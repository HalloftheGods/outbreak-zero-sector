import { shallowRef } from 'vue';
import type { ShallowRef } from 'vue';
import { TICK_DT } from '../../shared/constants.ts';
import type { GameEvent, GameOverStats, PlayerEntity, SnapshotPacket, WelcomePacket, WorldMap } from '../../shared/protocol.ts';
import { generateWorldMap } from '../../shared/world-map.ts';
import { buildArtBook } from '../art/index.ts';
import { AudioEngine } from '../audio/audio-engine.ts';
import { aimAngle } from '../engine/camera.ts';
import { CHEST_HEIGHT, EMPTY_SCENE } from '../engine/scene.ts';
import type { SceneView } from '../engine/scene.ts';
import { uiUnit } from '../engine/viewport.ts';
import { WorldRenderer } from '../engine/world-renderer.ts';
import { LocalSession } from '../network/local-session.ts';
import { resolveServerUrl, SocketSession } from '../network/socket-session.ts';
import type { GameTransport } from '../network/transport.ts';
import { ClientWorld } from './client-world.ts';
import { SERVER_FIELD_ID } from './hud-state.ts';
import type { RunResult, UiState } from './hud-state.ts';
import { InputManager } from './input-manager.ts';
import { deathFade, finishRun, healthFraction, NO_RUN_UI, RunHud } from './run-hud.ts';
import { pickupNote } from './run-notices.ts';
import { DEFAULT_PREFS, loadBest, loadPrefs, savePrefs } from './storage.ts';

const GAME_OVER_BEAT_MS = 1800;
const MAX_FRAME_DT = 0.05;
const MAX_INPUTS_PER_FRAME = 2;
const CALLSIGN_MAX = 12;
const FALLBACK_CALLSIGN = 'SURVIVOR';
const TITLE_MAP_SEED = 20417;
const ART_DELAY_MS = 40;
/** Full intensity by this many hostiles; scales the music, not the danger. */
const INTENSE_HOSTILES = 24;

type UiSound = 'click' | 'hover' | 'start' | 'pause' | 'resume';

const EVENT_MUSIC: Partial<Record<GameEvent['type'], 'wave' | 'intermission'>> = {
  wave_start: 'wave',
  wave_intermission: 'intermission',
};

/** Owns a run from menu to game over. Vue only sees the small state in `ui`. */
export class GameController {
  readonly ui: ShallowRef<UiState>;

  private readonly audio = new AudioEngine();
  private readonly input: InputManager;
  private readonly runHud: RunHud;
  private renderer: WorldRenderer | null = null;
  private transport: GameTransport | null = null;
  private world: ClientWorld | null = null;
  private map: WorldMap | null = null;
  private titleMap: WorldMap | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private lastScene: SceneView = EMPTY_SCENE;
  private raf = 0;
  private artTimer: ReturnType<typeof setTimeout> | null = null;
  private lastFrameMs = 0;
  private lastSnapshotMs = 0;
  private inputClock = 0;
  private inputSeq = 0;
  private aim = 0;
  private titleTime = 0;
  /** Set from the moment the run ends, a beat before the results show. */
  private runResult: RunResult | null = null;
  private gameOverAtMs = 0;
  private welcomed = false;

  constructor() {
    const prefs = loadPrefs();
    this.ui = shallowRef<UiState>({
      screen: 'title',
      art: null,
      mode: 'solo',
      connecting: false,
      error: null,
      ...NO_RUN_UI,
      lostReason: '',
      signalWeak: false,
      best: loadBest(),
      callsign: prefs.callsign || DEFAULT_PREFS.callsign,
      serverAddress: prefs.serverAddress,
      volume: this.audio.volume,
      muted: this.audio.muted,
    });
    this.runHud = new RunHud(() => this.ui.value, (patch) => this.publish(patch));
    this.input = new InputManager({
      onGesture: () => this.audio.unlock(),
      onPause: () => this.togglePause(),
      onMute: () => this.toggleMute(),
      onConfirm: (target) => this.confirm(target),
      onMap: () => this.toggleMap(),
      mapUsable: () => this.canUseMap(),
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
    this.applyUiUnit();
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

  private applyUiUnit(): void {
    document.documentElement.style.setProperty('--u', `${uiUnit(window.innerWidth, window.innerHeight)}px`);
  }

  private readonly onResize = (): void => {
    this.applyUiUnit();
    this.renderer?.resize();
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

  startSolo(): void {
    if (!this.canStart()) return;
    this.audio.unlock();
    this.audio.playUi('start');
    this.publish({ mode: 'solo', error: null });
    this.beginSession(new LocalSession());
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

  private beginSession(transport: GameTransport): void {
    this.transport = transport;
    this.welcomed = false;
    transport.onWelcome = (packet) => this.onWelcome(packet);
    transport.onSnapshot = (packet) => this.onSnapshot(packet);
    transport.onClosed = (reason) => this.onClosed(reason);
    transport.connect(this.ui.value.callsign.trim() || FALLBACK_CALLSIGN);
  }

  /** A menu is over the game: solo stops, and co-op stands still while the town carries on. */
  private holdRun(held: boolean): void {
    this.transport?.setPaused(held);
    this.input.setEnabled(!held);
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

  playAgain(): void {
    const canRestart = this.ui.value.screen === 'gameover' && !this.ui.value.restarting;
    if (!canRestart) return;
    this.audio.playUi('start');
    this.publish({ restarting: true });
    this.transport?.requestRestart();
  }

  toMenu(): void {
    this.transport?.disconnect();
    this.transport = null;
    this.world = null;
    this.runResult = null;
    this.input.setEnabled(false);
    this.audio.setScene('menu');
    if (this.titleMap) this.renderer?.setMap(this.titleMap);
    this.publish({ ...NO_RUN_UI, screen: 'title', connecting: false, best: loadBest() });
  }

  private confirm(target: EventTarget | null): void {
    const { screen } = this.ui.value;
    const inServerField = target instanceof HTMLInputElement && target.id === SERVER_FIELD_ID;
    if (screen === 'title' && inServerField) this.startCoop();
    else if (screen === 'title') this.startSolo();
    else if (screen === 'gameover') this.playAgain();
    else if (screen === 'lost') this.toMenu();
    else if (this.isMenuUp()) this.togglePause();
  }

  // --- Transport -----------------------------------------------------------

  private onWelcome(packet: WelcomePacket): void {
    this.welcomed = true;
    this.map = generateWorldMap(packet.mapSeed);
    this.world = new ClientWorld(this.map, packet.yourId);
    this.runHud.setMap(this.map);
    this.renderer?.setMap(this.map);
    this.beginRun();
  }

  private beginRun(): void {
    this.runResult = null;
    this.inputClock = 0;
    this.runHud.reset();
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
      this.beginRun();
    }
    // Someone joining mid-horde gets no wave_start, so the first frame sets the mood.
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
    this.gameOverAtMs = now;
    this.input.setEnabled(false);
    this.audio.setScene('gameover');
    this.publish({ paused: false, mapOpen: false, banner: null, place: null, best: loadBest() });
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
      this.aim = aimAngle(
        pointerX,
        pointerY,
        camera.screenX(world.predictor.x),
        camera.screenY(world.predictor.y) - CHEST_HEIGHT,
      );
    }
    const aim = this.aim;
    const delay = transport?.interpolationDelayMs ?? 0;
    const entities = world.advance(ms, delay, dirX, dirY, aim, dt);
    if (!entities) return;

    const result = this.runResult;
    const over = result !== null;
    const scene: SceneView = {
      ...entities,
      pointerX: over ? null : pointerX,
      pointerY: over ? null : pointerY,
      showCrosshair: this.isPlaying() && !menuUp,
    };
    this.lastScene = scene;
    const sending = transport !== null && !over;
    if (sending) this.sendInputs(transport, world, aim, dirX, dirY, dt);
    this.tickAudio(world, scene, dt);
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

  /** Sent at the sim's rate, however fast this display runs. */
  private sendInputs(transport: GameTransport, world: ClientWorld, aim: number, dirX: number, dirY: number, dt: number): void {
    this.inputClock += dt;
    let budget = MAX_INPUTS_PER_FRAME;
    while (this.inputClock >= TICK_DT && budget > 0) {
      this.inputClock -= TICK_DT;
      budget -= 1;
      this.inputSeq += 1;
      transport.sendInput(this.input.sample(this.inputSeq, aim, world.localPlayer));
      world.predictor.record(this.inputSeq, dirX, dirY);
    }
    const fellBehind = this.inputClock >= TICK_DT;
    if (fellBehind) this.inputClock = 0;
  }

  /** Called when the keys have just been let go, so a teammate does not keep running. */
  private sendNeutralInput(): void {
    const world = this.world;
    const inRun = world !== null && this.transport !== null;
    if (!inRun) return;
    this.inputSeq += 1;
    const angle = world.localPlayer?.angle ?? 0;
    this.transport?.sendInput(this.input.sample(this.inputSeq, angle, null));
    world.predictor.record(this.inputSeq, 0, 0);
  }

  private tickAudio(world: ClientWorld, scene: SceneView, dt: number): void {
    const health = healthFraction(world.localPlayer);
    this.audio.setListener(scene.focusX, scene.focusY);
    this.audio.setHealth(health);
    const threat = scene.phase === 'wave' ? Math.min(1, scene.hostiles / INTENSE_HOSTILES) : 0;
    this.audio.setIntensity(Math.min(1, threat * 0.75 + (1 - health) * 0.25));
    this.audio.tick(dt, scene.zombies);
  }
}
