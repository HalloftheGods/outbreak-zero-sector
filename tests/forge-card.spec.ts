import { describe, expect, it } from 'vitest';
import { FORGE_SLOTS, forgeCard } from '../src/game/home/forge-card.ts';
import { LARGE_JEWEL_SILVER, SMALL_JEWEL_SILVER } from '../src/game/home/forge.ts';
import type { ForgeView } from '../src/game/home-screens.ts';

function view(patch: Partial<ForgeView> = {}): ForgeView {
  return { waiting: { small: 0, large: 0 }, progress: 0, secondsLeft: 0, idle: true, ...patch };
}

describe('the forge card (#7210)', () => {
  it('lists small then large jewels with the forge prices and their pickup icons', () => {
    const card = forgeCard(view({ waiting: { small: 3, large: 2 }, idle: false, secondsLeft: 15 }));
    expect(card.jewels.map((row) => [row.size, row.icon, row.count, row.each])).toEqual([
      ['small', 'jewel_small', 3, SMALL_JEWEL_SILVER],
      ['large', 'jewel_large', 2, LARGE_JEWEL_SILVER],
    ]);
  });

  it('adds up the silver the waiting jewels come to', () => {
    const card = forgeCard(view({ waiting: { small: 3, large: 2 }, idle: false }));
    expect(card.yieldSilver).toBe(3 * SMALL_JEWEL_SILVER + 2 * LARGE_JEWEL_SILVER);
  });

  it('rounds the time left up to whole seconds', () => {
    expect(forgeCard(view({ waiting: { small: 1, large: 0 }, idle: false, secondsLeft: 7.5 })).timeLeft).toBe('8s');
    expect(forgeCard(view()).timeLeft).toBe('0s');
  });

  it('lights the bar by the jewel on the forge, never past its cells', () => {
    const busy = { waiting: { small: 1, large: 0 }, idle: false };
    expect(forgeCard(view({ ...busy, progress: 0 })).filled).toBe(0);
    expect(forgeCard(view({ ...busy, progress: 0.55 })).filled).toBe(Math.floor(0.55 * FORGE_SLOTS));
    expect(forgeCard(view({ ...busy, progress: 1.2 })).filled).toBe(FORGE_SLOTS);
  });

  it('puts the large jewels on the forge first, as the smelt takes them', () => {
    expect(forgeCard(view({ waiting: { small: 4, large: 1 }, idle: false })).onForge).toBe('large');
    expect(forgeCard(view({ waiting: { small: 4, large: 0 }, idle: false })).onForge).toBe('small');
  });

  it('is dark and says so with nothing to smelt', () => {
    const card = forgeCard(view({ progress: 0.5 }));
    expect(card.onForge).toBeNull();
    expect(card.filled).toBe(0);
    expect(card.yieldSilver).toBe(0);
    expect(card.status).toBe('No jewels to smelt.');
  });
});
