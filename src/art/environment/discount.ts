// S.O.S. Discount: a low brick-and-block store a little smaller than the grocery. A mustard
// box sign stands up off the parapet with the name lit on cream, a plain canopy runs over the
// door and the glass, and the sidewalk still holds the clearance rack.

import type { PixelSprite } from '../types.ts';
import type { PixelCanvas } from '../kit.ts';
import { darker, RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import { brickPatch, grime, streak } from './facade.ts';
import type { Trim } from './facade.ts';
import { acUnit, roofVent, skylight, tarPatch, turbineVent } from './roof-kit.ts';
import { bakeShell, caseLamp, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { GREY_PARAPET, parapetRoof, puddle, rollSeams, stockedWindow } from './shop.ts';
import { heavyText, signBoard, smallText } from './signage.ts';

const { ink, metal, concrete, asphalt, bone, brick, blood, fire, denim, teal, violet, wood } = RAMPS;

const WALL = 34;
const ROOF_TOP = 6;
// Plain aluminium storefront round the doors.
const TRIM: Trim = [metal[0], metal[2], metal[3]];

/** A blue tarp weighed down with loose bricks over a leak, folds catching the light. */
function tarp(c: PixelCanvas, x: number, y: number): void {
  c.poly([[x + 2, y], [x + 30, y + 2], [x + 32, y + 17], [x, y + 15]], denim[1]);
  c.line(x + 6, y + 2, x + 9, y + 15, denim[2]).line(x + 18, y + 2, x + 20, y + 16, denim[2]);
  c.line(x + 7, y + 2, x + 10, y + 15, denim[0]).line(x + 1, y + 8, x + 31, y + 10, denim[0]);
  for (const [bx, by] of [[x, y - 1], [x + 28, y + 1], [x + 30, y + 15], [x - 1, y + 13], [x + 14, y + 8]]) {
    c.rect(bx, by, 4, 3, brick[2]).rect(bx, by + 2, 4, 1, brick[0]);
  }
}

function roof(s: Shell): void {
  const { c, left } = s;
  const shade = asphalt[2];
  const box = parapetRoof(s, ROOF_TOP, GREY_PARAPET);
  rollSeams(c, box, [30, 52, 72], shade);
  tarPatch(c, left + 122, 20, [[2, 7], [0, 12], [0, 15], [1, 13], [4, 6]]);
  tarPatch(c, left + 56, 58, [[3, 10], [0, 16], [1, 18], [0, 14], [5, 7]]);
  tarp(c, left + 94, 40);
  skylight(c, left + 46, 36, 26, 8, shade, 15);
  acUnit(c, left + 18, 14, 26, shade);
  turbineVent(c, left + 140, 12, shade);
  roofVent(c, left + 64, 18, shade);
  roofVent(c, left + 152, 62, shade);
  puddle(c, left + 22, 44, 22);
}

/** The name: the three letters with their points, then the word, all in heavy capitals. */
function storeName(c: PixelCanvas, x: number, y: number, color: Color): void {
  ['S', 'O', 'S'].forEach((letter, i) => {
    heavyText(c, x + i * 10, y, letter, color);
    c.rect(x + i * 10 + 7, y + 5, 2, 2, color);
  });
  heavyText(c, x + 33, y, 'DISCOUNT', color);
}

/** The box sign standing up off the parapet: mustard can, cream face, red name. */
function boxSign(s: Shell): void {
  const { c, left, wallTop } = s;
  const cx = left + 88;
  const top = wallTop - 21;
  // Struts bracing the can from behind, on the tar.
  c.line(cx - 40, top - 6, cx - 36, top, metal[1]).line(cx + 40, top - 6, cx + 36, top, metal[1]);
  c.rect(cx - 41, top - 6, 3, 1, metal[2]).rect(cx + 39, top - 6, 3, 1, metal[2]);
  c.rect(cx - 56, top, 112, 21, fire[2]);
  c.rect(cx - 56, top, 112, 1, fire[3]).rect(cx - 56, top, 1, 21, fire[3]);
  c.rect(cx - 56, top + 18, 112, 3, fire[1]).rect(cx + 55, top, 1, 21, fire[1]);
  signBoard(c, cx - 48, top + 3, 96, 14, bone[3], bone[1]);
  // One tube gone behind the face, so the end of the board sits dimmer.
  c.rect(cx + 26, top + 4, 21, 12, bone[2]);
  storeName(c, cx - 44, top + 6, blood[1]);
  // A stone's crack across the face, and a corner of it gone to the dark behind.
  c.line(cx - 46, top + 12, cx - 45, top + 5, bone[1]).rect(cx - 47, top + 14, 3, 2, ink[1]);
  // Rust weeping from the can's bolts.
  streak(c, cx - 53, top + 17, [3, 1], fire[0]);
  streak(c, cx + 50, top + 17, [2, 4], fire[0]);
}

/** A faded painted panel from the store's better days, the paint lifting off the brick. */
function mural(c: PixelCanvas, x: number, y: number): void {
  c.rect(x, y, 34, 20, brick[2]).frame(x, y, 34, 20, bone[0]);
  c.poly([[x + 17, y + 2], [x + 21, y + 8], [x + 28, y + 8], [x + 22, y + 12], [x + 25, y + 18], [x + 17, y + 14],
    [x + 9, y + 18], [x + 12, y + 12], [x + 6, y + 8], [x + 13, y + 8]], fire[0]);
  smallText(c, x + 8, y + 14, 'DEALS', bone[1]);
  for (const [px, py] of [[2, 3], [3, 3], [26, 2], [30, 14], [31, 15], [5, 16], [20, 5], [14, 17], [15, 17]]) {
    c.px(x + px, y + py, brick[1]);
  }
}

/** Paper price cards taped inside the glass. */
function priceCards(c: PixelCanvas, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const cx = x + i * 7;
    c.rect(cx, y + (i % 2), 5, 5, bone[3]).rect(cx + 1, y + 1 + (i % 2), 3, 1, blood[2]).rect(cx + 1, y + 3 + (i % 2), 2, 1, ink[1]);
  }
}

/** A star crack across a pane, white at the strike. */
function crack(c: PixelCanvas, x: number, y: number): void {
  c.line(x, y, x - 5, y - 4, metal[2]).line(x, y, x + 6, y - 3, metal[2]).line(x, y, x + 3, y + 5, metal[2]);
  c.line(x, y, x - 4, y + 3, metal[1]).px(x, y, bone[3]);
}

/** The sidewalk rack: a rail on two feet with the last of the clearance still on hangers. */
function clearanceRack(c: PixelCanvas, x: number, ground: number): void {
  const rail = ground - 12;
  c.rect(x, rail, 28, 1, metal[3]).rect(x, rail, 1, 11, metal[2]).rect(x + 27, rail, 1, 11, metal[1]);
  c.rect(x - 2, ground - 1, 5, 1, metal[1]).rect(x + 25, ground - 1, 5, 1, metal[0]);
  const garments: readonly Color[] = [teal[2], blood[2], violet[2], bone[2], denim[2]];
  garments.forEach((tone, i) => {
    const gx = x + 2 + i * 5 + (i > 2 ? 2 : 0);
    const drop = 8 - (i % 2) * 2;
    c.rect(gx, rail + 2, 4, drop, tone).rect(gx + 3, rail + 2, 1, drop, darker(tone)).rect(gx, rail + 1, 4, 1, darker(tone));
    c.px(gx + 1, rail, metal[2]);
  });
  // A hand-written card wired to the far post.
  c.rect(x + 25, rail - 2, 7, 5, bone[3]).rect(x + 26, rail, 5, 1, blood[1]);
}

/** Two cartons of stock left out by the glass, the top one torn open. */
function cartons(c: PixelCanvas, x: number, ground: number): void {
  c.rect(x, ground - 7, 12, 7, wood[2]).rect(x, ground - 7, 12, 1, wood[3]).rect(x + 11, ground - 7, 1, 7, wood[1]);
  c.rect(x + 2, ground - 12, 8, 5, wood[3]).rect(x + 2, ground - 12, 8, 1, bone[2]).rect(x + 9, ground - 12, 1, 5, wood[2]);
  c.rect(x + 3, ground - 13, 3, 1, wood[3]).rect(x + 5, ground - 4, 3, 1, wood[1]);
}

function front(s: Shell): void {
  const { c, left, right, footW, ground, wallTop, doorL, doorR } = s;
  c.rect(left, wallTop, footW, WALL, brick[1]);
  c.rect(left, wallTop, footW, 2, ink[1]);
  for (const [x, y, p] of [[38, 23, 2], [150, 1, 2]] as const) brickPatch(c, left + x, wallTop + y, p);
  c.rect(left, wallTop, 1, WALL, brick[2]).rect(right, wallTop, 1, WALL, brick[0]);
  // A course of painted block at the foot.
  c.rect(left, ground - 4, footW, 4, concrete[1]).rect(left, ground - 4, footW, 1, concrete[2]);
  mural(c, left + 5, wallTop + 3);

  const top = wallTop + 15;
  const glassL = doorR + 7;
  stockedWindow(c, glassL, top, 38, 14, metal[1]);
  stockedWindow(c, glassL + 42, top, right - glassL - 47, 14, metal[1]);
  signBoard(c, glassL + 2, top + 1, 19, 8, bone[2], bone[1]);
  smallText(c, glassL + 4, top + 3, 'SALE', blood[2]);
  priceCards(c, glassL + 24, top + 2, 2);
  priceCards(c, glassL + 64, top + 7, 3);
  crack(c, glassL + 50, top + 6);
  doorway(s, 22, 'glass', TRIM, concrete[1]);

  // The plain canopy over the way in and the glass, its fascia in the store's mustard.
  const canopyL = doorL - 6;
  const canopyW = right - 2 - canopyL;
  c.rect(canopyL, wallTop + 11, canopyW, 2, ink[1]);
  // Tie rods from the wall to the canopy's lip.
  for (const rx of [canopyL + 4, canopyL + 60, canopyL + canopyW - 6]) c.line(rx, wallTop + 2, rx + 2, wallTop + 5, metal[1]);
  c.rect(canopyL, wallTop + 4, canopyW, 2, metal[1]).rect(canopyL, wallTop + 4, canopyW, 1, metal[2]);
  c.rect(canopyL, wallTop + 6, canopyW, 5, fire[2]);
  c.rect(canopyL, wallTop + 10, canopyW, 1, fire[1]);
  c.rect(canopyL, wallTop + 8, canopyW, 1, blood[1]);
  c.rect(canopyL - 1, wallTop + 4, 1, 7, metal[2]).rect(canopyL + canopyW, wallTop + 4, 1, 7, metal[0]);
  // The far end has sagged where a bracket let go.
  c.rect(canopyL + canopyW - 18, wallTop + 11, 18, 1, fire[1]).rect(canopyL + canopyW - 10, wallTop + 12, 10, 1, fire[0]);
  // A painted banner tied off the canopy over the far window.
  signBoard(c, glassL + 44, wallTop + 12, 39, 8, bone[2], bone[1]);
  smallText(c, glassL + 46, wallTop + 13, 'CLEARANCE', blood[1]);
  caseLamp(c, doorL + 12, wallTop + 12);

  clearanceRack(c, left + 10, ground);
  cartons(c, right - 16, ground);
  streak(c, left + 38, wallTop + 26, [2, 1, 3], brick[0]);
  grime(c, left, ground - 4, 44, [2, 4, 1, 3], brick[0]);
  grime(c, right - 40, ground - 4, 40, [3, 1, 2, 4], brick[0]);
}

export function buildDiscount(): PixelSprite {
  const s = startShell('discount', WALL);
  roof(s);
  boxSign(s);
  front(s);
  return bakeShell(s);
}
