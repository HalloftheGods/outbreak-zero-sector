// A mock street at game scale, so art can be judged in context rather than on a grid.
// The night mode approximates the game's lighting pass; the client's renderer is the real one.

import { TILE_SIZE } from '../shared/protocol.ts';
import type { BuildingKind, PropKind, TileKind, WeaponId, ZombieType } from '../shared/protocol.ts';
import type { ArtBook, PixelSprite } from '../src/art/types.ts';
import { drawSprite, Sheet } from './sheet.ts';

const WIDTH = 480;
const HEIGHT = 270;
const COLS = WIDTH / TILE_SIZE;
const ROWS = Math.ceil(HEIGHT / TILE_SIZE);

function tileAt(col: number, row: number): TileKind {
  if (row <= 7) return col >= 21 && col < 25 && row >= 3 ? 'dirt' : 'sidewalk';
  if (row === 8) return 'curb_n';
  if (row === 14) return 'curb_s';
  if (row > 14) return col < 7 ? 'grass' : 'sidewalk';
  if (col >= 13 && col < 15) return 'crosswalk_v';
  if (row === 11) return col % 2 === 0 ? 'lane_h' : 'asphalt';
  if (row === 9 && col >= 3 && col < 9) return 'parking_line';
  return (col * 7 + row * 3) % 5 === 0 ? 'asphalt_cracked' : 'asphalt';
}

/** Kind, facade, then the centre of the footprint's south edge. */
const BUILDINGS: readonly (readonly [BuildingKind, number, number, number])[] = [
  ['pharmacy', 0, 76, 112], ['house', 1, 232, 112], ['gun_shop', 0, 392, 100],
];

const PROPS: readonly (readonly [PropKind, number, number])[] = [
  ['street_lamp', 160, 124], ['hydrant', 196, 126], ['dumpster', 306, 122], ['crate_stack', 334, 124],
  ['tree', 40, 250], ['bush', 90, 246], ['tree', 450, 255], ['street_lamp', 300, 244],
  ['car_sedan_h', 76, 166], ['car_wreck_h', 150, 196], ['van_h', 390, 176], ['car_sedan_v', 300, 190],
  ['barrier', 250, 228], ['sandbags', 180, 256], ['fire_barrel', 236, 148], ['rubble', 350, 216],
];

const SURVIVORS: readonly (readonly [number, WeaponId, number, number, number])[] = [
  [0, 'pistol', 2, 218, 186], [1, 'carbine', 0, 248, 200], [2, 'shotgun', 1, 200, 214], [3, 'pistol', 4, 262, 170],
  [4, 'pistol', 0, 282, 212],
];

const ZOMBIES: readonly (readonly [ZombieType, number, number, number])[] = [
  ['walker', 4, 330, 206], ['walker', 3, 346, 164], ['runner', 4, 306, 150], ['bloater', 3, 372, 214],
  ['brute', 4, 366, 150], ['walker', 2, 216, 140], ['runner', 2, 176, 158], ['walker', 0, 120, 222],
];

interface Actor {
  readonly y: number;
  readonly shadow: number;
  readonly sprite: PixelSprite;
  readonly x: number;
}

function place(sheet: Sheet, sprite: PixelSprite, x: number, y: number): void {
  drawSprite(sheet, sprite, x - sprite.ax, y - sprite.ay, 1);
}

function groundShadow(sheet: Sheet, x: number, y: number, rx: number): void {
  const ry = Math.max(2, rx * 0.4);
  for (let j = -ry; j <= ry; j++) {
    for (let i = -rx; i <= rx; i++) {
      if ((i * i) / (rx * rx) + (j * j) / (ry * ry) <= 1) sheet.tint(Math.round(x + i), Math.round(y + j), 0.55, 0.55, 0.62);
    }
  }
}

function buildActors(book: ArtBook): Actor[] {
  const buildings = BUILDINGS.map(([kind, variant, x, y]) => ({ x, y, sprite: book.environment.buildings[kind][variant], shadow: 0 }));
  const props = PROPS.map(([kind, x, y]) => ({ x, y, sprite: book.environment.props[kind], shadow: 0 }));
  const survivors = SURVIVORS.map(([skin, weapon, dir, x, y]) => ({
    x, y, shadow: 7, sprite: book.survivors[skin].weapons[weapon].walk[dir].frames[0],
  }));
  const zombies = ZOMBIES.map(([type, dir, x, y]) => ({
    x, y, shadow: type === 'brute' ? 11 : 7, sprite: book.zombies[type].walk[dir].frames[0],
  }));
  const flames = PROPS.filter(([kind]) => kind === 'fire_barrel').map(([, x, y]) => ({
    x, y: y + 1, shadow: 0, sprite: book.environment.barrelFire.frames[0],
  }));
  return [...buildings, ...props, ...survivors, ...zombies, ...flames].sort((a, b) => a.y - b.y);
}

interface Pool {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const POOLS: readonly Pool[] = [
  { x: 160, y: 118, radius: 90, r: 1, g: 0.86, b: 0.62 },
  { x: 300, y: 238, radius: 80, r: 1, g: 0.86, b: 0.62 },
  { x: 236, y: 140, radius: 60, r: 1, g: 0.6, b: 0.3 },
];

/** How much of a light reaches a point, in three hard steps like a banded pixel-art light. */
function band(t: number): number {
  if (t < 0.45) return 1;
  if (t < 0.75) return 0.65;
  return t < 1 ? 0.35 : 0;
}

function flashlight(x: number, y: number): number {
  const dx = x - 218;
  const dy = y - 186;
  return Math.abs(Math.atan2(dy, dx)) < 0.5 ? band(Math.hypot(dx, dy) / 170) : 0;
}

/** Multiplies the scene by dark blue, then lifts it back inside lamp pools and the flashlight cone. */
function nightPass(sheet: Sheet): void {
  const ambient = { r: 0.3, g: 0.34, b: 0.54 };
  for (let y = 0; y < sheet.h; y++) {
    for (let x = 0; x < sheet.w; x++) {
      let r = ambient.r;
      let g = ambient.g;
      let b = ambient.b;
      for (const pool of POOLS) {
        const light = band(Math.hypot(x - pool.x, (y - pool.y) * 1.3) / pool.radius);
        r = Math.max(r, light * pool.r);
        g = Math.max(g, light * pool.g);
        b = Math.max(b, light * pool.b);
      }
      const beam = flashlight(x, y);
      r = Math.max(r, beam);
      g = Math.max(g, beam * 0.96);
      b = Math.max(b, beam * 0.86);
      sheet.tint(x, y, r, g, b);
    }
  }
}

export function renderScene(book: ArtBook, scale: number, night: boolean): Sheet {
  const scene = new Sheet(WIDTH, HEIGHT, 0);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const variants = book.environment.tiles[tileAt(col, row)];
      drawSprite(scene, variants[(col * 3 + row * 5) % variants.length], col * TILE_SIZE, row * TILE_SIZE, 1);
    }
  }
  const decals = [...book.fx.bloodDecals, ...book.fx.acidDecals];
  decals.forEach((decal, i) => place(scene, decal, 280 + i * 28, 196 + (i % 2) * 18));
  const pickups = Object.values(book.pickups);
  pickups.forEach((clip, i) => place(scene, clip.frames[0], 130 + i * 30, 234));
  const actors = buildActors(book);
  for (const actor of actors) if (actor.shadow) groundShadow(scene, actor.x, actor.y, actor.shadow);
  for (const actor of actors) place(scene, actor.sprite, actor.x, actor.y);
  if (night) nightPass(scene);
  return scene.scaled(scale);
}
