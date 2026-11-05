import { describe, expect, it } from 'vitest';
import { shouldShowSplash, splashTimings } from '../src/game/studio-splash.ts';

describe('the studio splash', () => {
  it('fades in and out, and only holds for someone who wants less motion', () => {
    expect(splashTimings(false)).toEqual({ fadeIn: 400, hold: 1600, fadeOut: 500 });
    expect(splashTimings(true)).toEqual({ fadeIn: 0, hold: 1000, fadeOut: 0 });
  });

  it('shows unless the address says not to', () => {
    expect(shouldShowSplash('')).toBe(true);
    expect(shouldShowSplash('?seed=4')).toBe(true);
    expect(shouldShowSplash('?nosplash')).toBe(false);
    expect(shouldShowSplash('?seed=4&nosplash=1')).toBe(false);
  });
});
