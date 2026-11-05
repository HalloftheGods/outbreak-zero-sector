import { describe, expect, it } from 'vitest';
import { EXIT_RADIUS, PLAYER_RADIUS } from '../shared/constants.ts';
import { vanBoxAt } from '../shared/exit-van.ts';
import { FlowField } from '../shared/flow-field.ts';
import { chooseExitSpot } from '../shared/level-exit.ts';
import { stepMovement } from '../shared/movement.ts';
import { circleHitsSolid, generateWorldMap, segmentHitsSolid } from '../shared/world-map.ts';

const SEEDS = [1, 2, 3, 99, 1234, 777777];

/** Some open ground a walker can reach from the spawn lies within the 2 second wait's range of the van. */
function reachableWithinWaitingRange(walk: FlowField, spot: { x: number; y: number }): boolean {
  const reach = EXIT_RADIUS - PLAYER_RADIUS;
  for (let dy = -reach; dy <= reach; dy += 8) {
    for (let dx = -reach; dx <= reach; dx += 8) {
      const near = Math.hypot(dx, dy) <= reach;
      if (near && Number.isFinite(walk.distanceAt(spot.x + dx, spot.y + dy))) return true;
    }
  }
  return false;
}

describe('the escape van', () => {
  it('stops walkers and bullets on every seed', () => {
    for (const seed of SEEDS) {
      const map = generateWorldMap(seed);
      const spot = chooseExitSpot(map);
      const box = vanBoxAt(spot);
      const midY = (box.y0 + box.y1) / 2;
      expect(circleHitsSolid(map, spot.x, midY, 1)).toBe(true);
      expect(segmentHitsSolid(map, box.x0 - 30, midY, box.x1 + 30, midY)).not.toBeNull();
      const walked = stepMovement(map, box.x0 - 12, midY, 1, 0, 60, 1, PLAYER_RADIUS);
      expect(walked.x).toBeLessThan(box.x0);
    }
  });

  it('parks where it always did, and leaves a place beside it to wait', () => {
    for (const seed of SEEDS) {
      const map = generateWorldMap(seed);
      const spot = chooseExitSpot(map);
      expect(chooseExitSpot(generateWorldMap(seed))).toEqual(spot);
      const box = vanBoxAt(spot);
      const beside = { x: box.x1 + PLAYER_RADIUS + 1, y: spot.y - 2 };
      expect(circleHitsSolid(map, beside.x, beside.y, PLAYER_RADIUS)).toBe(false);
      expect(Math.hypot(beside.x - spot.x, beside.y - spot.y)).toBeLessThanOrEqual(EXIT_RADIUS);
    }
  });

  it('is still reachable from the spawn on foot', () => {
    for (const seed of SEEDS) {
      const map = generateWorldMap(seed);
      const spot = chooseExitSpot(map);
      const walk = new FlowField(map);
      walk.recompute([map.spawn]);
      expect(reachableWithinWaitingRange(walk, spot), `seed ${seed}`).toBe(true);
    }
  });
});
