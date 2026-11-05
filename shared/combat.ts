import {
  BLOATER_BURST_PLAYER_DAMAGE,
  BLOATER_BURST_RADIUS,
  BLOATER_BURST_ZOMBIE_DAMAGE,
  KNOCKBACK_SPEED,
  PLAYER_RADIUS,
  TICK_DT,
} from './constants.ts';
import type { EntityId } from './protocol.ts';
import { maybeDropOnKill } from './pickups.ts';
import { hurtPlayer } from './player-health.ts';
import type { BulletState, SimState, ZombieState } from './sim-state.ts';
import { emit } from './sim-state.ts';
import { segmentHitsSolid } from './world-query.ts';
import { startHunting } from './zombie-senses.ts';

/** Bullets count as this much fatter than a point against zombies. */
const BULLET_RADIUS = 2;
/** Scratch list for grid queries, reused so the bullet loop does not allocate. */
const nearby: ZombieState[] = [];

function burst(sim: SimState, z: ZombieState, killerId: EntityId | null): void {
  emit(sim, { type: 'bloater_burst', x: z.x, y: z.y, radius: BLOATER_BURST_RADIUS });
  const sheltered = (target: { x: number; y: number }): boolean => segmentHitsSolid(sim.map, z.x, z.y, target.x, target.y) !== null;
  for (const p of sim.players) {
    const inBlast = Math.hypot(p.x - z.x, p.y - z.y) <= BLOATER_BURST_RADIUS + PLAYER_RADIUS;
    if (inBlast && !sheltered(p)) hurtPlayer(sim, p, BLOATER_BURST_PLAYER_DAMAGE);
  }
  for (const other of sim.zombies) {
    const distance = Math.hypot(other.x - z.x, other.y - z.y);
    const inBlast = other !== z && distance <= BLOATER_BURST_RADIUS + other.radius;
    if (inBlast && !sheltered(other)) {
      const angle = Math.atan2(other.y - z.y, other.x - z.x);
      damageZombie(sim, other, BLOATER_BURST_ZOMBIE_DAMAGE, angle, killerId);
    }
  }
}

function killZombie(sim: SimState, z: ZombieState, angle: number, killerId: EntityId | null): void {
  const killer = sim.players.find((p) => p.id === killerId);
  if (killer) {
    killer.score += z.points;
    killer.kills += 1;
  }
  emit(sim, {
    type: 'zombie_die',
    zombieId: z.id,
    zombieType: z.type,
    x: z.x,
    y: z.y,
    angle,
    killerId,
    points: z.points,
  });
  maybeDropOnKill(sim, z.x, z.y);
  if (z.type === 'bloater') burst(sim, z, killerId);
}

/** Dead zombies stay in the list with health 0 until the end of the tick. */
export function damageZombie(
  sim: SimState,
  z: ZombieState,
  damage: number,
  angle: number,
  killerId: EntityId | null,
): void {
  if (z.health <= 0) return;
  z.health -= damage;
  const turnsOnShooter = killerId !== null && !z.horde;
  if (turnsOnShooter) startHunting(sim, z);
  // Big bodies shove less.
  const shove = KNOCKBACK_SPEED * Math.min(1, (6 / z.radius) ** 2);
  z.knockX += Math.cos(angle) * shove;
  z.knockY += Math.sin(angle) * shove;
  emit(sim, { type: 'zombie_hit', zombieId: z.id, zombieType: z.type, x: z.x, y: z.y, angle });
  if (z.health <= 0) {
    z.health = 0;
    killZombie(sim, z, angle, killerId);
  }
}

/** Fraction along the segment where it enters the circle, or Infinity on a miss. */
function segmentEntersCircle(
  x0: number,
  y0: number,
  dx: number,
  dy: number,
  cx: number,
  cy: number,
  radius: number,
): number {
  const fx = x0 - cx;
  const fy = y0 - cy;
  const c = fx * fx + fy * fy - radius * radius;
  if (c <= 0) return 0;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const discriminant = b * b - 4 * a * c;
  if (a === 0 || discriminant < 0) return Infinity;
  const t = (-b - Math.sqrt(discriminant)) / (2 * a);
  return t >= 0 && t <= 1 ? t : Infinity;
}

function firstZombieOnPath(sim: SimState, b: BulletState, dx: number, dy: number): { zombie: ZombieState; t: number } | null {
  nearby.length = 0;
  sim.grid.query(b.x + dx / 2, b.y + dy / 2, Math.hypot(dx, dy) / 2 + BULLET_RADIUS, nearby);
  let zombie: ZombieState | null = null;
  let best = Infinity;
  for (const z of nearby) {
    if (z.health <= 0) continue;
    const t = segmentEntersCircle(b.x, b.y, dx, dy, z.x, z.y, z.radius + BULLET_RADIUS);
    if (t < best) {
      best = t;
      zombie = z;
    }
  }
  return zombie ? { zombie, t: best } : null;
}

/** Returns false once the bullet is spent. Each tick's whole path is swept, so speed cannot tunnel. */
function advanceBullet(sim: SimState, b: BulletState): boolean {
  const speed = Math.hypot(b.vx, b.vy);
  const length = Math.min(speed * TICK_DT, b.rangeLeft);
  const dx = (b.vx / speed) * length;
  const dy = (b.vy / speed) * length;
  const angle = Math.atan2(b.vy, b.vx);

  const wall = segmentHitsSolid(sim.map, b.x, b.y, b.x + dx, b.y + dy);
  const wallT = wall ? Math.hypot(wall.x - b.x, wall.y - b.y) / length : Infinity;
  const target = firstZombieOnPath(sim, b, dx, dy);

  if (target && target.t <= wallT) {
    damageZombie(sim, target.zombie, b.damage, angle, b.shooterId);
    return false;
  }
  if (wall) {
    emit(sim, { type: 'bullet_impact', x: wall.x, y: wall.y, angle });
    return false;
  }
  b.x += dx;
  b.y += dy;
  b.rangeLeft -= length;
  const inWorld = b.x >= 0 && b.y >= 0 && b.x <= sim.map.width && b.y <= sim.map.height;
  return b.rangeLeft > 0 && inWorld;
}

export function updateBullets(sim: SimState): void {
  sim.bullets = sim.bullets.filter((b) => advanceBullet(sim, b));
}
