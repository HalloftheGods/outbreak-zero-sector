// Treasure in the sim: placed, taken and dropped.
// It keeps its own generator and id counter, off `entityId()`, `sim.rng` and the ammo budget.

import { townContainers } from './containers.ts';
import type { Container } from './containers.ts';
import { TREASURE_TYPES } from './events.ts';
import { FINAL_LEVEL, FIRST_LEVEL } from './levels.ts';
import type { PickupType } from './protocol.ts';
import { createRng, randInt, shuffle } from './rng.ts';
import type { PickupState, PlayerState, SimState } from './sim-state.ts';

const SILVER_PER_GOLD = 100;

/** Keeps the treasure rolls apart from the town's own use of its seed. */
const TREASURE_SALT = 0x54524541;

export const SMALL_JEWEL_SILVER = 40;
export const LARGE_JEWEL_SILVER = 200;
export const SILVER_STACK_MIN = 5;
export const SILVER_STACK_MAX = 20;

export type TreasurePickup = (typeof TREASURE_TYPES)[number];

export const isTreasurePickup = (type: PickupType): type is TreasurePickup => TREASURE_TYPES.includes(type as TreasurePickup);

/** Money is stored as whole silver and shown as gold and silver. */
export function silverToCoins(silver: number): { gold: number; silver: number } {
  return { gold: Math.floor(silver / SILVER_PER_GOLD), silver: silver % SILVER_PER_GOLD };
}

interface TreasureCounts {
  silver: number;
  small: number;
  large: number;
}

/** What a town holds at its first level and at its last, with the levels between in step. */
const FIRST_LEVEL_COUNTS: TreasureCounts = { silver: 30, small: 5, large: 1 };
const FINAL_LEVEL_COUNTS: TreasureCounts = { silver: 45, small: 8, large: 3 };

/** A replay of a level the room has already got past holds half as many of each, rounded down. */
export function treasureCounts(level: number, replay: boolean): TreasureCounts {
  const along = (Math.min(FINAL_LEVEL, Math.max(FIRST_LEVEL, level)) - FIRST_LEVEL) / (FINAL_LEVEL - FIRST_LEVEL);
  const count = (first: number, last: number): number => {
    const full = Math.round(first + (last - first) * along);
    return replay ? Math.floor(full / 2) : full;
  };
  return {
    silver: count(FIRST_LEVEL_COUNTS.silver, FINAL_LEVEL_COUNTS.silver),
    small: count(FIRST_LEVEL_COUNTS.small, FINAL_LEVEL_COUNTS.small),
    large: count(FIRST_LEVEL_COUNTS.large, FINAL_LEVEL_COUNTS.large),
  };
}

/** Jewels live in people's homes, and most of all in the bedroom furniture. */
const BEDROOM_FURNITURE: ReadonlySet<Container['kind']> = new Set(['drawer', 'cabinet']);
const HOME_BUILDINGS: ReadonlySet<Container['buildingKind']> = new Set(['house', 'apartment']);

function jewelRank(container: Container): number {
  const inAHome = HOME_BUILDINGS.has(container.buildingKind);
  if (!inAHome) return 2;
  return BEDROOM_FURNITURE.has(container.kind) ? 0 : 1;
}

/** Treasure's own ids, off `entityId()`, because zombie sense timing reads `sim.nextEntity`. */
export function spawnTreasure(sim: SimState, type: TreasurePickup, x: number, y: number, rounds: number): void {
  const serial = sim.homeRun?.nextTreasure ?? 0;
  if (sim.homeRun) sim.homeRun.nextTreasure = serial + 1;
  sim.pickups.push({ id: `t${serial}`, type, x, y, ttl: null, rounds });
}

/** Takes the first `count` containers off the list and puts one treasure in each. */
function putAway(sim: SimState, places: Container[], type: TreasurePickup, count: number, worth: () => number): void {
  for (const container of places.splice(0, count)) sim.containers[container.id].loot = { type, rounds: worth() };
}

/** Leaves treasure in town containers that were empty, picked from the town's seed alone. Does nothing outside a home room. */
export function placeTownTreasure(sim: SimState): void {
  const run = sim.homeRun;
  if (!run) return;
  const rng = createRng(sim.map.seed ^ TREASURE_SALT);
  const counts = treasureCounts(sim.level, sim.level < run.roomHighest);
  const empty = townContainers(sim.map).filter((container) => sim.containers[container.id].loot === null);
  const byJewelRank = shuffle(rng, [...empty]).sort((a, b) => jewelRank(a) - jewelRank(b));
  putAway(sim, byJewelRank, 'jewel_large', counts.large, () => LARGE_JEWEL_SILVER);
  putAway(sim, byJewelRank, 'jewel_small', counts.small, () => SMALL_JEWEL_SILVER);
  const rest = shuffle(rng, byJewelRank);
  putAway(sim, rest, 'silver', counts.silver, () => randInt(rng, SILVER_STACK_MIN, SILVER_STACK_MAX));
}

/** Whoever touches it carries it. False leaves the item on the ground. */
export function takeTreasure(p: PlayerState, item: PickupState): boolean {
  const { home } = p;
  if (!home) return false;
  if (item.type === 'silver') home.silver += item.rounds;
  if (item.type === 'jewel_small') home.jewels.small += 1;
  if (item.type === 'jewel_large') home.jewels.large += 1;
  // Zero rounds is how the pickup loop knows it is spent.
  item.rounds = 0;
  return true;
}

/** Everything carried falls where they stood, and is written down in `p.home.lost`. Runs on every death. */
export function dropCarried(sim: SimState, p: PlayerState): void {
  const { home } = p;
  if (!sim.homeRun || !home) return;
  const { silver, jewels } = home;
  if (silver > 0) spawnTreasure(sim, 'silver', p.x, p.y, silver);
  for (let n = 0; n < jewels.small; n++) spawnTreasure(sim, 'jewel_small', p.x, p.y, SMALL_JEWEL_SILVER);
  for (let n = 0; n < jewels.large; n++) spawnTreasure(sim, 'jewel_large', p.x, p.y, LARGE_JEWEL_SILVER);
  home.lost = { silver: home.lost.silver + silver, jewels: { small: home.lost.jewels.small + jewels.small, large: home.lost.jewels.large + jewels.large } };
  home.silver = 0;
  home.jewels = { small: 0, large: 0 };
}
