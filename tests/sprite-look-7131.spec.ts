// #7131: the brute's look. Its flesh reads in three planes inside the cool metal/ash range, the
// club's rebar has no gaps for the outline to ink, toes and knuckles are not bead rows, the
// planted foot keeps pace with the walk, a strike seen from behind still shows the club, the
// downswing leaves an unoutlined smear, and the corpse's pool lies flat as a decal.

import { describe, expect, it } from 'vitest';
import { ZOMBIES } from '../shared/constants.ts';
import { INK, RAMPS } from '../src/art/palette.ts';
import type { Color } from '../src/art/palette.ts';
import type { PixelSprite } from '../src/art/types.ts';
import { buildBrute } from '../src/art/zombies/brute.ts';
import { BRUTE_FACINGS, BRUTE_FIST, BRUTE_LEGEND, CLUB_BLOCK, CLUB_REBAR } from '../src/art/zombies/brute-art.ts';

const art = buildBrute();
const DRAWN = [0, 1, 2, 6, 7] as const;

const colour = (s: PixelSprite, x: number, y: number): Color | null => {
  const inside = x >= 0 && y >= 0 && x < s.w && y < s.h;
  if (!inside) return null;
  const i = (y * s.w + x) * 4;
  return s.rgba[i + 3] === 0 ? null : (s.rgba[i] << 16) | (s.rgba[i + 1] << 8) | s.rgba[i + 2];
};

/** Every opaque pixel in rows [y0, y1), as [x, y, colour]. */
const opaque = (s: PixelSprite, y0 = 0, y1 = s.h): [number, number, Color][] =>
  Array.from({ length: (y1 - y0) * s.w }, (_, i): [number, number, Color | null] => {
    const [x, y] = [i % s.w, y0 + Math.floor(i / s.w)];
    return [x, y, colour(s, x, y)];
  }).filter((p): p is [number, number, Color] => p[2] !== null);

const pixels = (s: PixelSprite): Color[] => opaque(s).map(([, , c]) => c);
const topRow = (s: PixelSprite): number => Math.min(...opaque(s).map(([, y]) => y));
const bottomRow = (s: PixelSprite): number => Math.max(...opaque(s).map(([, y]) => y));

/** CIE L* of an sRGB colour: how light it reads, 0 to 100. */
function lightness(c: Color): number {
  const linear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const y = 0.2126 * linear((c >> 16) / 255) + 0.7152 * linear(((c >> 8) & 255) / 255) + 0.0722 * linear((c & 255) / 255);
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}

/** A row that alternates one letter with single other pixels, such as 'kFkFk' or 'a.a.a'. */
const BEADS = /(\w)(?!\1)[\w.]\1(?!\1)[\w.]\1/;

describe('brute flesh planes', () => {
  const tone = (letter: string): number => lightness(BRUTE_LEGEND[letter]!);

  it('steps shadow, mid, lit and top plane up the value scale with clear gaps', () => {
    expect(tone('b') - tone('a')).toBeGreaterThanOrEqual(5);
    expect(tone('c') - tone('b')).toBeGreaterThanOrEqual(15);
    expect(tone('d') - tone('c')).toBeGreaterThanOrEqual(10);
  });

  it('keeps the flesh in the cool metal and ash ramps', () => {
    const cool: readonly Color[] = [...RAMPS.metal, ...RAMPS.ash];
    for (const letter of ['a', 'b', 'c', 'd']) expect(cool).toContain(BRUTE_LEGEND[letter]);
  });

  it('keeps the bone spurs off the top-plane highlight', () => {
    for (const spur of ['e', 'f']) expect(BRUTE_LEGEND[spur]).not.toBe(BRUTE_LEGEND.d);
  });

  it('gives the lit plane a real share of the flesh in every drawn facing', () => {
    const flesh: readonly Color[] = [RAMPS.ash[0], RAMPS.metal[0], RAMPS.metal[1], RAMPS.metal[2], RAMPS.ash[2]];
    for (const dir of DRAWN) {
      const body = pixels(art.walk[dir].frames[0]).filter((c) => flesh.includes(c));
      const lit = body.filter((c) => c === BRUTE_LEGEND.c || c === BRUTE_LEGEND.d).length;
      expect(lit / body.length, `facing ${dir}`).toBeGreaterThanOrEqual(0.15);
    }
  });
});

describe('brute club and small parts', () => {
  it('fills every rebar cross-section, so the outline finds no hole to ink', () => {
    for (const section of CLUB_REBAR) expect(section).not.toContain('.');
  });

  it('leaves no hole inside the club block for the outline to ink', () => {
    const rows = CLUB_BLOCK.rows;
    const filled = (x: number, y: number) => (rows[y]?.[x] ?? '.') !== '.';
    const holes = rows.flatMap((row, y) => [...row].map((cell, x) => [cell, x, y] as const))
      .filter(([cell, x, y]) => cell === '.' && filled(x - 1, y) && filled(x + 1, y) && filled(x, y - 1) && filled(x, y + 1));
    expect(holes).toEqual([]);
  });

  it('draws toes and knuckles as groups, not bead rows', () => {
    const feet = Object.values(BRUTE_FACINGS).flatMap((facing) => facing.foot.rows);
    const fists = [BRUTE_FIST.down, BRUTE_FIST.side, BRUTE_FIST.up].flatMap((hand) => hand.rows);
    for (const row of [...feet, ...fists]) expect(row).not.toMatch(BEADS);
    const columns = (rows: readonly string[]) => [...rows[0]].map((_, x) => rows.map((row) => row[x]).join(''));
    for (const column of columns(BRUTE_FIST.side.rows)) expect(column).not.toMatch(BEADS);
  });
});

describe('brute motion', () => {
  it('walks at the frame rate where the planted foot steps 4 px a frame, as fast as the brute moves', () => {
    for (let dir = 0; dir < 8; dir++) expect(ZOMBIES.brute.speed / art.walk[dir].fps).toBe(4);
  });

  it('shows the club past the torso when it strikes straight away from the camera', () => {
    const block: readonly Color[] = [RAMPS.concrete[1], RAMPS.concrete[2], RAMPS.concrete[3]];
    for (const frame of [2, 3]) {
      const shown = pixels(art.attack[6].frames[frame]).filter((c) => block.includes(c)).length;
      expect(shown, `frame ${frame}`).toBeGreaterThanOrEqual(40);
    }
  });

  it('trails an unoutlined smear above the brute on the downswing frame', () => {
    const swing = art.attack[0].frames[2];
    const trail = opaque(swing, 0, topRow(art.attack[0].frames[3])).map(([, , c]) => c);
    expect(trail.length).toBeGreaterThan(0);
    expect(trail).not.toContain(INK);
  });

  it('keeps the strike on the last wind-up frame', () => {
    for (let dir = 0; dir < 8; dir++) {
      const clip = art.attack[dir];
      expect(clip.frames.length / clip.fps).toBeCloseTo(4 * ZOMBIES.brute.windupSec / 3);
      expect(clip.loop).toBe(false);
    }
  });
});

describe('brute corpse pool', () => {
  it('lies flat: the bottom row of the last death frame is blood, with no outline under it', () => {
    const last = art.death.frames.at(-1)!;
    const bottom = bottomRow(last);
    const row = opaque(last, bottom, bottom + 1).map(([, , c]) => c);
    expect(row).not.toContain(INK);
    const pool: readonly Color[] = [RAMPS.blood[0], RAMPS.blood[1]];
    expect(row.every((c) => pool.includes(c))).toBe(true);
  });

  it('keeps the corpse anchor where it was', () => {
    for (const frame of art.death.frames) expect([frame.ax, frame.ay]).toEqual([32, 51]);
  });
});
