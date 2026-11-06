// The overrun's reward chest: a roll from tables that already exist, one per player, opened by holding E at the chest
// or written for them when the van leaves first. Nothing here runs unless an overrun was held.

import { AMMO_PICKUPS } from './constants.ts';
import { rollFind } from './container-loot.ts';
import { scaleRounds } from './difficulty.ts';
import type { Jewels, Loadout } from './home-protocol.ts';
import { emptyLoadout } from './loadout.ts';
import { overrunFacts } from './overrun-fight.ts';
import { OVERRUN_CHEST_FINDS, OVERRUN_CHEST_STACKS } from './overrun.ts';
import { isAmmoPickup } from './pickups.ts';
import { randInt } from './rng.ts';
import type { PlayerState, SimState } from './sim-state.ts';
import { SILVER_STACK_MAX, SILVER_STACK_MIN } from './treasure.ts';

/** The room's highest level from which the chest holds a small jewel. */
export const OVERRUN_CHEST_JEWEL_FROM = 5;

export interface ChestRoll {
  gear: Loadout;
  silver: number;
  jewels: Jewels;
}

/**
 * What a chest holds. Ammo is three police-table finds kept as whole boxes (a chest is full boxes, not the half-used drawer rule),
 * credited whether or not the player owns the gun: `mergeHome` caps the bag. Plus a medkit, six silver stacks and, from level 5, a small jewel.
 */
export function rollChest(sim: SimState, highest: number): ChestRoll {
  const gear = emptyLoadout();
  for (let i = 0; i < OVERRUN_CHEST_FINDS; i += 1) {
    const { type } = rollFind(sim, 'police');
    if (!isAmmoPickup(type)) continue;
    const box = AMMO_PICKUPS[type];
    gear.ammoBag[box.weapon] += scaleRounds(box.rounds, sim.difficulty);
  }
  gear.medkits = 1;
  let silver = 0;
  for (let i = 0; i < OVERRUN_CHEST_STACKS; i += 1) silver += randInt(sim.rng, SILVER_STACK_MIN, SILVER_STACK_MAX);
  return { gear, silver, jewels: { small: highest >= OVERRUN_CHEST_JEWEL_FROM ? 1 : 0, large: 0 } };
}

/**
 * Rolls and writes this player's held receipt, once: the chest is spent. Does nothing without a chest waiting. A body that fell in the
 * horde holds a died receipt the client may not have applied yet, so the held one carries it rather than writing over it.
 */
export function openChest(sim: SimState, p: PlayerState): void {
  const { home } = p;
  const run = sim.homeRun;
  const overrun = sim.overrun;
  const nothingWaiting = !home || !home.chest || !run || !overrun;
  if (nothingWaiting) return;
  const roll = rollChest(sim, run.roomHighest);
  const prior = home.overrun;
  const death = prior?.outcome === 'died' ? { died: prior } : {};
  home.chest = false;
  home.overrun = { ...overrunFacts(sim, run, overrun), outcome: 'held', share: 0, chest: roll.gear, silver: roll.silver, jewels: roll.jewels, lost: null, ...death };
  home.station = null;
  home.stationHold = 0;
}

/** The van is leaving: every chest still shut is opened for its owner, so leaving never costs a reward. */
export function openPendingChests(sim: SimState): void {
  for (const p of sim.players) openChest(sim, p);
}
