// The bunker's map. A stub for the bunker-world lane: one room holding the spawn, the van and every station.

import { BUNKER_SEED, STATION_IDS } from './home-protocol.ts';
import type { Station, StationId } from './home-protocol.ts';
import { TILE_KINDS, TILE_SIZE } from './protocol.ts';
import type { PropInstance, PropKind, WorldMap } from './protocol.ts';

const COLS = 40;
const ROWS = 24;
const WIDTH = COLS * TILE_SIZE;
const HEIGHT = ROWS * TILE_SIZE;

const FLOOR = TILE_KINDS.indexOf('floor_concrete');
const WALL = TILE_KINDS.indexOf('bunker_wall');

const STATION_PROPS: Record<StationId, PropKind> = {
  bench: 'workbench',
  forge: 'forge',
  locker: 'locker',
  level_map: 'level_map',
  gunsmith: 'gunsmith',
  quartermaster: 'quartermaster',
  medic: 'medic',
  powder: 'powder',
};

const FIRST_STATION_X = 64;
const STATION_SPACING = 72;
const PROP_GROUND_Y = 64;
const STATION_Y = 88;
const STATION_RADIUS = 28;
const WARM_LAMP = '#ffb066';

const stationX = (index: number): number => FIRST_STATION_X + index * STATION_SPACING;

function roomTiles(): Uint8Array {
  const tiles = new Uint8Array(COLS * ROWS).fill(FLOOR);
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const onEdge = row === 0 || col === 0 || row === ROWS - 1 || col === COLS - 1;
      if (onEdge) tiles[row * COLS + col] = WALL;
    }
  }
  return tiles;
}

export function generateBunkerMap(): WorldMap {
  const stations: Station[] = STATION_IDS.map((id, index) => ({ id, x: stationX(index), y: STATION_Y, radius: STATION_RADIUS }));
  const props: PropInstance[] = STATION_IDS.map((id, index) => ({ kind: STATION_PROPS[id], x: stationX(index), y: PROP_GROUND_Y }));
  return {
    seed: BUNKER_SEED,
    width: WIDTH,
    height: HEIGHT,
    cols: COLS,
    rows: ROWS,
    tiles: roomTiles(),
    props,
    buildings: [],
    districts: [{ name: 'Bunker', x: WIDTH / 2, y: HEIGHT / 2 }],
    lights: [{ x: WIDTH / 2, y: HEIGHT / 2, radius: 200, color: WARM_LAMP, flicker: false }],
    spawn: { x: WIDTH / 2, y: HEIGHT / 2 },
    walls: [
      { x0: 0, y0: 0, x1: WIDTH, y1: TILE_SIZE },
      { x0: 0, y0: HEIGHT - TILE_SIZE, x1: WIDTH, y1: HEIGHT },
      { x0: 0, y0: 0, x1: TILE_SIZE, y1: HEIGHT },
      { x0: WIDTH - TILE_SIZE, y0: 0, x1: WIDTH, y1: HEIGHT },
    ],
    exit: { x: WIDTH - 96, y: HEIGHT - 64 },
    stations,
  };
}
