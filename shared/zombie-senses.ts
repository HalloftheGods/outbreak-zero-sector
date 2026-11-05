import { TICK_DT, ZOMBIE_INVESTIGATE_SEC, ZOMBIE_LOSE_INTEREST_SEC, ZOMBIE_SIGHT_RANGE } from './constants.ts';
import type { PlayerState, SimState, ZombieMode, ZombieState } from './sim-state.ts';
import { emit } from './sim-state.ts';
import { buildingAt, segmentHitsSolid } from './world-query.ts';

/** Each zombie looks around once in this many ticks, a sixth of its body count per tick. */
export const SIGHT_CHECK_TICKS = 6;

function notice(sim: SimState, z: ZombieState, mode: ZombieMode, interest: number): void {
  const wasUnaware = z.mode === 'wander';
  z.mode = mode;
  z.interestLeft = interest;
  if (wasUnaware) emit(sim, { type: 'zombie_alert', zombieId: z.id, zombieType: z.type, x: z.x, y: z.y });
}

export function startHunting(sim: SimState, z: ZombieState): void {
  notice(sim, z, 'hunt', ZOMBIE_LOSE_INTEREST_SEC);
}

/** Forgets everything and settles wherever it stands. */
export function backToRoaming(sim: SimState, z: ZombieState): void {
  z.mode = 'wander';
  z.interestLeft = 0;
  z.wanderLeft = 0;
  z.home = buildingAt(sim.map, z.x, z.y)?.id ?? null;
}

/** Sound goes through walls: everything in the radius comes to look. Horde zombies already know. */
export function makeNoise(sim: SimState, x: number, y: number, radius: number): void {
  sim.noises.push({ x, y });
  const radiusSquared = radius * radius;
  for (const z of sim.zombies) {
    const heard = !z.horde && z.health > 0 && (z.x - x) ** 2 + (z.y - y) ** 2 <= radiusSquared;
    if (!heard) continue;
    if (z.mode === 'hunt') z.interestLeft = ZOMBIE_LOSE_INTEREST_SEC;
    else notice(sim, z, 'alert', ZOMBIE_INVESTIGATE_SEC);
  }
}

function seesAnyone(sim: SimState, z: ZombieState, prey: readonly PlayerState[]): boolean {
  return prey.some((p) => {
    const inRange = (p.x - z.x) ** 2 + (p.y - z.y) ** 2 <= ZOMBIE_SIGHT_RANGE ** 2;
    return inRange && !segmentHitsSolid(sim.map, z.x, z.y, p.x, p.y);
  });
}

/** Looks around when due, and lets interest run down without fresh contact. */
export function updateAwareness(sim: SimState, z: ZombieState, prey: readonly PlayerState[]): void {
  if (z.horde) return;
  const lookingNow = (sim.tick + z.senseOffset) % SIGHT_CHECK_TICKS === 0;
  const spotted = lookingNow && seesAnyone(sim, z, prey);
  if (spotted) {
    startHunting(sim, z);
    return;
  }
  if (z.mode === 'wander') return;
  z.interestLeft -= TICK_DT;
  if (z.interestLeft <= 0) backToRoaming(sim, z);
}
