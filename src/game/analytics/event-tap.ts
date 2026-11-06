/**
 * Where the game hands analytics what it already knows. The game calls these and does not care who
 * listens or whether anyone does; nothing here can change what the game does.
 */
import type { GameEvent } from '../../../shared/protocol.ts';
import type { BenchAction } from '../../../shared/workbench.ts';

export interface GameTap {
  event(event: GameEvent): void;
  /** Which player in the events is this one. */
  localPlayer(id: string): void;
  /** The difficulty the room is played on, when the server said. */
  roomDifficulty(difficulty: string): void;
  bench(action: BenchAction): void;
}

let listener: GameTap | null = null;

/** The one listener, or none to stop listening. */
export function listenToGame(next: GameTap | null): void {
  listener = next;
}

function quietly(call: (tap: GameTap) => void): void {
  try {
    if (listener) call(listener);
  } catch {
    // chemx-allow: best-effort analytics must never reach play
  }
}

export const tapGameEvent = (event: GameEvent): void => quietly((tap) => tap.event(event));
export const tapRoomDifficulty = (difficulty: string): void => quietly((tap) => tap.roomDifficulty(difficulty));
export const tapLocalPlayer = (id: string): void => quietly((tap) => tap.localPlayer(id));
export const tapBenchAction = (action: BenchAction): void => quietly((tap) => tap.bench(action));
