import { describe, expect, it } from 'vitest';
import {
  MELEE_COOLDOWN_SEC,
  MELEE_DAMAGE,
  MELEE_MAX_TARGETS,
  TICK_RATE,
  WEAPONS,
} from '../shared/constants.ts';
import type { ZombieType } from '../shared/protocol.ts';
import type { PlayerState, SimState } from '../shared/sim-state.ts';
import type { GameSimulation } from '../shared/simulation.ts';
import { addZombie, eventsOf, input, quietSim, steps } from './helpers/sim-harness.ts';

function holdCarbine(p: PlayerState, ammo: number, spare: number): void {
  p.guns.carbine = { ammo };
  p.ammoBag.carbine = spare;
  p.owned = ['pistol', 'carbine'];
  p.weapon = 'carbine';
  p.ammo = ammo;
  p.reserve = spare;
}

/** Ticks on which a shot left the gun, over the given run. */
function shotTicks(sim: GameSimulation, ticks: number): number[] {
  const fired: number[] = [];
  for (let tick = 0; tick < ticks; tick++) {
    sim.step();
    if (eventsOf(sim.snapshot(), 'shot').length > 0) fired.push(tick);
  }
  return fired;
}

const gapsBetween = (ticks: readonly number[]): number[] => ticks.slice(1).map((tick, index) => tick - ticks[index]);

describe('the trigger', () => {
  const carbineGap = Math.floor((WEAPONS.carbine.fireIntervalMs / 1000) * TICK_RATE);

  it('owes no shots for being held through a reload', () => {
    const { sim, state } = quietSim();
    holdCarbine(state.players[0], 3, 30);
    sim.setInput('a', input({ seq: 1, shoot: true }));
    const gaps = gapsBetween(shotTicks(sim, TICK_RATE * 4));
    expect(gaps.length).toBeGreaterThan(15);
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(carbineGap);
  });

  it('owes no shots for being held on an empty gun', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    holdCarbine(p, 0, 0);
    sim.setInput('a', input({ seq: 1, shoot: true }));
    steps(sim, TICK_RATE * 2);
    p.guns.carbine!.ammo = 12;
    const gaps = gapsBetween(shotTicks(sim, TICK_RATE * 2));
    expect(gaps.length).toBeGreaterThan(8);
    for (const gap of gaps) expect(gap).toBeGreaterThanOrEqual(carbineGap);
  });

  it('fires once for a tap that starts and ends between two ticks', () => {
    const { sim } = quietSim();
    sim.setInput('a', input({ seq: 1, shoot: true }));
    sim.setInput('a', input({ seq: 2, shoot: false }));
    steps(sim, TICK_RATE);
    expect(eventsOf(sim.snapshot(), 'shot').length).toBe(1);
  });

  it('spends a tap on the tick that reads it, even if the gun could not fire then', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    p.guns.pistol!.ammo = 4;
    sim.setInput('a', input({ seq: 1, reload: true }));
    sim.step();
    sim.setInput('a', input({ seq: 2, shoot: true }));
    sim.setInput('a', input({ seq: 3, shoot: false }));
    steps(sim, TICK_RATE * 2);
    expect(p.shootQueued).toBe(false);
    expect(eventsOf(sim.snapshot(), 'shot').length).toBe(0);
  });

  it('drops a tap from someone who cannot use it', () => {
    const { sim, state } = quietSim(['a', 'b']);
    const [a] = state.players;
    a.status = 'dead';
    sim.setInput('a', input({ seq: 1, shoot: true }));
    sim.setInput('a', input({ seq: 2, shoot: false }));
    sim.step();
    expect(a.shootQueued).toBe(false);
  });
});

describe('shove limits', () => {
  it('moves only the nearest bodies', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    const bodies = [20, 16, 24, 28].map((offset, row) => addZombie(state, 'walker', p.x + offset, p.y + (row - 1.5) * 6));
    for (const z of bodies) z.speed = 0;
    sim.setInput('a', input({ seq: 1, melee: true, angle: 0 }));
    sim.step();
    const moved = bodies.filter((z) => z.health < z.maxHealth);
    expect(moved.length).toBe(MELEE_MAX_TARGETS);
    expect(moved).toEqual(expect.arrayContaining([bodies[0], bodies[1]]));
  });

  it('passes over bodies still reeling to reach a fresh one behind them', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    const bodies = [16, 20, 24].map((offset, row) => addZombie(state, 'walker', p.x + offset, p.y + (row - 1) * 6));
    for (const z of bodies) z.speed = 0;
    bodies[0].staggerImmuneLeft = 1;
    bodies[1].staggerImmuneLeft = 1;
    sim.setInput('a', input({ seq: 1, melee: true, angle: 0 }));
    sim.step();
    expect(bodies[2].health).toBe(bodies[2].maxHealth - MELEE_DAMAGE);
    expect(bodies[0].health).toBe(bodies[0].maxHealth);
    expect(eventsOf(sim.snapshot(), 'melee')[0].hit).toBe(true);
  });

  it('leaves a just-shoved zombie swinging until it can be staggered again', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    const zombie = addZombie(state, 'brute', p.x + 20, p.y);
    zombie.speed = 0;
    const shove = (seq: number): void => sim.setInput('a', input({ seq, melee: true, angle: 0 }));
    const cooldownTicks = Math.ceil(MELEE_COOLDOWN_SEC * TICK_RATE);

    shove(1);
    sim.step();
    expect(zombie.staggerImmuneLeft).toBeGreaterThan(0);
    const afterFirst = zombie.health;
    expect(afterFirst).toBe(zombie.maxHealth - MELEE_DAMAGE);
    steps(sim, cooldownTicks);
    sim.snapshot();

    zombie.windupLeft = 0.2;
    zombie.attacking = true;
    zombie.knockX = 0;
    shove(2);
    sim.step();
    expect(eventsOf(sim.snapshot(), 'melee')[0].hit).toBe(false);
    expect(zombie.health).toBe(afterFirst);
    expect(zombie.attacking).toBe(true);
    expect(zombie.knockX).toBe(0);

    zombie.staggerImmuneLeft = 0;
    steps(sim, cooldownTicks);
    shove(3);
    sim.step();
    expect(zombie.health).toBe(afterFirst - MELEE_DAMAGE);
  });

  /** A dry player stands still and shoves whatever is closest for as long as they last. */
  function standAndShove(type: ZombieType, count: number): { state: SimState; hurt: number } {
    const { sim, state } = quietSim();
    const [p] = state.players;
    p.guns.pistol!.ammo = 0;
    p.ammoBag.pistol = 0;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 0.6 - 0.9;
      addZombie(state, type, p.x + Math.cos(angle) * 40, p.y + Math.sin(angle) * 40);
    }
    let hurt = 0;
    for (let tick = 0; tick < TICK_RATE * 120 && sim.phase !== 'gameover' && state.zombies.length > 0; tick++) {
      const distance = (z: { x: number; y: number }): number => Math.hypot(z.x - p.x, z.y - p.y);
      const nearest = [...state.zombies].sort((a, b) => distance(a) - distance(b))[0];
      sim.setInput('a', input({ seq: tick + 1, angle: Math.atan2(nearest.y - p.y, nearest.x - p.x), melee: distance(nearest) < 34 }));
      sim.step();
      hurt += eventsOf(sim.snapshot(), 'player_hurt').reduce((sum, event) => sum + event.damage, 0);
    }
    return { state, hurt };
  }

  it.each<[ZombieType, number]>([['brute', 1], ['walker', 6], ['runner', 3], ['bloater', 1]])(
    'a dry player cannot stand and beat %s x%i',
    (type, count) => {
      const { state, hurt } = standAndShove(type, count);
      expect(hurt).toBeGreaterThan(0);
      expect(state.players[0].status).toBe('dead');
    },
    30000,
  );

  it('still buys room against one walker', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    const zombie = addZombie(state, 'walker', p.x + 18, p.y);
    sim.setInput('a', input({ seq: 1, melee: true, angle: 0 }));
    let widest = 0;
    for (let tick = 0; tick < TICK_RATE; tick++) {
      sim.step();
      widest = Math.max(widest, zombie.x - p.x);
    }
    expect(widest).toBeGreaterThan(36);
    expect(p.health).toBe(p.maxHealth);
  });
});
