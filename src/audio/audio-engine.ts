import type { GameStyle } from '../../shared/game-style.ts';
import type { GameEvent, PickupType, WeaponId, ZombieType } from '../../shared/protocol.ts';
import type { GunEffect } from '../../shared/round-effect-data.ts';
import { HEARING_RANGE, Mixer } from './mixer.ts';
import { Music, type Scene } from './music.ts';
import { Soundtrack } from './soundtrack.ts';
import { SFX } from './sfx-registry.ts';
import type { SfxName } from './sfx-registry.ts';

export { renderSfx } from './render.ts';
export { SFX_NAMES } from './sfx-registry.ts';
export type { SfxName } from './sfx-registry.ts';
export type { Scene } from './music.ts';

const STORE_KEY = 'outbreak-zero.audio';
const SHOT: Record<WeaponId, SfxName> = { pistol: 'pistol', carbine: 'carbine', shotgun: 'shotgun' };
const DEATH: Record<ZombieType, SfxName> = {
  walker: 'die_walker', runner: 'die_runner', bloater: 'die_bloater', brute: 'die_brute', screamer: 'die_walker',
};
const VOICE: Record<ZombieType, SfxName> = {
  walker: 'groan_walker', runner: 'shriek_runner', bloater: 'gurgle_bloater', brute: 'roar_brute', screamer: 'groan_walker',
};
const ALERT: Record<ZombieType, SfxName> = {
  walker: 'alert_walker', runner: 'alert_runner', bloater: 'alert_bloater', brute: 'alert_brute', screamer: 'scream',
};
export const PICKUP_SFX: Record<PickupType, SfxName> = {
  bandage: 'pickup_bandage', medkit: 'pickup_medkit', pistol_ammo: 'pickup_pistol_ammo',
  carbine_ammo: 'pickup_carbine_ammo', shells: 'pickup_shells', carbine: 'pickup_weapon', shotgun: 'pickup_weapon',
  knife: 'pickup_weapon', radio: 'pickup_radio',
  barrel: 'pickup_weapon', grip: 'pickup_weapon', magazine: 'pickup_weapon', suppressor: 'pickup_weapon', toolkit: 'pickup_weapon',
  incendiary_kit: 'pickup_weapon', acid_kit: 'pickup_weapon', piercing_kit: 'pickup_weapon', tranq_kit: 'pickup_weapon',
  silver: 'pickup_silver', jewel_small: 'pickup_jewel', jewel_large: 'pickup_jewel_large',
};
const STATUS: Record<GunEffect, SfxName> = { incendiary: 'ignite', acid: 'corrode', piercing: 'pierce', tranq: 'tranq_dart' };
/** A can on the end of a gun: still a shot, but a dull one. */
const SUPPRESSED_GAIN = 0.35;
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
  private town = 1;
  private style: GameStyle = 'arcade';
  private intensity = 0;
  private health = 1;
  private groanIn = 2;
  private beatIn = 0;
  private alertIn = 0;
  private unlocking: Promise<void> | null = null;
  private previewTimer: ReturnType<typeof setTimeout> | null = null;

  async unlock(): Promise<void> {
    if (!hasWebAudio()) return;
    if (!this.mixer) {
      try {
        this.mixer = new Mixer(new AudioContext({ latencyHint: 'interactive' }), this.level);
        this.music = new Music(this.mixer.ctx, this.mixer.music, (n) => this.ambient(n));
        this.music.setScene(this.scene);
        this.music.setIntensity(this.intensity);
        this.soundtrack = this.makeSoundtrack(this.mixer);
        this.soundtrack?.setLevel(this.town);
        this.soundtrack?.setStyle(this.style);
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

  /** The van's engine and door over the drive between the bunker and a town. */
  playVan(name: 'depart' | 'arrive' | 'door'): void {
    this.mixer?.play(`van_${name}`);
  }

  /** The Sound Test opens quiet: the scene's music steps aside until leavePreview(). */
  enterPreview(): void {
    this.soundtrack?.hush();
  }

  /** The Sound Test plays one thing at a time through the same mixer, so volume and mute apply. False if nothing could start. */
  previewTrack(file: string, onEnd: () => void): boolean {
    if (!this.soundtrack) return false;
    this.clearPreviewTimer();
    this.soundtrack.audition(file, onEnd);
    return true;
  }

  previewSfx(name: SfxName, onEnd: () => void): boolean {
    if (!this.mixer) return false;
    this.stopPreview();
    this.mixer.play(name, { local: true });
    this.previewTimer = setTimeout(() => {
      this.previewTimer = null;
      onEnd();
    }, SFX[name].length * 1000);
    return true;
  }

  /** Stops whatever is playing and stays quiet. */
  stopPreview(): void {
    this.clearPreviewTimer();
    this.soundtrack?.silence();
  }

  /** Leaving the Sound Test: the scene's music, the title's, comes back. */
  leavePreview(): void {
    this.clearPreviewTimer();
    this.soundtrack?.stopAudition();
  }

  private clearPreviewTimer(): void {
    if (this.previewTimer) clearTimeout(this.previewTimer);
    this.previewTimer = null;
  }

  /** The town being played, which picks the music between hordes. */
  setLevel(level: number): void {
    this.town = level;
    this.soundtrack?.setLevel(level);
  }

  /** The style of the run being played, which picks the bunker's music and level 6's. */
  setStyle(style: GameStyle): void {
    this.style = style;
    this.soundtrack?.setStyle(style);
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
        mixer.play(SHOT[e.weapon], e.suppressed ? { ...p, gain: SUPPRESSED_GAIN } : p);
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
      case 'zombie_track': mixer.play('sniff', { x: e.x, y: e.y }); break;
      case 'weapon_switch': mixer.play('weapon_switch', at(e.x, e.y, e.playerId)); break;
      case 'bullet_impact': mixer.play('impact', { x: e.x, y: e.y }); break;
      case 'zombie_hit': mixer.play('flesh_hit', { x: e.x, y: e.y }); break;
      case 'headshot': mixer.play('headshot', at(e.x, e.y, e.playerId)); break;
      case 'zombie_die': mixer.play(DEATH[e.zombieType], { x: e.x, y: e.y }); break;
      case 'zombie_status': mixer.play(STATUS[e.effect], { x: e.x, y: e.y }); break;
      case 'zombie_attack': mixer.play('claw', { x: e.x, y: e.y }); break;
      case 'bloater_burst': mixer.play('bloater_burst', { x: e.x, y: e.y }); break;
      case 'player_hurt': mixer.play('player_hurt', at(e.x, e.y, e.playerId)); break;
      case 'player_downed': mixer.play('player_downed', at(e.x, e.y, e.playerId)); break;
      case 'player_dead': mixer.play('player_downed', { ...at(e.x, e.y, e.playerId), pitch: 0.75 }); break;
      case 'player_revived': mixer.play('revive', at(e.x, e.y, e.playerId)); break;
      case 'pickup': mixer.play(PICKUP_SFX[e.pickup], at(e.x, e.y, e.playerId)); break;
      case 'container_opened': mixer.play(e.noisy ? 'clatter' : 'container_open', at(e.x, e.y, e.playerId)); break;
      case 'bottle_smash': mixer.play('glass_smash', { x: e.x, y: e.y }); break;
      case 'car_alarm': mixer.play('car_alarm', { x: e.x, y: e.y }); break;
      case 'wave_start': mixer.play('wave_start'); break;
      case 'overrun_warning': this.ambient(e.step === 0 ? 'distant_groan' : 'distant_crash'); break;
      case 'overrun_breach': mixer.play('wave_start'); break;
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
    this.clearPreviewTimer();
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
