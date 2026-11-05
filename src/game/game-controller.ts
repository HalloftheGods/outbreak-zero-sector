import { shallowRef } from 'vue';
import type { ShallowRef } from 'vue';
import type { GameEvent, GameOverStats, PlayerEntity, SnapshotPacket, WelcomePacket, WorldMap } from '../../shared/protocol.ts';
import { generateWorldMap } from '../../shared/world-map.ts';
import { buildArtBook } from '../art/index.ts';
import { AudioEngine } from '../audio/audio-engine.ts';
import { aimAngle } from '../engine/camera.ts';
import { CHEST_HEIGHT, EMPTY_SCENE } from '../engine/scene.ts';
import type { SceneView } from '../engine/scene.ts';
import { WorldRenderer } from '../engine/world-renderer.ts';
import { LocalSession } from '../network/local-session.ts';
import { resolveServerUrl, SocketSession } from '../network/socket-session.ts';
import type { GameTransport } from '../network/transport.ts';
import { BenchLink } from './bench-link.ts';
import { ClientWorld } from './client-world.ts';
import type { RunResult, UiState } from './hud-state.ts';
import { loadCharacter } from './character-pref.ts';
import { loadDifficulty } from './difficulty-pref.ts';
import { InputManager } from './input-manager.ts';
import { continueLevel, loadLevelProgress, recordGameFinished, recordLevelReached } from './level-progress.ts';
import { InputSender } from './input-sender.ts';
import { tickRunAudio } from './run-audio.ts';
import { deathFade, finishRun, healthFraction, NO_RUN_UI, RunHud } from './run-hud.ts';
import { RunStage } from './run-stage.ts';
import { pickupNote } from './run-notices.ts';
import { DEFAULT_PREFS, loadBest, loadLeaderboard, loadPrefs, savePrefs } from './storage.ts';
import { isTouchDevice } from './touch-input.ts';
import { touchMarks } from './touch-marks.ts';
import { fitWindow } from './view-fit.ts';

const GAME_OVER_BEAT_MS = 1800;
const MAX_FRAME_DT = 0.05;
const CALLSIGN_MAX = 12;
const FALLBACK_CALLSIGN = 'SURVIVOR';
const TITLE_MAP_SEED = 20417;
const ART_DELAY_MS = 40;

type UiSound = 'click' | 'hover' | 'start' | 'pause' | 'resume';

const EVENT_MUSIC: Partial<Record<GameEvent['type'], 'wave' | 'intermission'>> = {
  wave_start: 'wave',
  wave_intermission: 'intermission',
};

/** Owns a run from menu to game over. Vue only sees the small state in `ui`. */
export class GameController {
  readonly ui: ShallowRef<UiState>;
  /** The workbench screen's way to the run. */
  readonly bench: BenchLink;

  /** The touch buttons press through this. */
  readonly input: InputManager;
  private readonly audio = new AudioEngine();
  private readonly inputs: InputSender;
  private readonly runHud: RunHud;
  private readonly stage: RunStage;
  private renderer: WorldRenderer | null = null;
  private transport: GameTransport | null = null;
  private world: ClientWorld | null = null;
  private titleMap: WorldMap | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private lastScene: SceneView = EMPTY_SCENE;
  private raf = 0;
  private artTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFrameMs = 0;
  private lastSnapshotMs = 0;
  private aim = 0;
  private titleTime = 0;
  /** Set from the moment the run ends, a beat before the results show. */
  private runResult: RunResult | null = null;
  private gameOverAtMs = 0;
  private welcomed = false;
  /** Highest level already written to storage this page load, so snapshots do not hit it every tick. */
  private levelNoted = 0;

  constructor() {
    const prefs = loadPrefs();
    this.ui = shallowRef<UiState>({
      touch: isTouchDevice(),
      screen: 'title',
      art: null,
      mode: 'solo',
      connecting: false,
      error: null,
      ...NO_RUN_UI,
      lostReason: '',
      signalWeak: false,
      best: loadBest(),
      leaderboard: loadLeaderboard(),
      callsign: prefs.callsign || DEFAULT_PREFS.callsign,
      serverAddress: prefs.serverAddress,
      volume: this.audio.volume,
      muted: this.audio.muted,
    });
    this.runHud = new RunHud(() => this.ui.value, (patch) => this.publish(patch));
    this.stage = new RunStage(this.runHud, () => this.renderer);
    this.input = new InputManager({
      onGesture: () => this.audio.unlock(),
      onPause: () => this.togglePause(),
      onMute: () => this.toggleMute(),
      onConfirm: () => this.confirm(),
      onMap: () => this.toggleMap(),
      mapUsable: () => this.canUseMap(),
      onTouchSeen: () => { this.publish({ touch: true }); this.onResize(); },
    });
    this.inputs = new InputSender(this.input);
    this.bench = new BenchLink({
      transport: () => this.transport,
      menuUp: () => this.isMenuUp(),
      setInputEnabled: (enabled) => this.input.setEnabled(enabled),
      settle: () => this.sendNeutralInput(),
    });
  }

  /** The studio splash's chime, on the gesture that skips it. */
  greet(): void {
    void this.audio.unlock();
    this.audio.playUi('start');
  }

  /** Exposed for the dev handle: the running simulation, in solo. */
  get sim() {
    return this.transport instanceof LocalSession ? this.transport.sim : null;
  }

  mount(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.onResize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('blur', this.onAway);
    document.addEventListener('visibilitychange', this.onVisibility);
    this.raf = requestAnimationFrame(this.frame);
    // Baking the art blocks for a moment: let the title paint first.
    this.artTimer = setTimeout(() => this.loadArt(), ART_DELAY_MS);
    this.audio.setScene('menu');
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    if (this.artTimer) clearTimeout(this.artTimer);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('blur', this.onAway);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.input.dispose();
    this.transport?.disconnect();
    this.transport = null;
    this.audio.dispose();
  }

  attachTownCanvas(canvas: HTMLCanvasElement | null): void {
    this.runHud.attachTownCanvas(canvas);
  }

  private loadArt(): void {
    const canvas = this.canvas;
    if (!canvas) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const art = buildArtBook();
    this.renderer = new WorldRenderer(canvas, art, reducedMotion);
    this.titleMap = generateWorldMap(TITLE_MAP_SEED);
    this.renderer.setMap(this.titleMap);
    this.publish({ art });
  }

  private publish(patch: Partial<UiState>): void {
    this.ui.value = { ...this.ui.value, ...patch };
  }

  private readonly onResize = (): void => {
    fitWindow(this.renderer, this.transport?.kind === 'coop', this.ui.value.touch);
  };

  /** A hidden tab gets no frames, so solo would otherwise be eaten alive unseen. */
  private readonly onVisibility = (): void => {
    if (document.hidden) this.onAway();
  };

  /** The player has gone: to another tab, or to a window beside this one that leaves the game in view. */
  private readonly onAway = (): void => {
    this.input.clearHeld();
    const shouldPause = this.transport?.kind === 'solo' && this.isPlaying() && !this.isMenuUp();
    if (shouldPause) this.togglePause();
    else this.sendNeutralInput();
  };

  private isPlaying(): boolean {
    return this.ui.value.screen === 'game' && this.runResult === null;
  }

  private isMenuUp(): boolean {
    return this.ui.value.paused || this.ui.value.mapOpen;
  }

  // --- Commands from the menus ---------------------------------------------

  setCallsign(callsign: string): void {
    this.publish({ callsign: callsign.slice(0, CALLSIGN_MAX) });
    this.savePrefs();
  }

  setServerAddress(serverAddress: string): void {
    this.publish({ serverAddress });
    this.savePrefs();
  }

  private savePrefs(): void {
    const { callsign, serverAddress } = this.ui.value;
    savePrefs({ callsign, serverAddress });
  }

  setVolume(volume: number): void {
    this.audio.volume = volume;
    this.publish({ volume });
  }

  toggleMute(): void {
    this.audio.muted = !this.audio.muted;
    this.publish({ muted: this.audio.muted });
  }

  playUi(sound: UiSound): void {
    this.audio.playUi(sound);
  }

  /** A fresh solo run from level 1, or from `fromLevel` with the return kit. */
  startSolo(fromLevel?: number): void {
    if (!this.canStart()) return;
    this.audio.unlock();
    this.audio.playUi('start');
    this.publish({ mode: 'solo', error: null });
    this.beginSession(new LocalSession(), fromLevel);
  }

  /** Solo from the furthest level reached. Does nothing until a level past the first has been reached. */
  continueSolo(): void {
    const level = continueLevel(loadLevelProgress());
    if (level !== null) this.startSolo(level);
  }

  startCoop(): void {
    if (!this.canStart()) return;
    this.audio.unlock();
    const url = resolveServerUrl(this.ui.value.serverAddress, window.location);
    if (!url) {
      this.publish({ error: 'That server address does not look right.' });
      return;
    }
    this.audio.playUi('start');
    this.publish({ mode: 'coop', error: null, connecting: true });
    this.beginSession(new SocketSession(url));
  }

  private canStart(): boolean {
    const { art, connecting, screen } = this.ui.value;
    return art !== null && !connecting && screen === 'title';
  }

  private beginSession(transport: GameTransport, startLevel?: number): void {
    this.transport = transport;
    this.welcomed = false;
    transport.onWelcome = (packet) => this.onWelcome(packet);
    transport.onSnapshot = (packet) => this.onSnapshot(packet);
    transport.onClosed = (reason) => this.onClosed(reason);
    transport.connect(this.ui.value.callsign.trim() || FALLBACK_CALLSIGN, loadDifficulty(), loadCharacter(), startLevel);
  }

  /** A menu is over the game: solo stops, and co-op stands still while the town carries on. */
  private holdRun(held: boolean): void {
    this.transport?.setPaused(held);
    this.input.setEnabled(!held && !this.bench.open);
    this.audio.playUi(held ? 'pause' : 'resume');
    if (held) this.sendNeutralInput();
  }

  togglePause(): void {
    if (!this.isPlaying()) return;
    if (this.ui.value.mapOpen) {
      this.toggleMap();
      return;
    }
    const paused = !this.ui.value.paused;
    this.holdRun(paused);
    this.publish({ paused });
  }

  private canUseMap(): boolean {
    return this.isPlaying() && !this.ui.value.paused;
  }

  /** True if the key did something, which it does not behind the pause menu or off a run. */
  toggleMap(): boolean {
    if (!this.canUseMap()) return false;
    const mapOpen = !this.ui.value.mapOpen;
    this.holdRun(mapOpen);
    this.publish({ mapOpen });
    return true;
  }

  playAgain(fromLevel?: number): void {
    const won = this.runResult?.stats.outcome === 'victory';
    const canRestart = this.ui.value.screen === 'gameover' && !this.ui.value.restarting && !won;
    if (!canRestart) return;
    this.audio.playUi('start');
    this.publish({ restarting: true });
    this.transport?.requestRestart(fromLevel);
  }

  /** After a solo death: back in at the furthest level reached. Co-op restarts stay at level 1. */
  continueAgain(): void {
    if (this.transport?.kind !== 'solo') return;
    const level = continueLevel(loadLevelProgress());
    if (level !== null) this.playAgain(level);
  }

  /** The ending screens pick their own track once the tally is read. */
  endingMusic(scene: 'victory' | 'credits'): void {
    this.audio.setScene(scene);
  }

  toMenu(): void {
    this.transport?.disconnect();
    this.transport = null;
    this.world = null;
    this.runResult = null;
    this.input.setEnabled(false);
    this.audio.setScene('menu');
    this.onResize();
    if (this.titleMap) this.renderer?.setMap(this.titleMap);
    this.publish({ ...NO_RUN_UI, screen: 'title', connecting: false, best: loadBest(), leaderboard: loadLeaderboard() });
  }

  /** The title has no say here: its menu answers Enter, and only Start or Join begins a run. */
  private confirm(): void {
    const { screen } = this.ui.value;
    if (screen === 'gameover') this.playAgain();
    else if (screen === 'lost') this.toMenu();
    else if (this.isMenuUp()) this.togglePause();
  }

  // --- Transport -----------------------------------------------------------

  private onWelcome(packet: WelcomePacket): void {
    this.welcomed = true;
    this.world = new ClientWorld(this.stage.open(packet.mapSeed), packet.yourId);
    this.beginRun();
  }

  private beginRun(): void {
    this.runResult = null;
    this.inputs.reset();
    this.runHud.reset();
    this.onResize();
    this.input.setEnabled(true);
    this.publish({ ...NO_RUN_UI, screen: 'game', connecting: false });
  }

  private onClosed(reason: string): void {
    this.transport = null;
    if (!this.welcomed) {
      this.publish({ connecting: false, error: reason });
      return;
    }
    this.world = null;
    this.runResult = null;
    this.input.setEnabled(false);
    this.audio.setScene('menu');
    this.onResize();
    if (this.titleMap) this.renderer?.setMap(this.titleMap);
    this.publish({ ...NO_RUN_UI, screen: 'lost', lostReason: reason });
  }

  private onSnapshot(snapshot: SnapshotPacket): void {
    const world = this.world;
    if (!world) return;
    const now = performance.now();
    // Off the stats, not the last frame: a run that ends between ticks may never have a frame of its own.
    const runRestarted = this.runResult !== null && snapshot.gameOver === null;
    if (runRestarted) {
      world.restart();
      this.renderer?.reset();
      this.stage.rewind();
      this.beginRun();
    }
    this.stage.follow(world, snapshot, now);
    this.bench.observe(snapshot);
    // Someone joining mid-horde gets no wave_start, so the first frame sets the mood.
    this.audio.setLevel(snapshot.level);
    const newLevel = snapshot.level > this.levelNoted;
    if (newLevel) {
      this.levelNoted = snapshot.level;
      recordLevelReached(snapshot.level);
    }
    const firstOfRun = world.latest === null;
    if (firstOfRun) this.audio.setScene(snapshot.phase === 'wave' ? 'wave' : 'intermission');
    this.lastSnapshotMs = now;
    const before = world.localPlayer;
    const after = snapshot.players.find((player) => player.id === world.localId) ?? null;
    for (const event of snapshot.events) this.onGameEvent(event, world, now, before, after);
    world.push(snapshot, now);
    const justEnded = snapshot.gameOver !== null && this.runResult === null;
    if (justEnded) this.enterGameOver(snapshot.gameOver!, world.localId, now);
  }

  private onGameEvent(event: GameEvent, world: ClientWorld, now: number, before: PlayerEntity | null, after: PlayerEntity | null): void {
    this.audio.handleEvent(event, world.localId);
    this.renderer?.handleEvent(event, {
      localId: world.localId,
      localX: world.predictor.x,
      localY: world.predictor.y,
      pickupNote: event.type === 'pickup' ? pickupNote(event.pickup, before, after) : undefined,
    });
    const music = EVENT_MUSIC[event.type];
    if (music) this.audio.setScene(music);
    this.runHud.onEvent(event, now);
  }

  private enterGameOver(stats: GameOverStats, localId: string, now: number): void {
    this.runResult = finishRun(stats, localId);
    const won = stats.outcome === 'victory';
    if (won) recordGameFinished();
    this.gameOverAtMs = now;
    this.input.setEnabled(false);
    this.audio.setScene(stats.outcome === 'victory' ? 'victory' : 'gameover');
    this.publish({ paused: false, mapOpen: false, banner: null, place: null, best: loadBest(), leaderboard: loadLeaderboard() });
  }

  // --- Frame loop ----------------------------------------------------------

  private readonly frame = (ms: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(MAX_FRAME_DT, (ms - this.lastFrameMs) / 1000);
    this.lastFrameMs = ms;
    const renderer = this.renderer;
    if (!renderer) return;
    if (this.world) this.frameRun(renderer, this.world, ms, dt);
    else this.frameTitle(renderer, dt);
  };

  /** The city at night behind the menu, drifting past with nobody in it. */
  private frameTitle(renderer: WorldRenderer, dt: number): void {
    const map = this.titleMap;
    if (!map) return;
    this.titleTime += dt;
    const focusX = map.width / 2 + Math.sin(this.titleTime * 0.04) * map.width * 0.3;
    const focusY = map.height / 2 + Math.cos(this.titleTime * 0.031) * map.height * 0.3;
    renderer.render({ ...EMPTY_SCENE, focusX, focusY }, dt);
  }

  private frameRun(renderer: WorldRenderer, world: ClientWorld, ms: number, dt: number): void {
    const transport = this.transport;
    const { screen } = this.ui.value;
    const menuUp = this.isMenuUp();
    const frozen = menuUp && transport?.kind === 'solo';
    if (frozen) {
      renderer.render({ ...this.lastScene, showCrosshair: false }, 0);
      return;
    }
    const dirX = this.input.dirX;
    const dirY = this.input.dirY;
    const pointerX = renderer.toBufferX(this.input.pointerClientX);
    const pointerY = renderer.toBufferY(this.input.pointerClientY);
    const camera = renderer.camera;
    // Behind a co-op menu the mouse belongs to the menu, not the flashlight.
    if (!menuUp) {
      this.aim = this.input.touch.look(this.aim) ?? aimAngle(
        pointerX,
        pointerY,
        camera.screenX(world.predictor.x),
        camera.screenY(world.predictor.y) - CHEST_HEIGHT,
      );
      this.inputs.aimPoint = renderer.toWorld(pointerX, pointerY);
    }
    const aim = this.aim;
    const delay = transport?.interpolationDelayMs ?? 0;
    const entities = world.advance(ms, delay, dirX, dirY, aim, dt);
    if (!entities) return;

    const result = this.runResult;
    const over = result !== null;
    const touch = touchMarks(this.input.touch, renderer, ms);
    // A finger picks a spot on the picture, so the picture must not lean toward it and move the spot.
    const scene: SceneView = {
      ...entities,
      pointerX: over || touch ? null : pointerX,
      pointerY: over || touch ? null : pointerY,
      showCrosshair: this.isPlaying() && !menuUp && !this.bench.open,
      touch,
    };
    this.lastScene = scene;
    const sending = transport !== null && !over;
    if (sending) this.inputs.send(transport, world, aim, dirX, dirY, dt);
    tickRunAudio(this.audio, world, scene, dt);
    renderer.effects.setHealth(healthFraction(world.localPlayer));
    renderer.effects.setDesaturation(deathFade(world.localPlayer?.status, over));
    renderer.render(scene, dt);

    const beatOver = over && screen === 'game' && ms - this.gameOverAtMs > GAME_OVER_BEAT_MS;
    if (beatOver) this.publish({ screen: 'gameover', result });
    this.runHud.tick({
      world,
      scene,
      renderer,
      ms,
      networked: transport?.kind === 'coop',
      lastSnapshotMs: this.lastSnapshotMs,
    });
  }

  private sendNeutralInput(): void {
    const { transport, world } = this;
    const inRun = world !== null && transport !== null;
    if (inRun) this.inputs.sendNeutral(transport, world);
  }
}
