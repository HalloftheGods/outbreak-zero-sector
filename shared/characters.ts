// The playable survivors, in the order of the art: a player's `skin` is an index into
// this table. Each one is better at one thing, and only a little.

export interface Character {
  readonly id: string;
  readonly name: string;
  /** The title screen's line about what this survivor does better. */
  readonly trait: string;
  /** Share of the normal distance a zombie can spot this survivor from. */
  readonly sightRange: number;
  /** Share of the normal reload time. */
  readonly reloadTime: number;
  /** Share of the normal walking speed. */
  readonly moveSpeed: number;
  /** Share of the normal shove knockback. */
  readonly shoveForce: number;
  /** Share of the normal chance that this survivor's kill drops something. */
  readonly dropOdds: number;
  /** Chance this survivor turns something up in a container with nothing put away in it. */
  readonly searchLuck: number;
}

const PLAIN = { sightRange: 1, reloadTime: 1, moveSpeed: 1, shoveForce: 1, dropOdds: 1, searchLuck: 0 } as const;

export const CHARACTERS: readonly Character[] = [
  { ...PLAIN, id: 'night', name: 'Night', trait: 'Moves more quietly', sightRange: 0.75 },
  { ...PLAIN, id: 'khronus8', name: 'Khronus8', trait: 'Reloads faster', reloadTime: 0.75 },
  { ...PLAIN, id: 'satori', name: 'Satori', trait: 'Runs faster', moveSpeed: 1.12 },
  { ...PLAIN, id: 'rex', name: 'Rex', trait: 'Shoves harder', shoveForce: 1.5 },
  { ...PLAIN, id: 'sol', name: 'Sol', trait: 'Finds more in searches and on kills', dropOdds: 2, searchLuck: 0.15 },
];

export function characterOf(skin: number): Character {
  return CHARACTERS[skin] ?? CHARACTERS[0];
}

export function isCharacterIndex(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < CHARACTERS.length;
}

/** The survivor asked for if nobody has them, otherwise the next one along that is free. */
export function freeCharacter(taken: ReadonlySet<number>, wanted = 0): number {
  for (let step = 0; step < CHARACTERS.length; step++) {
    const skin = (wanted + step) % CHARACTERS.length;
    if (!taken.has(skin)) return skin;
  }
  return wanted;
}
