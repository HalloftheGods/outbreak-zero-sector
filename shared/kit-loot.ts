import { containerInBuilding } from './container-loot.ts';
import type { Point } from './flow-field.ts';
import { freeSpot } from './part-loot.ts';
import { spawnPickup } from './pickups.ts';
import type { BuildingInstance } from './protocol.ts';
import { GUN_EFFECTS, KIT_CONTAINER_SHARE, KIT_EXTRA_ODDS_PER_LEVEL, KIT_SOURCES, KITS_PER_TOWN } from './round-effect-data.ts';
import type { GunEffect, KitCounts, RoundKitId } from './round-effect-data.ts';
import { createRng, pickWeighted, shuffle } from './rng.ts';
import type { Rng } from './rng.ts';
import type { SimState } from './sim-state.ts';

/** Off the town's seed, so kits leave the run's RNG, and all the loot rolled from it, as it was. */
const KIT_SEED_SALT = 0x6b17;

/** Three kits, or four: the odds of the fourth are all that a later level changes. */
export function kitsInTown(rng: Rng, level: number): number {
  const extraOdds = KIT_EXTRA_ODDS_PER_LEVEL * (level - 1);
  return rng() < extraOdds ? KITS_PER_TOWN + 1 : KITS_PER_TOWN;
}

function rollKit(rng: Rng, building: BuildingInstance): RoundKitId {
  const effect: GunEffect = pickWeighted<GunEffect>(rng, KIT_SOURCES[building.kind] as Partial<KitCounts>);
  return GUN_EFFECTS[effect].kit;
}

/** Into an empty container here if the roll says so and there is one, otherwise onto the floor. */
function placeKit(sim: SimState, rng: Rng, building: BuildingInstance, spots: readonly Point[]): boolean {
  const kit = rollKit(rng, building);
  const putAway = rng() < KIT_CONTAINER_SHARE;
  const space = putAway ? containerInBuilding(sim, building, rng) : null;
  if (space) {
    space.loot = { type: kit, rounds: 0 };
    return true;
  }
  const spot = freeSpot(sim, spots);
  if (spot) spawnPickup(sim, kit, spot.x, spot.y);
  return spot !== null;
}

/** Runs after the town's own loot. Spots come from the caller, which knows the rooms. */
export function placeTownKits(sim: SimState, spotsIn: (building: BuildingInstance) => readonly Point[]): void {
  const rng = createRng(sim.map.seed ^ KIT_SEED_SALT);
  let left = kitsInTown(rng, sim.level);
  const sources = shuffle(rng, sim.map.buildings.filter((building) => KIT_SOURCES[building.kind]));
  for (const building of sources) {
    const allPlaced = left === 0;
    if (allPlaced) return;
    const placed = placeKit(sim, rng, building, shuffle(rng, [...spotsIn(building)]));
    if (placed) left -= 1;
  }
}
