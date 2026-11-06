import { describe, expect, it } from 'vitest';
import { FINAL_LEVEL, LEVELS, levelDef } from '../shared/levels.ts';
import { LEVEL_METER_SLOTS, levelMeters } from '../src/game/level-meters.ts';

const slotsOf = (level: number): Record<string, number> =>
  Object.fromEntries(levelMeters(levelDef(level)).map((meter) => [meter.key, meter.slots]));

describe('level meters', () => {
  it('lists hordes, difficulty, brutes and runners in that order', () => {
    expect(levelMeters(LEVELS[0]).map((meter) => meter.label)).toEqual(['Hordes', 'Difficulty', 'Brutes', 'Runners']);
  });

  it('starts the run at one segment of hordes and difficulty and no special zombies', () => {
    expect(slotsOf(1)).toEqual({ hordes: 1, difficulty: 1, brute: 0, runner: 0 });
  });

  it('fills every meter on the final level', () => {
    expect(slotsOf(FINAL_LEVEL)).toEqual({ hordes: 5, difficulty: 5, brute: 5, runner: 5 });
  });

  it('lights a brute segment only once brutes show up', () => {
    const firstBrutes = LEVELS.find((level) => level.mix.brute > 0);
    expect(firstBrutes).toBeDefined();
    expect(slotsOf((firstBrutes?.number ?? 1) - 1).brute).toBe(0);
    expect(slotsOf(firstBrutes?.number ?? 1).brute).toBeGreaterThan(0);
  });

  it('never drops a meter from one level to the next, and stays within the slots', () => {
    for (let level = 2; level <= FINAL_LEVEL; level++) {
      const before = slotsOf(level - 1);
      const now = slotsOf(level);
      for (const key of Object.keys(now)) {
        expect(now[key]).toBeGreaterThanOrEqual(before[key]);
        expect(now[key]).toBeLessThanOrEqual(LEVEL_METER_SLOTS);
      }
    }
  });
});
