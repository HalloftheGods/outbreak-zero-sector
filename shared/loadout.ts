// Gear in hand, as a Loadout and back. The trip-loop lane fills the stubs here.

import { noParts } from './gun-upgrades.ts';
import type { Loadout } from './home-protocol.ts';
import type { PlayerEntity } from './protocol.ts';
import { noKits } from './round-effects.ts';
import type { PlayerState } from './sim-state.ts';

export function emptyLoadout(): Loadout {
  return { guns: {}, ammoBag: { pistol: 0, carbine: 0, shotgun: 0 }, parts: noParts(), kits: noKits(), medkits: 0, knife: false, bottles: 0 };
}

/** Stub: refuses everything until the lane checks ids, slots and caps. */
export function validateLoadout(value: unknown): Loadout | null {
  return null;
}

/** Stub. */
export function applyLoadout(p: PlayerState, loadout: Loadout): void {}

/** Stub: reads as empty until the lane reads the player. */
export function loadoutOf(p: PlayerState): Loadout {
  return emptyLoadout();
}

/**
 * Stub: reads as empty until the lane fills it. `loadoutOf` for a client, which holds only the entity:
 * built from owned, ammoBag, mags, gear.parts, gear.fits, gear.kits, medkits, knife and bottles.
 * `gear`, `gear.kits` and `bottles` are left off the wire when there are none.
 */
export function loadoutOfEntity(entity: PlayerEntity): Loadout {
  return emptyLoadout();
}

/** Stub: leaves the locker as it is until the lane adds what came home, up to the caps. `applyReceipt` calls it. */
export function mergeHome(locker: Loadout, gear: Loadout): Loadout {
  return locker;
}

/** Stub. */
export function issueFreePistol(p: PlayerState): void {}
