// Treasure in the sim: placed, taken and dropped. The bunker-world lane fills the stubs here.
// It keeps its own generator and id counter, off `entityId()`, `sim.rng` and the ammo budget.

import { TREASURE_TYPES } from './events.ts';
import type { PickupType } from './protocol.ts';
import type { PickupState, PlayerState, SimState } from './sim-state.ts';

const SILVER_PER_GOLD = 100;

export type TreasurePickup = (typeof TREASURE_TYPES)[number];

export const isTreasurePickup = (type: PickupType): type is TreasurePickup => TREASURE_TYPES.includes(type as TreasurePickup);

/** Money is stored as whole silver and shown as gold and silver. */
export function silverToCoins(silver: number): { gold: number; silver: number } {
  return { gold: Math.floor(silver / SILVER_PER_GOLD), silver: silver % SILVER_PER_GOLD };
}

/** Stub: places nothing. Runs after `seedPopulation`, and must return early unless `sim.homeRun` is set. */
export function placeTownTreasure(sim: SimState): void {}

/** Stub: false leaves the item on the ground. */
export function takeTreasure(p: PlayerState, item: PickupState): boolean {
  return false;
}

/** Stub: drops nothing, and writes what dropped to `p.home.lost`. Runs on every death, and must return early unless `sim.homeRun` is set. */
export function dropCarried(sim: SimState, p: PlayerState): void {}
