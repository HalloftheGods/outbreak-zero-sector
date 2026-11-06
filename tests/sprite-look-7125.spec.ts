// Khronus8's own look (#7125): a lit crown on the hair, no outline-ink fills on hair, belt,
// boots or far leg, a sleeve darker than the shirt it crosses and a shaded hem on every torso.
// These pin the data in khronus8.ts; how it reads on the road was judged by eye.

import { describe, expect, it } from 'vitest';
import type { DrawnDir } from '../src/art/kit.ts';
import { RAMPS } from '../src/art/palette.ts';
import type { Color } from '../src/art/palette.ts';
import { KHRONUS8 } from '../src/art/survivors/khronus8.ts';

const DIRS: readonly DrawnDir[] = [0, 1, 2, 6, 7];
const OUTLINE = new Set(['k', 'K']);
const INKS = new Set<Color>(RAMPS.ink);

function woodStep(color: Color | null | undefined): number {
  return (RAMPS.wood as readonly Color[]).indexOf(color as Color);
}

describe('Khronus8 look (#7125)', () => {
  it('maps only the outline letters to ink, near and far', () => {
    for (const legend of [KHRONUS8.legend, KHRONUS8.farLegend]) {
      for (const [letter, color] of Object.entries(legend)) {
        const inked = color !== null && INKS.has(color);
        if (inked) expect(OUTLINE.has(letter), letter).toBe(true);
      }
    }
  });

  it('lights the crown of every head with the hair highlight', () => {
    expect(KHRONUS8.legend.j).toBe(RAMPS.wood[2]);
    for (const dir of DIRS) expect(KHRONUS8.heads[dir].rows.slice(0, 2).join(''), `head ${dir}`).toContain('j');
  });

  it('keeps each far boot letter in wood and never lighter than the near one', () => {
    for (const letter of 'gfe') {
      const near = woodStep(KHRONUS8.legend[letter]);
      const far = woodStep(KHRONUS8.farLegend[letter]);
      expect(far, letter).toBeGreaterThanOrEqual(0);
      expect(far, letter).toBeLessThanOrEqual(near);
    }
  });

  it('draws every sleeve shade darker than the shirt it crosses', () => {
    const blood: readonly Color[] = RAMPS.blood;
    const shirt = blood.indexOf(KHRONUS8.legend.u as Color);
    for (const color of KHRONUS8.sleeve) expect(blood.indexOf(color)).toBeLessThan(shirt);
  });

  it('shades the hem row above the belt on every torso', () => {
    for (const dir of DIRS) {
      const rows = KHRONUS8.torsos[dir].rows;
      expect(rows[rows.length - 1].replace(/\./g, ''), `belt ${dir}`).toMatch(/^w+$/);
      expect(rows[rows.length - 2].replace(/\./g, ''), `hem ${dir}`).toMatch(/^t+$/);
    }
  });
});
