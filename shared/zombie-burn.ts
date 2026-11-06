import { woundZombie } from './combat.ts';
import { TICK_DT } from './constants.ts';
import { BURN_NOISE_RADIUS, BURN_NOISE_SEC, BURN_PULSE_DAMAGE, BURN_PULSE_SEC, BURN_TOUCH_GAP } from './round-effect-data.ts';
import type { SimState, ZombieState } from './sim-state.ts';
import { segmentHitsSolid } from './world-query.ts';
import { igniteZombie, wearOff } from './zombie-status.ts';
import type { ZombieStatus } from './zombie-status.ts';
import { makeNoise } from './zombie-senses.ts';

const nearby: ZombieState[] = [];

const skinGap = (a: ZombieState, b: ZombieState): number => Math.hypot(a.x - b.x, a.y - b.y) - a.radius - b.radius;

/** The closest body it touches that is not already alight. The list comes from the grid, so ties fall the same way every run. */
function neighbourToCatch(sim: SimState, z: ZombieState): ZombieState | null {
  nearby.length = 0;
  sim.grid.query(z.x, z.y, z.radius + BURN_TOUCH_GAP, nearby);
  let best: ZombieState | null = null;
  for (const other of nearby) {
    const flammable = other !== z && other.health > 0 && (other.status?.burnLeft ?? 0) <= 0;
    const touching = flammable && skinGap(z, other) <= BURN_TOUCH_GAP && !segmentHitsSolid(sim.map, z.x, z.y, other.x, other.y);
    const closer = touching && (best === null || skinGap(z, other) < skinGap(z, best));
    if (closer) best = other;
  }
  return best;
}

function catchNeighbour(sim: SimState, z: ZombieState, status: ZombieStatus): void {
  const other = neighbourToCatch(sim, z);
  if (!other) return;
  status.canCatch = false;
  igniteZombie(sim, other, status.burnerId, true);
}

function burn(sim: SimState, z: ZombieState, status: ZombieStatus): void {
  status.burnLeft -= TICK_DT;
  status.burnPulseLeft -= TICK_DT;
  status.burnNoiseLeft -= TICK_DT;
  const pulseDue = status.burnPulseLeft <= 1e-9;
  const noiseDue = status.burnNoiseLeft <= 1e-9;
  const burntOut = status.burnLeft <= 1e-9;
  const stillRoaring = noiseDue && !burntOut;
  if (stillRoaring) {
    status.burnNoiseLeft += BURN_NOISE_SEC;
    makeNoise(sim, z.x, z.y, BURN_NOISE_RADIUS);
  }
  if (status.canCatch) catchNeighbour(sim, z, status);
  if (pulseDue) {
    status.burnPulseLeft += BURN_PULSE_SEC;
    woundZombie(sim, z, BURN_PULSE_DAMAGE, status.burnerId);
  }
  if (burntOut) status.burnLeft = 0;
}

/** Runs for every body in town, near a player or not, so an effect never waits on a zombie waking. */
export function updateZombieStatuses(sim: SimState): void {
  for (const z of sim.zombies) {
    const { status } = z;
    const affected = status !== undefined && z.health > 0;
    if (!affected) continue;
    wearOff(status);
    const alight = status.burnLeft > 0;
    if (alight) burn(sim, z, status);
  }
}
