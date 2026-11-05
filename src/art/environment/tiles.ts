// Ground tiles: flat bases, the overlays in tile-grids.ts and the continuous markings
// (curbs, zebra bars, stall lines) that are the only things allowed to touch a tile edge.
// Everything stays dark and quiet so characters pop.

import { TILE_KINDS, TILE_SIZE } from '../../../shared/protocol.ts';
import type { TileKind } from '../../../shared/protocol.ts';
import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import { buildFloors } from './floors.ts';
import { ASPHALT, CRACKED, DIRT, GRASS, LANE_WEAR, SLABS, ZEBRA_WEAR } from './tile-grids.ts';
import type { Rows, Slab } from './tile-grids.ts';

const { asphalt, concrete, grass, wood, olive, ink, bone, skinDeep } = RAMPS;
const S = TILE_SIZE;

const ROAD: Legend = { '-': asphalt[0], '+': asphalt[2], x: ink[0] };
const WALK: Legend = { '=': asphalt[2], '+': concrete[1] };
const LAWN: Legend = { '-': grass[1], '+': grass[2] };
const EARTH: Legend = { '-': wood[0], '+': skinDeep[0], b: concrete[0], p: skinDeep[0], g: grass[1], G: grass[2] };
const WORN: Legend = { '-': asphalt[1], ':': concrete[0] };

function tile(base: Color, rows: Rows, legend: Legend): PixelCanvas {
  return new PixelCanvas(S, S).fill(base).grid(0, 0, rows, legend);
}

function transpose(canvas: PixelCanvas): PixelCanvas {
  const out = new PixelCanvas(canvas.h, canvas.w);
  for (let y = 0; y < canvas.h; y++) {
    for (let x = 0; x < canvas.w; x++) {
      const color = canvas.get(x, y);
      if (color !== null) out.px(y, x, color);
    }
  }
  return out;
}

/** Bars run along the road, four on and four off, so a crossing of any length seams. */
function zebra(wear: Rows): PixelCanvas {
  const canvas = new PixelCanvas(S, S).fill(asphalt[1]);
  for (const y of [2, 10]) canvas.rect(0, y, S, 4, concrete[1]).rect(0, y, S, 1, concrete[2]);
  return canvas.grid(0, 0, wear, WORN);
}

/** The dash is one 10px stroke per tile, so the road reads as a steady 16px rhythm. */
function laneDash(wear: Rows, base: Rows): PixelCanvas {
  const canvas = tile(asphalt[1], base, ROAD);
  canvas.rect(3, 7, 10, 2, bone[0]).rect(3, 7, 10, 1, bone[1]);
  return canvas.grid(0, 0, wear, { '-': asphalt[1] });
}

/** A stall divider down the middle of the tile, unbroken across tiles. */
function stallLine(base: Rows, gaps: readonly (readonly [number, number])[]): PixelCanvas {
  const canvas = tile(asphalt[1], base, ROAD);
  canvas.rect(7, 0, 2, S, concrete[1]).rect(7, 0, 1, S, concrete[2]);
  for (const [y, h] of gaps) canvas.rect(7, y, 2, h, concrete[0]);
  return canvas;
}

function sidewalk(slab: Slab): PixelCanvas {
  const canvas = new PixelCanvas(S, S).fill(concrete[0]);
  if (slab.top) canvas.rect(0, 0, S, 1, asphalt[2]);
  if (slab.left) canvas.rect(0, 0, 1, S, asphalt[2]);
  return canvas.grid(0, 0, slab.detail, WALK);
}

type CurbSide = 'n' | 's' | 'e' | 'w';

/** Colours from the road outwards. Only a south-facing curb shows its face to the camera. */
const CURB_PROFILE: Record<CurbSide, readonly Color[]> = {
  n: [asphalt[0], concrete[1], concrete[2], concrete[2], concrete[1], asphalt[2]],
  s: [asphalt[0], concrete[0], concrete[1], concrete[3], concrete[2], concrete[2], asphalt[2]],
  e: [asphalt[0], concrete[0], concrete[1], concrete[2], concrete[2], asphalt[2]],
  w: [asphalt[0], concrete[3], concrete[2], concrete[2], concrete[1], asphalt[2]],
};

/** Writes in curb space: u runs along the kerb, v counts in from the road. */
function curbPainter(canvas: PixelCanvas, side: CurbSide) {
  return (u: number, v: number, color: Color): void => {
    if (side === 'n') canvas.px(u, v, color);
    else if (side === 's') canvas.px(u, S - 1 - v, color);
    else if (side === 'w') canvas.px(v, u, color);
    else canvas.px(S - 1 - v, u, color);
  };
}

interface CurbDamage {
  /** Bites out of the stone from the road side, as [u, depth]. */
  readonly chips?: readonly (readonly [number, number])[];
  readonly drain?: boolean;
}

const CURB_DAMAGE: readonly CurbDamage[] = [
  {},
  { chips: [[3, 2], [4, 3], [5, 2], [12, 1]] },
  {},
  { drain: true, chips: [[13, 2]] },
];

function curb(side: CurbSide, slab: Slab, damage: CurbDamage): PixelCanvas {
  const canvas = sidewalk(slab);
  const put = curbPainter(canvas, side);
  const profile = CURB_PROFILE[side];
  const stone = profile.length - 1;
  profile.forEach((color, v) => {
    for (let u = 0; u < S; u++) put(u, v, color);
  });
  // A joint per tile, so the kerb reads as long stones rather than stitching.
  for (let v = 1; v < stone; v++) put(0, v, concrete[0]);
  for (const [u, depth] of damage.chips ?? []) {
    for (let v = 1; v <= depth; v++) put(u, v, v === depth ? concrete[1] : asphalt[1]);
  }
  if (damage.drain) {
    for (let u = 4; u < 12; u++) {
      put(u, 1, ink[0]);
      put(u, 2, u % 2 === 0 ? ink[1] : ink[0]);
    }
  }
  return canvas;
}

export function buildTiles(): Record<TileKind, readonly PixelSprite[]> {
  const bases = [ASPHALT[0], ASPHALT[1], ASPHALT[2]];
  const lanes = LANE_WEAR.map((wear, i) => laneDash(wear, bases[i]));
  const zebras = ZEBRA_WEAR.map(zebra);
  const stalls = [stallLine(ASPHALT[0], []), stallLine(ASPHALT[1], [[3, 2]]), stallLine(ASPHALT[2], [[10, 3], [14, 1]])];
  const curbs = (side: CurbSide) => CURB_DAMAGE.map((damage, i) => curb(side, SLABS[i], damage));

  const canvases: Record<TileKind, readonly PixelCanvas[]> = {
    asphalt: ASPHALT.map((rows) => tile(asphalt[1], rows, ROAD)),
    asphalt_cracked: CRACKED.map((rows) => tile(asphalt[1], rows, ROAD)),
    lane_h: lanes,
    lane_v: lanes.map(transpose),
    crosswalk_h: zebras,
    crosswalk_v: zebras.map(transpose),
    parking_line: stalls,
    sidewalk: SLABS.map(sidewalk),
    curb_n: curbs('n'),
    curb_s: curbs('s'),
    curb_e: curbs('e'),
    curb_w: curbs('w'),
    // On the same base as dirt, so a lawn dissolves into a lot instead of stopping at a tile edge.
    grass: GRASS.map((rows) => tile(olive[0], rows, LAWN)),
    dirt: DIRT.map((rows) => tile(olive[0], rows, EARTH)),
    ...buildFloors(),
  };
  return Object.fromEntries(
    TILE_KINDS.map((kind) => [kind, canvases[kind].map((canvas) => canvas.toSprite(S, S, 0, S))]),
  ) as unknown as Record<TileKind, readonly PixelSprite[]>;
}
