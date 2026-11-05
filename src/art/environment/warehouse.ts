// Two long sheds for the industrial yard. The steel one has a sawtooth roof: glazed north
// lights over ribbed sheeting, corrugated walls on a concrete plinth. The brick one has a
// rust-red pitched roof with a raised monitor down its ridge and a loading dock.

import type { PixelSprite } from '../types.ts';
import type { PixelCanvas } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { brickPatch, grime, rust, streak } from './facade.ts';
import type { Trim } from './facade.ts';
import { turbineVent } from './roof-kit.ts';
import { bakeShell, caseLamp, doorway, startShell } from './shell.ts';
import type { Shell } from './shell.ts';
import { heavyText } from './signage.ts';

const { ink, metal, denim, wood, bone, fire, concrete, asphalt, teal, ash, brick } = RAMPS;

const BAY = 24;
const PLANE = 17;
const GLAZING = 6;
const PANE = 8;
const BAYS = 5;
const STEEL_WALL = 40;
const STEEL: Trim = [metal[0], metal[1], metal[2]];

/** Panes lost, per bay. */
const BROKEN: readonly (readonly number[])[] = [[3, 4, 12, 18, 25], [7, 15, 16], [1, 9, 10, 20], [22, 23, 5], [13, 27, 28]];

/** Lap joints per bay, as [x, row in the plane, width]. */
const LAPS: readonly (readonly (readonly [number, number, number])[])[] = [
  [[8, 7, 32], [76, 10, 24], [132, 6, 40], [196, 9, 28]],
  [[4, 11, 24], [52, 5, 40], [128, 12, 32], [180, 7, 24]],
  [[60, 9, 32], [116, 5, 24], [148, 12, 24], [206, 5, 24]],
  [[20, 6, 40], [92, 12, 32], [172, 10, 40]],
  [[36, 10, 24], [100, 7, 32], [160, 5, 24], [212, 12, 16]],
];

function sawtooth(s: Shell, y: number, bay: number): void {
  const { c, left, right, footW } = s;
  c.rect(left, y, footW, PLANE, metal[0]);
  // Standing seams every 8px, with a quieter rib between them.
  for (let x = left + 3; x < right; x += 8) c.rect(x, y, 1, PLANE, metal[1]).rect(x + 4, y, 1, PLANE, ash[0]);
  // Sheet laps, a few short runs staggered bay by bay.
  for (const [x, dy, w] of LAPS[bay]) c.rect(left + x, y + dy, w, 1, ash[0]);
  // Ridge cap, then the glazing band under it.
  c.rect(left, y + PLANE, footW, 1, metal[2]);
  const glassY = y + PLANE + 1;
  c.rect(left, glassY, footW, GLAZING, metal[1]);
  for (let i = 0; i * PANE < footW - PANE; i++) {
    const x = left + 2 + i * PANE;
    const broken = BROKEN[bay].includes(i);
    const glint = (i + bay) % 3 === 0;
    c.rect(x, glassY + 1, PANE - 1, GLAZING - 2, broken ? ink[0] : denim[0]);
    if (broken) c.px(x, glassY + 1, metal[2]).px(x + 1, glassY + 2, metal[2]).px(x + PANE - 2, glassY + GLAZING - 2, metal[2]);
    else if (glint) c.rect(x + 2, glassY + 1, 2, GLAZING - 2, denim[1]);
  }
  // Gutter, the darkest line on the roof.
  c.rect(left, glassY + GLAZING - 1, footW, 1, ink[1]);
}

function sawtoothRoof(s: Shell): void {
  const { c, left, right, footW, wallTop } = s;
  const top = wallTop - BAYS * BAY;
  for (let bay = 0; bay < BAYS; bay++) sawtooth(s, top + bay * BAY, bay);
  rust(c, left + 19, top, [3, 9, 4, 11, 2, 7, 3, 14, 5]);
  rust(c, left + 111, top + BAY, [2, 12, 5, 3, 14, 8, 2, 10, 4, 6]);
  rust(c, left + 57, top + BAY * 2, [4, 12, 3, 7]);
  rust(c, left + 196, top, [5, 13, 4, 8, 2]);
  rust(c, left + 150, top + BAY * 3, [3, 13, 6, 2, 10, 4]);
  rust(c, left + 30, top + BAY * 4, [6, 2, 12, 5]);
  // Newer sheets let into the old roof, a touch paler and unweathered.
  c.rect(left + 60, top + 2, 16, 9, ash[0]).rect(left + 60, top + 2, 16, 1, metal[1]).rect(left + 60, top + 2, 1, 9, metal[1]);
  for (const x of [64, 68, 72]) c.rect(left + x, top + 3, 1, 8, metal[0]);
  c.rect(left + 20, top + BAY * 2 + 3, 24, 7, ash[0]).rect(left + 20, top + BAY * 2 + 3, 24, 1, metal[1]);
  // A sheet lifted by the wind, showing the void under it.
  c.rect(left + 164, top + BAY + 7, 12, 7, ink[0]).rect(left + 164, top + BAY + 7, 12, 1, metal[2]).rect(left + 163, top + BAY + 8, 1, 6, metal[2]);
  for (const [x, bay] of [[42, 1], [74, 3], [128, 0], [136, 2], [204, 3], [94, 4]] as const) turbineVent(c, left + x, top + bay * BAY + 2, ink[1]);
  // Side flashings.
  c.rect(left, top, 2, wallTop - top, metal[1]).rect(left, top, 1, wallTop - top, metal[2]);
  c.rect(right - 1, top, 2, wallTop - top, metal[1]).rect(right, top, 1, wallTop - top, metal[0]);
  c.rect(left, top, footW, 1, metal[2]);
  c.rect(left, wallTop - 2, footW, 1, metal[2]).rect(left, wallTop - 1, footW, 1, metal[1]);
}

function steelWall(s: Shell): void {
  const { c, left, right, footW, ground, wallTop } = s;
  const plinth = ground - 9;
  c.rect(left, wallTop, footW, plinth - wallTop, teal[0]);
  for (let x = left + 2; x < right; x += 4) c.rect(x, wallTop, 1, plinth - wallTop, metal[0]);
  c.rect(left, wallTop, footW, 2, ink[1]);
  c.rect(left, wallTop, 1, plinth - wallTop, metal[1]);
  // Concrete plinth with its form lines.
  c.rect(left, plinth, footW, ground - plinth, concrete[1]);
  c.rect(left, plinth, footW, 1, concrete[2]).rect(left, ground - 4, footW, 1, concrete[0]);
  for (const x of [17, 73, 133, 169]) c.rect(left + x, plinth + 1, 1, 8, concrete[0]);
}

const STENCIL: Legend = { b: bone[0], B: bone[1] };

// Freight stencils: invented marks, not lettering.
const CHEVRONS = [
  'B..B..B...BBBBBB.BB.BB',
  '.B..B..B..B....B.BB.BB',
  '..B..B..B.B.BB.B.BB.BB',
  '.B..B..B..B....B.BB.BB',
  'B..B..B...BBBBBB.BB.BB',
];

function rollerDoor(s: Shell, x: number, w: number, open: number): void {
  const { c, ground } = s;
  const top = ground - 28;
  // Steel jamb and a head box.
  c.rect(x - 2, top - 3, w + 4, ground - top + 3, metal[1]);
  c.rect(x - 2, top - 3, w + 4, 1, metal[2]).rect(x - 2, top - 3, 1, ground - top + 3, metal[2]);
  c.rect(x + w + 1, top - 2, 1, ground - top + 2, metal[0]);
  c.rect(x, top, w, ground - top, metal[1]);
  for (let y = top + 1; y < ground; y += 3) c.rect(x, y, w, 1, metal[0]);
  c.rect(x, top, w, 1, ink[1]);
  const raised = open > 0;
  if (raised) {
    c.rect(x, ground - open, w, open, ink[0]);
    c.rect(x, ground - open - 1, w, 1, metal[2]);
    c.rect(x, ground - open, w, 1, ink[1]);
  }
}

function crateInside(c: PixelCanvas, x: number, y: number): void {
  c.rect(x, y, 13, 9, wood[1]).rect(x, y, 13, 1, wood[2]).rect(x, y, 1, 9, wood[2]);
  c.line(x + 1, y + 8, x + 11, y + 1, wood[0]);
}

function bollard(s: Shell, x: number): void {
  const { c, ground } = s;
  const top = ground - 10;
  c.rect(x, top, 3, 10, metal[0]);
  for (let y = 0; y < 10; y += 4) c.rect(x, top + y, 3, 2, fire[1]).rect(x, top + y, 1, 2, fire[2]);
  c.rect(x, top, 3, 1, metal[2]);
}

function steelDetails(s: Shell): void {
  const { c, left, ground, wallTop, doorL, doorR } = s;
  rollerDoor(s, left + 22, 46, 13);
  crateInside(c, left + 30, ground - 10);
  crateInside(c, left + 45, ground - 9);
  rollerDoor(s, left + 86, 46, 0);
  // A dent and the rust around it, where something drove into the shutter.
  c.rect(left + 104, ground - 15, 12, 8, metal[0]);
  for (const y of [ground - 14, ground - 11, ground - 8]) c.rect(left + 104, y, 12, 1, ink[1]);
  c.rect(left + 104, ground - 15, 12, 1, metal[2]);
  rust(c, left + 100, ground - 12, [5, 7, 12, 9]);
  rust(c, left + 118, ground - 9, [6, 9, 4]);
  for (const x of [15, 72, 79, 136, 170, 214]) bollard(s, left + x);

  // Stencils above each door line.
  c.grid(left + 34, wallTop + 3, CHEVRONS, STENCIL);
  c.grid(left + 98, wallTop + 3, CHEVRONS, STENCIL);
  doorway(s, 28, 'shutter', STEEL, concrete[1]);
  caseLamp(c, doorL + 12, wallTop + 3);

  // Downpipes.
  for (const pipe of [left + 10, left + 142, doorR + 12]) {
    c.rect(pipe, wallTop, 2, ground - wallTop - 2, metal[1]).rect(pipe + 1, wallTop, 1, ground - wallTop - 2, metal[0]);
    c.rect(pipe - 1, wallTop + 16, 4, 1, metal[2]);
  }
  rust(c, left + 2, ground - 18, [3, 7, 4]);
  rust(c, left + 156, ground - 22, [4, 8, 11, 7, 3]);
  streak(c, left + 75, wallTop + 3, [14, 9, 18], asphalt[1]);
}

export function buildSteelWarehouse(): PixelSprite {
  const s = startShell('warehouse', STEEL_WALL);
  sawtoothRoof(s);
  steelWall(s);
  steelDetails(s);
  grime(s.c, s.left, s.ground, 18, [2, 4, 3], concrete[0]);
  grime(s.c, s.left + 150, s.ground, 11, [3, 2, 5], concrete[0]);
  return bakeShell(s);
}

const BRICK_WALL = 44;
const ROOF_TOP = 6;
const RIDGE = 56;
const MONITOR_H = 18;

function pitchPlane(s: Shell, y: number, h: number, base: number, rib: number): void {
  const { c, left, footW } = s;
  c.rect(left, y, footW, h, base);
  for (let x = left + 5; x < left + footW; x += 10) c.rect(x, y, 1, h, rib);
}

function monitor(s: Shell): void {
  const { c, left, footW } = s;
  const x = left + 26;
  const w = footW - 52;
  const y = RIDGE - MONITOR_H;
  c.rect(x + 3, y + MONITOR_H + 8, w, 3, ink[1]).rect(x + w, y + 4, 3, MONITOR_H + 6, ink[1]);
  c.rect(x, y, w, MONITOR_H, brick[0]).rect(x, y, w, 1, brick[2]).rect(x, y, 1, MONITOR_H, brick[2]);
  for (let i = x + 4; i < x + w; i += 10) c.rect(i, y, 1, MONITOR_H, brick[1]);
  // Louvred glazing down the monitor's front.
  c.rect(x, y + MONITOR_H, w, 8, metal[0]).rect(x, y + MONITOR_H, w, 1, metal[2]);
  for (let i = 0; i * 12 < w - 12; i++) {
    const px = x + 2 + i * 12;
    const lost = i === 4 || i === 5 || i === 12;
    const lit = i % 3 === 1;
    c.rect(px, y + MONITOR_H + 2, 10, 5, lost ? ink[0] : denim[0]);
    if (lit) c.rect(px + 3, y + MONITOR_H + 2, 2, 5, denim[1]);
  }
}

function pitchedRoof(s: Shell): void {
  const { c, left, right, footW, wallTop } = s;
  pitchPlane(s, ROOF_TOP, RIDGE - ROOF_TOP, brick[1], brick[0]);
  pitchPlane(s, RIDGE, wallTop - RIDGE, brick[0], ink[1]);
  for (const [x, y, w] of [[10, 76, 40], [80, 92, 36], [150, 84, 44], [40, 108, 32], [186, 104, 30], [120, 16, 50], [30, 24, 36]] as const) {
    c.rect(left + x, y, w, 1, ink[1]);
  }
  rust(c, left + 54, RIDGE + 10, [4, 12, 7, 2, 16, 9]);
  rust(c, left + 170, RIDGE + 12, [2, 9, 14, 5]);
  rust(c, left + 96, 104, [5, 11, 3]);
  // A missing sheet and the purlins under it.
  c.rect(left + 120, 86, 22, 12, ink[0]);
  for (const y of [89, 94]) c.rect(left + 120, y, 22, 1, wood[1]);
  c.rect(left + 120, 85, 22, 1, brick[2]);
  monitor(s);
  for (const x of [40, 110, 180]) turbineVent(c, left + x, RIDGE - MONITOR_H - 8, ink[1]);
  c.rect(left, ROOF_TOP, footW, 1, brick[2]).rect(left, ROOF_TOP, 1, wallTop - ROOF_TOP, brick[2]);
  c.rect(right, ROOF_TOP, 1, wallTop - ROOF_TOP, ink[1]);
  c.rect(left, wallTop - 2, footW, 1, metal[1]).rect(left, wallTop - 1, footW, 1, metal[0]);
}

function dock(s: Shell): void {
  const { c, left, ground } = s;
  // The raised dock and its rubber bumpers.
  c.rect(left + 12, ground - 12, 120, 12, concrete[1]);
  c.rect(left + 12, ground - 12, 120, 2, concrete[3]).rect(left + 12, ground - 10, 120, 1, concrete[0]);
  for (const x of [left + 26, left + 70, left + 114]) c.rect(x, ground - 9, 6, 7, ink[1]).rect(x, ground - 9, 6, 1, asphalt[2]);
  for (const x of [left + 14, left + 58]) {
    c.rect(x, ground - 40, 38, 28, metal[1]).rect(x, ground - 40, 38, 1, metal[2]);
    for (let y = ground - 38; y < ground - 12; y += 3) c.rect(x, y, 38, 1, metal[0]);
    c.rect(x + 1, ground - 39, 1, 27, metal[2]);
  }
  c.rect(left + 58, ground - 22, 38, 10, ink[0]).rect(left + 58, ground - 23, 38, 1, metal[3]);
  crateInside(c, left + 66, ground - 21);
}

function brickWall(s: Shell): void {
  const { c, left, right, footW, ground, wallTop, doorL } = s;
  c.rect(left, wallTop, footW, BRICK_WALL, brick[1]);
  c.rect(left, wallTop, footW, 2, ink[1]);
  for (const [x, y, p] of [[8, 4, 2], [100, 2, 0], [136, 22, 1], [150, 10, 2], [212, 14, 1], [214, 28, 2]] as const) {
    brickPatch(c, left + x, wallTop + y, p);
  }
  c.rect(left, wallTop, 1, BRICK_WALL, brick[2]).rect(right, wallTop, 1, BRICK_WALL, brick[0]);
  c.rect(left, ground - 3, footW, 3, concrete[0]).rect(left, ground - 3, footW, 1, concrete[1]);
  heavyText(c, left + 100, wallTop + 3, 'STORAGE', bone[0]);
  dock(s);
  doorway(s, 28, 'shutter', STEEL, concrete[1]);
  caseLamp(c, doorL + 12, wallTop + 7);
  streak(c, left + 104, wallTop + 11, [2, 8, 3, 5], brick[0]);
  rust(c, left + 140, wallTop + 2, [3, 8, 5]);
  grime(c, left + 134, ground - 3, 30, [2, 4, 1, 3], brick[0]);
  grime(c, right - 20, ground - 3, 20, [3, 1, 2, 4], brick[0]);
}

export function buildBrickWarehouse(): PixelSprite {
  const s = startShell('warehouse', BRICK_WALL);
  pitchedRoof(s);
  brickWall(s);
  return bakeShell(s);
}
