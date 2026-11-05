import type { WorldMap } from './protocol.ts';
import { circleHitsSolid } from './world-query.ts';

/** Small enough that stopping distance from a wall barely depends on the frame rate. */
const MAX_SUBSTEP = 1;

/**
 * Moves a circle along a direction at a fixed speed, sliding along solids one
 * axis at a time. The client's prediction and the sim both run this, so any
 * change here changes both.
 */
export function stepMovement(
  map: WorldMap,
  x: number,
  y: number,
  dirX: number,
  dirY: number,
  speed: number,
  dt: number,
  radius: number,
): { x: number; y: number } {
  const length = Math.hypot(dirX, dirY);
  if (!(length > 0) || !(speed > 0) || !(dt > 0)) return { x, y };

  const distance = speed * dt;
  const steps = Math.ceil(distance / MAX_SUBSTEP);
  const stepX = ((dirX / length) * distance) / steps;
  const stepY = ((dirY / length) * distance) / steps;
  const maxX = map.width - radius;
  const maxY = map.height - radius;
  let px = x;
  let py = y;

  for (let i = 0; i < steps; i++) {
    if (stepX !== 0) {
      const nx = Math.min(maxX, Math.max(radius, px + stepX));
      if (!circleHitsSolid(map, nx, py, radius)) px = nx;
    }
    if (stepY !== 0) {
      const ny = Math.min(maxY, Math.max(radius, py + stepY));
      if (!circleHitsSolid(map, px, ny, radius)) py = ny;
    }
  }
  return { x: px, y: py };
}
