import { generateBunkerMap } from './bunker-map.ts';
import { isBunkerSeed } from './home-protocol.ts';
import { TILE_KINDS, TILE_SIZE } from './protocol.ts';
import type { MapLight, PropInstance, WorldMap } from './protocol.ts';
import { biomeFor } from './biomes.ts';
import { MapBuilder } from './map-builder.ts';
import { createRng, randRange } from './rng.ts';
import type { Rng } from './rng.ts';
import { raiseBuildings } from './town-buildings.ts';
import { raiseTownPieces } from './town-pieces.ts';
import { EDGE_TILES, MAP_TILES, planTown, rectBox } from './town-plan.ts';
import { dressStreets, paintStreets } from './town-streets.ts';
import { fillPark, fillVerge, raiseFence } from './world-blocks.ts';
import { blockedTiles, isSolidProp, propBox } from './world-query.ts';

export {
  blockedTiles,
  buildingAt,
  buildingBox,
  circleHitsSolid,
  doorBox,
  isBlockedAt,
  isSolidProp,
  propBox,
  segmentHitsSolid,
  wallBoxes,
} from './world-query.ts';
export type { Box } from './world-query.ts';

/** Depth of the strip the verge scatter works in, along each edge of the map. */
const VERGE_TILES = 6;

const SODIUM = '#ffb066';
const COOL = '#9ad0ff';
const FIRE = '#ff7a2e';

function freeTilesReached(blocked: Uint8Array, cols: number, rows: number, start: number): Uint8Array {
  const seen = new Uint8Array(cols * rows);
  const stack = [start];
  seen[start] = 1;
  while (stack.length) {
    const index = stack.pop() as number;
    const col = index % cols;
    const neighbours = [
      col > 0 ? index - 1 : -1,
      col < cols - 1 ? index + 1 : -1,
      index - cols,
      index + cols,
    ];
    for (const next of neighbours) {
      const onMap = next >= 0 && next < cols * rows;
      if (onMap && !blocked[next] && !seen[next]) {
        seen[next] = 1;
        stack.push(next);
      }
    }
  }
  return seen;
}

function nearestSolid(props: readonly PropInstance[], x: number, y: number): number {
  let bestIndex = -1;
  let bestDistance = Infinity;
  props.forEach((prop, index) => {
    if (!isSolidProp(prop)) return;
    const box = propBox(prop);
    const dx = x - Math.max(box.x0, Math.min(x, box.x1));
    const dy = y - Math.max(box.y0, Math.min(y, box.y1));
    const distance = dx * dx + dy * dy;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

/** Removes solids until every free tile is reachable from the spawn. */
function connectedProps(base: WorldMap): PropInstance[] {
  const props = [...base.props];
  const spawnTile = Math.floor(base.spawn.y / TILE_SIZE) * base.cols + Math.floor(base.spawn.x / TILE_SIZE);
  for (;;) {
    const blocked = blockedTiles({ ...base, props });
    const seen = freeTilesReached(blocked, base.cols, base.rows, spawnTile);
    const stranded = blocked.findIndex((isBlocked, index) => !isBlocked && !seen[index]);
    if (stranded < 0) return props;
    const x = ((stranded % base.cols) + 0.5) * TILE_SIZE;
    const y = (Math.floor(stranded / base.cols) + 0.5) * TILE_SIZE;
    props.splice(nearestSolid(props, x, y), 1);
  }
}

/** Drifts, flood, ash or sludge laid over the finished town in ragged patches, inside the fence. */
function spreadTerrain(b: MapBuilder): void {
  const { terrain } = b.biome;
  if (!terrain) return;
  const size = MAP_TILES * TILE_SIZE;
  const inner = EDGE_TILES * TILE_SIZE + TILE_SIZE;
  for (let i = 0; i < terrain.count; i++) {
    const radius = randRange(b.rng, terrain.radius[0], terrain.radius[1]);
    b.blob(randRange(b.rng, inner, size - inner), randRange(b.rng, inner, size - inner), radius, terrain.tile, terrain.over);
  }
}

function lightsFor(props: readonly PropInstance[], rng: Rng): MapLight[] {
  const lights: MapLight[] = [];
  for (const prop of props) {
    if (prop.kind === 'fire_barrel') {
      lights.push({ x: prop.x, y: prop.y - 6, radius: 74, color: FIRE, flicker: true });
    } else if (prop.kind === 'street_lamp') {
      const roll = rng();
      if (roll < 0.25) continue; // Dead lamp: dark gaps keep the flashlight useful.
      const color = roll < 0.55 ? COOL : SODIUM;
      lights.push({ x: prop.x, y: prop.y + 2, radius: 104, color, flicker: roll > 0.85 });
    }
  }
  return lights;
}

/** Deterministic: the same seed and level yield the same map on the server and every client. The level picks the biome. */
export function generateWorldMap(seed: number, level = 1): WorldMap {
  if (isBunkerSeed(seed)) return generateBunkerMap();
  const rng = createRng(seed);
  const size = MAP_TILES * TILE_SIZE;
  const plan = planTown(rng);
  const builder = new MapBuilder(MAP_TILES, MAP_TILES, rng, plan.spawn, biomeFor(level));

  builder.fill({ x0: 0, y0: 0, x1: size, y1: size }, builder.biome.ground);
  fillPark(builder, rectBox(plan.park));
  const roadMask = paintStreets(builder, plan.roads);
  raiseFence(builder);
  raiseBuildings(builder, plan);
  dressStreets(builder, plan.roads, roadMask);
  raiseTownPieces(builder, plan);

  const verge = VERGE_TILES * TILE_SIZE;
  fillVerge(builder, { x0: 0, y0: 0, x1: size, y1: verge });
  fillVerge(builder, { x0: 0, y0: size - verge, x1: size, y1: size });
  fillVerge(builder, { x0: 0, y0: verge, x1: verge, y1: size - verge });
  fillVerge(builder, { x0: size - verge, y0: verge, x1: size, y1: size - verge });

  spreadTerrain(builder);

  const base: WorldMap = {
    seed,
    width: size,
    height: size,
    cols: MAP_TILES,
    rows: MAP_TILES,
    tiles: builder.tiles,
    props: builder.props,
    buildings: builder.buildings,
    districts: plan.districts,
    lights: [],
    spawn: plan.spawn,
  };
  const props = connectedProps(base);
  return { ...base, props, lights: lightsFor(props, rng) };
}

export const tileKindAt = (map: WorldMap, col: number, row: number) => TILE_KINDS[map.tiles[row * map.cols + col]];
