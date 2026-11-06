import { TICK_DT } from './constants.ts';
import type { EntityId, ZombieEntity } from './protocol.ts';
import {
  BURN_NOISE_RADIUS,
  BURN_NOISE_SEC,
  BURN_PULSE_SEC,
  BURN_SEC,
  CORROSION_BRUTE_PER_STACK,
  CORROSION_MAX_STACKS,
  CORROSION_PER_STACK,
  CORROSION_SEC,
  TRANQ_BRUTE_SPEED,
  TRANQ_SEC,
  TRANQ_SPEED,
} from './round-effect-data.ts';
import type { GunEffect } from './round-effect-data.ts';
import type { SimState, ZombieState } from './sim-state.ts';
import { emit } from './sim-state.ts';
import { makeNoise } from './zombie-senses.ts';

/** What rounds have left on a zombie. It lives and dies with the body, so a new town starts clean. */
export interface ZombieStatus {
  /** Seconds left alight, 0 when not. */
  burnLeft: number;
  burnPulseLeft: number;
  burnNoiseLeft: number;
  /** Can still set one body it touches alight. A body that caught fire that way cannot. */
  canCatch: boolean;
  /** Who lit it, for the kill. */
  burnerId: EntityId | null;
  corrosion: number;
  corrosionLeft: number;
  /** The blast that put on the last stack, so its other pellets add none. */
  corrodedBy: string | null;
  slowLeft: number;
}

const freshStatus = (): ZombieStatus => ({
  burnLeft: 0,
  burnPulseLeft: 0,
  burnNoiseLeft: 0,
  canCatch: false,
  burnerId: null,
  corrosion: 0,
  corrosionLeft: 0,
  corrodedBy: null,
  slowLeft: 0,
});

function statusOf(z: ZombieState): ZombieStatus {
  z.status ??= freshStatus();
  return z.status;
}

function announce(sim: SimState, z: ZombieState, effect: GunEffect, extra: { caught?: boolean; stacks?: number } = {}): void {
  emit(sim, { type: 'zombie_status', effect, zombieId: z.id, zombieType: z.type, x: z.x, y: z.y, ...extra });
}

/** A body already alight just burns for longer. Fire is the one effect everything nearby comes to look at. */
export function igniteZombie(sim: SimState, z: ZombieState, burnerId: EntityId | null, caught = false): void {
  const status = statusOf(z);
  const alight = status.burnLeft > 0;
  status.burnLeft = BURN_SEC;
  status.burnerId = burnerId;
  if (alight) return;
  status.burnPulseLeft = BURN_PULSE_SEC;
  status.burnNoiseLeft = BURN_NOISE_SEC;
  status.canCatch = !caught;
  makeNoise(sim, z.x, z.y, BURN_NOISE_RADIUS);
  announce(sim, z, 'incendiary', caught ? { caught } : {});
}

function corrode(sim: SimState, z: ZombieState, _shooterId: EntityId, volley?: string): void {
  const status = statusOf(z);
  const sameBlast = volley !== undefined && status.corrodedBy === volley;
  status.corrodedBy = volley ?? null;
  status.corrosionLeft = CORROSION_SEC;
  if (sameBlast) return;
  const stacks = Math.min(CORROSION_MAX_STACKS, status.corrosion + 1);
  const deeper = stacks > status.corrosion;
  status.corrosion = stacks;
  if (deeper) announce(sim, z, 'acid', { stacks });
}

function tranquillise(sim: SimState, z: ZombieState): void {
  const status = statusOf(z);
  const fresh = status.slowLeft <= 0;
  status.slowLeft = TRANQ_SEC;
  if (fresh) announce(sim, z, 'tranq');
}

/** Piercing does its work in flight, so it has nothing to leave on a body. */
const ON_HIT: Partial<Record<GunEffect, (sim: SimState, z: ZombieState, shooterId: EntityId, volley?: string) => void>> = {
  incendiary: (sim, z, shooterId) => igniteZombie(sim, z, shooterId),
  acid: corrode,
  tranq: tranquillise,
};

/** A bullet's effect on a body it hit and did not kill. */
export function applyRoundEffect(sim: SimState, effect: GunEffect, z: ZombieState, shooterId: EntityId, volley?: string): void {
  const survived = z.health > 0;
  if (survived) ON_HIT[effect]?.(sim, z, shooterId, volley);
}

/** A bullet going through a body, for whoever draws it. */
export const announcePierce = (sim: SimState, z: ZombieState): void => announce(sim, z, 'piercing');

/** What every point of damage to this body is multiplied by. */
export function corrosionScale(z: ZombieState): number {
  const perStack = z.type === 'brute' ? CORROSION_BRUTE_PER_STACK : CORROSION_PER_STACK;
  return 1 + (z.status?.corrosion ?? 0) * perStack;
}

/** How fast it walks right now. */
export function zombieSpeed(z: ZombieState): number {
  const slowed = (z.status?.slowLeft ?? 0) > 0;
  if (!slowed) return z.speed;
  return z.speed * (z.type === 'brute' ? TRANQ_BRUTE_SPEED : TRANQ_SPEED);
}

/** One tick of the effects that only run out. Burning has more to do, in zombie-burn.ts. */
export function wearOff(status: ZombieStatus): void {
  status.slowLeft = Math.max(0, status.slowLeft - TICK_DT);
  status.corrosionLeft = Math.max(0, status.corrosionLeft - TICK_DT);
  const acidGone = status.corrosionLeft <= 1e-9;
  if (acidGone) status.corrosion = 0;
}

/** The fields for a zombie's snapshot, all left off on a clean body. */
export function statusView(z: ZombieState): Pick<ZombieEntity, 'burning' | 'corrosion' | 'slowed'> {
  const status = z.status;
  if (!status) return {};
  return {
    ...(status.burnLeft > 0 ? { burning: true } : {}),
    ...(status.corrosion > 0 ? { corrosion: status.corrosion } : {}),
    ...(status.slowLeft > 0 ? { slowed: true } : {}),
  };
}

/** A connection that came back has a new id, and whatever it lit still counts for it. */
export function moveBurnCredit(sim: SimState, from: EntityId, to: EntityId): void {
  for (const { status } of sim.zombies) {
    const lit = status?.burnerId === from;
    if (lit) status.burnerId = to;
  }
}
