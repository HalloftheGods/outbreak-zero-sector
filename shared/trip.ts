// Out to a town and back. The trip-loop lane fills the stubs here.

import type { HomeAction, JoinHome } from './home-protocol.ts';
import { FIRST_LEVEL } from './levels.ts';
import { applyLoadout } from './loadout.ts';
import type { HomeRun, PlayerState, SimState } from './sim-state.ts';

const SIM_ID_BYTES = 8;

/** Off `sim.rng`, so it moves no roll. Not randomUUID: that only exists on https, and a LAN server is plain http. */
function newSimId(seed: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(SIM_ID_BYTES));
  const noise = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${seed.toString(36)}-${noise}`;
}

export function newHomeRun(seed: number): HomeRun {
  return { simId: newSimId(seed), tripLevel: null, pickedLevel: null, attempt: 0, roomHighest: FIRST_LEVEL, nextTreasure: 0, nextReceipt: 1 };
}

/** A newcomer to a home room, with the gear and highest level they brought. Does nothing with home off. */
export function enterHome(sim: SimState, p: PlayerState, join?: JoinHome): void {
  if (!sim.homeRun) return;
  p.home = {
    silver: 0,
    jewels: { small: 0, large: 0 },
    station: null,
    stationHold: 0,
    ready: false,
    receipt: null,
    highest: join?.highest ?? FIRST_LEVEL,
    lost: { silver: 0, jewels: { small: 0, large: 0 } },
    lastActiveTick: sim.tick,
  };
  if (join) applyLoadout(p, join.loadout);
}

/** Stub. Clears every `p.home.receipt` and `p.home.lost`, so a trip's result never outlives the next trip's start. */
export function startTrip(sim: SimState, level: number): void {}

/** Stub. */
export function returnToBunker(sim: SimState): void {}

/** Stub. */
export function wipeToBunker(sim: SimState): void {}

/** Stub: every HomeAction lands here. */
export function homeCommand(sim: SimState, p: PlayerState, action: HomeAction): void {}
