import { describe, expect, it } from 'vitest';
import { titleUnit } from '../src/engine/viewport.ts';
import {
  isConfirmKey,
  menuStep,
  recordRows,
  recordStats,
  setupActionLabel,
  steppedIndex,
  TITLE_MENU,
} from '../src/game/title-menu.ts';

describe('title scale', () => {
  it.each([
    [800, 600, 1.5],
    [1280, 720, 2],
    [1920, 1080, 3],
    [3840, 2160, 6],
    [320, 240, 1.5],
  ])('at %ix%i runs on %f', (width, height, unit) => {
    expect(titleUnit(width, height)).toBe(unit);
  });
});

describe('title menu', () => {
  it('runs in the agreed order, with Play first so it is the default', () => {
    expect(TITLE_MENU.map((item) => item.label)).toEqual(['Play', 'Levels', 'How to Play', 'Records', 'Options']);
  });

  it('has no Co-op item, since Multiplayer is chosen inside Play', () => {
    expect(TITLE_MENU.map((item) => item.page)).not.toContain('coop');
  });

  it('gives every item its own page', () => {
    expect(new Set(TITLE_MENU.map((item) => item.page)).size).toBe(TITLE_MENU.length);
  });

  it.each([
    ['ArrowUp', -1],
    ['KeyW', -1],
    ['ArrowDown', 1],
    ['KeyS', 1],
    ['KeyD', 0],
    ['Enter', 0],
  ])('reads %s as a step of %i', (code, step) => {
    expect(menuStep(code)).toBe(step);
  });

  it('wraps at both ends', () => {
    const last = TITLE_MENU.length - 1;
    expect(steppedIndex(0, -1)).toBe(last);
    expect(steppedIndex(last, 1)).toBe(0);
    expect(steppedIndex(2, 1)).toBe(3);
  });

  it('takes either Enter key as confirm, and nothing else', () => {
    expect(isConfirmKey('Enter')).toBe(true);
    expect(isConfirmKey('NumpadEnter')).toBe(true);
    expect(isConfirmKey('Space')).toBe(false);
  });
});

describe('setup page button', () => {
  it('says Start for solo and Join for co-op', () => {
    expect(setupActionLabel(false, true, false)).toBe('Start');
    expect(setupActionLabel(true, true, false)).toBe('Join');
  });

  it('says why it cannot be pressed yet', () => {
    expect(setupActionLabel(false, false, false)).toBe('Loading...');
    expect(setupActionLabel(true, true, true)).toBe('Connecting...');
  });
});

describe('records page', () => {
  it('shows empty stats before the first run', () => {
    expect(recordStats(null).map((stat) => stat.value)).toEqual(['0', '0', '0', '--:--']);
  });

  it('shows the best run', () => {
    const best = { score: 1200, wave: 4, kills: 57, durationSec: 125 };
    expect(recordStats(best).map((stat) => stat.value)).toEqual(['1200', '4', '57', '2:05']);
  });

  it('keeps the top five, ranked, and names a run with no callsign', () => {
    const runs = Array.from({ length: 7 }, (_, index) => ({ callsign: '', score: 100 - index, timestamp: index }));
    const rows = recordRows(runs as never);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toMatchObject({ rank: '#1', name: 'SURVIVOR', score: 100 });
  });
});
