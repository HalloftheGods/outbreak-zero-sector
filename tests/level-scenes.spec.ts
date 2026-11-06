import { describe, expect, it } from 'vitest';
import { CARD_H, CARD_W, cardOf } from '../src/art/difficulty-card.ts';
import type { CardDef } from '../src/art/difficulty-card.ts';
import { buildLevelCards } from '../src/art/level-cards.ts';
import { LEVEL_1_CARD } from '../src/art/levels/level-1.ts';
import { LEVEL_2_CARD } from '../src/art/levels/level-2.ts';
import { LEVEL_3_CARD } from '../src/art/levels/level-3.ts';
import { LEVEL_4_CARD } from '../src/art/levels/level-4.ts';
import { LEVEL_5_CARD } from '../src/art/levels/level-5.ts';
import { LEVEL_6_CARD } from '../src/art/levels/level-6.ts';
import { LEVEL_7_CARD } from '../src/art/levels/level-7.ts';
import { LEVEL_8_CARD } from '../src/art/levels/level-8.ts';
import { LEVEL_9_CARD } from '../src/art/levels/level-9.ts';
import { LEVEL_10_CARD } from '../src/art/levels/level-10.ts';
import { inPalette } from '../src/art/palette.ts';
import type { PixelSprite } from '../src/art/types.ts';

const CARDS: ReadonlyArray<readonly [string, CardDef]> = [
  ['level_1', LEVEL_1_CARD],
  ['level_2', LEVEL_2_CARD],
  ['level_3', LEVEL_3_CARD],
  ['level_4', LEVEL_4_CARD],
  ['level_5', LEVEL_5_CARD],
  ['level_6', LEVEL_6_CARD],
  ['level_7', LEVEL_7_CARD],
  ['level_8', LEVEL_8_CARD],
  ['level_9', LEVEL_9_CARD],
  ['level_10', LEVEL_10_CARD],
];

function alphaAt(sprite: PixelSprite, x: number, y: number): number {
  return sprite.rgba[(y * sprite.w + x) * 4 + 3];
}

function colourAt(sprite: PixelSprite, x: number, y: number): string {
  const at = (y * sprite.w + x) * 4;
  return `${sprite.rgba[at]},${sprite.rgba[at + 1]},${sprite.rgba[at + 2]},${sprite.rgba[at + 3]}`;
}

/** Fraction of pixels that differ between two same-size sprites. */
function differing(a: PixelSprite, b: PixelSprite): number {
  let diff = 0;
  for (let y = 0; y < CARD_H; y++) {
    for (let x = 0; x < CARD_W; x++) if (colourAt(a, x, y) !== colourAt(b, x, y)) diff++;
  }
  return diff / (CARD_W * CARD_H);
}

describe('level scene pictures (#7200)', () => {
  for (const [id, def] of CARDS) {
    describe(id, () => {
      it('is a CARD_H by CARD_W grid', () => {
        expect(def.rows).toHaveLength(CARD_H);
        expect(def.rows.map((row) => row.length)).toEqual(def.rows.map(() => CARD_W));
      });

      it('has every grid letter in its legend and every colour in the palette', () => {
        const letters = new Set(def.rows.join('').replaceAll('.', ''));
        const missing = [...letters].filter((letter) => !(letter in def.legend));
        expect(missing).toEqual([]);
        const off = Object.values(def.legend).filter((colour) => colour !== null && !inPalette(colour));
        expect(off).toEqual([]);
      });

      it('builds a full-scene, hard-edged card', () => {
        const sprite = cardOf(def);
        expect([sprite.w, sprite.h]).toEqual([CARD_W, CARD_H]);

        let opaque = 0;
        const colours = new Set<string>();
        for (let y = 0; y < CARD_H; y++) {
          for (let x = 0; x < CARD_W; x++) {
            const alpha = alphaAt(sprite, x, y);
            expect([0, 255]).toContain(alpha);
            if (alpha === 255) {
              opaque++;
              colours.add(colourAt(sprite, x, y));
            }
          }
        }
        expect(opaque / (CARD_W * CARD_H)).toBeGreaterThanOrEqual(0.92);
        expect(colours.size).toBeLessThanOrEqual(28);
      });
    });
  }

  it('builds ten scenes in level order', () => {
    const built = buildLevelCards();
    expect(built).toHaveLength(10);
    built.forEach((sprite, i) => expect(differing(sprite, cardOf(CARDS[i][1]))).toBe(0));
  });

  it('draws every pair of scenes at least 40% differently', () => {
    const built = buildLevelCards();
    for (let i = 0; i < built.length; i++) {
      for (let j = i + 1; j < built.length; j++) {
        expect(differing(built[i], built[j]), `level ${i + 1} vs level ${j + 1}`).toBeGreaterThanOrEqual(0.4);
      }
    }
  });
});
