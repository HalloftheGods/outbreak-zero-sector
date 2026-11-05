import type { ClientInputPacket, SnapshotPacket, WelcomePacket } from '../../shared/protocol.ts';

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
  connect(name: string): void;
  sendInput(input: ClientInputPacket): void;
  requestRestart(): void;
  setPaused(paused: boolean): void;
  disconnect(): void;
}
