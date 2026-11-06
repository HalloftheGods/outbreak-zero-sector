// Walking up to something in the bunker and holding E. It borrows the search key: a per-player hold,
// so the input packet does not change. A shop, the locker and the rest are client screens over `p.home.station`.

import { TICK_DT } from './constants.ts';
import type { Station } from './home-protocol.ts';
import type { WorldMap } from './protocol.ts';
import type { PlayerState, SimState } from './sim-state.ts';

/** Seconds of holding E before a station opens. */
export const STATION_HOLD_SEC = 0.5;

/** The nearest station whose circle holds the point, or null in open floor. */
export function stationInReach(map: WorldMap, x: number, y: number): Station | null {
  let nearest: Station | null = null;
  let nearestGap = Infinity;
  for (const station of map.stations ?? []) {
    const gap = Math.hypot(x - station.x, y - station.y);
    const closer = gap <= station.radius && gap < nearestGap;
    if (closer) {
      nearest = station;
      nearestGap = gap;
    }
  }
  return nearest;
}

function closeStation(home: NonNullable<PlayerState['home']>): void {
  home.station = null;
  home.stationHold = 0;
}

/** Walking off, or falling, puts the station away. */
function keepOpen(sim: SimState, p: PlayerState, home: NonNullable<PlayerState['home']>): void {
  const stillThere = p.status === 'alive' && stationInReach(sim.map, p.x, p.y)?.id === home.station;
  if (!stillThere) closeStation(home);
  if (stillThere) home.lastActiveTick = sim.tick;
}

/** Holding E in reach of a station, still, for long enough. */
function holdToOpen(sim: SimState, p: PlayerState, home: NonNullable<PlayerState['home']>): void {
  const target = p.status === 'alive' ? stationInReach(sim.map, p.x, p.y) : null;
  const holding = target !== null && p.searchHeld && !p.searchSpent && !p.moving;
  if (!holding) {
    home.stationHold = 0;
    return;
  }
  home.lastActiveTick = sim.tick;
  home.stationHold = Math.min(1, home.stationHold + TICK_DT / STATION_HOLD_SEC);
  const done = home.stationHold >= 1;
  if (done) {
    home.station = target.id;
    home.stationHold = 0;
    // The press has done its work: nothing more until it is let go.
    p.searchSpent = true;
  }
}

/** Runs beside `updateSearch` on every tick. Only a home room has stations. */
export function updateStations(sim: SimState, p: PlayerState): void {
  const { home } = p;
  if (!sim.homeRun || !home) return;
  if (home.station !== null) keepOpen(sim, p, home);
  else holdToOpen(sim, p, home);
}
