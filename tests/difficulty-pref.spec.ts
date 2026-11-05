import { describe, expect, it } from 'vitest';
import { DEFAULT_DIFFICULTY } from '../shared/difficulty.ts';
import { loadDifficulty, saveDifficulty } from '../src/game/difficulty-pref.ts';

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

describe('difficulty preference', () => {
  it('starts on Stay Close', () => {
    expect(DEFAULT_DIFFICULTY).toBe('stay_close');
    expect(loadDifficulty(memoryStore())).toBe('stay_close');
  });

  it('remembers a choice', () => {
    const store = memoryStore();
    saveDifficulty('undead_tired', store);
    expect(loadDifficulty(store)).toBe('undead_tired');
  });

  it('ignores a saved value it does not know, and a missing store', () => {
    expect(loadDifficulty(memoryStore({ 'outbreak.difficulty': 'nightmare' }))).toBe('stay_close');
    expect(loadDifficulty(null)).toBe('stay_close');
  });
});
