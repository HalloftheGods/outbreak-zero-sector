// Synthesis primitives shared by every sound recipe. Recipes are pure functions of
// a Voice, so the same code plays live and renders through an OfflineAudioContext.

export interface Voice {
  readonly ctx: BaseAudioContext;
  readonly out: AudioNode;
  /** Context time the sound starts at. */
  readonly t: number;
  /** Frequency multiplier, 1 = as designed. */
  readonly pitch: number;
  rand(): number;
}

export type Recipe = (v: Voice) => void;

export function makeVoice(ctx: BaseAudioContext, out: AudioNode, t: number, pitch: number, rand: () => number): Voice {
  return { ctx, out, t, pitch, rand };
}

/** Small deterministic generator for offline renders and noise tables. */
export function seeded(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>();

/** Two seconds of white noise, generated once per context. */
export function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const hit = noiseCache.get(ctx);
  if (hit) return hit;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate);
  const data = buf.getChannelData(0);
  const rnd = seeded(0x2f6e2b1);
  for (let i = 0; i < data.length; i++) data[i] = rnd() * 2 - 1;
  noiseCache.set(ctx, buf);
  return buf;
}

const curves = new Map<number, Float32Array<ArrayBuffer>>();

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const hit = curves.get(amount);
  if (hit) return hit;
  const n = 1024;
  const k = 1 + amount * 8;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = Math.tanh(((i / (n - 1)) * 2 - 1) * k) / Math.tanh(k);
  curves.set(amount, out);
  return out;
}

export interface Env {
  /** Seconds, at least 2 ms so nothing starts with a click. */
  attack?: number;
  hold?: number;
  decay: number;
  /** Final linear fade to exactly zero. */
  release?: number;
}

export function envLength(e: Env): number {
  return Math.max(e.attack ?? 0.003, 0.002) + (e.hold ?? 0) + e.decay + Math.max(e.release ?? 0.02, 0.01);
}

function applyEnv(p: AudioParam, t: number, peak: number, e: Env): number {
  const a = Math.max(e.attack ?? 0.003, 0.002);
  p.setValueAtTime(0, t);
  p.linearRampToValueAtTime(peak, t + a);
  let at = t + a;
  if (e.hold) {
    at += e.hold;
    p.setValueAtTime(peak, at);
  }
  at += e.decay;
  p.exponentialRampToValueAtTime(Math.max(peak * 0.01, 1e-4), at);
  const end = at + Math.max(e.release ?? 0.02, 0.01);
  p.linearRampToValueAtTime(0, end);
  return end;
}

interface Shaping {
  at?: number;
  gain: number;
  /** Waveshaper amount 0..1. */
  drive?: number;
  trem?: { rate: number; depth: number };
}

function lfo(ctx: BaseAudioContext, rate: number, t: number, end: number): OscillatorNode {
  const o = ctx.createOscillator();
  o.frequency.value = rate;
  o.start(t);
  o.stop(end + 0.02);
  return o;
}

/** Drive, envelope and tremolo, then out. Returns the end time. */
function finish(v: Voice, head: AudioNode, o: Shaping & Env, t: number): number {
  const { ctx } = v;
  let node = head;
  if (o.drive) {
    const ws = ctx.createWaveShaper();
    ws.curve = driveCurve(o.drive);
    node.connect(ws);
    node = ws;
  }
  const amp = ctx.createGain();
  const end = applyEnv(amp.gain, t, o.gain, o);
  node.connect(amp);
  node = amp;
  if (o.trem) {
    const tr = ctx.createGain();
    tr.gain.value = 1 - o.trem.depth / 2;
    const l = lfo(ctx, o.trem.rate, t, end);
    const lg = ctx.createGain();
    lg.gain.value = o.trem.depth / 2;
    l.connect(lg);
    lg.connect(tr.gain);
    node.connect(tr);
    node = tr;
  }
  node.connect(v.out);
  return end;
}

export interface ToneOpts extends Env, Shaping {
  type?: OscillatorType;
  f0: number;
  /** Exponential glide target reached at the end of the decay. */
  f1?: number;
  /** Frequency breakpoints [seconds from start, hz], exponential between them. */
  path?: ReadonlyArray<readonly [number, number]>;
  lp?: number;
  hp?: number;
  /** Parallel band-pass formants [hz, q, gain], gives the voice vowel colour. */
  formants?: ReadonlyArray<readonly [number, number, number]>;
  vib?: { rate: number; cents: number };
  detune?: number;
}

export function tone(v: Voice, o: ToneOpts): void {
  const { ctx } = v;
  const t = v.t + (o.at ?? 0);
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f0 * v.pitch, t);
  const glideEnd = t + Math.max(o.attack ?? 0.003, 0.002) + (o.hold ?? 0) + o.decay;
  if (o.path) for (const [dt, f] of o.path) osc.frequency.exponentialRampToValueAtTime(f * v.pitch, t + dt);
  else if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1 * v.pitch, glideEnd);
  if (o.detune) osc.detune.value = o.detune;

  let node: AudioNode = osc;
  if (o.formants) {
    const sum = ctx.createGain();
    for (const [f, q, g] of o.formants) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f * Math.sqrt(v.pitch);
      bp.Q.value = q;
      const fg = ctx.createGain();
      fg.gain.value = g;
      osc.connect(bp);
      bp.connect(fg);
      fg.connect(sum);
    }
    node = sum;
  }
  for (const [kind, f] of [['highpass', o.hp], ['lowpass', o.lp]] as const) {
    if (!f) continue;
    const bq = ctx.createBiquadFilter();
    bq.type = kind;
    bq.frequency.value = f;
    node.connect(bq);
    node = bq;
  }
  const end = finish(v, node, o, t);
  if (o.vib) {
    const l = lfo(ctx, o.vib.rate, t, end);
    const lg = ctx.createGain();
    lg.gain.value = o.vib.cents;
    l.connect(lg);
    lg.connect(osc.detune);
  }
  osc.start(t);
  osc.stop(end + 0.02);
}

export interface NoiseOpts extends Env, Shaping {
  filter: BiquadFilterType;
  freq: number;
  /** Exponential filter sweep target reached at the end of the decay. */
  freq1?: number;
  q?: number;
}

export function noise(v: Voice, o: NoiseOpts): void {
  const { ctx } = v;
  const t = v.t + (o.at ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = o.filter;
  f.Q.value = o.q ?? 0.7;
  f.frequency.setValueAtTime(o.freq * v.pitch, t);
  if (o.freq1) {
    const glideEnd = t + Math.max(o.attack ?? 0.003, 0.002) + (o.hold ?? 0) + o.decay;
    f.frequency.exponentialRampToValueAtTime(o.freq1 * v.pitch, glideEnd);
  }
  src.connect(f);
  const end = finish(v, f, o, t);
  src.start(t, v.rand() * 1.5);
  src.stop(end + 0.02);
}
