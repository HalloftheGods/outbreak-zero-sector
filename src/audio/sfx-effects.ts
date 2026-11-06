import { noise, tone, type Recipe } from './voice-kit.ts';

// Round effects. Each is a short cue over the plain hit sound, told apart by texture:
// fire is a soft rush, acid a wet fizz, piercing a thin zip, tranq a hushed dart.

/** A body catching: a low rush that swells, then crackle. */
export const ignite: Recipe = (v) => {
  noise(v, { filter: 'bandpass', freq: 500, freq1: 1800, q: 0.8, attack: 0.05, decay: 0.28, gain: 0.45 });
  tone(v, { type: 'sine', f0: 110, f1: 70, attack: 0.04, decay: 0.3, gain: 0.3 });
  noise(v, { at: 0.12, filter: 'highpass', freq: 3500, decay: 0.03, gain: 0.25 });
  noise(v, { at: 0.2, filter: 'highpass', freq: 4200, decay: 0.025, gain: 0.2 });
};

/** Acid taking hold: a bright fizz that falls away. */
export const corrode: Recipe = (v) => {
  noise(v, { filter: 'highpass', freq: 4500, freq1: 2500, decay: 0.22, gain: 0.4 });
  tone(v, { type: 'triangle', f0: 1400, f1: 500, decay: 0.12, gain: 0.12 });
  noise(v, { at: 0.06, filter: 'bandpass', freq: 3000, q: 3, decay: 0.1, gain: 0.2 });
};

/** A bullet going through one body into the next. */
export const pierce: Recipe = (v) => {
  noise(v, { filter: 'bandpass', freq: 2600, freq1: 5200, q: 2, decay: 0.05, gain: 0.4 });
  tone(v, { type: 'sine', f0: 1800, f1: 3200, decay: 0.05, gain: 0.12 });
  noise(v, { at: 0.04, filter: 'lowpass', freq: 800, decay: 0.07, gain: 0.3 });
};

/** A dart landing and the body going heavy. */
export const tranq: Recipe = (v) => {
  noise(v, { filter: 'bandpass', freq: 1800, q: 3, decay: 0.03, gain: 0.3 });
  tone(v, { type: 'sine', f0: 420, f1: 140, attack: 0.01, decay: 0.3, gain: 0.3 });
  tone(v, { at: 0.05, type: 'triangle', f0: 260, f1: 80, decay: 0.28, gain: 0.2 });
};

/** A thrown bottle bursting on the ground: a hard crack and a spill of glass. */
export const glassSmash: Recipe = (v) => {
  noise(v, { filter: 'highpass', freq: 2600, attack: 0.002, decay: 0.12, gain: 0.6 });
  noise(v, { at: 0.03, filter: 'bandpass', freq: 5200, q: 3, attack: 0.01, decay: 0.35, gain: 0.25 });
  tone(v, { type: 'triangle', f0: 3100, f1: 2400, attack: 0.002, decay: 0.18, gain: 0.12 });
};

/** A car alarm's two-tone whoop, a few cycles of it. */
export const carAlarm: Recipe = (v) => {
  for (let i = 0; i < 4; i += 1) {
    tone(v, { at: i * 0.5, type: 'square', f0: 700, f1: 1300, attack: 0.01, hold: 0.2, decay: 0.05, gain: 0.2, lp: 2600 });
    tone(v, { at: i * 0.5 + 0.25, type: 'square', f0: 1300, f1: 700, attack: 0.01, hold: 0.2, decay: 0.05, gain: 0.2, lp: 2600 });
  }
};
