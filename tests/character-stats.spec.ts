import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../shared/characters.ts';
import { STATS, STAT_BASELINE, STAT_SLOTS, statSlots, statSlotsOf, type StatKey } from '../shared/character-stats.ts';

const SIGNATURE: Record<string, StatKey> = {
  night: 'stealth',
  bandus: 'reload',
  satori: 'speed',
  rex: 'strength',
  sol: 'search',
};

describe('character stats', () => {
  it('fills the signature stat and leaves the rest at baseline', () => {
    for (const character of CHARACTERS) {
      const slots = statSlots(character);
      for (const { key } of STATS) {
        expect(slots[key]).toBe(key === SIGNATURE[character.id] ? STAT_SLOTS : STAT_BASELINE);
      }
    }
  });

  it('reads Stealth from how far a survivor is spotted and heard together', () => {
    const night = CHARACTERS[0];
    const dull = { ...night, sightRange: 1, noise: 1 };
    expect(statSlots(night).stealth).toBe(STAT_SLOTS);
    expect(statSlots({ ...night, noise: 1 }).stealth).toBeLessThan(STAT_SLOTS);
    expect(statSlots({ ...night, sightRange: 1 }).stealth).toBeLessThan(STAT_SLOTS);
    expect(statSlots(dull).stealth).toBe(STAT_BASELINE);
  });

  it('keeps every stat an integer within the bar', () => {
    for (const character of CHARACTERS) {
      for (const value of Object.values(statSlots(character))) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(STAT_BASELINE);
        expect(value).toBeLessThanOrEqual(STAT_SLOTS);
      }
    }
  });

  it('reads a survivor by skin and falls back to the first for an unknown one', () => {
    expect(statSlotsOf(2)).toEqual(statSlots(CHARACTERS[2]));
    expect(statSlotsOf(99)).toEqual(statSlots(CHARACTERS[0]));
    expect(statSlotsOf(-1)).toEqual(statSlots(CHARACTERS[0]));
  });
});
