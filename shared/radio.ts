import { townContainers } from './containers.ts';
import type { BuildingKind, PickupType } from './protocol.ts';
import { createRng, shuffle } from './rng.ts';
import type { SimState } from './sim-state.ts';

/** Roughly one town in two has a Radio, so most players come across one within the first few levels. */
export const RADIO_ODDS = 0.5;
/** Keeps the Radio's rolls apart from the town's own use of its seed. */
const RADIO_SALT = 0x52414449;
/** Where a Radio is left: the places someone would have kept one. */
const RADIO_PLACES: ReadonlySet<BuildingKind | 'outdoors'> = new Set(['house', 'apartment', 'diner', 'garage']);

const SMALL_FINDS: ReadonlySet<PickupType> = new Set(['bandage', 'knife']);

/**
 * Whether the town's container could give up its place to a Radio: only bare ones or those holding a
 * small find, so the ammo the town settled on stays as it was.
 */
function canTakeRadio(sim: SimState, id: number): boolean {
  const held = sim.containers[id].loot;
  return held === null || SMALL_FINDS.has(held.type);
}

/**
 * Leaves at most one Radio in a container in some towns. It is picked from the town's seed alone, on a
 * generator of its own, so it never moves the simulation's rolls, and a Radio is never loose on the floor.
 */
export function placeRadio(sim: SimState): void {
  const rng = createRng(sim.map.seed ^ RADIO_SALT);
  const townHasRadio = rng() < RADIO_ODDS;
  if (!townHasRadio) return;
  const places = townContainers(sim.map).filter((container) => RADIO_PLACES.has(container.buildingKind));
  const chosen = shuffle(rng, places).find(({ id }) => canTakeRadio(sim, id));
  if (chosen) sim.containers[chosen.id].loot = { type: 'radio', rounds: 0 };
}

/** The container holding the Radio, or null when this town has none. */
export function radioContainerId(sim: SimState): number | null {
  const held = sim.containers.findIndex((state) => state.loot?.type === 'radio');
  return held < 0 ? null : held;
}
