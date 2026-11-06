import { characterOf } from './characters.ts';
import { rollFind } from './container-loot.ts';
import { containerInReach, SEARCH_SEC, townContainers } from './containers.ts';
import type { ContainerLoot } from './containers.ts';
import { TICK_DT } from './constants.ts';
import { spawnPickup } from './pickups.ts';
import type { PlayerState, SimState } from './sim-state.ts';
import { emit } from './sim-state.ts';
import { makeNoise } from './zombie-senses.ts';
import { maybeCarAlarm, scroungeBottle } from './bottles.ts';

/** Odds that a search knocks something over. */
export const CLATTER_CHANCE = 0.1;
/** Zombies this close hear it, a good way short of a pistol. */
export const CLATTER_RADIUS = 170;

export function stopSearch(p: PlayerState): void {
  p.searchingId = null;
  p.searchLeft = 0;
  p.search = 0;
}

function startSearch(sim: SimState, p: PlayerState): void {
  const free = p.searchHeld && !p.searchSpent && !p.moving;
  const target = free ? containerInReach(sim.map, p.x, p.y, (id) => sim.containers[id].opened) : null;
  if (!target) return;
  p.searchingId = target.id;
  p.searchLeft = SEARCH_SEC[target.kind];
}

/** What was put away here or, rolled now so every client agrees, what a lucky searcher turns up anyway. */
function findIn(sim: SimState, p: PlayerState, id: number): ContainerLoot | null {
  const { loot } = sim.containers[id];
  const lucky = loot === null && sim.rng() < characterOf(p.skin).searchLuck;
  return lucky ? rollFind(sim, townContainers(sim.map)[id].buildingKind) : loot;
}

/** Whatever was in it falls at the searcher's feet, for them or for whoever has room for it. */
function finishSearch(sim: SimState, p: PlayerState, id: number): void {
  const state = sim.containers[id];
  const loot = findIn(sim, p, id);
  state.opened = true;
  state.loot = null;
  const noisy = sim.rng() < CLATTER_CHANCE;
  const found = loot !== null;
  if (noisy) makeNoise(sim, p.x, p.y, CLATTER_RADIUS);
  if (found) spawnPickup(sim, loot.type, p.x, p.y, loot.rounds);
  const bottle = !found && scroungeBottle(sim, p);
  maybeCarAlarm(sim, townContainers(sim.map)[id]);
  emit(sim, { type: 'container_opened', playerId: p.id, container: id, x: p.x, y: p.y, found, noisy, ...(bottle ? { bottle } : {}) });
  stopSearch(p);
  p.searchSpent = true;
}

/** Ends a search the player or a teammate has put a stop to. */
function keepSearching(sim: SimState, p: PlayerState, id: number, hurt: boolean): void {
  const interrupted = p.moving || hurt;
  if (interrupted) p.searchSpent = true;
  const stopped = interrupted || !p.searchHeld || sim.containers[id].opened;
  if (stopped) stopSearch(p);
}

function advanceSearch(sim: SimState, p: PlayerState, id: number): void {
  const total = SEARCH_SEC[townContainers(sim.map)[id].kind];
  p.searchLeft -= TICK_DT;
  // A floor above zero keeps "searching" distinct from "not searching" on the first tick.
  p.search = Math.max(0.01, 1 - p.searchLeft / total);
  const done = p.searchLeft <= 1e-9;
  if (done) finishSearch(sim, p, id);
}

/** Holding the key works through what is in reach. Moving or taking a hit undoes it, and it wants a fresh press. */
export function updateSearch(sim: SimState, p: PlayerState): void {
  const released = !p.searchHeld;
  if (released) p.searchSpent = false;
  const hurt = p.health < p.searchHealth;
  p.searchHealth = p.health;
  if (p.searchingId !== null) keepSearching(sim, p, p.searchingId, hurt);
  if (p.searchingId === null) startSearch(sim, p);
  if (p.searchingId !== null) advanceSearch(sim, p, p.searchingId);
}

/** The ids of everything opened in this town, for every client to draw. */
export function openedContainers(sim: SimState): number[] {
  const opened: number[] = [];
  sim.containers.forEach(({ opened: isOpen }, id) => {
    if (isOpen) opened.push(id);
  });
  return opened;
}
