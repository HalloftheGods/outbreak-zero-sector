// The diner: a stainless lozenge. Rounded rear corners, a ribbed barrel roof, chrome
// flutes round round-cornered windows, and a neon pylon that is half dead.

import type { PixelSprite } from '../types.ts';
import { RAMPS } from '../palette.ts';
import { grime, glass, streak } from './facade.ts';
import type { Trim } from './facade.ts';
import { roofVent, turbineVent } from './roof-kit.ts';
import { bakeShell, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { blockText, smallText } from './signage.ts';

const { ink, metal, concrete, asphalt, bone, blood, fire, teal, wood, violet } = RAMPS;

const WALL = 30;
const ROOF_TOP = 3;
const CORNER = 16;
const CHROME: Trim = [metal[0], metal[2], metal[3]];

/** Barrel shading from the upper-left light: bands by row, brightest a third of the way down. */
const BARREL_BANDS: readonly (readonly [number, number])[] = [
  [0, metal[0]], [8, metal[1]], [22, metal[2]], [30, metal[1]], [56, metal[0]], [78, RAMPS.ash[0]],
];

function roof(s: Shell): void {
  const { c, left, right, footW, wallTop } = s;
  BARREL_BANDS.forEach(([from, color], i) => {
    const to = BARREL_BANDS[i + 1]?.[0] ?? wallTop;
    c.rect(left, ROOF_TOP + from, footW, Math.min(to, wallTop - ROOF_TOP) - from, color);
  });
  // Standing ribs round the barrel, a lit one every 16px.
  for (let x = left + 7; x < right; x += 16) {
    c.rect(x, ROOF_TOP, 1, wallTop - ROOF_TOP, metal[0]).rect(x + 1, ROOF_TOP, 1, wallTop - ROOF_TOP, metal[2]);
  }
  // Rounded rear corners: this is the silhouette people will remember.
  let edge = CORNER;
  for (let y = 0; y < CORNER; y++) {
    const inset = CORNER - Math.round(Math.sqrt(CORNER * CORNER - (CORNER - y) * (CORNER - y)));
    for (let i = 0; i < inset; i++) c.erase(left + i, ROOF_TOP + y).erase(right - i, ROOF_TOP + y);
    // One unbroken lit line round the left corner, a duller one round the right.
    c.rect(left + inset, ROOF_TOP + y, Math.max(1, edge - inset), 1, metal[3]);
    c.rect(right - Math.max(inset, edge - 1), ROOF_TOP + y, Math.max(1, edge - inset), 1, metal[1]);
    edge = inset;
  }
  c.rect(left + CORNER, ROOF_TOP, footW - CORNER * 2, 1, metal[3]);
  // Kitchen extract: a galvanised hood with its fan, and the grease it has run down the steel.
  for (const [x, len] of [[114, 7], [117, 12], [121, 5], [125, 9], [129, 4]] as const) c.rect(left + x, 50, 1, len, asphalt[2]);
  c.rect(left + 112, 49, 26, 3, ink[1]).rect(left + 138, 30, 3, 21, ink[1]);
  c.rect(left + 110, 28, 28, 14, metal[2]).rect(left + 110, 28, 28, 1, metal[3]).rect(left + 110, 28, 1, 14, metal[3]);
  c.rect(left + 110, 42, 28, 7, metal[1]).rect(left + 110, 42, 28, 1, metal[3]);
  for (const y of [44, 46]) c.rect(left + 113, y, 22, 1, ink[1]);
  turbineVent(c, left + 118, 22, ink[1]);
  roofVent(c, left + 24, 26, ink[1]);
  roofVent(c, left + 78, 28, ink[1]);
  // Dented panel.
  c.rect(left + 38, 52, 14, 8, RAMPS.ash[0]).rect(left + 38, 52, 14, 1, metal[2]);
}

function pylon(s: Shell): void {
  const { c, left, wallTop } = s;
  const x = left + 14;
  const y = wallTop - 42;
  // Legs, then the board facing the road.
  c.rect(x + 8, y + 19, 2, 23, metal[0]).rect(x + 48, y + 19, 2, 23, metal[0]);
  c.rect(x + 4, wallTop - 3, 54, 3, ink[1]);
  c.rect(x, y, 58, 20, blood[0]);
  c.rect(x, y, 58, 1, metal[3]).rect(x, y, 1, 20, metal[3]).rect(x, y + 19, 58, 1, ink[0]).rect(x + 57, y, 1, 20, metal[0]);
  c.rect(x + 2, y + 2, 54, 16, ink[1]);
  blockText(c, x + 8, y + 7, 'DINER', blood[3], blood[1]);
  // The R has lost its tube.
  c.rect(x + 32, y + 7, 5, 7, ink[1]);
  blockText(c, x + 32, y + 7, 'R', blood[1]);
  // A cup with the steam still lit.
  c.rect(x + 42, y + 8, 7, 6, teal[2]).rect(x + 49, y + 9, 2, 3, teal[1]).rect(x + 43, y + 9, 5, 1, bone[3]);
  c.px(x + 44, y + 6, teal[2]).px(x + 45, y + 5, teal[2]).px(x + 47, y + 6, teal[1]).px(x + 46, y + 4, teal[1]);
}

function porthole(s: Shell, x: number, y: number, w: number, h: number, lit: boolean): void {
  const { c } = s;
  c.rect(x - 1, y - 1, w + 2, h + 2, metal[3]);
  glass(c, x, y, w, h);
  if (lit) {
    c.rect(x, y, w, h, fire[1]).rect(x + 1, y + 6, w - 2, h - 7, fire[2]);
    c.rect(x + 2, y + h - 4, w - 4, 1, wood[1]);
  }
  c.px(x - 1, y - 1, metal[1]).px(x + w, y - 1, metal[1]).px(x - 1, y + h, metal[1]).px(x + w, y + h, metal[1]);
  c.px(x, y, metal[3]).px(x + w - 1, y, metal[3]).px(x, y + h - 1, metal[3]).px(x + w - 1, y + h - 1, metal[3]);
}

function front(s: Shell): void {
  const { c, left, right, footW, ground, wallTop } = s;
  c.rect(left, wallTop, footW, WALL, metal[1]);
  // Fluted stainless, then the red band every chrome diner wears.
  for (let y = wallTop + 2; y < ground - 4; y += 2) c.rect(left, y, footW, 1, metal[0]);
  c.rect(left, wallTop, footW, 3, metal[3]).rect(left, wallTop + 2, footW, 1, metal[2]).rect(left, wallTop + 3, footW, 1, ink[1]);
  c.rect(left, wallTop + 19, footW, 4, blood[1]).rect(left, wallTop + 19, footW, 1, blood[3]).rect(left, wallTop + 22, footW, 1, blood[0]);
  c.rect(left, wallTop, 2, WALL, metal[3]).rect(right - 1, wallTop, 2, WALL, metal[0]);
  c.rect(left, ground - 4, footW, 4, bone[0]).rect(left, ground - 4, footW, 1, bone[2]);
  for (let x = left; x < right; x += 6) c.rect(x, ground - 3, 3, 3, concrete[0]);
  const y = wallTop + 6;
  [6, 28, 50, 72].forEach((x, i) => porthole(s, left + x, y, 17, 11, i === 2));
  porthole(s, left + 136, y, 17, 11, false);
  c.rect(left + 54, y + 1, 9, 2, wood[2]);
  doorway(s, 24, 'glass', CHROME, concrete[1]);
  // A cracked pane and neon word over the door.
  c.line(left + 12, y + 1, left + 18, y + 9, metal[2]).line(left + 18, y + 9, left + 14, y + 10, metal[2]);
  smallText(c, left + 137, y + 3, 'OPEN', violet[2]);
  streak(c, left + 32, wallTop + 23, [3, 1, 2], metal[0]);
  grime(c, left, ground - 4, 30, [2, 3, 1, 2], asphalt[2]);
  grime(c, right - 20, ground - 4, 20, [3, 1, 2, 3], asphalt[2]);
}

export function buildDiner(): PixelSprite {
  const s = startShell('diner', WALL);
  roof(s);
  front(s);
  pylon(s);
  return bakeShell(s);
}
