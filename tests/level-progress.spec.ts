import { describe, expect, it } from 'vitest';
import { FINAL_LEVEL } from '../shared/levels.ts';
import { isLevelUnlocked, loadLevelProgress, recordGameFinished, recordLevelReached } from '../src/game/level-progress.ts';

function memoryStore() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
}

describe('level progress', () => {
  it('starts with level 1 only, and loads old saves without it', () => {
    const progress = loadLevelProgress(memoryStore());
    expect(progress).toEqual({ highest: 1, finished: false });
    expect(isLevelUnlocked(1, progress)).toBe(true);
    expect(isLevelUnlocked(2, progress)).toBe(false);
  });

  it('only moves the highest level up', () => {
    const store = memoryStore();
    recordLevelReached(4, store);
    recordLevelReached(2, store);
    expect(loadLevelProgress(store).highest).toBe(4);
  });

  it('clamps to the final level and marks a finished game', () => {
    const store = memoryStore();
    recordLevelReached(99, store);
    expect(loadLevelProgress(store).highest).toBe(FINAL_LEVEL);
    recordGameFinished(store);
    expect(loadLevelProgress(store)).toEqual({ highest: FINAL_LEVEL, finished: true });
  });

  it('ignores corrupt saves and survives blocked storage', () => {
    const bad = { getItem: () => '{nope', setItem: () => undefined };
    expect(loadLevelProgress(bad).highest).toBe(1);
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(() => recordLevelReached(3, blocked)).not.toThrow();
    expect(loadLevelProgress(null).highest).toBe(1);
  });
});
