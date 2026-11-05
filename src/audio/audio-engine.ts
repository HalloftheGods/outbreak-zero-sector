import type { GameEvent, PickupType, WeaponId, ZombieType } from '../../shared/protocol.ts';
import { HEARING_RANGE, Mixer } from './mixer.ts';
import { Music, type Scene } from './music.ts';
import { Soundtrack } from './soundtrack.ts';
import type { SfxName } from './sfx-registry.ts';

export { renderSfx } from './render.ts';
export { SFX_NAMES } from './sfx-registry.ts';
export type { SfxName } from './sfx-registry.ts';
export type { Scene } from './music.ts';

const STORE_KEY = 'outbreak-zero.audio';
const SHOT: Record<WeaponId, SfxName> = { pistol: 'pistol', carbine: 'carbine', shotgun: 'shotgun' };
const DEATH: Record<ZombieType, SfxName> = {
  walker: 'die_walker', runner: 'die_runner', bloater: 'die_bloater', brute: 'die_brute',
};
const VOICE: Record<ZombieType, SfxName> = {
  walker: 'groan_walker', runner: 'shriek_runner', bloater: 'gurgle_bloater', brute: 'roar_brute',
};
const ALERT: Record<ZombieType, SfxName> = {
  walker: 'alert_walker', runner: 'alert_runner', bloater: 'alert_bloater', brute: 'alert_brute',
};
const PICKUP: Record<PickupType, SfxName> = {
  bandage: 'pickup_bandage', medkit: 'pickup_medkit', pistol_ammo: 'pickup_pistol_ammo',
  carbine_ammo: 'pickup_carbine_ammo', shells: 'pickup_shells', carbine: 'pickup_weapon', shotgun: 'pickup_weapon',
};
/** A pack waking at once shares this: at most one alert snarl per window. */
const ALERT_WINDOW = 0.15;

interface Prefs { volume: number; muted: boolean }

function loadPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as Partial<Prefs> | null;
    const volume = typeof raw?.volume === 'number' ? Math.max(0, Math.min(1, raw.volume)) : 0.7;
    return { volume, muted: raw?.muted === true };
  } catch {
    return { volume: 0.7, muted: false };
  }
}

function hasWebAudio(): boolean {
  return typeof AudioContext !== 'undefined';
}

/**
 * All game sound. Every method is a no-op until unlock() succeeds in a browser,
 * so it is safe in Node, in tests and under blocked autoplay.
 */
export class AudioEngine {
  private mixer: Mixer | null = null;
  private music: Music | null = null;
  private soundtrack: Soundtrack | null = null;
  private prefs: Prefs = loadPrefs();
  private scene: Scene = 'menu';
  private intensity = 0;
  private health = 1;
  private groanIn = 2;
  private beatIn = 0;
  private alertIn = 0;
  private unlocking: Promise<void> | null = null;

  async unlock(): Promise<void> {
    if (!hasWebAudio()) return;
    if (!this.mixer) {
      try {
        this.mixer = new Mixer(new AudioContext({ latencyHint: 'interactive' }), this.level);
        this.music = new Music(this.mixer.ctx, this.mixer.music, (n) => this.ambient(n));
        this.music.setScene(this.scene);
        this.music.setIntensity(this.intensity);
        this.soundtrack = this.makeSoundtrack(this.mixer);
        this.soundtrack?.setScene(this.scene);
      } catch {
        this.mixer = null;
        this.music = null;
        this.soundtrack = null;
        return;
      }
    }
    const ctx = this.mixer.ctx;
    if (ctx.state === 'running') {
      this.soundtrack?.retry();
      return;
    }
    this.unlocking ??= ctx.resume().catch(() => undefined).finally(() => { this.unlocking = null; });
    await this.unlocking;
    this.soundtrack?.retry();
  }

  private makeSoundtrack(mixer: Mixer): Soundtrack | null {
    const canStream = typeof Audio !== 'undefined';
    if (!canStream) return null;
    return new Soundtrack(mixer.ctx, mixer.tracks, (available) => this.music?.setBedOn(!available));
  }

  setListener(x: number, y: number): void {
    this.mixer?.setListener(x, y);
  }

  playUi(name: 'click' | 'hover' | 'start' | 'pause' | 'resume'): void {
    this.mixer?.play(`ui_${name}`);
  }

  setScene(scene: Scene): void {
    this.scene = scene;
    this.music?.setScene(scene);
    this.soundtrack?.setScene(scene);
  }

  setIntensity(value: number): void {
    this.intensity = value;
    this.music?.setIntensity(value);
  }

  /** Local player's health fraction 0..1; below a third the heartbeat starts. */
  setHealth(fraction: number): void {
    this.health = fraction;
  }

  get volume(): number {
    return this.prefs.volume;
  }

  set volume(v: number) {
    this.prefs.volume = Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
    this.persist();
  }

  get muted(): boolean {
    return this.prefs.muted;
  }

  set muted(m: boolean) {
    this.prefs.muted = m;
    this.persist();
  }

  handleEvent(e: GameEvent, localPlayerId: string | null): void {
    const mixer = this.mixer;
    if (!mixer) return;
    const at = (x: number, y: number, playerId?: string) => ({ x, y, local: playerId !== undefined && playerId === localPlayerId });
    switch (e.type) {
      case 'shot': {
        const p = at(e.x, e.y, e.playerId);
        mixer.play(SHOT[e.weapon], p);
        if (e.weapon === 'shotgun') mixer.play('pump', { ...p, delay: 0.45, gain: 0.8 });
        break;
      }
      case 'dry_fire': mixer.play('dry_click', at(e.x, e.y, e.playerId)); break;
      case 'reload_start': mixer.play(e.weapon === 'shotgun' ? 'shell_load' : 'mag_out', at(e.x, e.y, e.playerId)); break;
      case 'reload_end': mixer.play(e.weapon === 'shotgun' ? 'pump' : 'mag_in', at(e.x, e.y, e.playerId)); break;
      case 'melee': mixer.play(e.hit ? 'melee_thud' : 'melee_swing', at(e.x, e.y, e.playerId)); break;
      case 'heal': mixer.play('heal', at(e.x, e.y, e.playerId)); break;
      case 'zombie_alert': {
        if (this.alertIn > 0) break;
        this.alertIn = ALERT_WINDOW;
        mixer.play(ALERT[e.zombieType], { x: e.x, y: e.y });
        break;
      }
      case 'weapon_switch': mixer.play('weapon_switch', at(e.x, e.y, e.playerId)); break;
      case 'bullet_impact': mixer.play('impact', { x: e.x, y: e.y }); break;
      case 'zombie_hit': mixer.play('flesh_hit', { x: e.x, y: e.y }); break;
      case 'zombie_die': mixer.play(DEATH[e.zombieType], { x: e.x, y: e.y }); break;
      case 'zombie_attack': mixer.play('claw', { x: e.x, y: e.y }); break;
      case 'bloater_burst': mixer.play('bloater_burst', { x: e.x, y: e.y }); break;
      case 'player_hurt': mixer.play('player_hurt', at(e.x, e.y, e.playerId)); break;
      case 'player_downed': mixer.play('player_downed', at(e.x, e.y, e.playerId)); break;
      case 'player_dead': mixer.play('player_downed', { ...at(e.x, e.y, e.playerId), pitch: 0.75 }); break;
      case 'player_revived': mixer.play('revive', at(e.x, e.y, e.playerId)); break;
      case 'pickup': mixer.play(PICKUP[e.pickup], at(e.x, e.y, e.playerId)); break;
      case 'wave_start': mixer.play('wave_start'); break;
      case 'wave_clear': mixer.play('wave_clear'); break;
      case 'game_over': mixer.play('game_over', { local: true }); break;
      case 'wave_intermission': break;
    }
  }

  tick(dt: number, zombies: readonly { x: number; y: number; type: ZombieType }[]): void {
    const mixer = this.mixer;
    if (!mixer) return;
    this.beatIn -= dt;
    this.alertIn -= dt;
    if (this.health < 0.34 && this.health > 0 && this.beatIn <= 0) {
      this.beatIn = 0.5 + this.health * 1.4;
      mixer.play('heartbeat', { local: true, gain: 0.9 - this.health });
    }
    this.groanIn -= dt;
    if (this.groanIn > 0 || zombies.length === 0) return;
    this.groanIn = (1 + Math.random() * 2.5) / (1 + Math.min(zombies.length, 12) * 0.12);
    const { x, y } = mixer.listener;
    const near = zombies.filter((z) => Math.hypot(z.x - x, z.y - y) < HEARING_RANGE);
    if (near.length === 0) return;
    const z = near[Math.floor(Math.random() * near.length)];
    mixer.play(VOICE[z.type], { x: z.x, y: z.y, gain: 0.8 });
  }

  dispose(): void {
    this.soundtrack?.dispose();
    this.music?.dispose();
    this.mixer?.dispose();
    this.soundtrack = null;
    this.music = null;
    this.mixer = null;
  }

  private ambient(name: 'distant_groan' | 'distant_crash'): void {
    if (!this.mixer) return;
    const { x, y } = this.mixer.listener;
    const a = Math.random() * Math.PI * 2;
    const r = 330 + Math.random() * 60;
    // The lull is meant to be nearly silent: its few sounds are far and faint.
    const lull = this.scene === 'intermission';
    this.mixer.play(name, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, gain: lull ? 0.8 : 1.4 });
  }

  private get level(): number {
    return this.prefs.muted ? 0 : this.prefs.volume;
  }

  private applyLevel(): void {
    this.mixer?.setLevel(this.level);
  }

  private persist(): void {
    this.applyLevel();
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.prefs));
    } catch {
      // storage blocked: the setting still applies for this session
    }
  }
}
