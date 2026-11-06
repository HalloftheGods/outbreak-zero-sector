import { HOME_LOOP_LIVE } from '../../shared/home-protocol.ts';

/** Whether this page plays from the bunker: once the switch is flipped, or in a dev build that asked with `?home`. */
export function homeLoopOn(search: string, dev: boolean, live: boolean = HOME_LOOP_LIVE): boolean {
  const asked = new URLSearchParams(search).has('home');
  return live || (dev && asked);
}
