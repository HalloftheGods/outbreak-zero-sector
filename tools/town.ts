// A mock town at true size: every facade on a street, furniture in cutaway rooms and a
// fence run, so buildings can be compared with each other and judged at 1x.

import { BUILDING_DEFS, TILE_SIZE, WALL_THICKNESS } from '../shared/protocol.ts';
import type { BuildingKind, PropKind, TileKind, WeaponId } from '../shared/protocol.ts';
import type { ArtBook, PixelSprite } from '../src/art/types.ts';
import { drawSprite, Sheet } from './sheet.ts';

const WIDTH = 1456;
const HEIGHT = 736;
const GAP = 16;
const ROAD_DEPTH = 80;

function tileAt(book: ArtBook, sheet: Sheet, kind: TileKind, col: number, row: number): void {
  const variants = book.environment.tiles[kind];
  drawSprite(sheet, variants[(col * 5 + row * 3) % variants.length], col * TILE_SIZE, row * TILE_SIZE, 1);
}

function place(sheet: Sheet, sprite: PixelSprite, x: number, y: number): void {
  drawSprite(sheet, sprite, x - sprite.ax, y - sprite.ay, 1);
}

/** A sidewalk with a road under it, from the row `from`. */
function street(book: ArtBook, sheet: Sheet, from: number, rows: number): void {
  const cols = Math.ceil(sheet.w / TILE_SIZE);
  for (let row = from; row < from + rows; row++) {
    for (let col = 0; col < cols; col++) {
      const depth = row - from;
      let kind: TileKind = 'asphalt';
      if (depth < 1) kind = 'sidewalk';
      else if (depth === 1) kind = 'curb_s';
      else if (depth === 3) kind = col % 2 === 0 ? 'lane_h' : 'asphalt';
      tileAt(book, sheet, kind, col, row);
    }
  }
}

type Lot = readonly [BuildingKind, number];

const ROWS: readonly (readonly Lot[])[] = [
  [['pharmacy', 0], ['clinic', 0], ['police', 0], ['gun_shop', 0], ['grocery', 0], ['diner', 0]],
  [['garage', 0], ['warehouse', 0], ['warehouse', 1], ['house', 0], ['house', 1], ['house', 2], ['apartment', 0], ['apartment', 1]],
];

function drawStreetRow(book: ArtBook, sheet: Sheet, lots: readonly Lot[], ground: number): void {
  street(book, sheet, ground / TILE_SIZE, ROAD_DEPTH / TILE_SIZE);
  let x = GAP;
  for (const [kind, variant] of lots) {
    const def = BUILDING_DEFS[kind];
    place(sheet, book.environment.buildings[kind][variant], x + def.w / 2, ground);
    x += def.w + GAP;
  }
}

interface Room {
  readonly floor: TileKind;
  readonly cols: number;
  readonly rows: number;
  readonly door: number;
  readonly props: readonly (readonly [PropKind, number, number])[];
}

const ROOMS: readonly Room[] = [
  { floor: 'floor_tile', cols: 13, rows: 9, door: 6, props: [['shelf', 40, 60], ['shelf', 40, 88], ['shelf', 96, 60], ['shelf', 96, 88], ['counter', 150, 60], ['locker', 188, 40]] },
  { floor: 'floor_wood', cols: 10, rows: 8, door: 4, props: [['sofa', 40, 52], ['table', 40, 90], ['bed', 130, 78]] },
  { floor: 'floor_concrete', cols: 12, rows: 8, door: 3, props: [['workbench', 40, 48], ['locker', 100, 40], ['locker', 118, 40], ['workbench', 160, 48], ['crate_stack', 164, 100]] },
  { floor: 'floor_carpet', cols: 10, rows: 8, door: 6, props: [['bed', 30, 70], ['sofa', 110, 52], ['table', 124, 92]] },
];

/** A building with its shell faded out, as a player inside it sees it. */
function drawRoom(book: ArtBook, sheet: Sheet, room: Room, x: number, y: number): void {
  const { interior, tiles, props } = book.environment;
  const w = room.cols * TILE_SIZE;
  const h = room.rows * TILE_SIZE;
  const variants = tiles[room.floor];
  for (let row = 0; row < room.rows; row++) {
    for (let col = 0; col < room.cols; col++) {
      drawSprite(sheet, variants[(col * 5 + row * 3) % variants.length], x + col * TILE_SIZE, y + row * TILE_SIZE, 1);
    }
  }
  for (let i = 0; i < w; i += TILE_SIZE) drawSprite(sheet, interior.wallFace, x + i, y + WALL_THICKNESS, 1);
  const doorL = room.door * TILE_SIZE;
  const cap = (cx: number, cy: number, cw: number, ch: number) => {
    for (let j = 0; j < ch; j++) {
      for (let i = 0; i < cw; i++) {
        const at = ((j % TILE_SIZE) * TILE_SIZE + (i % TILE_SIZE)) * 4;
        const { rgba } = interior.wallCap;
        sheet.set(cx + i, cy + j, (rgba[at] << 16) | (rgba[at + 1] << 8) | rgba[at + 2]);
      }
    }
  };
  cap(x, y, w, WALL_THICKNESS);
  cap(x, y, WALL_THICKNESS, h);
  cap(x + w - WALL_THICKNESS, y, WALL_THICKNESS, h);
  cap(x, y + h - WALL_THICKNESS, doorL, WALL_THICKNESS);
  cap(x + doorL + 32, y + h - WALL_THICKNESS, w - doorL - 32, WALL_THICKNESS);
  place(sheet, interior.doorMat, x + doorL + 16, y + h - WALL_THICKNESS);
  const sorted = [...room.props].sort((a, b) => a[2] - b[2]);
  for (const [kind, px, py] of sorted) place(sheet, props[kind], x + px, y + py);
}

function drawFences(book: ArtBook, sheet: Sheet, x: number, y: number): void {
  const { fence_h: h, fence_v: v, gas_pump: pump } = book.environment.props;
  for (let i = 0; i < 6; i++) place(sheet, v, x, y - 192 + (i + 1) * 32);
  for (let i = 0; i < 8; i++) place(sheet, h, x + 19 + i * 32, y);
  place(sheet, pump, x + 60, y - 60);
  place(sheet, pump, x + 100, y - 60);
}

const SURVIVOR: readonly [number, WeaponId] = [0, 'pistol'];

/** crop is "x,y,w,h" in town pixels, for a close look at one lot. */
export function renderTown(book: ArtBook, scale: number, crop?: string): Sheet {
  const scene = new Sheet(WIDTH, HEIGHT, 0x15231f);
  drawStreetRow(book, scene, ROWS[0], 176);
  drawStreetRow(book, scene, ROWS[1], 416);
  let x = GAP;
  for (const room of ROOMS) {
    drawRoom(book, scene, room, x, 528);
    x += room.cols * TILE_SIZE + GAP;
  }
  drawFences(book, scene, x + 8, 720);
  const [skin, weapon] = SURVIVOR;
  place(scene, book.survivors[skin].weapons[weapon].walk[2].frames[0], 96, 196);
  place(scene, book.survivors[skin].weapons[weapon].walk[6].frames[0], 80, 660);
  const [cx = 0, cy = 0, cw = WIDTH, ch = HEIGHT] = crop ? crop.split(',').map(Number) : [];
  return scene.cropped(cx, cy, cw, ch).scaled(scale);
}
