// The character select screen's big picture of a survivor: a hand-drawn head and shoulders,
// far more detailed than the in-game figure. Each survivor's grid lives in busts/<id>.ts.

import type { Legend } from '../kit.ts';
import { PixelCanvas } from '../kit.ts';
import type { PixelSprite } from '../types.ts';

/** Every bust is this many art pixels, so the five stand side by side at one scale. */
export const BUST_W = 48;
export const BUST_H = 56;

export interface BustDef {
  /** BUST_H rows of BUST_W characters. '.' is empty; any other character is looked up in `legend`. */
  readonly rows: readonly string[];
  /** Colours come from RAMPS only (src/art/palette.ts), so a bust matches the rest of the art. */
  readonly legend: Legend;
}

export function bustOf(def: BustDef): PixelSprite {
  return PixelCanvas.fromGrid(def.rows, def.legend).toSprite(BUST_W, BUST_H, BUST_W / 2, BUST_H);
}
