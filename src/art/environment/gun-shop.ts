// The gun shop: a narrow, dark brick fort. Razor wire on the parapet, a roundel on the
// roof, bars on everything and a long gun in silhouette on the sign.

import type { PixelSprite } from '../types.ts';
import { RAMPS } from '../palette.ts';
import { bars, brickPatch, grime, streak } from './facade.ts';
import type { Trim } from './facade.ts';
import { acUnit, roofVent, tarPatch } from './roof-kit.ts';
import { bakeShell, caseLamp, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { GREY_PARAPET, parapetRoof, puddle, stockedWindow, rollSeams } from './shop.ts';
import { blockText, rifleMark, signBoard, targetMark } from './signage.ts';

const { ink, metal, concrete, asphalt, bone, brick, blood, wood } = RAMPS;

const WALL = 34;
const ROOF_TOP = 5;
const IRON: Trim = [metal[0], metal[1], metal[2]];

/** Coils along the parapet, a loop every 6px: they bite into the skyline. */
function razorWire(s: Shell, y: number): void {
  const { c, left, right } = s;
  for (let x = left + 2; x < right - 4; x += 6) {
    c.px(x + 1, y - 3, metal[3]).px(x + 2, y - 3, metal[2]);
    c.px(x, y - 2, metal[2]).px(x + 3, y - 2, metal[1]);
    c.px(x, y - 1, metal[1]).px(x + 4, y - 1, metal[1]);
    c.rect(x + 1, y, 3, 1, metal[0]);
  }
}

function roof(s: Shell): void {
  const { c, left, right, wallTop } = s;
  const shade = asphalt[1];
  const box = parapetRoof(s, ROOF_TOP, {
    ...GREY_PARAPET, field: asphalt[2], shade, lit: brick[2], top: brick[1], face: brick[0], low: ink[1],
  });
  rollSeams(c, box, [32, 64], asphalt[1]);
  tarPatch(c, left + 10, 72, [[3, 9], [1, 15], [0, 19], [0, 20], [2, 17], [6, 9]]);
  targetMark(c, left + 72, 54, 26, blood[1], asphalt[2]);
  acUnit(c, left + 106, 14, 16, shade);
  roofVent(c, left + 16, 16, shade);
  roofVent(c, left + 118, 74, shade);
  puddle(c, left + 104, 90, 20);
  razorWire(s, ROOF_TOP - 1);
  razorWire(s, wallTop - 4);
  c.rect(right, ROOF_TOP + 3, 1, 1, metal[2]);
}

function shutter(s: Shell, x: number, y: number, w: number, h: number): void {
  const { c } = s;
  c.rect(x - 1, y - 1, w + 2, h + 2, metal[1]);
  c.rect(x, y, w, h, metal[0]);
  for (let j = y + 1; j < y + h; j += 2) c.rect(x, j, w, 1, ink[1]);
  c.rect(x - 1, y - 1, w + 2, 1, metal[2]);
  c.rect(x + 5, y + h - 2, 5, 1, metal[2]);
  // A padlock on the hasp.
  c.rect(x + Math.floor(w / 2) - 1, y + h - 3, 3, 3, bone[1]);
}

function front(s: Shell): void {
  const { c, left, right, footW, ground, wallTop, doorR } = s;
  c.rect(left, wallTop, footW, WALL, brick[1]);
  c.rect(left, wallTop, footW, 2, ink[1]);
  for (const [x, y, p] of [[6, 20, 2], [70, 19, 1], [96, 26, 2], [118, 21, 0]] as const) brickPatch(c, left + x, wallTop + y, p);
  c.rect(left, wallTop, 1, WALL, brick[2]).rect(right, wallTop, 1, WALL, brick[0]);
  c.rect(left, ground - 3, footW, 3, concrete[0]).rect(left, ground - 3, footW, 1, concrete[1]);

  // Blood-red board: the word, then the gun.
  signBoard(c, left + 3, wallTop + 1, footW - 6, 11, blood[0], blood[2]);
  blockText(c, left + 8, wallTop + 3, 'GUNS', bone[3], ink[0]);
  rifleMark(c, left + 42, wallTop + 3, bone[1]);
  blockText(c, right - 30, wallTop + 3, 'AMMO', bone[2], ink[0]);

  const top = wallTop + 17;
  stockedWindow(c, doorR + 8, top, 62, 12, metal[0]);
  bars(c, doorR + 8, top, 62, 12);
  shutter(s, left + 6, top, 20, 12);
  doorway(s, 20, 'steel', IRON, wood[1]);
  // The security gate, dragged back to one side and left.
  bars(c, doorR + 2, ground - 20, 5, 19);
  caseLamp(c, doorR - 20, ground - 22);
  streak(c, left + 34, wallTop + 14, [2, 4, 1], brick[0]);
  grime(c, left, ground - 3, 30, [2, 4, 1, 3], brick[0]);
  grime(c, right - 40, ground - 3, 40, [3, 1, 2, 4], brick[0]);
  // A roundel on a bracket off the corner, the other thing people look for.
  c.rect(right - 12, wallTop - 3, 8, 2, metal[1]);
  c.ellipse(right - 6, wallTop + 1, 6, 6, bone[1]).ellipse(right - 6, wallTop + 1, 4, 4, blood[2]).ellipse(right - 6, wallTop + 1, 2, 2, bone[1]);
}

export function buildGunShop(): PixelSprite {
  const s = startShell('gun_shop', WALL);
  roof(s);
  front(s);
  return bakeShell(s);
}
