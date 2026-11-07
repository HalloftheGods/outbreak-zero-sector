import { describe, expect, it } from 'vitest';
import { MERCHANT_IDS } from '../shared/home-protocol.ts';
import { buildMerchants } from '../src/art/environment/merchants.ts';
import { GUNSMITH } from '../src/art/environment/merchant-people/gunsmith.ts';
import { MEDIC } from '../src/art/environment/merchant-people/medic.ts';
import { POWDER } from '../src/art/environment/merchant-people/powder.ts';
import { QUARTERMASTER } from '../src/art/environment/merchant-people/quartermaster.ts';
import { inPalette } from '../src/art/palette.ts';
import { buildSurvivors } from '../src/art/survivors.ts';
import { ANCHOR_X, ANCHOR_Y } from '../src/art/survivors/cell.ts';
import type { PixelSprite } from '../src/art/types.ts';

const PEOPLE = { gunsmith: GUNSMITH, quartermaster: QUARTERMASTER, medic: MEDIC, powder: POWDER };

function colours(sprite: PixelSprite): number[] {
  const out: number[] = [];
  for (let at = 0; at < sprite.rgba.length; at += 4) {
    const clear = sprite.rgba[at + 3] === 0;
    if (clear) continue;
    out.push((sprite.rgba[at] << 16) | (sprite.rgba[at + 1] << 8) | sprite.rgba[at + 2]);
  }
  return out;
}

describe('merchants drawn on the survivor rig', () => {
  const merchants = buildMerchants();
  const survivorPortrait = buildSurvivors()[0].portrait;

  for (const id of MERCHANT_IDS) {
    describe(id, () => {
      const person = PEOPLE[id];

      it('has every letter of its front head and torso in its legend', () => {
        const letters = new Set([...person.heads[2].rows, ...person.torsos[2].rows].join('').replaceAll('.', ''));
        for (const letter of letters) expect(person.legend[letter], `${id} ${letter}`).toBeDefined();
      });

      it('stands on the anchor the survivors stand on', () => {
        expect([merchants[id].figure.ax, merchants[id].figure.ay]).toEqual([ANCHOR_X, ANCHOR_Y]);
      });

      it('has a portrait the size of a survivor portrait, for the How to Play book', () => {
        expect([merchants[id].portrait.w, merchants[id].portrait.h]).toEqual([survivorPortrait.w, survivorPortrait.h]);
      });

      it('uses only palette colours', () => {
        for (const colour of colours(merchants[id].figure)) expect(inPalette(colour)).toBe(true);
      });
    });
  }
});
