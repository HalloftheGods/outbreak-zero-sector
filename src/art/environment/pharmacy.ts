// The pharmacy: pale walls, a green plus on the roof and on a blade sign, shelves behind glass.

import type { PixelSprite } from '../types.ts';
import { RAMPS } from '../palette.ts';
import { grime, streak } from './facade.ts';
import type { Trim } from './facade.ts';
import { acUnit, roofVent, skylight, tarPatch } from './roof-kit.ts';
import { bakeShell, caseLamp, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { GREY_PARAPET, parapetRoof, puddle, rollSeams, stockedWindow } from './shop.ts';
import { blockText, blockWidth, plusMark, signBoard, smallText } from './signage.ts';

const { ink, metal, concrete, asphalt, acid, bone, ash, grass } = RAMPS;

const WALL = 38;
const PALE: Trim = [ash[0], bone[0], bone[1]];

function roof(s: Shell): void {
  const { c, left, wallTop } = s;
  const shade = asphalt[2];
  const box = parapetRoof(s, 2, { ...GREY_PARAPET, field: concrete[1], lit: bone[1], top: bone[0], face: ash[0] });
  rollSeams(c, box, [24, 52, 80], concrete[0]);
  tarPatch(c, left + 112, 62, [[3, 9], [1, 15], [0, 19], [0, 20], [2, 17], [6, 9]]);
  tarPatch(c, left + 12, 72, [[2, 6], [0, 13], [0, 16], [1, 16], [0, 12], [3, 8]]);
  // The green plus, big enough to find from anywhere on the block, its paint flaking.
  const cx = left + 80;
  const cy = 50;
  plusMark(c, cx, cy, 26, 8, acid[0], acid[1], grass[1]);
  for (const [x, y, w] of [[cx - 22, cy + 3, 6], [cx + 12, cy - 6, 9], [cx - 5, cy + 19, 4], [cx + 3, cy - 21, 5], [cx + 2, cy + 12, 3]] as const) {
    c.rect(x, y, w, 1, concrete[1]);
  }
  acUnit(c, left + 14, 10, 28, shade);
  acUnit(c, left + 124, 18, 16, shade);
  skylight(c, left + 118, 44, 18, 8, shade);
  roofVent(c, left + 20, 46, shade);
  roofVent(c, left + 48, 84, shade);
  roofVent(c, left + 138, 80, shade);
  puddle(c, left + 72, 86, 22);
  c.rect(left, wallTop - 4, s.footW, 1, acid[0]);
}

function front(s: Shell): void {
  const { c, left, right, footW, ground, wallTop, doorL, doorR } = s;
  c.rect(left, wallTop, footW, WALL, ash[0]);
  c.rect(left, wallTop, 1, WALL, bone[0]).rect(right, wallTop, 1, WALL, concrete[0]);
  c.rect(left, wallTop, footW, 2, ink[1]);
  c.rect(left, ground - 4, footW, 4, concrete[1]).rect(left, ground - 4, footW, 1, concrete[2]);

  // Green fascia, the plain word, and small print.
  signBoard(c, left + 6, wallTop + 3, footW - 12, 12, grass[1], acid[0]);
  const word = 'PHARMACY';
  blockText(c, left + 80 - Math.floor(blockWidth(word) / 2), wallTop + 5, word, acid[2], ink[1]);
  smallText(c, left + 12, wallTop + 7, '24 HR', bone[1]);
  smallText(c, right - 28, wallTop + 7, 'OPEN', bone[0]);

  const top = wallTop + 18;
  stockedWindow(c, left + 6, top, 54, 14, metal[1]);
  stockedWindow(c, doorR + 6, top, 54, 14, metal[1]);
  // A shutter stuck half way, with somebody's kick-mark in it.
  c.rect(doorR + 6, top, 54, 6, metal[1]);
  for (let y = top + 1; y < top + 6; y += 2) c.rect(doorR + 6, y, 54, 1, metal[0]);
  c.rect(doorR + 6, top + 6, 54, 1, metal[2]);
  doorway(s, 22, 'glass', PALE, concrete[1]);
  caseLamp(c, left + 76, ground - 26);
  streak(c, doorL - 6, ground - 4, [2, 1], concrete[0]);

  // A blade sign held off the corner: the plus again, facing up the street.
  c.rect(left + 1, wallTop - 5, 4, 2, metal[2]);
  plusMark(c, left + 7, wallTop - 4, 5, 1, acid[1], acid[2], acid[0]);
  grime(c, left, ground - 4, 20, [2, 4, 1, 3], concrete[0]);
  grime(c, right - 30, ground - 4, 30, [3, 1, 2, 4], concrete[0]);
}

export function buildPharmacy(): PixelSprite {
  const s = startShell('pharmacy', WALL);
  roof(s);
  front(s);
  return bakeShell(s);
}
