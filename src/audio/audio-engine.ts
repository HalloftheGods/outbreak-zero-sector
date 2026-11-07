import type { GameStyle } from '../../shared/game-style.ts';
import type { GameEvent, PlayerEntity, WorldMap, ZombieType } from '../../shared/protocol.ts';
import { playEventSound } from './event-sounds.ts';
import { FootstepTracker, type StepPlayer } from './footsteps.ts';
import { HEARING_RANGE, Mixer } from './mixer.ts';
import { Music, type Scene } from './music.ts';
import { Soundtrack } from './soundtrack.ts';
import { SFX } from './sfx-registry.ts';
import type { SfxName } from './sfx-registry.ts';

export { PICKUP_SFX } from './event-sounds.ts';
export { renderSfx } from './render.ts';
export { SFX_NAMES } from './sfx-registry.ts';
export type { SfxName } from './sfx-registry.ts';
export type { Scene } from './music.ts';

const STORE_KEY = 'outbreak-zero.audio';
const VOICE: Record<ZombieType, SfxName> = {
  walker: 'groan_walker', runner: 'shriek_runner', bloater: 'gurgle_bloater', brute: 'roar_brute', screamer: 'groan_walker',
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
  private town = 1;
  private style: GameStyle = 'arcade';
  private intensity = 0;
  private health = 1;
  private groanIn = 2;
  private beatIn = 0;
  private alertIn = 0;
  private readonly footsteps = new FootstepTracker();
  private readonly playStep: StepPlayer = (name, opts) => this.mixer?.play(name, opts);
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
    const isAudioRunning = ctx.state === 'running';
    if (isAudioRunning) {
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
    playEventSound(e, { mixer, at, playAmbient: (name) => this.ambient(name), claimAlert: () => this.claimAlert() });
  }

  /** A pack waking at once snarls once: the first alert in a window claims it. */
  private claimAlert(): boolean {
    const isAlertCoolingDown = this.alertIn > 0;
    if (isAlertCoolingDown) return false;
    this.alertIn = ALERT_WINDOW;
    return true;
  }

  tick(dt: number, zombies: readonly { x: number; y: number; type: ZombieType }[]): void {
    const mixer = this.mixer;
    if (!mixer) return;
    this.beatIn -= dt;
    this.alertIn -= dt;
    const isHeartbeatDue = this.health < 0.34 && this.health > 0 && this.beatIn <= 0;
    if (isHeartbeatDue) {
      this.beatIn = 0.5 + this.health * 1.4;
      mixer.play('heartbeat', { local: true, gain: 0.9 - this.health });
    }
    this.groanIn -= dt;
    const isGroanQuiet = this.groanIn > 0 || zombies.length === 0;
    if (isGroanQuiet) return;
    this.groanIn = (1 + Math.random() * 2.5) / (1 + Math.min(zombies.length, 12) * 0.12);
    const { x, y } = mixer.listener;
    const near = zombies.filter((z) => Math.hypot(z.x - x, z.y - y) < HEARING_RANGE);
    const hasNoZombieInEarshot = near.length === 0;
    if (hasNoZombieInEarshot) return;
    const z = near[Math.floor(Math.random() * near.length)];
    mixer.play(VOICE[z.type], { x: z.x, y: z.y, gain: 0.8 });
  }

  /**
   * Footsteps for everyone on screen this frame, on the ground under them. Silent while muted
   * or at zero volume, and until the audio has unlocked, like every other sound.
   */
  stepPlayers(players: readonly PlayerEntity[], localId: string | null, map: WorldMap, dt: number): void {
    const isSilenced = !this.mixer || this.level === 0;
    if (isSilenced) {
      this.footsteps.reset();
      return;
    }
    this.footsteps.tick(players, localId, map, dt, this.playStep);
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
      // chemx-allow: best-effort storage blocked: the setting still applies for this session
    }
  }
}
