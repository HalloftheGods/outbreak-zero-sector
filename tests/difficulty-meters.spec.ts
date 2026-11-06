import { describe, expect, it } from 'vitest';
import { BASELINE_DIFFICULTY, DIFFICULTIES, difficultyDef } from '../shared/difficulty.ts';
import { METER_SLOTS, difficultyMeters } from '../src/game/difficulty-meters.ts';

const slotsOf = (id: Parameters<typeof difficultyDef>[0], key: string) =>
  difficultyMeters(difficultyDef(id)).find((each) => each.key === key)?.slots as number;

describe('difficultyMeters', () => {
  it('puts the baseline difficulty in the middle of every bar', () => {
    for (const meter of difficultyMeters(difficultyDef(BASELINE_DIFFICULTY))) expect(meter.slots).toBe(3);
  });

  it('keeps every bar within one to five slots, and the table spans both ends', () => {
    for (const key of ['zombieSpeed', 'zombieDamage', 'hordeSize', 'ammo']) {
      const all = DIFFICULTIES.map((each) => slotsOf(each.id, key));
      expect(Math.min(...all)).toBe(1);
      expect(Math.max(...all)).toBe(METER_SLOTS);
    }
  });

  it('never lights fewer zombie segments on a harder row', () => {
    for (const key of ['zombieSpeed', 'zombieDamage', 'hordeSize']) {
      const all = DIFFICULTIES.map((each) => slotsOf(each.id, key));
      expect([...all].sort((a, b) => a - b)).toEqual(all);
    }
  });

  it('never lights more ammo segments on a harder row', () => {
    const all = DIFFICULTIES.map((each) => slotsOf(each.id, 'ammo'));
    expect([...all].sort((a, b) => b - a)).toEqual(all);
  });

  it('lists speed, bite, horde, ammo in that order', () => {
    expect(difficultyMeters(difficultyDef('night_light')).map((each) => each.key)).toEqual(['zombieSpeed', 'zombieDamage', 'hordeSize', 'ammo']);
  });
});
