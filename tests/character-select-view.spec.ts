import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../shared/characters.ts';
import { STAT_BASELINE, STAT_SLOTS, STATS } from '../shared/character-stats.ts';
import { rosterStep, statBarsOf } from '../src/game/character-select-view.ts';

describe('statBarsOf', () => {
  it('lists the five stats in the screen order, each within the bar', () => {
    for (const [skin] of CHARACTERS.entries()) {
      const bars = statBarsOf(skin);
      expect(bars.map((bar) => bar.key)).toEqual(STATS.map((stat) => stat.key));
      for (const bar of bars) {
        expect(bar.filled).toBeGreaterThanOrEqual(STAT_BASELINE);
        expect(bar.filled).toBeLessThanOrEqual(STAT_SLOTS);
      }
    }
  });

  it('picks out only the stats above a plain survivor', () => {
    for (const [skin] of CHARACTERS.entries()) {
      for (const bar of statBarsOf(skin)) expect(bar.strong).toBe(bar.filled > STAT_BASELINE);
    }
  });

  it('gives each survivor a strong stat of their own', () => {
    const strongest = CHARACTERS.map((_, skin) => statBarsOf(skin).find((bar) => bar.strong)?.key);
    expect(strongest.every(Boolean)).toBe(true);
    expect(new Set(strongest).size).toBe(CHARACTERS.length);
  });
});

describe('rosterStep', () => {
  it('moves one survivor along with the arrows', () => {
    expect(rosterStep(1, 'ArrowRight', 5)).toBe(2);
    expect(rosterStep(1, 'ArrowDown', 5)).toBe(2);
    expect(rosterStep(1, 'ArrowLeft', 5)).toBe(0);
    expect(rosterStep(1, 'ArrowUp', 5)).toBe(0);
  });

  it('wraps round both ends', () => {
    expect(rosterStep(4, 'ArrowRight', 5)).toBe(0);
    expect(rosterStep(0, 'ArrowLeft', 5)).toBe(4);
  });

  it('ignores other keys and an empty roster', () => {
    expect(rosterStep(2, 'Enter', 5)).toBeNull();
    expect(rosterStep(0, 'ArrowRight', 0)).toBeNull();
  });

  it('defaults to the whole cast', () => {
    expect(rosterStep(CHARACTERS.length - 1, 'ArrowRight')).toBe(0);
  });
});
