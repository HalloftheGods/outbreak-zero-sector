import { describe, expect, it } from 'vitest';
import { buildMerchants } from '../src/art/environment/merchants.ts';
import { GUNSMITH_BUST } from '../src/art/environment/merchant-busts/gunsmith.ts';
import { MEDIC_BUST } from '../src/art/environment/merchant-busts/medic.ts';
import { POWDER_BUST } from '../src/art/environment/merchant-busts/powder.ts';
import { QUARTERMASTER_BUST } from '../src/art/environment/merchant-busts/quartermaster.ts';
import { inPalette } from '../src/art/palette.ts';
import { buildSurvivors } from '../src/art/survivors.ts';
import { BUST_H, BUST_W } from '../src/art/survivors/bust.ts';
import type { BustDef } from '../src/art/survivors/bust.ts';
import type { PixelSprite } from '../src/art/types.ts';

const BUSTS = [
  ['gunsmith', GUNSMITH_BUST],
  ['quartermaster', QUARTERMASTER_BUST],
  ['medic', MEDIC_BUST],
  ['powder', POWDER_BUST],
] as const satisfies ReadonlyArray<readonly [string, BustDef]>;

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

function differingShare(a: PixelSprite, b: PixelSprite): number {
  let differing = 0;
  for (let y = 0; y < BUST_H; y++) {
    for (let x = 0; x < BUST_W; x++) {
      const differs = colourAt(a, x, y) !== colourAt(b, x, y);
      differing += Number(differs);
    }
  }
  return differing / (BUST_W * BUST_H);
}

describe('merchant busts (#7199)', () => {
  const built = buildMerchants();

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
        const sprite = built[id].bust;
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

        expect(opaqueInRow(sprite, BUST_H - 1)).toBeGreaterThanOrEqual(Math.ceil(BUST_W * 0.6));
        const topRows = opaqueInRow(sprite, 0) + opaqueInRow(sprite, 1);
        expect(topRows).toBeLessThan(BUST_W * 2);
      });
    });
  }

  it('makes every pair of merchant busts differ in at least a quarter of their pixels', () => {
    for (let a = 0; a < BUSTS.length; a++) {
      for (let b = a + 1; b < BUSTS.length; b++) {
        const share = differingShare(built[BUSTS[a][0]].bust, built[BUSTS[b][0]].bust);
        expect(share, `${BUSTS[a][0]} vs ${BUSTS[b][0]}`).toBeGreaterThanOrEqual(0.25);
      }
    }
  });

  it('makes every merchant bust differ from every survivor bust', () => {
    const survivors = buildSurvivors().map((art) => art.select);
    for (const [id] of BUSTS) {
      survivors.forEach((select, i) => {
        const share = differingShare(built[id].bust, select);
        expect(share, `${id} vs survivor ${i}`).toBeGreaterThanOrEqual(0.25);
      });
    }
  });
});
