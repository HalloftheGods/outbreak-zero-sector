import { describe, expect, it } from 'vitest';
import { inPalette } from '../src/art/palette.ts';
import { buildSurvivors } from '../src/art/survivors.ts';
import { BUST_H, BUST_W, bustOf } from '../src/art/survivors/bust.ts';
import type { BustDef } from '../src/art/survivors/bust.ts';
import { BANDUS_BUST } from '../src/art/survivors/busts/bandus.ts';
import { NIGHT_BUST } from '../src/art/survivors/busts/night.ts';
import { REX_BUST } from '../src/art/survivors/busts/rex.ts';
import { SATORI_BUST } from '../src/art/survivors/busts/satori.ts';
import { SOL_BUST } from '../src/art/survivors/busts/sol.ts';
import type { PixelSprite } from '../src/art/types.ts';

const BUSTS: ReadonlyArray<readonly [string, BustDef]> = [
  ['night', NIGHT_BUST],
  ['bandus', BANDUS_BUST],
  ['satori', SATORI_BUST],
  ['rex', REX_BUST],
  ['sol', SOL_BUST],
];

function alphaAt(sprite: PixelSprite, x: number, y: number): number {
  return sprite.rgba[(y * sprite.w + x) * 4 + 3];
}

function colourAt(sprite: PixelSprite, x: number, y: number): string {
  const at = (y * sprite.w + x) * 4;
  return `${sprite.rgba[at]},${sprite.rgba[at + 1]},${sprite.rgba[at + 2]},${sprite.rgba[at + 3]}`;
}

function opaqueInRow(sprite: PixelSprite, y: number): number {
  let count = 0;
  for (let x = 0; x < sprite.w; x++) {
    const opaque = alphaAt(sprite, x, y) === 255;
    count += Number(opaque);
  }
  return count;
}

describe('select screen busts (#7166)', () => {
  for (const [id, def] of BUSTS) {
    describe(id, () => {
      it('is a BUST_H by BUST_W grid', () => {
        expect(def.rows).toHaveLength(BUST_H);
        expect(def.rows.map((row) => row.length)).toEqual(def.rows.map(() => BUST_W));
      });

      it('has every grid letter in its legend and every colour in the palette', () => {
        const letters = new Set(def.rows.join('').replaceAll('.', ''));
        const missing = [...letters].filter((letter) => !(letter in def.legend));
        expect(missing).toEqual([]);
        const off = Object.values(def.legend).filter((colour) => colour !== null && !inPalette(colour));
        expect(off).toEqual([]);
      });

      it('builds a full-frame, hard-edged bust', () => {
        const sprite = bustOf(def);
        expect([sprite.w, sprite.h]).toEqual([BUST_W, BUST_H]);

        let opaque = 0;
        const colours = new Set<string>();
        for (let y = 0; y < BUST_H; y++) {
          for (let x = 0; x < BUST_W; x++) {
            const alpha = alphaAt(sprite, x, y);
            expect([0, 255]).toContain(alpha);
            const isOpaque = alpha === 255;
            if (isOpaque) {
              opaque++;
              colours.add(colourAt(sprite, x, y));
            }
          }
        }
        const share = opaque / (BUST_W * BUST_H);
        expect(share).toBeGreaterThanOrEqual(0.35);
        expect(share).toBeLessThanOrEqual(0.8);
        expect(colours.size).toBeLessThanOrEqual(24);

        // The shoulders run off the bottom edge; the crown of the head does not touch the top.
        expect(opaqueInRow(sprite, BUST_H - 1)).toBeGreaterThanOrEqual(Math.ceil(BUST_W * 0.6));
        const topRows = opaqueInRow(sprite, 0) + opaqueInRow(sprite, 1);
        expect(topRows).toBeLessThan(BUST_W * 2);
      });
    });
  }

  it('exposes each bust as the survivor select art', () => {
    const shown = buildSurvivors().map((art) => art.select);
    expect(shown.map((each) => `${each.w}x${each.h}`)).toEqual(shown.map(() => `${BUST_W}x${BUST_H}`));
  });

  it('makes every pair of busts differ in at least a quarter of their pixels', () => {
    const sprites = BUSTS.map(([id, def]) => [id, bustOf(def)] as const);
    for (let a = 0; a < sprites.length; a++) {
      for (let b = a + 1; b < sprites.length; b++) {
        let differing = 0;
        for (let y = 0; y < BUST_H; y++) {
          for (let x = 0; x < BUST_W; x++) {
            const differs = colourAt(sprites[a][1], x, y) !== colourAt(sprites[b][1], x, y);
            differing += Number(differs);
          }
        }
        const share = differing / (BUST_W * BUST_H);
        expect(share, `${sprites[a][0]} vs ${sprites[b][0]}`).toBeGreaterThanOrEqual(0.25);
      }
    }
  });
});
