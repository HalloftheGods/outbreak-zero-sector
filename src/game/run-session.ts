import type { ShallowRef } from 'vue';
import type { JoinHome } from '../../shared/home-protocol.ts';
import type { SnapshotPacket, WelcomePacket, WorldMap } from '../../shared/protocol.ts';
import type { AudioEngine } from '../audio/audio-engine.ts';
import type { WorldRenderer } from '../engine/world-renderer.ts';
import { LocalSession } from '../network/local-session.ts';
import { resolveServerUrl, SocketSession } from '../network/socket-session.ts';
import type { ConnectOptions, GameTransport } from '../network/transport.ts';
import type { BenchLink } from './bench-link.ts';
import { ClientWorld } from './client-world.ts';
import { loadCharacter } from './character-pref.ts';
import { loadDifficulty } from './difficulty-pref.ts';
import type { HomeLink } from './home-link.ts';
import type { RunResult, UiState } from './hud-state.ts';
import type { InputManager } from './input-manager.ts';
import type { InputSender } from './input-sender.ts';
import { continueLevel, loadLevelProgress, soloStartLevel } from './level-progress.ts';
import { NO_RUN_UI } from './run-hud.ts';
import type { RunHud } from './run-hud.ts';
import type { RunStage } from './run-stage.ts';
import { loadBest, loadLeaderboard } from './storage.ts';

const FALLBACK_CALLSIGN = 'SURVIVOR';
const HOME_UNREADABLE = 'The game could not open your saved home.';

/** What a run keeps between snapshots, shared by the session and the snapshot handler. */
export interface RunState {
  transport: GameTransport | null;
  world: ClientWorld | null;
  /** Set from the moment the run ends, a beat before the results show. */
  runResult: RunResult | null;
  welcomed: boolean;
  lastSnapshotMs: number;
  gameOverAtMs: number;
  /** Highest level already written to storage this page load, so snapshots do not hit it every tick. */
  levelNoted: number;
  /** Whether the last snapshot was of the bunker, or null before any. */
  inBunker: boolean | null;
}

/** The controller's parts a run reaches into. */
export interface RunHost {
  readonly state: RunState;
  readonly ui: ShallowRef<UiState>;
  readonly audio: AudioEngine;
  readonly input: InputManager;
  readonly inputs: InputSender;
  readonly runHud: RunHud;
  readonly stage: RunStage;
  readonly bench: BenchLink;
  readonly home: HomeLink;
  readonly renderer: WorldRenderer | null;
  readonly titleMap: WorldMap | null;
  publish(patch: Partial<UiState>): void;
  onResize(): void;
}

export function newRunState(): RunState {
  return { transport: null, world: null, runResult: null, welcomed: false, lastSnapshotMs: 0, gameOverAtMs: 0, levelNoted: 0, inBunker: null };
}

/** Starts, restarts and ends a run: the connection from menu to welcome to menu. */
export class RunSession {
  constructor(
    private readonly host: RunHost,
    private readonly onSnapshot: (snapshot: SnapshotPacket) => void,
  ) {}

  /** A fresh solo run from level 1, or from `fromLevel` with the return kit. */
  startSolo(fromLevel?: number): void {
    if (!this.canStart()) return;
    this.host.audio.unlock();
    this.host.audio.playUi('start');
    this.host.publish({ mode: 'solo', error: null });
    this.beginSession(new LocalSession(), fromLevel);
  }

  /** Solo from `chosen` (guarded by what is unlocked) or, with none, the furthest level reached. Does nothing if there is no later level to start at. */
  continueSolo(chosen?: number): void {
    const level = soloStartLevel(chosen, loadLevelProgress());
    if (level !== null) this.startSolo(level);
  }

  startCoop(): void {
    if (!this.canStart()) return;
    this.host.audio.unlock();
    const url = resolveServerUrl(this.host.ui.value.serverAddress, window.location);
    const badAddress = url === null;
    if (badAddress) {
      this.host.publish({ error: 'That server address does not look right.' });
      return;
    }
    this.host.audio.playUi('start');
    this.host.publish({ mode: 'coop', error: null, connecting: true });
    this.beginSession(new SocketSession(url));
  }

  playAgain(fromLevel?: number): void {
    const { state, ui } = this.host;
    const won = state.runResult?.stats.outcome === 'victory';
    const canRestart = ui.value.screen === 'gameover' && !ui.value.restarting && !won;
    if (!canRestart) return;
    this.host.audio.playUi('start');
    this.host.publish({ restarting: true });
    state.transport?.requestRestart(fromLevel);
  }

  /** After a solo death: back in at the furthest level reached. Co-op restarts stay at level 1. */
  continueAgain(): void {
    if (this.host.state.transport?.kind !== 'solo') return;
    const level = continueLevel(loadLevelProgress());
    if (level !== null) this.playAgain(level);
  }

  toMenu(): void {
    const { state, input, audio, titleMap, renderer } = this.host;
    this.host.home.close();
    state.transport?.disconnect();
    state.transport = null;
    state.world = null;
    state.runResult = null;
    input.setEnabled(false);
    audio.setScene('menu');
    this.host.onResize();
    const hasTitleMap = titleMap !== null;
    if (hasTitleMap) renderer?.setMap(titleMap);
    this.host.publish({ ...NO_RUN_UI, screen: 'title', connecting: false, best: loadBest(), leaderboard: loadLeaderboard() });
  }

  onWelcome(packet: WelcomePacket): void {
    const { state, stage } = this.host;
    state.welcomed = true;
    this.host.home.welcomed(packet);
    state.world = new ClientWorld(stage.open(packet.mapSeed), packet.yourId);
    this.beginRun();
  }

  beginRun(): void {
    const { state, input, inputs, runHud } = this.host;
    state.runResult = null;
    state.inBunker = null;
    inputs.reset();
    runHud.reset();
    this.host.onResize();
    input.setEnabled(true);
    this.host.publish({ ...NO_RUN_UI, screen: 'game', connecting: false });
  }

  onClosed(reason: string): void {
    const { state, input, audio, titleMap, renderer } = this.host;
    this.host.home.close();
    state.transport = null;
    if (!state.welcomed) {
      this.host.publish({ connecting: false, error: reason });
      return;
    }
    state.world = null;
    state.runResult = null;
    input.setEnabled(false);
    audio.setScene('menu');
    this.host.onResize();
    const hasTitleMap = titleMap !== null;
    if (hasTitleMap) renderer?.setMap(titleMap);
    this.host.publish({ ...NO_RUN_UI, screen: 'lost', lostReason: reason });
  }

  private canStart(): boolean {
    const { art, connecting, screen } = this.host.ui.value;
    return art !== null && !connecting && screen === 'title';
  }

  private beginSession(transport: GameTransport, startLevel?: number): void {
    const { state, ui, home } = this.host;
    state.transport = transport;
    state.welcomed = false;
    transport.onWelcome = (packet) => this.onWelcome(packet);
    transport.onSnapshot = this.onSnapshot;
    transport.onClosed = (reason) => this.onClosed(reason);
    const options = { name: ui.value.callsign.trim() || FALLBACK_CALLSIGN, difficulty: loadDifficulty(), character: loadCharacter() };
    if (!home.enabled) {
      transport.connect({ ...options, startLevel });
      return;
    }
    this.connectHome(transport, options);
  }

  /** The save is read first, so the room hears of the gear before it hears of the player. A level is picked at the garage, not here. */
  private connectHome(transport: GameTransport, options: Pick<ConnectOptions, 'name' | 'difficulty' | 'character'>): void {
    const { state, home } = this.host;
    this.host.publish({ connecting: true });
    const stillWanted = (): boolean => state.transport === transport;
    const connect = (join: JoinHome): void => {
      const wanted = stillWanted();
      if (wanted) transport.connect({ ...options, home: join, homeLoop: true });
    };
    const giveUp = (): void => {
      const gone = !stillWanted();
      if (gone) return;
      state.transport = null;
      this.host.publish({ connecting: false, error: HOME_UNREADABLE });
    };
    void home.open(transport.kind).then(connect, giveUp);
  }
}
