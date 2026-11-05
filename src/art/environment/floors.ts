// Indoor floors and the inside of walls. Floors are darker than anything outdoors so the
// player's light does the work. All wear stays off the outer ring of a tile, so every
// variant seams with every neighbour.

import { DOOR_WIDTH, TILE_SIZE } from '../../../shared/protocol.ts';
import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';

const { ink, wood, ash, concrete, asphalt, brick, skinDeep, metal, olive, bone } = RAMPS;
const S = TILE_SIZE;

export type FloorKind = 'floor_wood' | 'floor_tile' | 'floor_concrete' | 'floor_carpet';

/** A run of pixels: x, y, width, colour. */
type Mark = readonly [number, number, number, Color];

function marked(base: PixelCanvas, marks: readonly Mark[]): PixelCanvas {
  const canvas = base.clone();
  for (const [x, y, w, color] of marks) canvas.rect(x, y, w, 1, color);
  return canvas;
}

function boards(): PixelCanvas {
  const c = new PixelCanvas(S, S).fill(wood[1]);
  for (const y of [3, 7, 11, 15]) c.rect(0, y, S, 1, wood[0]);
  // A second board tone and one butt joint every other plank: long boards, not brickwork.
  c.rect(0, 4, S, 3, brick[0]).rect(0, 12, S, 3, brick[0]);
  for (const [x, y] of [[11, 0], [4, 8]] as const) c.rect(x, y, 1, 3, wood[0]);
  return c;
}

const WOOD: readonly (readonly Mark[])[] = [
  [[2, 1, 3, wood[0]], [8, 5, 4, wood[0]], [7, 9, 3, wood[0]], [12, 13, 2, wood[0]]],
  // Scuffed through the finish where people walked.
  [[4, 5, 7, wood[1]], [3, 6, 9, wood[1]], [5, 9, 6, wood[0]], [2, 13, 3, wood[1]]],
  // A sprung board with the dark showing.
  [[7, 9, 6, ink[1]], [3, 1, 4, wood[0]], [2, 5, 3, wood[0]]],
];

function checks(): PixelCanvas {
  const c = new PixelCanvas(S, S).fill(concrete[0]);
  c.rect(0, 0, 7, 7, ash[0]).rect(8, 8, 7, 7, ash[0]);
  for (const at of [7, 15]) c.rect(at, 0, 1, S, asphalt[2]).rect(0, at, S, 1, asphalt[2]);
  return c;
}

const TILE: readonly (readonly Mark[])[] = [
  [[2, 2, 2, concrete[1]], [10, 11, 2, concrete[1]]],
  // A cracked square and a dull trail of something dried.
  [[9, 2, 2, asphalt[2]], [10, 3, 2, asphalt[2]], [11, 4, 2, asphalt[2]], [12, 5, 2, asphalt[2]]],
  // A chipped corner, down to the screed.
  [[11, 12, 3, asphalt[2]], [12, 13, 2, asphalt[2]], [13, 14, 1, asphalt[2]], [3, 3, 1, concrete[1]]],
];

const SLAB: readonly (readonly Mark[])[] = [
  [[3, 4, 2, concrete[0]], [11, 3, 1, concrete[0]], [6, 11, 3, concrete[0]], [12, 12, 1, asphalt[1]]],
  // An old oil stain.
  [[7, 5, 3, asphalt[1]], [5, 6, 7, asphalt[1]], [5, 7, 8, asphalt[1]], [6, 8, 6, asphalt[1]], [8, 9, 3, asphalt[1]]],
  // A hairline crack.
  [[3, 11, 2, asphalt[1]], [5, 10, 2, asphalt[1]], [7, 9, 1, asphalt[1]], [8, 8, 2, asphalt[1]], [4, 3, 2, concrete[0]]],
];

function pile(): PixelCanvas {
  const c = new PixelCanvas(S, S).fill(brick[0]);
  for (let y = 0; y < S; y++) for (let x = (y % 2) * 2; x < S; x += 4) c.px(x, y, brick[1]);
  return c;
}

const CARPET: readonly (readonly Mark[])[] = [
  [[3, 3, 2, skinDeep[0]], [11, 10, 2, skinDeep[0]]],
  // Trodden flat: the pile's dots rubbed away.
  [[3, 5, 9, brick[0]], [2, 6, 11, brick[0]], [2, 7, 12, brick[0]], [3, 8, 10, brick[0]], [5, 9, 6, brick[0]]],
  // A dark drip that nobody cleaned up.
  [[9, 4, 3, skinDeep[0]], [8, 5, 4, skinDeep[0]], [9, 6, 2, skinDeep[0]], [3, 11, 2, skinDeep[0]]],
];

export function buildFloors(): Record<FloorKind, readonly PixelCanvas[]> {
  const concreteBase = new PixelCanvas(S, S).fill(asphalt[2]);
  return {
    floor_wood: WOOD.map((marks) => marked(boards(), marks)),
    floor_tile: TILE.map((marks) => marked(checks(), marks)),
    floor_concrete: SLAB.map((marks) => marked(concreteBase, marks)),
    floor_carpet: CARPET.map((marks) => marked(pile(), marks)),
  };
}

const FACE_H = 20;

/** The north wall's inner face: plaster, a dado rail, boarding and a skirting in shadow. */
function wallFace(): PixelSprite {
  const c = new PixelCanvas(S, FACE_H).fill(concrete[0]);
  c.rect(0, 0, S, 2, ink[1]);
  c.rect(0, 2, S, 1, asphalt[2]);
  // Water stain and a patch of lifted plaster.
  c.rect(3, 3, 2, 3, asphalt[2]).rect(4, 6, 1, 2, asphalt[2]).rect(10, 6, 3, 2, concrete[1]);
  c.rect(0, 10, S, 1, olive[0]).rect(0, 11, S, 1, asphalt[1]);
  c.rect(0, 12, S, 6, asphalt[2]);
  for (const x of [3, 7, 11, 15]) c.rect(x, 12, 1, 6, asphalt[1]);
  c.rect(0, 18, S, 1, asphalt[1]).rect(0, FACE_H - 1, S, 1, ink[0]);
  return c.toSprite(S, FACE_H, 0, FACE_H);
}

/** Wall tops, seen from above: the cut through the masonry. */
function wallCap(): PixelSprite {
  const c = new PixelCanvas(S, S).fill(asphalt[1]);
  for (const [x, y] of [[3, 3], [11, 2], [6, 7], [13, 9], [2, 11], [9, 13]] as const) c.px(x, y, concrete[0]);
  return c.toSprite(S, S, 0, S);
}

const MAT_H = 10;

/** Coir worn thin down the middle, its fringe gone at one corner. */
function doorMat(): PixelSprite {
  const c = new PixelCanvas(DOOR_WIDTH, MAT_H);
  c.rect(0, 1, DOOR_WIDTH, MAT_H - 2, wood[1]);
  c.rect(1, 2, DOOR_WIDTH - 2, MAT_H - 4, wood[2]);
  c.rect(10, 3, 12, 4, wood[1]).rect(13, 2, 7, 6, wood[1]);
  for (let x = 0; x < DOOR_WIDTH; x += 2) c.px(x, 0, metal[0]).px(x + 1, MAT_H - 1, metal[0]);
  c.rect(24, 8, 8, 2, wood[0]).erase(31, 1).erase(30, 9).erase(31, 9);
  c.px(4, 4, bone[0]).px(26, 5, bone[0]);
  return c.toSprite(DOOR_WIDTH, MAT_H, DOOR_WIDTH / 2, MAT_H);
}

export function buildInterior(): { wallFace: PixelSprite; wallCap: PixelSprite; doorMat: PixelSprite } {
  return { wallFace: wallFace(), wallCap: wallCap(), doorMat: doorMat() };
}
