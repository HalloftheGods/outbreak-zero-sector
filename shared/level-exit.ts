import { EXIT_HOLD_SEC, EXIT_RADIUS, TICK_DT } from './constants.ts';
import { exitSpotOf } from './exit-van.ts';
import type { Point } from './flow-field.ts';
import type { ExitEntity } from './protocol.ts';
import type { SimState } from './sim-state.ts';
import { alivePlayers, emit } from './sim-state.ts';

/** Where the van parks: the same spot on the server and every client, and its body is solid from the start. */
export const chooseExitSpot = exitSpotOf;

/** The level's last horde is behind them: the van is there from now on, hordes or no hordes. */
export function openExit(sim: SimState): void {
  if (sim.exit) return;
  const { x, y } = chooseExitSpot(sim.map);
  sim.exit = { x, y, hold: 0 };
  emit(sim, { type: 'exit_open', level: sim.level, x, y });
}

/** The downed cannot walk to it, so everyone on their feet is everyone who counts. */
function allAtTheVan(sim: SimState, spot: Point): boolean {
  const riders = alivePlayers(sim);
  return riders.length > 0 && riders.every((p) => Math.hypot(p.x - spot.x, p.y - spot.y) <= EXIT_RADIUS);
}

/** Counts the wait at the van, which anyone stepping away starts over. True once it has run out. */
export function exitBoarded(sim: SimState): boolean {
  const exit = sim.exit;
  if (!exit) return false;
  exit.hold = allAtTheVan(sim, exit) ? exit.hold + TICK_DT : 0;
  return exit.hold >= EXIT_HOLD_SEC - 1e-9;
}

export function exitEntity(sim: SimState): ExitEntity | null {
  const exit = sim.exit;
  if (!exit) return null;
  return { x: exit.x, y: exit.y, progress: Math.min(1, exit.hold / EXIT_HOLD_SEC) };
}
