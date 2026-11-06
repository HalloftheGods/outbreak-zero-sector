// The difficulty page's card art: one small hand-drawn scene per difficulty, in the same
// style as the survivor busts. Each grid lives in difficulty/<id>.ts.

import type { Legend } from './kit.ts';
import { PixelCanvas } from './kit.ts';
import type { PixelSprite } from './types.ts';

/** Every card picture is this many art pixels, so the four sit side by side at one scale. */
export const CARD_W = 56;
export const CARD_H = 40;

export interface CardDef {
  /** CARD_H rows of CARD_W characters. '.' is empty; any other character is looked up in `legend`. */
  readonly rows: readonly string[];
  /** Colours come from RAMPS only (src/art/palette.ts). */
  readonly legend: Legend;
}

export function cardOf(def: CardDef): PixelSprite {
  return PixelCanvas.fromGrid(def.rows, def.legend).toSprite(CARD_W, CARD_H, CARD_W / 2, CARD_H);
}
