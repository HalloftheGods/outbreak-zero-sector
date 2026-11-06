// The overrun: a clock that starts each time the room comes home, a blast door that bursts when it runs out,
// and a horde through it. Sim state, advanced by `step()` in the bunker, so solo and co-op run the same code.
// The numbers are starting points for the soak (#7223). Nothing here runs while `sim.overrun` is null.

import { TICK_DT } from './constants.ts';
import type { OverrunView } from './home-protocol.ts';
import { goneQuiet } from './level-exit.ts';
import type { OverrunState, PlayerState, SimState } from './sim-state.ts';
import { alivePlayers, emit } from './sim-state.ts';

/** Seconds from arrival to the breach at full speed. */
export const OVERRUN_CLOCK_SEC = 300;
/** How fast the clock runs while everyone who counts has a station open. */
export const OVERRUN_MENU_RATE = 0.5;
/** Share of the clock left at each warning: 2:30, 1:15 and 0:30. */
export const OVERRUN_WARNINGS: readonly number[] = [0.5, 0.25, 0.1];
/** Guns are free from the last warning on. */
export const OVERRUN_ARM_FRACTION = 0.1;
/** No clock until someone in the room has reached this level, so a first visit is in peace. */
export const OVERRUN_FIRST_HIGHEST = 2;
/** Most zombies one breach sends, for the bunker's floor space. */
export const OVERRUN_HORDE_MAX = 40;
/** Gap between zombies coming through the door. */
export const OVERRUN_SPAWN_INTERVAL_SEC = 0.6;
/** Most merchants one flight kills, so one stall always survives. */
export const OVERRUN_MAX_KILLED = 3;
/** Banked trips until a closed stall reopens or a thin stock is full again. */
export const OVERRUN_RECOVERY_TRIPS = 3;
/** Ammo finds in a reward chest. */
export const OVERRUN_CHEST_FINDS = 3;
/** Silver stacks in a reward chest. */
export const OVERRUN_CHEST_STACKS = 6;

/** Seconds of slack for the sum of many small ticks, as the van's wait allows. */
const CLOCK_EPSILON = 1e-9;

/** A fresh clock for an arrival in the bunker, or none: the switch is off, or the room has not yet reached `OVERRUN_FIRST_HIGHEST`. */
export function startOverrunClock(sim: SimState): void {
  const peace = !sim.overrunOn || (sim.homeRun?.roomHighest ?? 0) < OVERRUN_FIRST_HIGHEST;
  sim.overrun = peace ? null : {
    phase: 'counting',
    left: OVERRUN_CLOCK_SEC,
    slowed: false,
    warned: 0,
    queue: [],
    spawnTimer: 0,
    total: 0,
    kills: 0,
    startTick: sim.tick,
  };
}

/** The players the van would wait for. */
const standing = (sim: SimState): PlayerState[] => alivePlayers(sim).filter((p) => !goneQuiet(sim, p));

/** Half speed while everyone who counts has a station open. With nobody counting the clock runs full. */
function clockRate(sim: SimState): number {
  const counting = standing(sim);
  const inMenus = counting.length > 0 && counting.every((p) => p.home?.station != null);
  return inMenus ? OVERRUN_MENU_RATE : 1;
}

/** One tick of the overrun, from the bunker branch of `step()`. Filled in by #7214 and #7215. */
export function updateOverrun(sim: SimState): void {
  const overrun = sim.overrun;
  if (!overrun || overrun.phase === 'held' || overrun.phase === 'lost') return;
  if (overrun.total === 0 && overrun.left > 0) tickClock(sim, overrun);
}

/** Runs the clock down by one tick, gives each warning once and arms the guns for the last stretch. */
function tickClock(sim: SimState, overrun: OverrunState): void {
  const rate = clockRate(sim);
  overrun.slowed = rate < 1;
  overrun.left = Math.max(0, overrun.left - TICK_DT * rate);
  if (overrun.left < CLOCK_EPSILON) overrun.left = 0;
  const share = overrun.left / OVERRUN_CLOCK_SEC;
  while (overrun.warned < OVERRUN_WARNINGS.length && share <= OVERRUN_WARNINGS[overrun.warned] + CLOCK_EPSILON) {
    emit(sim, { type: 'overrun_warning', step: overrun.warned, left: Math.round(overrun.left) });
    overrun.warned += 1;
  }
  if (overrun.phase === 'counting' && share <= OVERRUN_ARM_FRACTION + CLOCK_EPSILON) overrun.phase = 'armed';
}

/** The room's overrun for the snapshot, or null while there is none. Tenths of a second, as the clock is drawn. */
export function overrunView(sim: SimState): OverrunView | null {
  const overrun = sim.overrun;
  if (!overrun) return null;
  const standing = sim.zombies.filter((z) => z.horde && z.health > 0).length;
  const breached = overrun.total > 0;
  return {
    phase: overrun.phase,
    left: Math.round(overrun.left * 10) / 10 + 0,
    slowed: overrun.slowed,
    hostiles: breached ? overrun.queue.length + standing : 0,
    total: overrun.total,
  };
}
