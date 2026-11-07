import { describe, expect, it } from 'vitest';
import { parseClientPacket } from '../server/packets.ts';
import { townContainers } from '../shared/containers.ts';
import { rebuildZombieGrid } from '../shared/zombies.ts';
import {
  FIRE_PLAYER_DAMAGE,
  FIRE_SEC,
  FLARE_CARRY,
  FLARE_SEC,
  FUEL_CARRY,
  MOLOTOV_RANGE,
  stashIn,
  takeStash,
} from '../shared/throwables.ts';
import { addRoamer, eventsOf, input, quietSim, steps } from './helpers/sim-harness.ts';

describe('molotovs and flares', () => {
  it('a molotov spends a bottle and a fuel, lights a zombie in the pool, and burns out', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    p.fuel = 1;
    p.bottles = 1;
    const aim = { x: p.x + 1, y: p.y + 60 };
    const z = addRoamer(state, 'brute', aim.x, aim.y);
    rebuildZombieGrid(state);
    sim.setInput('a', input({ seq: 1, aimX: aim.x, aimY: aim.y, molotov: true }));
    steps(sim, 1);
    const [burst] = eventsOf(sim.snapshot(), 'molotov_burst');
    expect(burst).toBeDefined();
    expect(Math.hypot(burst.x - p.x, burst.y - p.y)).toBeLessThanOrEqual(MOLOTOV_RANGE + 0.01);
    expect(p.fuel).toBe(0);
    expect(p.bottles).toBe(0);
    steps(sim, 2);
    expect(z.status?.burnLeft ?? 0).toBeGreaterThan(0);
    steps(sim, Math.ceil(FIRE_SEC * 30) + 2);
    expect(state.fires).toEqual([]);
  });

  it('needs a bottle as well as fuel', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    p.fuel = 1;
    p.bottles = 0;
    sim.setInput('a', input({ seq: 1, molotov: true }));
    steps(sim, 1);
    expect(eventsOf(sim.snapshot(), 'molotov_burst')).toEqual([]);
    expect(p.fuel).toBe(1);
  });

  it('burns a survivor who stands in it', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    state.fires.push({ x: p.x, y: p.y, ownerId: p.id, left: FIRE_SEC, noiseLeft: 1 });
    const before = p.health;
    steps(sim, 30);
    expect(p.health).toBeLessThanOrEqual(before - FIRE_PLAYER_DAMAGE);
  });

  it('a flare lands, hisses for its time, and goes out', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    p.flares = 1;
    sim.setInput('a', input({ seq: 1, aimX: p.x + 1, aimY: p.y + 80, flare: true }));
    steps(sim, 1);
    expect(eventsOf(sim.snapshot(), 'flare_lit')).toHaveLength(1);
    expect(p.flares).toBe(0);
    expect(state.flares).toHaveLength(1);
    steps(sim, Math.ceil(FLARE_SEC * 30) + 2);
    expect(state.flares).toEqual([]);
  });

  it('carries no more than two of each', () => {
    const { state } = quietSim();
    const [p] = state.players;
    p.fuel = FUEL_CARRY;
    p.flares = FLARE_CARRY;
    expect(takeStash(p, 'fuel')).toBeNull();
    expect(takeStash(p, 'flare')).toBeNull();
    p.fuel = 0;
    expect(takeStash(p, 'fuel')).toBe('fuel');
    expect(p.fuel).toBe(1);
  });

  it('hides fuel and flares by the seed alone, only where they belong', () => {
    const { state } = quietSim();
    const containers = townContainers(state.map);
    const first = containers.map((c) => stashIn(state.map.seed, c));
    const again = containers.map((c) => stashIn(state.map.seed, c));
    expect(again).toEqual(first);
    containers.forEach((c, i) => {
      if (first[i] === 'fuel') expect(['garage', 'warehouse', 'diner']).toContain(c.buildingKind);
      if (first[i] === 'flare') expect(c.kind === 'car' || ['police', 'garage'].includes(c.buildingKind)).toBe(true);
    });
  });

  it('the server passes the new throws through and drops junk', () => {
    const base = { seq: 1, up: false, down: false, left: false, right: false, angle: 0, shoot: false, reload: false, weapon: null, melee: false, heal: false, search: false };
    const parse = (extra: Record<string, unknown>) => parseClientPacket(JSON.stringify({ type: 'input', input: { ...base, ...extra } }));
    expect(parse({ molotov: true, flare: true })).toMatchObject({ input: { molotov: true, flare: true } });
    expect(parse({ molotov: 'yes' })).toBeNull();
  });
});
