import { describe, expect, it } from 'vitest';
import { PLAYER_MAX_HEALTH, WEAPONS } from '../shared/constants.ts';
import { FINAL_LEVEL, levelPopulation, levelSeed } from '../shared/levels.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { eventsOf, SEED } from './helpers/sim-harness.ts';

const returnKit = {
  status: 'alive',
  health: PLAYER_MAX_HEALTH / 2,
  weapon: 'pistol',
  owned: ['pistol'],
  medkits: 0,
  reserve: 0,
};

describe('continuing a solo run from the furthest level', () => {
  it('begins in that level\'s town with the return kit', () => {
    const sim = new GameSimulation({ seed: SEED, startLevel: 4 });
    sim.addPlayer('p', 'P');
    const frame = sim.snapshot();
    expect(frame.level).toBe(4);
    expect(sim.map.seed).toBe(levelSeed(SEED, 4));
    expect(frame.players[0]).toMatchObject(returnKit);
    expect(frame.players[0].ammo).toBe(WEAPONS.pistol.magSize);
    expect(eventsOf(frame, 'level_start').map((event) => event.level)).toEqual([4]);
  });

  it('keeps a plain run starting at level 1 with the full loadout', () => {
    const sim = new GameSimulation({ seed: SEED });
    sim.addPlayer('p', 'P');
    const frame = sim.snapshot();
    expect(frame.level).toBe(1);
    expect(frame.players[0].health).toBe(PLAYER_MAX_HEALTH);
    expect(frame.players[0].reserve).toBeGreaterThan(0);
  });

  it('clamps a start level that is out of range or not a number', () => {
    expect(new GameSimulation({ seed: SEED, startLevel: 99 }).level).toBe(FINAL_LEVEL);
    expect(new GameSimulation({ seed: SEED, startLevel: 0 }).level).toBe(1);
    expect(new GameSimulation({ seed: SEED, startLevel: Number.NaN }).level).toBe(1);
  });

  it('restarts into a later level with the return kit, and into level 1 with the full loadout by default', () => {
    const sim = new GameSimulation({ seed: SEED });
    sim.addPlayer('p', 'P');
    sim.restart(3);
    let frame = sim.snapshot();
    expect(frame.level).toBe(3);
    expect(frame.players[0]).toMatchObject(returnKit);
    expect(eventsOf(frame, 'level_start').map((event) => event.level)).toEqual([3]);
    expect(levelPopulation(3)).toBeGreaterThan(0);

    sim.restart();
    frame = sim.snapshot();
    expect(frame.level).toBe(1);
    expect(frame.players[0].health).toBe(PLAYER_MAX_HEALTH);
    expect(frame.players[0].reserve).toBeGreaterThan(0);
  });
});
