import { TILE_SIZE } from './protocol.ts';
import type { PropKind, TileKind } from './protocol.ts';
import type { MapBuilder } from './map-builder.ts';
import { pick, randInt, randRange } from './rng.ts';
import { rectBox, WALK_TILES } from './town-plan.ts';
import type { Road } from './town-plan.ts';
import type { Box } from './world-query.ts';

const ACROSS = 1;
const DOWN = 2;
const JUNCTION = ACROSS | DOWN;
const LAMP_SPACING_TILES = 15;
const WRECK_SPACING_TILES = 22;
const END_MARGIN_TILES = 6;

const around = (point: { x: number; y: number }, size: number): Box => ({
  x0: point.x - size,
  y0: point.y - size,
  x1: point.x + size,
  y1: point.y + size,
});

/** Per tile, which way a road runs through it. */
function roadMask(b: MapBuilder, roads: readonly Road[]): Uint8Array {
  const mask = new Uint8Array(b.cols * b.rows);
  for (const road of roads) {
    for (let row = road.r0; row < road.r1; row++) {
      for (let col = road.c0; col < road.c1; col++) mask[row * b.cols + col] |= road.horizontal ? ACROSS : DOWN;
    }
  }
  return mask;
}

/** True within a sidewalk's width of a road running the other way, where the crossing is painted. */
function nearCrossing(b: MapBuilder, mask: Uint8Array, col: number, row: number, horizontal: boolean): boolean {
  const other = horizontal ? DOWN : ACROSS;
  for (let step = 1; step <= WALK_TILES; step++) {
    const before = horizontal ? row * b.cols + col - step : (row - step) * b.cols + col;
    const after = horizontal ? row * b.cols + col + step : (row + step) * b.cols + col;
    const crosses = (mask[before] & other) !== 0 || (mask[after] & other) !== 0;
    if (crosses) return true;
  }
  return false;
}

function paintRoad(b: MapBuilder, road: Road, mask: Uint8Array): void {
  const width = road.horizontal ? road.r1 - road.r0 : road.c1 - road.c0;
  const hasLane = width >= 5;
  const laneOffset = (width - 1) / 2;
  for (let row = road.r0; row < road.r1; row++) {
    for (let col = road.c0; col < road.c1; col++) {
      const junction = mask[row * b.cols + col] === JUNCTION;
      const across = road.horizontal ? row - road.r0 : col - road.c0;
      const crossing = !junction && nearCrossing(b, mask, col, row, road.horizontal);
      const onLane = !junction && hasLane && across === laneOffset;
      let kind: TileKind = b.rng() < 0.14 ? 'asphalt_cracked' : 'asphalt';
      if (crossing) kind = road.horizontal ? 'crosswalk_h' : 'crosswalk_v';
      else if (onLane) kind = road.horizontal ? 'lane_h' : 'lane_v';
      b.setTile(col, row, kind);
    }
  }
}

/** Curbs face the road across their named edge; inner corners stay plain paving. */
function paintCurbs(b: MapBuilder, mask: Uint8Array): void {
  const isRoad = (col: number, row: number): boolean => {
    const onMap = col >= 0 && row >= 0 && col < b.cols && row < b.rows;
    return onMap && mask[row * b.cols + col] !== 0;
  };
  for (let row = 0; row < b.rows; row++) {
    for (let col = 0; col < b.cols; col++) {
      if (isRoad(col, row)) continue;
      const north = isRoad(col, row - 1);
      const south = isRoad(col, row + 1);
      const west = isRoad(col - 1, row);
      const east = isRoad(col + 1, row);
      const sides = Number(north) + Number(south) + Number(west) + Number(east);
      if (sides !== 1) continue;
      if (north) b.setTile(col, row, 'curb_n');
      else if (south) b.setTile(col, row, 'curb_s');
      else if (east) b.setTile(col, row, 'curb_e');
      else b.setTile(col, row, 'curb_w');
    }
  }
}

/** Sidewalks first so a road laid after them cuts through cleanly. */
export function paintStreets(b: MapBuilder, roads: readonly Road[]): Uint8Array {
  const mask = roadMask(b, roads);
  for (const road of roads) {
    const walked = { c0: road.c0 - WALK_TILES, r0: road.r0 - WALK_TILES, c1: road.c1 + WALK_TILES, r1: road.r1 + WALK_TILES };
    b.fill(rectBox(walked), 'sidewalk');
  }
  for (const road of roads) paintRoad(b, road, mask);
  paintCurbs(b, mask);
  return mask;
}

function placeOnWalk(b: MapBuilder, mask: Uint8Array, kind: PropKind, x: number, y: number): void {
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor((y - 1) / TILE_SIZE);
  const offRoad = col >= 0 && row >= 0 && col < b.cols && row < b.rows && mask[row * b.cols + col] === 0;
  if (offRoad) b.place(kind, x, y, 24);
}

/** Lamps, hydrants, wrecks and roadblocks along one road, leaving at least a lane open. */
function dressRoad(b: MapBuilder, road: Road, mask: Uint8Array): void {
  const { rng } = b;
  const start = road.horizontal ? road.c0 : road.r0;
  const end = road.horizontal ? road.c1 : road.r1;
  const width = road.horizontal ? road.r1 - road.r0 : road.c1 - road.c0;
  const nearSide = ((road.horizontal ? road.r0 : road.c0) - 1) * TILE_SIZE + 12;
  const farSide = (road.horizontal ? road.r1 : road.c1) * TILE_SIZE + 12;
  const middle = ((road.horizontal ? road.r0 + road.r1 : road.c0 + road.c1) / 2) * TILE_SIZE;
  const alongRoad = (along: number, across: number): { x: number; y: number } =>
    road.horizontal ? { x: along, y: across } : { x: across, y: along };

  let side = rng() < 0.5;
  for (let tile = start + randInt(rng, 2, 8); tile < end; tile += LAMP_SPACING_TILES) {
    const lamp = alongRoad(tile * TILE_SIZE + 8, side ? nearSide : farSide);
    placeOnWalk(b, mask, 'street_lamp', lamp.x, lamp.y);
    side = !side;
    if (rng() < 0.3) {
      const hydrant = alongRoad((tile + 4) * TILE_SIZE, side ? nearSide : farSide);
      placeOnWalk(b, mask, 'hydrant', hydrant.x, hydrant.y);
    }
  }

  for (let tile = start + END_MARGIN_TILES; tile < end - END_MARGIN_TILES; tile += WRECK_SPACING_TILES) {
    const along = (tile + randInt(rng, 0, 10)) * TILE_SIZE;
    if (width < 5) {
      const spot = alongRoad(along, middle);
      if (rng() < 0.4) b.scatter('dumpster', around(spot, 30), 1, 24);
      continue;
    }
    const lane = middle + (rng() < 0.5 ? -1 : 1) * randRange(rng, 12, 24);
    const spot = alongRoad(along, lane);
    const wreck = road.horizontal ? pick<PropKind>(rng, ['car_wreck_h', 'car_wreck_h', 'car_sedan_h', 'van_h']) : 'car_sedan_v';
    if (rng() < 0.7) b.place(wreck, spot.x, spot.y);
    if (rng() < 0.2) {
      const block = alongRoad(along + 96, middle);
      b.place(pick<PropKind>(rng, ['barrier', 'sandbags']), block.x, block.y);
    }
    const rubble = alongRoad(along + randRange(rng, -60, 60), middle + randRange(rng, -30, 30));
    b.place('rubble', rubble.x, rubble.y);
  }

  // The town's edge: a street that reaches the fence ends in a barricade with a way round it.
  for (const tip of [start, end]) {
    const closed = tip <= 1 || tip >= b.cols - 1;
    if (!closed) continue;
    const barricade = alongRoad((tip <= 1 ? 3 : tip - 3) * TILE_SIZE, middle);
    b.place('barrier', barricade.x, barricade.y, 16);
  }
}

export function dressStreets(b: MapBuilder, roads: readonly Road[], mask: Uint8Array): void {
  for (const road of roads) dressRoad(b, road, mask);
}
