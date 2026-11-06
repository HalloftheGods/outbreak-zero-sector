// #7129: the walker and the screamer. Hair and boots take their own letters, so the screamer's
// white hair leaves its boots brown; the wounds carry no INK stripes and the back bite no long
// drip; the corpse pool is a decal; a planted foot keeps its spot at the walker's speed; and
// from straight behind the strike frames show the claws past the shoulders.

import { describe, expect, it } from 'vitest';
import { ZOMBIES } from '../shared/constants.ts';
import { RAMPS } from '../src/art/palette.ts';
import type { PixelSprite } from '../src/art/types.ts';
import { SCREAMER_LEGEND } from '../src/art/zombies/screamer.ts';
import { WALKER_CORPSE, WALKER_FACINGS, WALKER_FALL, WALKER_LEGEND } from '../src/art/zombies/walker-art.ts';
import { buildWalker } from '../src/art/zombies/walker.ts';

const DRAWN = [0, 1, 2, 6, 7] as const;
const BOOTS = ['W', 'X', 'V'];
const HAIR = ['w', 'x', 'y', 'Y'];
const SKIN = ['a', 'b', 'c', 'd'];
const BLOOD = new Set(['r', 's', 't', 'u']);
const NORTH = 6;
const EAST = 0;

const colour = (s: PixelSprite, x: number, y: number): number | null => {
  const i = (y * s.w + x) * 4;
  return s.rgba[i + 3] === 0 ? null : (s.rgba[i] << 16) | (s.rgba[i + 1] << 8) | s.rgba[i + 2];
};
const letters = (rows: readonly string[]): Set<string> => new Set(rows.join('').replace(/\./g, ''));

/** Every cell of a sprite: where it sits from the anchor, and its colour (null where clear). */
interface Cell {
  readonly x: number;
  readonly y: number;
  readonly c: number | null;
}
const cells = (s: PixelSprite): Cell[] =>
  Array.from({ length: s.w * s.h }, (_, i) => {
    const [x, y] = [i % s.w, Math.floor(i / s.w)];
    return { x: x - s.ax, y: y - s.ay, c: colour(s, x, y) };
  });
const painted = (s: PixelSprite): Cell[] => cells(s).filter((cell) => cell.c !== null);

describe('walker and screamer hair and boots', () => {
  it('draws every foot stamp in boot letters only', () => {
    for (const dir of DRAWN) for (const letter of letters(WALKER_FACINGS[dir].foot.rows)) expect(BOOTS).toContain(letter);
  });

  it('keeps the hand-drawn fall and corpse boots on boot letters too', () => {
    const bootRows = (rows: readonly string[]): string[] => rows.slice(-4).map((row) => row.slice(-6));
    for (const rows of [WALKER_FALL, WALKER_CORPSE]) for (const letter of letters(bootRows(rows))) expect([...BOOTS, ...SKIN, 'p', 'q', 'Q']).toContain(letter);
  });

  it('colours the walker boots brown, as before', () => {
    expect([WALKER_LEGEND.W, WALKER_LEGEND.X, WALKER_LEGEND.V]).toEqual([RAMPS.wood[0], RAMPS.wood[1], RAMPS.wood[2]]);
  });

  it('gives the screamer hair no skin colour, and leaves its boots brown', () => {
    const skin = SKIN.map((letter) => SCREAMER_LEGEND[letter]);
    for (const letter of HAIR) expect(skin).not.toContain(SCREAMER_LEGEND[letter]);
    for (const letter of BOOTS) expect(SCREAMER_LEGEND[letter]).toBe(WALKER_LEGEND[letter]);
  });
});

describe('walker wounds', () => {
  it('draws no INK inside any torso', () => {
    for (const dir of DRAWN) expect(WALKER_FACINGS[dir].torso.rows.join('')).not.toContain('K');
  });

  it('lets the back bite drip at most two pixels below its last row three wide', () => {
    for (const dir of [6, 7] as const) {
      const rows = WALKER_FACINGS[dir].torso.rows;
      const blood = rows.map((row) => [...row].filter((letter) => BLOOD.has(letter)).length);
      const biteEnds = blood.findLastIndex((n) => n >= 3);
      const below = blood.slice(biteEnds + 1).reduce((sum, n) => sum + n, 0);
      expect(biteEnds).toBeGreaterThanOrEqual(0);
      expect(below).toBeLessThanOrEqual(2);
    }
  });
});

describe('walker clips', () => {
  const art = buildWalker();

  it('lays the corpse pool flat: it adds only blood to the corpse, no outline of its own', () => {
    const blood = new Set<number>(RAMPS.blood);
    const [corpse, ...pooled] = art.death.frames.slice(-3);
    const before = cells(corpse);
    for (const frame of pooled) {
      expect([frame.w, frame.h, frame.ax, frame.ay]).toEqual([corpse.w, corpse.h, corpse.ax, corpse.ay]);
      const added = cells(frame)
        .filter((cell, i) => cell.c !== before[i].c)
        .map((cell) => cell.c ?? -1);
      expect(added.length).toBeGreaterThan(0);
      expect(added.filter((c) => !blood.has(c))).toEqual([]);
    }
  });

  it('keeps the bad foot on its spot while planted, with no pop on the loop seam', () => {
    const clip = art.walk[EAST];
    expect(clip.fps).toBe(8);
    const step = ZOMBIES.walker.speed / clip.fps;
    const boot = new Set<number>([RAMPS.wood[1], RAMPS.wood[2]]);
    // Facing east, the bad (body-right) foot is the near one, drawn below the anchor.
    const nearBoot = (cell: Cell): boolean => cell.y >= 1 && cell.y <= 2 && boot.has(cell.c ?? -1);
    const heel = clip.frames.map((frame) => Math.min(...painted(frame).filter(nearBoot).map((cell) => cell.x)));
    expect(heel.every(Number.isFinite)).toBe(true);
    const n = heel.length;
    // The street under the foot moves: on screen, a frame-to-frame move plus one step is its move on the ground.
    const ground = heel.map((x, i) => heel[(i + 1) % n] - x + step);
    for (const moved of ground) expect(moved).toBeGreaterThanOrEqual(-1);
    for (const [i, x] of heel.entries()) expect(Math.abs(heel[(i + 1) % n] - x)).toBeLessThanOrEqual(5);
    const planted = ground.filter((moved) => Math.abs(moved) <= 0.5);
    expect(planted.length).toBeGreaterThanOrEqual(2);
  });

  it('shows the claws past the shoulders in the strike frames seen from behind', () => {
    const clip = art.attack[NORTH];
    for (const frame of clip.frames.slice(2)) {
      const xs = painted(frame).map((cell) => cell.x);
      expect(Math.min(...xs)).toBeLessThanOrEqual(-10);
      expect(Math.max(...xs)).toBeGreaterThanOrEqual(10);
    }
  });
});
