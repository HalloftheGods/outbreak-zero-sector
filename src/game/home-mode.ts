// Which parts of Campaign this build turns on. Read once per run, so a run never changes under a player.

import { OVERRUN_LIVE } from '../../shared/home-protocol.ts';

/** Add this to the address of a dev build to play with the overrun before it is live. */
const OVERRUN_QUERY = 'overrun';

/** The overrun's horde clock: on for everyone once it is live, and before then only in a dev build asked for it. */
export function overrunOn(search: string, dev: boolean): boolean {
  return OVERRUN_LIVE || (dev && new URLSearchParams(search).has(OVERRUN_QUERY));
}
