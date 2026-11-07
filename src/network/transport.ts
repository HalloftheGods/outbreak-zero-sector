import type { DifficultyId } from '../../shared/difficulty.ts';
import type { GameStyle } from '../../shared/game-style.ts';
import type { HomeAction, JoinHome } from '../../shared/home-protocol.ts';
import type { ClientInputPacket, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';
import type { BenchAction } from '../../shared/workbench.ts';

export type TransportKind = 'solo' | 'coop';

export interface ConnectOptions {
  readonly name: string;
  /** Solo plays on this difficulty; in co-op the server uses it only if this player is first into the room. */
  readonly difficulty?: DifficultyId;
  readonly character?: number;
  readonly startLevel?: number;
  /** The gear and highest level this player brings to a Campaign run. */
  readonly home?: JoinHome;
  /** Solo plays in this style, and left off that is Arcade. In co-op the room decides, so `SocketSession.join` is told instead. */
  readonly style?: GameStyle;
  /** Solo only: the run's seed, so a Daily Night is the same town for everyone. Left off, a random one. */
  readonly seed?: number;
}

/** The one seam between the game client and a simulation, in-browser or over ws. */
export interface GameTransport {
  readonly kind: TransportKind;
  /** How far behind the newest snapshot remote entities are drawn. */
  readonly interpolationDelayMs: number;
  onWelcome: (packet: WelcomePacket) => void;
  onSnapshot: (packet: SnapshotPacket) => void;
  /** Fires at most once, and never after disconnect(). */
  onClosed: (reason: string) => void;
  connect(options: ConnectOptions): void;
  sendInput(input: ClientInputPacket): void;
  sendBench(action: BenchAction): void;
  sendHome(action: HomeAction): void;
  /** Solo can begin again from a later level; co-op restarts at level 1 and ignores it. */
  requestRestart(fromLevel?: number): void;
  setPaused(paused: boolean): void;
  /** Solo only: stop the clock for a beat (a hit-stop), then carry on unless paused meanwhile. */
  hold?(ms: number): void;
  disconnect(): void;
}
