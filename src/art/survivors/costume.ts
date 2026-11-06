// A costume is one complete look for a survivor: a Person the rig can draw. Each survivor
// has a list in costumes/<name>.ts, default first. Only the default is worn until the
// bunker locker exists; the list is here so the art and the ids are ready for it.

import type { Person } from './rig.ts';

export interface Costume {
  /** Unique within the survivor. Saved unlocks will name it, so it never changes once shipped. */
  readonly id: string;
  /** What the locker calls it. */
  readonly name: string;
  readonly person: Person;
}
