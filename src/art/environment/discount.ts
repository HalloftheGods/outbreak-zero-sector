// S.O.S. Discount: a low shopfront, a little smaller than the grocery.
//
// PLACEHOLDER: this body only stands in until the real front lands in this file. It reuses the
// grocery's parts (parapet roof, stocked windows, glass door, striped awning) in a teal tint and
// leaves the sign board blank, so the town draws and the shell specs hold in the meantime.
// Keep the export name and `startShell('discount', ...)` when replacing it.

import type { PixelSprite } from '../types.ts';
import { RAMPS } from '../palette.ts';
import type { Trim } from './facade.ts';
import { bakeShell, caseLamp, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { awning, GREY_PARAPET, parapetRoof, stockedWindow } from './shop.ts';
import type { Cloth } from './shop.ts';
import { signBoard } from './signage.ts';

const { ink, metal, concrete, bone, teal, wood } = RAMPS;

const WALL = 32;
const ROOF_TOP = 6;
const TEAL: Cloth = { hi: teal[2], mid: teal[1] };
const CREAM: Cloth = { hi: bone[1], mid: bone[0] };
const TRIM: Trim = [teal[0], teal[1], teal[2]];

function front(s: Shell): void {
  const { c, left, right, footW, ground, wallTop, doorL, doorR } = s;
  c.rect(left, wallTop, footW, WALL, concrete[1]);
  c.rect(left, wallTop, footW, 3, ink[1]);
  c.rect(left, wallTop, 1, WALL, concrete[3]).rect(right, wallTop, 1, WALL, concrete[0]);
  c.rect(left, ground - 4, footW, 4, wood[1]).rect(left, ground - 4, footW, 1, wood[2]);
  const top = wallTop + 14;
  stockedWindow(c, left + 6, top, 28, 13, metal[1]);
  stockedWindow(c, doorR + 8, top, right - doorR - 14, 13, metal[1]);
  doorway(s, 22, 'glass', TRIM, concrete[1]);
  awning(c, left + 4, wallTop + 4, Math.floor((footW - 8) / 8), TEAL, CREAM);
  caseLamp(c, doorL + 12, wallTop + 12);
  // The name board, left blank until the real front is drawn.
  signBoard(c, left + footW / 2 - 30, wallTop - 14, 60, 11, ink[1], teal[1]);
}

export function buildDiscount(): PixelSprite {
  const s = startShell('discount', WALL);
  parapetRoof(s, ROOF_TOP, GREY_PARAPET);
  front(s);
  return bakeShell(s);
}
