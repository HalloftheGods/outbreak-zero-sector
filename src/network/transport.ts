import type { DifficultyId } from '../../shared/difficulty.ts';
import type { ClientInputPacket, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';
import type { BenchAction } from '../../shared/workbench.ts';

export type TransportKind = 'solo' | 'coop';

/** The one seam between the game client and a simulation, in-browser or over ws. */
export interface GameTransport {
  readonly kind: TransportKind;
  /** How far behind the newest snapshot remote entities are drawn. */
  readonly interpolationDelayMs: number;
  onWelcome: (packet: WelcomePacket) => void;
  onSnapshot: (packet: SnapshotPacket) => void;
  /** Fires at most once, and never after disconnect(). */
  onClosed: (reason: string) => void;
  /** Solo plays on this difficulty; in co-op the server uses it only if this player is first into the room. */
  connect(name: string, difficulty?: DifficultyId, character?: number, startLevel?: number): void;
  sendInput(input: ClientInputPacket): void;
  sendBench(action: BenchAction): void;
  /** Solo can begin again from a later level; co-op restarts at level 1 and ignores it. */
  requestRestart(fromLevel?: number): void;
  setPaused(paused: boolean): void;
  disconnect(): void;
}
