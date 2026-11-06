import { describe, expect, it } from 'vitest';
import { DEFAULT_STYLE, isGameStyle, playsFromHome } from '../shared/game-style.ts';
import { BUNKER_SEED } from '../shared/home-protocol.ts';
import { FIRST_LEVEL } from '../shared/levels.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { loadStyle, saveStyle } from '../src/game/style-pref.ts';
import { SEED } from './helpers/sim-harness.ts';

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
  };
}

describe('game styles', () => {
  it('knows the two styles and nothing else', () => {
    expect(isGameStyle('campaign')).toBe(true);
    expect(isGameStyle('arcade')).toBe(true);
    expect(isGameStyle('solo')).toBe(false);
    expect(isGameStyle(undefined)).toBe(false);
    expect(playsFromHome('campaign')).toBe(true);
    expect(playsFromHome('arcade')).toBe(false);
  });
});

describe('the remembered style', () => {
  it('starts a first-time player on Campaign', () => {
    expect(DEFAULT_STYLE).toBe('campaign');
    expect(loadStyle(memoryStorage())).toBe('campaign');
    expect(loadStyle(null)).toBe('campaign');
  });

  it('remembers the last style chosen', () => {
    const store = memoryStorage();
    saveStyle('arcade', store);
    expect(loadStyle(store)).toBe('arcade');
    saveStyle('campaign', store);
    expect(loadStyle(store)).toBe('campaign');
  });

  it('falls back to the default on anything it cannot read', () => {
    const store = memoryStorage();
    store.setItem('outbreak.style', 'endless');
    expect(loadStyle(store)).toBe('campaign');
  });
});

describe('a simulation changing style', () => {
  it('moves an empty room between the towns and the bunker', () => {
    const sim = new GameSimulation({ seed: SEED, workbench: 'timed' });
    expect(sim.playsHome).toBe(false);
    sim.setHome(true);
    expect(sim.playsHome).toBe(true);
    expect(sim.map.seed).toBe(BUNKER_SEED);
    sim.setHome(false);
    expect(sim.playsHome).toBe(false);
    expect(sim.map.seed).not.toBe(BUNKER_SEED);
    expect(sim.level).toBe(FIRST_LEVEL);
  });

  it('keeps the difficulty it was given', () => {
    const sim = new GameSimulation({ seed: SEED, workbench: 'timed', difficulty: 'undead_tired' });
    sim.setHome(true);
    expect(sim.difficulty).toBe('undead_tired');
    sim.setHome(false);
    expect(sim.difficulty).toBe('undead_tired');
  });

  it('leaves a room in use alone', () => {
    const sim = new GameSimulation({ seed: SEED });
    sim.addPlayer('a', 'Ann');
    sim.setHome(true);
    expect(sim.playsHome).toBe(false);
    expect(sim.playerCount).toBe(1);
  });

  it('touches nothing when the style is the same, so the town and its rolls stay', () => {
    const left = new GameSimulation({ seed: SEED });
    const right = new GameSimulation({ seed: SEED });
    right.setHome(false);
    left.addPlayer('a', 'Ann');
    right.addPlayer('a', 'Ann');
    for (let tick = 0; tick < 30; tick++) {
      left.step();
      right.step();
    }
    expect(right.snapshot()).toEqual(left.snapshot());
  });
});
