// Parts every shopfront shares: the parapet roof with its tar field, and a striped awning.

import type { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import { glass } from './facade.ts';
import type { Shell } from './shell.ts';

const { ink, metal, denim, wood, concrete, asphalt, bone, fire, teal, blood } = RAMPS;

/** Parapet tones from lit to shade, plus the tar field and the shadow on it. */
export interface Parapet {
  readonly lit: Color;
  readonly top: Color;
  readonly face: Color;
  readonly low: Color;
  readonly field: Color;
  readonly shade: Color;
}

export const GREY_PARAPET: Parapet = {
  lit: concrete[3], top: concrete[2], face: concrete[1], low: concrete[0], field: concrete[0], shade: asphalt[2],
};

export interface RoofBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** A parapeted flat roof from the row `top` down to the front wall. Returns the tar field. */
export function parapetRoof(s: Shell, top: number, p: Parapet): RoofBox {
  const { c, left, right, footW, wallTop } = s;
  const bottom = wallTop - 3;
  const depth = bottom - top;
  c.rect(left, top, footW, depth, p.face);
  // Tar field, with the shade the rear and left parapets throw across it.
  c.rect(left + 3, top + 3, footW - 6, depth - 3, p.field);
  c.rect(left + 3, top + 3, footW - 6, 2, p.shade).rect(left + 3, top + 3, 2, depth - 3, p.shade);
  // Cap, lit on its top run and left return.
  c.rect(left, top, footW, 1, p.lit).rect(left, top + 1, footW, 1, p.top);
  c.rect(left, top, 1, depth, p.lit).rect(left + 1, top + 2, 1, depth - 1, p.top);
  c.rect(right - 1, top + 2, 2, depth - 1, p.face);
  c.rect(left, bottom, footW, 1, p.lit).rect(left, bottom + 1, footW, 1, p.top).rect(left, bottom + 2, footW, 1, p.face);
  for (let x = left + 31; x < right - 8; x += 37) c.rect(x, top, 1, 3, p.low).rect(x, bottom, 1, 3, p.low);
  return { x: left + 5, y: top + 5, w: footW - 8, h: depth - 5 };
}

/** Roll seams across a tar field, at the rows given, with one stagger joint per run. */
export function rollSeams(c: PixelCanvas, box: RoofBox, rows: readonly number[], shade: Color): void {
  rows.forEach((row, i) => {
    c.rect(box.x, row, box.w, 1, shade);
    const next = rows[i + 1] ?? box.y + box.h;
    c.rect(box.x + 19 + ((i * 47) % (box.w - 30)), row, 1, next - row, shade);
  });
}

/** Standing water: flat, dark and catching one edge of sky. */
export function puddle(c: PixelCanvas, x: number, y: number, w: number): void {
  c.rect(x + 2, y, w - 4, 3, ink[1]).rect(x, y + 1, w, 3, ink[1]).rect(x + 4, y + 4, w - 8, 1, ink[1]);
  c.rect(x + 3, y + 1, Math.floor(w / 3), 1, denim[0]).rect(x + Math.floor(w / 2), y + 3, Math.floor(w / 4), 1, denim[0]);
}

export interface Cloth {
  readonly hi: Color;
  readonly mid: Color;
}

/** A shop awning along the row y, in stripes of two cloths. `torn` stripes hang short. */
export function awning(c: PixelCanvas, x: number, y: number, stripes: number, a: Cloth, b: Cloth, torn: readonly number[] = []): void {
  const stripe = 8;
  const depth = 6;
  c.rect(x, y + depth + 2, stripes * stripe, 2, ink[1]);
  for (let i = 0; i < stripes; i++) {
    const ripped = torn.includes(i);
    const sx = x + i * stripe;
    const { hi, mid } = i % 2 === 0 ? a : b;
    const drop = ripped ? 2 : depth;
    c.rect(sx, y, stripe, drop, hi);
    c.rect(sx, y + drop, stripe, 1, mid);
    if (!ripped) c.rect(sx + 1, y + depth + 1, stripe - 2, 1, mid).rect(sx + 2, y + depth + 2, stripe - 4, 1, ink[1]);
  }
  c.rect(x, y - 1, stripes * stripe, 1, metal[2]);
  c.rect(x - 1, y - 1, 1, depth + 3, metal[1]).rect(x + stripes * stripe, y - 1, 1, depth + 3, metal[0]);
}

/** Shop window with stock on two shelves behind the glass, every few items gone. */
export function stockedWindow(c: PixelCanvas, x: number, y: number, w: number, h: number, frame: Color): void {
  glass(c, x, y, w, h);
  const goods: readonly Color[] = [teal[0], wood[1], blood[0], denim[1], bone[0], fire[0]];
  for (const row of [y + 4, y + h - 3]) {
    c.rect(x + 1, row + 2, w - 2, 1, metal[0]);
    for (let i = x + 2, n = 0; i < x + w - 3; i += 3, n++) {
      const stocked = (n * 7 + row) % 4 !== 0;
      if (stocked) c.rect(i, row, 2, 2, goods[(n * 5 + row) % goods.length]);
    }
  }
  c.frame(x - 1, y - 1, w + 2, h + 2, frame);
}
