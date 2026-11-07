import { PROP_DEFS, TILE_SIZE } from './protocol.ts';
import type { BuildingInstance, BuildingKind, PropKind } from './protocol.ts';
import type { MapBuilder } from './map-builder.ts';

/** `left` and `bottom` are pixels from the footprint's top left corner. */
type Slot = readonly [kind: PropKind, left: number, bottom: number, odds?: number];

const NORTH_WALL = TILE_SIZE;
/** Keeps deeper pieces clear of the north wall's own thickness. */
const NORTH_DEEP = 18;
const NORTH_BED = 38;

/**
 * Hand-laid so every room keeps a way in from the door, with pieces against the walls. Any gap
 * a player fits through is at least 24px, so a brute (22px across) can follow; anything less
 * must be too tight for the player as well. Tile rows are 16px, so a `bottom` of 64 fills row 3.
 */
const LAYOUTS: Record<BuildingKind, readonly Slot[]> = {
  pharmacy: [
    ['shelf', 16, NORTH_WALL], ['shelf', 48, NORTH_WALL], ['shelf', 80, NORTH_WALL], ['shelf', 112, NORTH_WALL],
    ['counter', 64, 30],
    ['shelf', 16, 64], ['shelf', 112, 64],
  ],
  clinic: [
    ['bed', 16, NORTH_BED], ['bed', 64, NORTH_BED], ['bed', 112, NORTH_BED], ['bed', 160, NORTH_BED],
    ['counter', 72, 80],
    ['table', 16, 88],
    ['locker', 88, NORTH_WALL], ['shelf', 144, 96], ['locker', 16, 74, 0.5],
  ],
  police: [
    ['locker', 16, NORTH_WALL], ['locker', 32, NORTH_WALL], ['locker', 48, NORTH_WALL], ['locker', 64, NORTH_WALL],
    ['locker', 160, NORTH_WALL], ['locker', 176, NORTH_WALL], ['locker', 192, NORTH_WALL],
    ['counter', 88, 52],
    ['table', 16, 80], ['table', 184, 80],
    ['shelf', 16, 114], ['shelf', 176, 114],
  ],
  gun_shop: [
    ['shelf', 16, NORTH_WALL], ['shelf', 48, NORTH_WALL], ['shelf', 104, NORTH_WALL],
    ['counter', 80, 60],
    ['locker', 16, 64],
    ['shelf', 96, 96],
  ],
  grocery: [
    ['shelf', 16, NORTH_WALL], ['shelf', 48, NORTH_WALL], ['shelf', 80, NORTH_WALL], ['shelf', 112, NORTH_WALL], ['shelf', 144, NORTH_WALL],
    ['shelf', 96, 52], ['shelf', 128, 52], ['shelf', 160, 52],
    ['shelf', 96, 96], ['shelf', 128, 96], ['shelf', 160, 96],
    ['counter', 16, 60],
  ],
  discount: [
    // Stockroom in the back corner: cartons and the locked cabinet.
    ['crate_stack', 10, 22], ['locker', 34, NORTH_WALL], ['crate_stack', 10, 62, 0.6],
    ['shelf', 74, NORTH_WALL], ['shelf', 106, NORTH_WALL], ['shelf', 138, NORTH_WALL],
    ['shelf', 74, 50], ['shelf', 106, 50],
    // The checkout, just inside the door, against the front wall.
    ['counter', 80, 95], ['shelf', 136, 95, 0.6],
  ],
  diner: [
    ['fridge', 14, NORTH_WALL], ['counter', 32, NORTH_DEEP], ['fridge', 85, NORTH_WALL], ['counter', 106, NORTH_DEEP],
    ['table', 72, 64], ['table', 128, 64],
    ['sofa', 12, 90, 0.6],
  ],
  garage: [
    ['shelf', 16, NORTH_WALL], ['workbench', 82, NORTH_DEEP], ['workbench', 130, NORTH_DEEP],
    ['locker', 144, 64],
    ['car_sedan_h', 96, 80, 0.7],
    ['crate_stack', 16, 80],
  ],
  warehouse: [
    ['shelf', 16, NORTH_WALL], ['shelf', 48, NORTH_WALL], ['shelf', 80, NORTH_WALL], ['shelf', 112, NORTH_WALL],
    ['crate_stack', 16, 54], ['crate_stack', 60, 54], ['crate_stack', 104, 54],
    ['crate_stack', 16, 100], ['crate_stack', 60, 100], ['crate_stack', 104, 100, 0.6],
    ['workbench', 194, NORTH_DEEP],
    ['shelf', 156, 64], ['shelf', 202, 100, 0.6],
  ],
  house: [
    ['bed', 16, NORTH_BED],
    ['fridge', 44, NORTH_WALL],
    ['sofa', 64, 20],
    ['table', 72, 64],
    ['locker', 16, 90, 0.5],
  ],
  apartment: [
    ['bed', 16, NORTH_BED], ['bed', 124, NORTH_BED],
    ['sofa', 64, 20],
    ['fridge', 104, NORTH_WALL], ['fridge', 136, 116],
    ['table', 16, 80], ['table', 120, 80],
    ['locker', 48, NORTH_WALL], ['shelf', 16, 116, 0.5],
  ],
};

/** Furnishes one building. Pieces go down as fixtures: the layouts already leave their own aisles. */
export function furnish(b: MapBuilder, building: BuildingInstance): void {
  for (const [kind, left, bottom, odds] of LAYOUTS[building.kind]) {
    const skipped = odds !== undefined && b.rng() >= odds;
    if (!skipped) b.fixture(kind, building.x + left + PROP_DEFS[kind].w / 2, building.y + bottom);
  }
}
