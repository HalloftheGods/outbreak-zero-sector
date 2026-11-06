// What the overrun looks like on the bunker floor, read from the room's view and this player's own receipt.

import { OVERRUN_CLOCK_SEC, OVERRUN_WARNINGS } from '../../shared/overrun.ts';
import type { OverrunView } from '../../shared/home-protocol.ts';
import type { PlayerEntity } from '../../shared/protocol.ts';

export type DoorState = 'shut' | 'buckling' | 'burst';

/** The warning that sets the door buckling: the second, a quarter of the clock left. */
const BUCKLING_WARNING = 1;
const BUCKLING_LEFT_SEC = OVERRUN_CLOCK_SEC * OVERRUN_WARNINGS[BUCKLING_WARNING];

/** Shut until the second warning, buckling until the breach, then burst for as long as the overrun is on show. */
export function doorState(overrun: OverrunView | undefined): DoorState {
  if (!overrun) return 'shut';
  const breached = overrun.phase === 'breached' || overrun.phase === 'held' || overrun.phase === 'lost';
  if (breached) return 'burst';
  return overrun.left <= BUCKLING_LEFT_SEC ? 'buckling' : 'shut';
}

/** The chest stands from the hold until this player opens theirs, which writes their held receipt. */
export function chestPending(overrun: OverrunView | undefined, local: PlayerEntity | null): boolean {
  const receipt = local?.home?.overrun;
  const opened = receipt?.outcome === 'held';
  return overrun?.phase === 'held' && local !== null && !opened;
}
