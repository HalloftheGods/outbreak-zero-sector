import { TILE_SIZE } from './protocol.ts';
import type { PropKind } from './protocol.ts';
import type { MapBuilder } from './map-builder.ts';
import { pick, randRange } from './rng.ts';
import type { Box } from './world-query.ts';

const STALL_DEPTH_TILES = 3;
const BAY_PITCH_TILES = 7;
const FENCE_LENGTH = 32;
/** The fence sits in the outermost tiles, so nothing walkable is left outside it. */
const FENCE_SPAN_FROM_EDGE = 10;
const FENCE_DEPTH = 6;

const inset = (area: Box, by: number): Box => ({
  x0: area.x0 + by,
  y0: area.y0 + by,
  x1: area.x1 - by,
  y1: area.y1 - by,
});

/** Painted bays with every other space at most occupied. */
export function fillParking(b: MapBuilder, lot: Box): void {
  b.fill(lot, 'asphalt');
  const col0 = lot.x0 / TILE_SIZE;
  const row0 = lot.y0 / TILE_SIZE;
  const cols = (lot.x1 - lot.x0) / TILE_SIZE;
  const rows = (lot.y1 - lot.y0) / TILE_SIZE;

  for (let i = 0; i < 40; i++) {
    b.setTile(col0 + Math.floor(b.rng() * cols), row0 + Math.floor(b.rng() * rows), 'asphalt_cracked');
  }
  for (let bayRow = 2; bayRow + STALL_DEPTH_TILES < rows; bayRow += BAY_PITCH_TILES) {
    for (let row = bayRow; row < bayRow + STALL_DEPTH_TILES; row++) {
      for (let col = 1; col < cols - 1; col += 2) b.setTile(col0 + col, row0 + row, 'parking_line');
    }
    const bottom = (row0 + bayRow + STALL_DEPTH_TILES) * TILE_SIZE - 4;
    for (let col = 2; col < cols - 2; col += 2) {
      if (b.rng() < 0.55) b.place('car_sedan_v', (col0 + col + 0.5) * TILE_SIZE, bottom, 16);
    }
  }
  b.scatter('van_h', lot, 1, 24);
  b.scatter('car_wreck_h', lot, 1, 24);
  b.scatter('street_lamp', lot, 2, 24);
  b.scatter('rubble', lot, 3);
}

/** A neglected park with dirt cross paths and the safe open square at its middle. */
export function fillPark(b: MapBuilder, lot: Box): void {
  b.fill(lot, 'grass');
  const { x, y } = b.spawn;
  const pathX = Math.floor(x / TILE_SIZE) * TILE_SIZE;
  const pathY = Math.floor(y / TILE_SIZE) * TILE_SIZE;
  b.fill({ x0: pathX, y0: lot.y0, x1: pathX + TILE_SIZE, y1: lot.y1 }, 'dirt');
  b.fill({ x0: lot.x0, y0: pathY, x1: lot.x1, y1: pathY + TILE_SIZE }, 'dirt');
  for (let pass = 0; pass < 2; pass++) {
    b.blob(x, y, 130, 'sidewalk', 'grass');
    b.blob(x, y, 130, 'sidewalk', 'dirt');
  }
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      b.place('sandbags', x + sx * 118, y + sy * 124, 12);
      b.place('fire_barrel', x + sx * 136, y + sy * 86, 12);
      b.place('bush', x + sx * 150, y + sy * 150);
    }
  }
  for (const [lx, ly] of [[0, -140], [0, 140], [-140, 0], [140, 0]]) b.place('street_lamp', x + lx, y + ly);
  b.scatter('tree', lot, 34);
  b.scatter('bush', lot, 26);
  b.scatter('street_lamp', inset(lot, 48), 3, 24);
  b.scatter('rubble', lot, 4);
}

/** An abandoned checkpoint: sandbag lines, burn barrels, whatever they could not carry. */
export function fillCamp(b: MapBuilder, lot: Box): void {
  b.fill(lot, 'dirt');
  b.blob(lot.x0 + 80, lot.y0 + 90, 60, 'grass', 'dirt');
  b.blob(lot.x1 - 90, lot.y1 - 70, 70, 'grass', 'dirt');
  b.scatter('sandbags', lot, 6);
  b.scatter('barrier', lot, 4);
  b.scatter('car_wreck_h', lot, 2);
  b.scatter('fire_barrel', lot, 3);
  b.scatter('crate_stack', lot, 4);
  b.scatter('rubble', lot, 6);
  b.scatter('bush', lot, 4);
}

/** The strip inside the fence that no block reaches. */
export function fillVerge(b: MapBuilder, strip: Box): void {
  const area = (strip.x1 - strip.x0) * (strip.y1 - strip.y0);
  const count = Math.max(1, Math.round(area / 9000));
  const kinds: readonly PropKind[] = ['tree', 'tree', 'bush', 'bush', 'rubble'];
  for (let i = 0; i < count; i++) {
    b.scatter(pick(b.rng, kinds), strip, 1, 32, 'grass');
    b.blob(randRange(b.rng, strip.x0, strip.x1), randRange(b.rng, strip.y0, strip.y1), 30, 'dirt', 'grass');
  }
}

/** A closed fence around the whole map. */
export function raiseFence(b: MapBuilder): void {
  const width = b.cols * TILE_SIZE;
  const height = b.rows * TILE_SIZE;
  for (let x = FENCE_LENGTH / 2; x < width; x += FENCE_LENGTH) {
    b.fixture('fence_h', x, FENCE_SPAN_FROM_EDGE + FENCE_DEPTH);
    b.fixture('fence_h', x, height - FENCE_SPAN_FROM_EDGE);
  }
  for (let y = FENCE_LENGTH; y <= height; y += FENCE_LENGTH) {
    b.fixture('fence_v', FENCE_SPAN_FROM_EDGE + FENCE_DEPTH / 2, y);
    b.fixture('fence_v', width - FENCE_SPAN_FROM_EDGE - FENCE_DEPTH / 2, y);
  }
}
