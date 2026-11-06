import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../shared/characters.ts';
import { PLAYER_RADIUS } from '../shared/constants.ts';
import { updateSearch } from '../shared/container-search.ts';
import { containerInReach, townContainers } from '../shared/containers.ts';
import type { Container } from '../shared/containers.ts';
import { TREASURE_TYPES } from '../shared/events.ts';
import { enterTown } from '../shared/level-change.ts';
import { spawnPickup } from '../shared/pickups.ts';
import type { SimState } from '../shared/sim-state.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { dropCarried, isTreasurePickup, placeTownTreasure, silverToCoins } from '../shared/treasure.ts';
import { buildingAt, circleHitsSolid } from '../shared/world-query.ts';
import { homeSim } from './helpers/home-harness.ts';
import { SEED, stateOf, steps } from './helpers/sim-harness.ts';

interface Found {
  silver: number;
  silverTotal: number;
  small: number;
  large: number;
}

/** What the town's containers hold of treasure. */
function treasureIn(state: SimState): Found {
  const found: Found = { silver: 0, silverTotal: 0, small: 0, large: 0 };
  for (const { loot } of state.containers) {
    if (loot?.type === 'silver') {
      found.silver += 1;
      found.silverTotal += loot.rounds;
    }
    if (loot?.type === 'jewel_small') found.small += 1;
    if (loot?.type === 'jewel_large') found.large += 1;
  }
  return found;
}

/** A home room with nobody in it yet, put into a level's town the way a trip does. */
function townAt(level: number, roomHighest = level) {
  const sim = new GameSimulation({ seed: SEED, home: true });
  const state = stateOf(sim);
  if (state.homeRun) state.homeRun.roomHighest = roomHighest;
  enterTown(state, level);
  return { sim, state };
}

/** The same, with one survivor standing in it. */
function townWithSurvivor() {
  const { sim, state } = townAt(1);
  sim.addPlayer('a', 'a');
  return { sim, state, p: state.players[0] };
}

describe('silverToCoins', () => {
  it('shows 100 silver to the gold', () => {
    expect(silverToCoins(1234)).toEqual({ gold: 12, silver: 34 });
  });
});

describe('placing treasure', () => {
  it('home off places no treasure', () => {
    const state = stateOf(new GameSimulation({ seed: SEED }));
    expect(treasureIn(state)).toEqual({ silver: 0, silverTotal: 0, small: 0, large: 0 });
    expect(state.pickups.some((item) => isTreasurePickup(item.type))).toBe(false);
    placeTownTreasure(state);
    expect(treasureIn(state).silver).toBe(0);
  });

  it('treasure leaves ammo in town and every roll on sim.rng as they were', () => {
    const classic = stateOf(new GameSimulation({ seed: SEED }));
    const { state } = townAt(1);
    expect(treasureIn(state).silver).toBeGreaterThan(0);
    const stripped = state.containers.map(({ loot }) => (loot && isTreasurePickup(loot.type) ? null : loot));
    expect(stripped).toEqual(classic.containers.map(({ loot }) => loot));
    expect(state.pickups).toEqual(classic.pickups);
    expect(state.nextEntity).toBe(classic.nextEntity);
    expect(state.rng()).toBe(classic.rng());
  });

  it('only takes a container that was empty', () => {
    const classic = stateOf(new GameSimulation({ seed: SEED }));
    const { state } = townAt(1);
    state.containers.forEach(({ loot }, id) => {
      const wasFilled = classic.containers[id].loot !== null;
      if (wasFilled) expect(loot).toEqual(classic.containers[id].loot);
    });
  });

  it('the treasure table\'s counts hold at levels 1 and 10', () => {
    const first = treasureIn(townAt(1).state);
    expect([first.silver, first.small, first.large]).toEqual([30, 5, 1]);
    const last = treasureIn(townAt(10).state);
    expect([last.silver, last.small, last.large]).toEqual([45, 8, 3]);
  });

  it('values every stack between 5 and 20 silver', () => {
    const { state } = townAt(1);
    for (const { loot } of state.containers) {
      if (loot?.type === 'silver') expect(loot.rounds).toBeGreaterThanOrEqual(5);
      if (loot?.type === 'silver') expect(loot.rounds).toBeLessThanOrEqual(20);
    }
  });

  it('a replay places half as many treasures, rounded down, at full value', () => {
    const full = treasureIn(townAt(2).state);
    const replay = townAt(2, 3).state;
    const half = treasureIn(replay);
    expect([half.silver, half.small, half.large]).toEqual([full.silver, full.small, full.large].map((n) => Math.floor(n / 2)));
    for (const { loot } of replay.containers) {
      if (loot?.type === 'jewel_small') expect(loot.rounds).toBe(40);
      if (loot?.type === 'jewel_large') expect(loot.rounds).toBe(200);
    }
  });

  it('places the same town the same way twice', () => {
    expect(townAt(3).state.containers).toEqual(townAt(3).state.containers);
  });
});

describe('taking treasure', () => {
  it('a coin stack vanishes when taken', () => {
    const { sim, state } = homeSim();
    const [p] = state.players;
    spawnPickup(state, 'silver', p.x, p.y, 12);
    spawnPickup(state, 'jewel_small', p.x, p.y, 40);
    spawnPickup(state, 'jewel_large', p.x, p.y, 200);
    steps(sim, 2);
    expect(state.pickups).toEqual([]);
    expect(p.home?.silver).toBe(12);
    expect(p.home?.jewels).toEqual({ small: 1, large: 1 });
  });

  it('numbers treasure on its own counter, off entityId', () => {
    const { state } = homeSim();
    const before = state.nextEntity;
    spawnPickup(state, 'silver', 0, 0, 5);
    spawnPickup(state, 'jewel_small', 0, 0, 40);
    spawnPickup(state, 'bandage', 0, 0);
    expect(state.pickups.map((item) => item.id).slice(0, 2)).toEqual(['t0', 't1']);
    expect(state.homeRun?.nextTreasure).toBe(2);
    expect(state.nextEntity).toBe(before + 1);
  });
});

describe('dropping what was carried', () => {
  it('a dead player\'s carried treasure drops where they fell, p.home.lost records it, and a teammate can take it', () => {
    const { sim, state } = homeSim({ players: ['a', 'b'] });
    const [a, b] = state.players;
    if (!a.home || !b.home) throw new Error('no home');
    a.x = 100;
    a.y = 100;
    a.home.silver = 140;
    a.home.jewels = { small: 2, large: 1 };
    a.status = 'dead';
    dropCarried(state, a);
    expect(a.home.silver).toBe(0);
    expect(a.home.jewels).toEqual({ small: 0, large: 0 });
    expect(a.home.lost).toEqual({ silver: 140, jewels: { small: 2, large: 1 } });
    expect(state.pickups).toHaveLength(4);
    for (const item of state.pickups) expect([item.x, item.y]).toEqual([100, 100]);
    b.x = 100;
    b.y = 100;
    steps(sim, 2);
    expect(state.pickups).toEqual([]);
    expect(b.home?.silver).toBe(140);
    expect(b.home?.jewels).toEqual({ small: 2, large: 1 });
  });

  it('drops nothing when home is off', () => {
    const state = stateOf(new GameSimulation({ seed: SEED }));
    dropCarried(state, state.players[0] ?? ({} as never));
    expect(state.pickups.some((item) => isTreasurePickup(item.type))).toBe(false);
  });
});

describe('searching a treasure container', () => {
  const sol = CHARACTERS.findIndex((character) => character.id === 'sol');
  const TRIALS = 2000;
  const MAX_TICKS = 400;

  function standingSpot(state: SimState, container: Container): { x: number; y: number } {
    const { x0, y0, x1, y1 } = container.box;
    for (let y = y0 - 24; y <= y1 + 24; y += 2) {
      for (let x = x0 - 24; x <= x1 + 24; x += 2) {
        const open = !circleHitsSolid(state.map, x, y, PLAYER_RADIUS);
        const sameRoom = buildingAt(state.map, x, y)?.id === container.building;
        if (open && sameRoom && containerInReach(state.map, x, y, () => false)?.id === container.id) return { x, y };
      }
    }
    throw new Error('nowhere to stand');
  }

  /** Searches one container 2000 times as Sol, holding the given loot, and counts what was turned up besides treasure. */
  function searches(loot: { type: 'silver'; rounds: number } | null) {
    const { state, p } = townWithSurvivor();
    const container = townContainers(state.map).find((candidate) => candidate.building !== undefined);
    if (!container) throw new Error('no container');
    Object.assign(p, standingSpot(state, container), { skin: sol, moving: false });
    let finds = 0;
    let treasure = 0;
    for (let trial = 0; trial < TRIALS; trial++) {
      state.containers[container.id] = { opened: false, loot };
      state.pickups = [];
      p.searchHeld = false;
      updateSearch(state, p);
      p.searchHeld = true;
      for (let tick = 0; tick < MAX_TICKS && !state.containers[container.id].opened; tick++) updateSearch(state, p);
      finds += state.pickups.filter((item) => !isTreasurePickup(item.type)).length;
      treasure += state.pickups.filter((item) => isTreasurePickup(item.type)).length;
    }
    return { finds, treasure, nextRoll: state.rng(), bottles: p.bottles, nextEntity: state.nextEntity };
  }

  it('a treasure container still makes the luck and bottle rolls', () => {
    const empty = searches(null);
    const holding = searches({ type: 'silver', rounds: 9 });
    expect(empty.finds).toBeGreaterThan(0);
    expect(holding.treasure).toBe(TRIALS);
    expect(holding.finds).toBe(empty.finds);
    expect(holding.bottles).toBe(empty.bottles);
    expect(holding.nextRoll).toBe(empty.nextRoll);
    expect(holding.nextEntity).toBe(empty.nextEntity);
  });

  it('hands out treasure ids from its own counter when a search drops it', () => {
    const { state, p } = townWithSurvivor();
    const container = townContainers(state.map).find((candidate) => candidate.building !== undefined);
    if (!container) throw new Error('no container');
    Object.assign(p, standingSpot(state, container), { moving: false, searchHeld: true });
    state.containers[container.id] = { opened: false, loot: { type: 'jewel_large', rounds: 200 } };
    for (let tick = 0; tick < MAX_TICKS && !state.containers[container.id].opened; tick++) updateSearch(state, p);
    const jewel = state.pickups.find((item) => item.type === 'jewel_large');
    expect(jewel?.id).toBe('t0');
    expect(jewel?.rounds).toBe(200);
  });

  it('knows which pickups are treasure', () => {
    for (const type of TREASURE_TYPES) expect(isTreasurePickup(type)).toBe(true);
    expect(isTreasurePickup('bandage')).toBe(false);
  });
});
