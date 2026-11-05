import { describe, expect, it } from 'vitest';
import { furnish } from '../shared/building-interiors.ts';
import { PLAYER_RADIUS, ZOMBIES } from '../shared/constants.ts';
import type { MapBuilder } from '../shared/map-builder.ts';
import { BUILDING_KINDS, TILE_SIZE, WALL_THICKNESS } from '../shared/protocol.ts';
import type { BuildingInstance, BuildingKind, PropInstance, WorldMap } from '../shared/protocol.ts';
import { blockedTiles, buildingBox, circleHitsSolid, doorBox, propBox } from '../shared/world-query.ts';
import type { Box } from '../shared/world-query.ts';

const COLS = 40;
const ROWS = 30;
const ORIGIN_TILE = 8;
/** Flood step, fine enough to find a body's way through a gap with a pixel to spare each side. */
const STEP = 2;
const NARROWEST_AISLE = 24;
const WIDEST_BODY = ZOMBIES.brute.radius;
const WIDE_BODIES = [ZOMBIES.bloater.radius, ZOMBIES.brute.radius];

interface Room {
  readonly map: WorldMap;
  readonly building: BuildingInstance;
  readonly props: readonly PropInstance[];
  /** How many pieces in the layout are optional. */
  readonly optional: number;
}

/** One room on an empty map, with each optional piece in or out according to the bits of `skipped`. */
function furnished(kind: BuildingKind, skipped: number): Room {
  const building: BuildingInstance = { id: 'b1', kind, x: ORIGIN_TILE * TILE_SIZE, y: ORIGIN_TILE * TILE_SIZE, variant: 0 };
  const props: PropInstance[] = [];
  let optional = 0;
  const builder = {
    rng: () => ((skipped >> optional++) & 1 ? 0.999 : 0),
    fixture: (prop: PropInstance['kind'], x: number, y: number) => props.push({ kind: prop, x, y }),
  };
  furnish(builder as unknown as MapBuilder, building);
  const map = {
    cols: COLS,
    rows: ROWS,
    width: COLS * TILE_SIZE,
    height: ROWS * TILE_SIZE,
    props,
    buildings: [building],
    spawn: { x: 0, y: 0 },
  } as unknown as WorldMap;
  return { map, building, props, optional };
}

function everyVariant(kind: BuildingKind): Room[] {
  const { optional } = furnished(kind, 0);
  return Array.from({ length: 2 ** optional }, (_, skipped) => furnished(kind, skipped));
}

/** Every point a body of this radius can walk to from outside the door. */
function walkable({ map, building }: Room, radius: number): Uint8Array {
  const width = map.width / STEP;
  const height = map.height / STEP;
  const seen = new Uint8Array(width * height);
  const door = doorBox(building);
  const start = Math.floor((door.y1 + 24) / STEP) * width + Math.floor((door.x0 + door.x1) / 2 / STEP);
  const stack = [start];
  seen[start] = 1;
  while (stack.length > 0) {
    const index = stack.pop() as number;
    const col = index % width;
    const row = (index - col) / width;
    for (const [c, r] of [[col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]]) {
      const onMap = c >= 0 && r >= 0 && c < width && r < height;
      const next = r * width + c;
      const open = onMap && seen[next] === 0 && !circleHitsSolid(map, c * STEP + 1, r * STEP + 1, radius);
      if (open) {
        seen[next] = 1;
        stack.push(next);
      }
    }
  }
  return seen;
}

/** Free tiles of the room no point of which a body of this radius can stand on. */
function tilesOutOfReach(room: Room, radius: number): string[] {
  const { map, building } = room;
  const blocked = blockedTiles(map);
  const seen = walkable(room, radius);
  const width = map.width / STEP;
  const { x0, y0, x1, y1 } = buildingBox(building);
  const missed: string[] = [];
  for (let y = y0; y < y1; y += TILE_SIZE) {
    for (let x = x0; x < x1; x += TILE_SIZE) {
      if (blocked[(y / TILE_SIZE) * map.cols + x / TILE_SIZE]) continue;
      let reached = false;
      for (let py = y; py < y + TILE_SIZE; py += STEP) {
        for (let px = x; px < x + TILE_SIZE; px += STEP) reached ||= seen[(py / STEP) * width + px / STEP] === 1;
      }
      if (!reached) missed.push(`${x - x0},${y - y0}`);
    }
  }
  return missed;
}

function solidsOf({ building, props }: Room): Box[] {
  const { x0, y0, x1, y1 } = buildingBox(building);
  const door = doorBox(building);
  const thick = WALL_THICKNESS;
  return [
    ...props.map(propBox),
    { x0, y0, x1, y1: y0 + thick },
    { x0, y0, x1: x0 + thick, y1 },
    { x0: x1 - thick, y0, x1, y1 },
    { x0, y0: y1 - thick, x1: door.x0, y1 },
    { x0: door.x1, y0: y1 - thick, x1, y1 },
  ];
}

/** True if solids fill the area's middle from end to end, so nothing can pass along it. */
function filledIn(solids: readonly Box[], area: Box): boolean {
  const middleX = (area.x0 + area.x1) / 2;
  const middleY = (area.y0 + area.y1) / 2;
  const inSolid = (x: number, y: number): boolean => solids.some((c) => x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1);
  const wide = area.x1 - area.x0 > area.y1 - area.y0;
  const length = wide ? area.x1 - area.x0 : area.y1 - area.y0;
  for (let along = 0; along <= length; along += STEP) {
    const open = wide ? !inSolid(area.x0 + along, middleY) : !inSolid(middleX, area.y0 + along);
    if (open) return false;
  }
  return true;
}

/** Straight gaps between two solids that face each other with nothing else in between. */
function facingGaps(room: Room): number[] {
  const solids = solidsOf(room);
  const gaps: number[] = [];
  solids.forEach((a, i) => {
    for (const b of solids.slice(i + 1)) {
      const overlapX = Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0);
      const overlapY = Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0);
      const gap = overlapX ? Math.max(a.y0 - b.y1, b.y0 - a.y1) : Math.max(a.x0 - b.x1, b.x0 - a.x1);
      const facing = (overlapX || overlapY) && gap > 0;
      if (!facing) continue;
      const between: Box = overlapX
        ? { x0: Math.max(a.x0, b.x0), x1: Math.min(a.x1, b.x1), y0: Math.min(a.y1, b.y1), y1: Math.max(a.y0, b.y0) }
        : { y0: Math.max(a.y0, b.y0), y1: Math.min(a.y1, b.y1), x0: Math.min(a.x1, b.x1), x1: Math.max(a.x0, b.x0) };
      if (!filledIn(solids, between)) gaps.push(gap);
    }
  });
  return gaps;
}

describe('room layouts', () => {
  it('the aisle allowance fits the widest body', () => {
    expect(NARROWEST_AISLE).toBeGreaterThan(WIDEST_BODY * 2);
  });

  it.each(BUILDING_KINDS)('%s: every free tile can be reached by the widest bodies', (kind) => {
    for (const room of everyVariant(kind)) {
      for (const radius of WIDE_BODIES) expect(tilesOutOfReach(room, radius)).toEqual([]);
    }
  });

  it.each(BUILDING_KINDS)('%s: a gap a player fits through is wide enough for a brute to follow', (kind) => {
    const playerWidth = PLAYER_RADIUS * 2;
    for (const room of everyVariant(kind)) {
      const squeezes = facingGaps(room).filter((gap) => gap >= playerWidth && gap < NARROWEST_AISLE);
      expect(squeezes).toEqual([]);
    }
  });
});
