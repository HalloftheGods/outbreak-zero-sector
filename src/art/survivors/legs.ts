// Leg strips for the survivor paper doll. Each strip is one leg, hand drawn, hanging
// from the hip. A walk is a table of strips, so both legs stay lit from the upper left
// instead of mirroring the shading, and a leg can be swapped per frame.
//
// Letters: r q p thigh light to dark, R Q P shin (so shorts can bare the skin),
// g f e boot light to dark.

import type { DrawnDir } from '../kit.ts';

export type Strip = readonly string[];

export interface LegSet {
  /** Cell column of each leg's strip. */
  readonly nearX: number;
  readonly farX: number;
  readonly strips: Readonly<Record<string, Strip>>;
  /** Strip names through one stride, six frames. The far leg runs half a cycle behind. */
  readonly cycle: readonly string[];
  readonly stand: readonly [near: string, far: string];
}

const FRONT: Readonly<Record<string, Strip>> = {
  long: ['rqqp', 'rqqp', 'rqqp', 'RQQP', 'RQQP', 'RQQP', 'fggf', 'fggf', 'eeee'],
  stand: ['rqqp', 'rqqp', 'rqqp', 'RQQP', 'RQQP', 'fggf', 'fggf', 'eeee'],
  short: ['rqqp', 'rqqp', 'RQQP', 'RQQP', 'fggf', 'fggf', 'eeee'],
  lifted: ['rqqp', 'rqqp', 'RQQP', 'PQQP', 'eeee', '.ee.'],
};

const BACK: Readonly<Record<string, Strip>> = {
  long: ['rqqp', 'rqqp', 'rqqp', 'RQQP', 'RQQP', 'RQQP', 'gffe', 'gffe', 'eeee'],
  stand: ['rqqp', 'rqqp', 'rqqp', 'RQQP', 'RQQP', 'gffe', 'gffe', 'eeee'],
  short: ['rqqp', 'rqqp', 'RQQP', 'RQQP', 'gffe', 'gffe', 'eeee'],
  lifted: ['rqqp', 'rqqp', 'RQQP', 'RQQP', 'gffe', 'eeee'],
};

const FRONT_CYCLE = ['long', 'stand', 'short', 'lifted', 'short', 'stand'];

const SIDE: Readonly<Record<string, Strip>> = {
  stand: [
    '....rqqp....',
    '....rqqp....',
    '....rqqp....',
    '....RQQP....',
    '....RQQP....',
    '....fgggf...',
    '....fggggf..',
    '....eeeeee..',
  ],
  forward: [
    '....rqqp....',
    '....rqqqp...',
    '.....rqqp...',
    '.....rqqqp..',
    '......RQQP..',
    '......RQQQP.',
    '......fgggf.',
    '......eeeeee',
  ],
  under: [
    '....rqqp....',
    '....rqqp....',
    '....rqqqp...',
    '.....rqqp...',
    '.....RQQP...',
    '.....RQQP...',
    '.....fgggf..',
    '.....eeeeee.',
  ],
  behind: [
    '....rqqp....',
    '...rqqqp....',
    '...rqqp.....',
    '..rqqqp.....',
    '..RQQP......',
    '..RQQP......',
    '..fgggf.....',
    '...eeeee....',
  ],
  trailing: [
    '....rqqp....',
    '...rqqp.....',
    '..rqqqp.....',
    '.rqqp.......',
    'RQQP........',
    'fgf.........',
    '.ggf........',
    '..ee........',
  ],
  passing: [
    '....rqqqp...',
    '....rqqqqp..',
    '.....rqqqp..',
    '.....RQQP...',
    '....RQQP....',
    '...fgggf....',
    '...eeeeee...',
  ],
  reaching: [
    '....rqqqp...',
    '....rqqqqp..',
    '.....rqqqp..',
    '.....rqqqqp.',
    '......RQQP..',
    '......fgggf.',
    '......eeeeee',
  ],
};

const SIDE_CYCLE = ['forward', 'under', 'behind', 'trailing', 'passing', 'reaching'];

const QUARTER_FRONT: Readonly<Record<string, Strip>> = {
  stand: [
    '...rqqp...',
    '...rqqp...',
    '...rqqp...',
    '...RQQP...',
    '...RQQP...',
    '...fgggf..',
    '...fgggf..',
    '...eeeee..',
  ],
  forward: [
    '...rqqp...',
    '...rqqqp..',
    '....rqqp..',
    '....rqqqp.',
    '.....RQQP.',
    '.....RQQP.',
    '.....RQQP.',
    '.....fgggf',
    '.....fgggf',
    '.....eeeee',
  ],
  under: [
    '...rqqp...',
    '...rqqp...',
    '...rqqqp..',
    '....RQQP..',
    '....RQQP..',
    '....RQQP..',
    '....fgggf.',
    '....fgggf.',
    '....eeeee.',
  ],
  behind: [
    '...rqqp...',
    '...rqqp...',
    '..rqqqp...',
    '..RQQP....',
    '..RQQP....',
    '..fgggf...',
    '..eeeee...',
  ],
  trailing: [
    '...rqqp...',
    '..rqqqp...',
    '..rqqp....',
    '.RQQP.....',
    '.fgff.....',
    '.eeee.....',
  ],
  passing: [
    '...rqqqp..',
    '...rqqqp..',
    '....RQQP..',
    '....RQQP..',
    '...fgggf..',
    '...eeeee..',
  ],
  reaching: [
    '...rqqqp..',
    '...rqqqqp.',
    '....rqqqp.',
    '.....RQQP.',
    '.....RQQP.',
    '.....fgggf',
    '.....fgggf',
    '.....eeeee',
  ],
};

const QUARTER_BACK: Readonly<Record<string, Strip>> = {
  stand: [
    '...rqqp...',
    '...rqqp...',
    '...rqqp...',
    '...RQQP...',
    '...RQQP...',
    '...gffe...',
    '...gffee..',
    '...eeeee..',
  ],
  forward: [
    '...rqqp...',
    '...rqqqp..',
    '....rqqp..',
    '....RQQP..',
    '....gffe..',
    '....gffee.',
    '....eeeee.',
  ],
  under: [
    '...rqqp...',
    '...rqqp...',
    '...rqqqp..',
    '....RQQP..',
    '....RQQP..',
    '....gffe..',
    '....gffee.',
    '....eeeee.',
  ],
  behind: [
    '...rqqp...',
    '...rqqp...',
    '..rqqqp...',
    '..RQQP....',
    '..RQQP....',
    '..RQQP....',
    '..gffe....',
    '..gffee...',
    '..eeeee...',
  ],
  trailing: [
    '...rqqp...',
    '..rqqqp...',
    '..rqqp....',
    '.RQQP.....',
    '.RQQP.....',
    '.RQQP.....',
    '.gffe.....',
    '.eeee.....',
  ],
  passing: [
    '...rqqqp..',
    '...rqqqp..',
    '....RQQP..',
    '...RQQP...',
    '...gffe...',
    '...eeee...',
  ],
  reaching: [
    '...rqqqp..',
    '...rqqqqp.',
    '....rqqqp.',
    '.....RQQP.',
    '.....gffe.',
    '.....gffee',
    '.....eeeee',
  ],
};

export const LEG_SETS: Readonly<Record<DrawnDir, LegSet>> = {
  0: { nearX: 14, farX: 16, strips: SIDE, cycle: SIDE_CYCLE, stand: ['stand', 'under'] },
  1: { nearX: 13, farX: 18, strips: QUARTER_FRONT, cycle: SIDE_CYCLE, stand: ['stand', 'stand'] },
  2: { nearX: 15, farX: 21, strips: FRONT, cycle: FRONT_CYCLE, stand: ['stand', 'stand'] },
  6: { nearX: 21, farX: 15, strips: BACK, cycle: FRONT_CYCLE, stand: ['stand', 'stand'] },
  7: { nearX: 18, farX: 13, strips: QUARTER_BACK, cycle: SIDE_CYCLE, stand: ['stand', 'stand'] },
};
