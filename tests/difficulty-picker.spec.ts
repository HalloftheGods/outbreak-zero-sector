import { describe, expect, it } from 'vitest';
import { DIFFICULTIES } from '../shared/difficulty.ts';
import { rosterStep } from '../src/game/character-select-view.ts';

const count = DIFFICULTIES.length;

describe('difficulty cards', () => {
  it('arrows step through the four cards and wrap at both ends', () => {
    expect(rosterStep(0, 'ArrowRight', count)).toBe(1);
    expect(rosterStep(count - 1, 'ArrowRight', count)).toBe(0);
    expect(rosterStep(0, 'ArrowLeft', count)).toBe(count - 1);
    expect(rosterStep(count - 1, 'ArrowDown', count)).toBe(0);
    expect(rosterStep(0, 'ArrowUp', count)).toBe(count - 1);
  });

  it('leaves Enter, Space and other keys to the button', () => {
    expect(rosterStep(1, 'Enter', count)).toBeNull();
    expect(rosterStep(1, ' ', count)).toBeNull();
    expect(rosterStep(1, 'Tab', count)).toBeNull();
  });
});
