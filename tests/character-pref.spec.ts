import { describe, expect, it } from 'vitest';
import { loadCharacter, saveCharacter } from '../src/game/character-pref.ts';

function memoryStore(): Pick<Storage, 'getItem' | 'setItem'> {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, value),
  };
}

describe('the remembered character', () => {
  it('starts on the first survivor', () => {
    expect(loadCharacter(memoryStore())).toBe(0);
  });

  it('remembers the choice', () => {
    const store = memoryStore();
    saveCharacter(3, store);
    expect(loadCharacter(store)).toBe(3);
  });

  it('ignores a saved value that is not a survivor', () => {
    const store = memoryStore();
    store.setItem('outbreak.character', 'nobody');
    expect(loadCharacter(store)).toBe(0);
    store.setItem('outbreak.character', '99');
    expect(loadCharacter(store)).toBe(0);
  });

  it('survives storage that throws', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(loadCharacter(broken)).toBe(0);
    expect(() => saveCharacter(1, broken)).not.toThrow();
  });
});
