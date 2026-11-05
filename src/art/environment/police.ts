// The police station: a stern concrete block. Heavy piers, slit windows behind bars, the
// name cut into a lintel, blue lamps at the door and a light bar over the entrance.

import type { PixelSprite } from '../types.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import { bars, grime, streak, windowUnit } from './facade.ts';
import type { Trim } from './facade.ts';
import { acUnit, bulkhead, dish, radioMast, roofVent, tarPatch } from './roof-kit.ts';
import { bakeShell, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { GREY_PARAPET, parapetRoof, puddle, rollSeams } from './shop.ts';
import { badgeMark, heavyText, heavyWidth } from './signage.ts';

const { ink, metal, denim, concrete, asphalt, bone } = RAMPS;

const WALL = 46;
const ROOF_TOP = 8;
const STONE: Trim = [concrete[0], concrete[2], concrete[3]];

function lightBar(s: Shell, x: number, y: number): void {
  const { c } = s;
  // Shade, struts, then the bar: two long blue lenses either side of a dead white one.
  c.rect(x + 3, y + 10, 52, 3, asphalt[1]);
  c.rect(x + 6, y + 8, 2, 4, metal[0]).rect(x + 44, y + 8, 2, 4, metal[0]);
  c.rect(x, y, 52, 9, metal[0]).rect(x, y, 52, 1, metal[3]).rect(x, y, 1, 9, metal[2]);
  c.rect(x + 2, y + 2, 21, 5, denim[1]).rect(x + 3, y + 2, 15, 3, denim[2]).rect(x + 4, y + 2, 7, 1, bone[3]);
  c.rect(x + 24, y + 2, 4, 5, metal[1]).rect(x + 24, y + 2, 4, 1, metal[2]);
  c.rect(x + 29, y + 2, 21, 5, denim[1]).rect(x + 30, y + 2, 15, 3, denim[2]).rect(x + 31, y + 2, 7, 1, bone[3]);
  c.rect(x, y + 8, 52, 1, ink[1]);
}

function roof(s: Shell): void {
  const { c, left, right, wallTop } = s;
  const shade = asphalt[1];
  const box = parapetRoof(s, ROOF_TOP, { ...GREY_PARAPET, field: asphalt[2], shade, lit: concrete[3], top: concrete[2], face: concrete[1] });
  rollSeams(c, box, [34, 66, 98], asphalt[1]);
  // Blue band painted inside the parapet: the department's colour, gone dull.
  c.rect(left + 8, ROOF_TOP + 8, s.footW - 16, 2, denim[0]).rect(left + 8, wallTop - 11, s.footW - 16, 2, denim[0]);
  c.rect(left + 8, ROOF_TOP + 8, 2, wallTop - ROOF_TOP - 17, denim[0]).rect(right - 9, ROOF_TOP + 8, 2, wallTop - ROOF_TOP - 17, denim[0]);
  tarPatch(c, left + 28, 86, [[3, 9], [1, 15], [0, 19], [0, 20], [2, 17], [6, 9]]);
  tarPatch(c, left + 170, 40, [[2, 6], [0, 13], [0, 16], [1, 16], [0, 12], [3, 8]]);
  // The raised core of the building, carrying the badge.
  const core = left + 68;
  c.rect(core + 4, 74, 92, 4, shade).rect(core + 88, 26, 4, 50, shade);
  c.rect(core, 22, 88, 52, concrete[1]);
  c.rect(core, 22, 88, 1, concrete[3]).rect(core, 22, 1, 52, concrete[3]).rect(core + 1, 23, 86, 1, concrete[2]);
  c.rect(core + 4, 26, 80, 44, concrete[0]);
  c.rect(core, 70, 88, 4, concrete[0]).rect(core, 70, 88, 1, concrete[2]);
  badgeMark(c, core + 22, 26, denim[2], denim[0], 3);
  bulkhead(c, left + 16, 22, 30, 10, 11, shade);
  acUnit(c, left + 178, 58, 28, shade);
  acUnit(c, left + 18, 58, 28, shade);
  dish(c, left + 176, 22, shade);
  roofVent(c, left + 56, 94, shade);
  roofVent(c, left + 170, 96, shade);
  puddle(c, left + 124, 92, 26);
  // The mast stands on the rear parapet and breaks the skyline.
  radioMast(c, left + 196, 1, 30);
  lightBar(s, left + 86, wallTop - 18);
}

function pier(s: Shell, x: number, w: number): void {
  const { c, ground, wallTop } = s;
  c.rect(x, wallTop, w, ground - wallTop, concrete[2]);
  c.rect(x, wallTop, 1, ground - wallTop, concrete[3]).rect(x + w - 1, wallTop, 1, ground - wallTop, concrete[0]);
}

function slit(s: Shell, x: number, y: number, kind: 'dark' | 'lit'): void {
  windowUnit(s.c, x, y, 8, 13, kind, STONE);
  bars(s.c, x, y, 8, 13);
}

function blueLamp(s: Shell, x: number, y: number, glow: Color): void {
  const { c } = s;
  c.rect(x + 1, y + 7, 3, 10, metal[1]).rect(x + 1, y + 7, 1, 10, metal[2]);
  c.ellipse(x + 2.5, y + 3, 3.5, 3.5, denim[1]).ellipse(x + 2, y + 2.5, 2, 2, glow).px(x + 1, y + 1, bone[3]);
}

function front(s: Shell): void {
  const { c, left, right, footW, ground, wallTop, doorL, doorR } = s;
  c.rect(left, wallTop, footW, WALL, concrete[1]);
  c.rect(left, wallTop, footW, 3, ink[1]);
  c.rect(left, wallTop, 1, WALL, concrete[3]).rect(right, wallTop, 1, WALL, concrete[0]);
  // Board-marked concrete: a few form lines, not a grid.
  for (const y of [wallTop + 15, wallTop + 29]) c.rect(left, y, footW, 1, concrete[0]);
  const piers = [left + 2, left + 34, left + 66, left + 150, left + 182, left + 212];
  for (const x of piers) pier(s, x, 10);
  for (const x of [left + 19, left + 51, left + 165, left + 197]) {
    slit(s, x, wallTop + 6, x === left + 51 ? 'lit' : 'dark');
    slit(s, x, wallTop + 26, 'dark');
  }
  c.rect(left, ground - 5, footW, 5, concrete[2]).rect(left, ground - 5, footW, 1, concrete[3]);

  // Entrance block: a deep lintel with the name in it.
  c.rect(left + 76, wallTop, 72, WALL, concrete[0]);
  c.rect(left + 72, wallTop + 1, 80, 19, concrete[2]);
  c.rect(left + 72, wallTop + 1, 80, 1, concrete[3]).rect(left + 72, wallTop + 1, 1, 19, concrete[3]);
  c.rect(left + 72, wallTop + 19, 80, 1, ink[1]).rect(left + 151, wallTop + 1, 1, 19, concrete[0]);
  const word = 'POLICE';
  const wordX = left + 112 - Math.floor(heavyWidth(word) / 2);
  heavyText(c, wordX + 1, wallTop + 8, word, concrete[0]);
  heavyText(c, wordX, wallTop + 7, word, bone[3]);
  badgeMark(c, left + 74, wallTop + 3, denim[2], denim[0]);
  badgeMark(c, left + 135, wallTop + 3, denim[2], denim[0]);
  doorway(s, 24, 'steel', STONE, concrete[1]);
  // Steps up to the door, with the lamps standing on them.
  c.rect(doorL - 8, ground - 2, doorR - doorL + 16, 2, concrete[3]).rect(doorL - 8, ground - 1, doorR - doorL + 16, 1, concrete[1]);
  blueLamp(s, doorL - 8, ground - 19, denim[2]);
  blueLamp(s, doorR + 3, ground - 19, denim[2]);
  streak(c, left + 22, wallTop + 21, [3, 1, 2, 4], concrete[0]);
  streak(c, left + 200, wallTop + 21, [2, 5, 1, 3], concrete[0]);
  grime(c, left, ground - 5, 60, [2, 4, 1, 3], concrete[1]);
  grime(c, left + 160, ground - 5, 60, [3, 1, 2, 4], concrete[1]);
}

export function buildPolice(): PixelSprite {
  const s = startShell('police', WALL);
  roof(s);
  front(s);
  return bakeShell(s);
}
