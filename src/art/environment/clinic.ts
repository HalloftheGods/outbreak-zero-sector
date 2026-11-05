// The clinic: long and low, ribbon windows behind blinds, an entrance canopy and a teal
// heart-and-trace mark. No crosses, so it never reads as the pharmacy.

import type { PixelSprite } from '../types.ts';
import { RAMPS } from '../palette.ts';
import { grime, streak, windowUnit } from './facade.ts';
import type { Trim, WindowKind } from './facade.ts';
import { acUnit, bulkhead, roofVent, skylight, tarPatch } from './roof-kit.ts';
import { bakeShell, caseLamp, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { GREY_PARAPET, parapetRoof, puddle, rollSeams } from './shop.ts';
import { blockText, heartMark, pulseLine, signBoard } from './signage.ts';

const { ink, metal, concrete, asphalt, teal, bone, ash } = RAMPS;

const WALL = 40;
const PALE: Trim = [ash[0], bone[0], bone[1]];

function roofMark(s: Shell, cx: number, cy: number): void {
  const { c } = s;
  c.ellipse(cx, cy, 27, 27, teal[0]);
  c.ellipse(cx, cy, 24, 24, concrete[1]);
  c.ellipse(cx, cy, 21, 21, teal[0]);
  heartMark(c, cx - 4, cy - 13, teal[2]);
  pulseLine(c, cx - 16, cy + 6, 33, teal[2]);
  // Paint gone where the roof has ponded.
  for (const [x, y, w] of [[cx + 10, cy + 14, 6], [cx - 17, cy - 8, 4], [cx + 8, cy - 15, 5]] as const) c.rect(x, y, w, 1, concrete[1]);
}

function roof(s: Shell): void {
  const { c, left, wallTop } = s;
  const shade = asphalt[2];
  const box = parapetRoof(s, 2, { ...GREY_PARAPET, field: concrete[1], lit: bone[1], top: bone[0], face: ash[0] });
  rollSeams(c, box, [30, 62, 92], concrete[0]);
  tarPatch(c, left + 20, 70, [[2, 6], [0, 13], [0, 16], [1, 16], [0, 12], [3, 8]]);
  tarPatch(c, left + 150, 34, [[3, 9], [1, 15], [0, 19], [0, 20], [2, 17], [6, 9]]);
  roofMark(s, left + 96, 54);
  bulkhead(c, left + 14, 16, 34, 12, 12, shade);
  acUnit(c, left + 152, 12, 28, shade);
  skylight(c, left + 142, 64, 30, 8, shade);
  skylight(c, left + 142, 84, 30, 8, shade, 19);
  skylight(c, left + 16, 92, 30, 8, shade, 9);
  roofVent(c, left + 54, 20, shade);
  roofVent(c, left + 62, 94, shade);
  roofVent(c, left + 124, 92, shade);
  puddle(c, left + 86, 94, 24);
  c.rect(left, wallTop - 4, s.footW, 1, teal[1]);
}

const WINDOWS: readonly (readonly [number, WindowKind])[] = [
  [8, 'blind'], [30, 'blind'], [52, 'cracked'], [130, 'blind'], [152, 'lit'], [174, 'blind'],
];

function canopy(s: Shell): void {
  const { c, left, ground, doorL, doorR, wallTop } = s;
  const x = doorL - 14;
  const w = doorR - doorL + 28;
  const y = wallTop + 13;
  for (const post of [x + 2, x + w - 5]) c.rect(post, y + 6, 3, ground - y - 6, bone[0]).rect(post, y + 6, 1, ground - y - 6, bone[1]);
  c.rect(x, y + 6, w, 2, ink[1]);
  c.rect(x, y, w, 6, bone[0]).rect(x, y, w, 1, bone[2]).rect(x, y + 3, w, 2, teal[1]).rect(x, y + 5, w, 1, ash[0]);
  // The name board stands on the canopy.
  const cx = left + 96;
  signBoard(c, cx - 31, wallTop + 1, 62, 12, teal[0], teal[1]);
  heartMark(c, cx - 28, wallTop + 3, teal[2]);
  blockText(c, cx - 16, wallTop + 3, 'CLINIC', bone[3], ink[1]);
}

function front(s: Shell): void {
  const { c, left, right, footW, ground, wallTop } = s;
  c.rect(left, wallTop, footW, WALL, ash[0]);
  c.rect(left, wallTop, footW, 3, ink[1]);
  c.rect(left, wallTop + 3, footW, 19, bone[0]).rect(left, wallTop + 3, footW, 1, bone[1]);
  c.rect(left, wallTop + 22, footW, 3, teal[0]).rect(left, wallTop + 22, footW, 1, teal[1]);
  c.rect(left, wallTop, 1, WALL, bone[1]).rect(right, wallTop, 1, WALL, concrete[0]);
  c.rect(left, ground - 4, footW, 4, concrete[1]).rect(left, ground - 4, footW, 1, concrete[2]);
  for (const [x, kind] of WINDOWS) windowUnit(c, left + x, wallTop + 6, 15, 12, kind, PALE);
  // Lower panels and a ramp rail running in from the right.
  for (const x of [left + 8, left + 30, left + 52, left + 130, left + 152, left + 174]) c.rect(x, wallTop + 27, 15, 7, ash[1]).rect(x, wallTop + 27, 15, 1, bone[0]);
  c.rect(s.doorR + 18, ground - 10, 58, 1, metal[2]).rect(s.doorR + 18, ground - 6, 58, 1, metal[1]);
  for (let x = s.doorR + 18; x < s.doorR + 76; x += 14) c.rect(x, ground - 10, 1, 8, metal[1]);
  doorway(s, 22, 'glass', PALE, concrete[1]);
  canopy(s);
  caseLamp(c, left + 92, wallTop + 19);
  streak(c, left + 14, wallTop + 25, [4, 2, 6], ash[0]);
  streak(c, left + 158, wallTop + 25, [2, 5, 3, 7], ash[0]);
  grime(c, left, ground - 4, 40, [2, 4, 1, 3], concrete[0]);
  grime(c, right - 24, ground - 4, 24, [3, 1, 2, 4], concrete[0]);
}

export function buildClinic(): PixelSprite {
  const s = startShell('clinic', WALL);
  roof(s);
  front(s);
  return bakeShell(s);
}
