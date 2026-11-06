// Walking up to something in the bunker and holding E. The bunker-world lane fills the stubs here.

import type { Station } from './home-protocol.ts';
import type { WorldMap } from './protocol.ts';
import type { PlayerState, SimState } from './sim-state.ts';

/** Stub: nothing is in reach. */
export function stationInReach(map: WorldMap, x: number, y: number): Station | null {
  return null;
}

/** Stub. Runs beside `updateSearch` on every tick, and must return early unless `sim.homeRun` is set. */
export function updateStations(sim: SimState, p: PlayerState): void {}
