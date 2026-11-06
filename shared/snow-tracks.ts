import type { PlayerState, SimState, ZombieState } from './sim-state.ts';
import { TICK_DT } from './constants.ts';
import { themeOf, TRACK_EVERY_TICKS, TRACK_LIFE_SEC, TRACK_LIMIT, TRACK_SNIFF_RADIUS } from './town-rules.ts';

/** Walking or sprinting outdoors in snow leaves prints. Sneaking and standing do not. */
export function leaveFootprint(sim: SimState, p: PlayerState): void {
  const snowy = themeOf(sim.level) === 'snow';
  const printing = snowy && p.moving && p.stance !== 'sneak' && p.indoors === null;
  const due = sim.tick % TRACK_EVERY_TICKS === 0;
  const skip = !printing || !due;
  if (skip) return;
  sim.tracks.push({ x: p.x, y: p.y, by: p.id, left: TRACK_LIFE_SEC });
  const overLimit = sim.tracks.length > TRACK_LIMIT;
  if (overLimit) sim.tracks.shift();
}

/** Snow fills the prints in. */
export function ageFootprints(sim: SimState): void {
  const anyPrints = sim.tracks.length > 0;
  if (!anyPrints) return;
  for (const print of sim.tracks) print.left -= TICK_DT;
  sim.tracks = sim.tracks.filter((print) => print.left > 0);
}

/** The living survivor whose trail this zombie is standing on, or null. */
export function trailUnder(sim: SimState, z: ZombieState): PlayerState | null {
  const reach = (TRACK_SNIFF_RADIUS + z.radius) ** 2;
  for (const print of sim.tracks) {
    const onIt = (print.x - z.x) ** 2 + (print.y - z.y) ** 2 <= reach;
    if (!onIt) continue;
    const maker = sim.players.find((p) => p.id === print.by && p.status === 'alive');
    if (maker) return maker;
  }
  return null;
}
