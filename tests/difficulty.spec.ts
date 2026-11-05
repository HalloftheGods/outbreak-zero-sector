import { describe, expect, it } from 'vitest';
import { INTERMISSION_SEC } from '../shared/constants.ts';
import { BASELINE_DIFFICULTY, DEFAULT_DIFFICULTY, DIFFICULTIES, difficultyDef, isDifficultyId, lullSeconds, scaleHordeSize, scaleRounds } from '../shared/difficulty.ts';
import type { DifficultyId } from '../shared/difficulty.ts';
import { ammoKillShare } from '../shared/loot.ts';
import { createRng } from '../shared/rng.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { parseClientPacket } from '../server/packets.ts';
import { waveRoster } from '../shared/waves.ts';
import { SEED, stateOf } from './helpers/sim-harness.ts';

const ammoOf = (id: DifficultyId) => ammoKillShare(stateOf(new GameSimulation({ seed: SEED, difficulty: id })).pickups);

describe('difficulty table', () => {
  it('has four modes, easiest first, and Lights Out changes nothing', () => {
    expect(DIFFICULTIES.map((each) => each.id)).toEqual(['night_light', 'stay_close', 'lights_out', 'undead_tired']);
    const baseline = difficultyDef('lights_out');
    expect([baseline.ammo, baseline.zombieSpeed, baseline.zombieDamage, baseline.hordeSize, baseline.lull]).toEqual([1, 1, 1, 1, 1]);
    expect(BASELINE_DIFFICULTY).toBe('lights_out');
    expect(DEFAULT_DIFFICULTY).toBe('stay_close');
  });

  it('knows its own ids', () => {
    expect(isDifficultyId('undead_tired')).toBe(true);
    expect(isDifficultyId('easy')).toBe(false);
    expect(isDifficultyId(null)).toBe(false);
  });

  it('leaves the baseline numbers exactly alone', () => {
    expect(scaleRounds(12, 'lights_out')).toBe(12);
    expect(scaleHordeSize(23, 'lights_out')).toBe(23);
    expect(lullSeconds(INTERMISSION_SEC, 'lights_out')).toBe(INTERMISSION_SEC);
  });

  it('orders ammo, horde size and lull from easy to hard', () => {
    const [easy, close, out, tired] = DIFFICULTIES;
    expect([easy.ammo, close.ammo, out.ammo, tired.ammo]).toEqual([...[easy.ammo, close.ammo, out.ammo, tired.ammo]].sort((a, b) => b - a));
    expect(easy.zombieSpeed).toBeLessThan(close.zombieSpeed);
    expect(close.zombieSpeed).toBeLessThan(out.zombieSpeed);
    expect(out.zombieSpeed).toBeLessThan(tired.zombieSpeed);
    expect(easy.hordeSize).toBeLessThan(tired.hordeSize);
    expect(easy.lull).toBeGreaterThan(tired.lull);
  });
});

describe('difficulty in the join packet', () => {
  const join = (extra: Record<string, unknown>) => parseClientPacket(JSON.stringify({ type: 'join', name: 'a', token: 't', ...extra }));

  it('carries a known difficulty and drops an unknown or missing one', () => {
    expect(join({ difficulty: 'night_light' })).toMatchObject({ type: 'join', difficulty: 'night_light' });
    expect(join({ difficulty: 'nightmare' })).not.toHaveProperty('difficulty');
    expect(join({})).not.toHaveProperty('difficulty');
  });
});

describe('difficulty in play', () => {
  it('sizes hordes by mode', () => {
    const size = (id: DifficultyId) => waveRoster(4, createRng(1), undefined, id).length;
    expect(size('night_light')).toBeLessThan(size('stay_close'));
    expect(size('stay_close')).toBeLessThan(size('lights_out'));
    expect(size('lights_out')).toBeLessThan(size('undead_tired'));
    expect(waveRoster(4, createRng(1)).length).toBe(size('lights_out'));
  });

  it('stocks more ammo on easier modes', () => {
    expect(ammoOf('night_light')).toBeGreaterThan(ammoOf('stay_close'));
    expect(ammoOf('stay_close')).toBeGreaterThan(ammoOf('lights_out'));
    expect(ammoOf('lights_out')).toBeGreaterThan(ammoOf('undead_tired'));
  });

  it('gives zombies the mode\'s speed and bite', () => {
    const stats = (id: DifficultyId) => {
      const sim = new GameSimulation({ seed: SEED, difficulty: id });
      const [z] = stateOf(sim).zombies;
      return { type: z.type, speed: z.speed, damage: z.damage };
    };
    const calm = stats('night_light');
    const tired = stats('undead_tired');
    expect(tired.damage / calm.damage).toBeGreaterThan(1.5);
    expect(tired.speed).toBeGreaterThan(calm.speed);
  });

  it('is set by an empty room only, and shows on the results', () => {
    const sim = new GameSimulation({ seed: SEED });
    sim.setDifficulty('undead_tired');
    expect(sim.difficulty).toBe('undead_tired');
    sim.addPlayer('a', 'a');
    sim.setDifficulty('night_light');
    expect(sim.difficulty).toBe('undead_tired');
    const state = stateOf(sim);
    state.players[0].status = 'dead';
    sim.step();
    expect(sim.snapshot().gameOver?.difficulty).toBe('undead_tired');
  });
});
