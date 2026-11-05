// Muzzle flashes and tracers. Each flash is hand drawn facing E and SE, with the barrel
// tip at the anchor. Frame one is the hard star, two is the star tearing open, three is
// embers. The shotgun fans wide, the carbine thrusts long, the pistol stays small.

import { WEAPON_ORDER } from '../../../shared/protocol.ts';
import type { WeaponId } from '../../../shared/protocol.ts';
import type { DirClips } from '../types.ts';
import { HOT, turnedClips } from './shared.ts';
import type { Grid } from './shared.ts';

const FLASH_FPS = 30;
const TRACER_FPS = 20;

const PISTOL_E: readonly Grid[] = [
  [
    '.......A.....',
    '...O...AO....',
    '....AO.YA.O..',
    '...OAYYWYAAO.',
    '.AYWWWWWWWYAO',
    '...OAYYWYAAO.',
    '....AO.YA.O..',
    '...O...AO....',
    '.......A.....',
  ],
  [
    '.....O.......',
    '......A...O..',
    '..O...AY.A...',
    '...AOYYWYA...',
    '.OAYWWWYYYAAO',
    '...AOYYWYA...',
    '..O...AY.A...',
    '......A...O..',
    '.....O.......',
  ],
  [
    '.............',
    '........O....',
    '.....O..A..R.',
    '....OA.A.....',
    '..OAAYAA.OAR.',
    '....OA.A.....',
    '.....O..A..R.',
    '........O....',
    '.............',
  ],
];

const PISTOL_SE: readonly Grid[] = [
  [
    '...........',
    '.A.....O...',
    '..YY...A...',
    '..YWY..A.O.',
    '...YWYAY.A.',
    '....YWWYA..',
    '.OAAAWWWYA.',
    '...AYYWWWYO',
    '.....A.YWAA',
    '...O.A..AY.',
    '.......O..O',
  ],
  [
    '...........',
    '.......O...',
    '.OA....A...',
    '..AYY..A.O.',
    '...YWY.Y.A.',
    '...AYWYYA..',
    '..OAAYWWYAA',
    '...O.YYWWA.',
    '...OA..AYAO',
    '.....A..AO.',
    '.........O.',
  ],
  [
    '...........',
    '.......O...',
    '...O.......',
    '....A...O..',
    '....OA.A...',
    '......YA...',
    '...OAAAAO.R',
    '......AOA..',
    '....O...O..',
    '.......O..R',
    '...........',
  ],
];

const CARBINE_E: readonly Grid[] = [
  [
    '..........O......',
    '...O......A......',
    '....A.....AY..O..',
    '....OAY.AYWA.A...',
    '.....AYYWWWYYA...',
    '.AYWWWWWWWWWWYYAO',
    '.....AYYWWWYYA...',
    '....OAY.AYWA.A...',
    '....A.....AY..O..',
    '...O......A......',
    '..........O......',
  ],
  [
    '.................',
    '.......O.........',
    '........A.....O..',
    '...O....AY...A...',
    '....AOYYYWYAAY...',
    '.OAYWWWWYYWWYYAAO',
    '....AOYYYWYAAY...',
    '...O....AY...A...',
    '........A.....O..',
    '.......O.........',
    '.................',
  ],
  [
    '.................',
    '.................',
    '.........O.....R.',
    '.....O...A.......',
    '....OAA.A...O....',
    '..OAAYAAYA.AAOOR.',
    '....OAA.A...O....',
    '.....O...A.......',
    '.........O.....R.',
    '.................',
    '.................',
  ],
];

const CARBINE_SE: readonly Grid[] = [
  [
    '.............',
    '.AY.....O....',
    '.YWY....A....',
    '..YWY...A..O.',
    '...YWYAAY.A..',
    '....YWWWYA...',
    '...AAWWWWY...',
    '.OAAAYWWWWYA.',
    '.....AYYWWWYA',
    '..O.A...YWWY.',
    '...A....AYWYA',
    '.......O..AYA',
    '...........AO',
  ],
  [
    '.............',
    '.OA.....O....',
    '..AY....A....',
    '..AYY...A....',
    '...YWYAAY..O.',
    '....YWWYYAA..',
    '...AAYWWYY...',
    '..OA.YYWWYA..',
    '.....AYWWWYAA',
    '...OA..YWWYA.',
    '...A...AAYYAO',
    '..........AAO',
    '............O',
  ],
  [
    '.............',
    '.............',
    '...OA........',
    '.....A..O....',
    '.....OA.A....',
    '......AYA..R.',
    '....OAAYAA...',
    '.....O.AYAO..',
    '....A...AOA..',
    '........O.AO.',
    '...O.......O.',
    '............R',
    '.............',
  ],
];

const SHOTGUN_E: readonly Grid[] = [
  [
    '............O........',
    '.......O....A........',
    '........A...AO....O..',
    '........AY..YA...A...',
    '....O....AY.YA..AY...',
    '.....A...AYYWYA.YA...',
    '.....OAY.YWWWYAYA....',
    '...AAYYYWWWWWWYYA..O.',
    '.AYYWWWWWWWWWWWWYYAAO',
    '...AAYYYWWWWWWYYA..O.',
    '.....OAY.YWWWYAYA....',
    '.....A...AYYWYA.YA...',
    '....O....AY.YA..AY...',
    '........AY..YA...A...',
    '........A...AO....O..',
    '.......O....A........',
    '............O........',
  ],
  [
    '.........O...........',
    '..........A....O.....',
    '.....O....A....A.....',
    '......A...AY..AY...O.',
    '......AY..YA..YA..A..',
    '.......AY.YWY.YA.AY..',
    '...O...AYYWWYYYAAY...',
    '....AOYYWWWYYWWYYA...',
    '.OAYWWWWWYYYWWWWWYAAO',
    '....AOYYWWWYYWWYYA...',
    '...O...AYYWWYYYAAY...',
    '.......AY.YWY.YA.AY..',
    '......AY..YA..YA..A..',
    '......A...AY..AY...O.',
    '.....O....A....A.....',
    '..........A....O.....',
    '.........O...........',
  ],
  [
    '.....................',
    '...............R.....',
    '...........O.........',
    '......O....A.....R...',
    '.......A....O..O.....',
    '.......OA...A.A...O..',
    '.....O..AA.A.AA......',
    '....OAA.AYAAYA..O....',
    '..OAAAYAAAYAAAOA.OOR.',
    '....OAA.AYAAYA..O....',
    '.....O..AA.A.AA......',
    '.......OA...A.A...O..',
    '.......A....O..O.....',
    '......O....A.....R...',
    '...........O.........',
    '...............R.....',
    '.....................',
  ],
];

const SHOTGUN_SE: readonly Grid[] = [
  [
    '................',
    '.YW.............',
    '.WWY.......O....',
    '..YWY......A..O.',
    '...YWY.....A.A..',
    '....YWY...AYYA..',
    '.....YWWYYWWY...',
    '.....YWWWWWYAAAO',
    '.....YWWWWWWYA..',
    '......YWWWWWWY..',
    '.....YYWWWWWWWY.',
    '...OAYAYYWWWYWWA',
    '..A.A.A..YWY.YWY',
    '.O..A.....YA..YA',
    '....A.....A....A',
    '....O.....O.....',
  ],
  [
    '................',
    '.OA.............',
    '..AY.......O....',
    '..YWY......A..O.',
    '...YWY.....Y.A..',
    '....YWY....YYA..',
    '.....YWYYYWWY...',
    '.....YYWWYYYAAAO',
    '.....YWYYWWWYA..',
    '......YWWYYWWY..',
    '.....AYYWWYWWWY.',
    '...OA.AYYYWYYWWA',
    '..A..A...YWA.YWY',
    '.O...A....YA..YA',
    '.....O....A....A',
    '..........O.....',
  ],
  [
    '................',
    '................',
    '...O.......O....',
    '....A.......R...',
    '..........A...O.',
    '.....A.A..Y.A...',
    '......AYAAYA....',
    '.....AYAAYAA.OOR',
    '......AAYAAYA...',
    '..O...YAAYAAYA..',
    '...A.AA.AAY.AAO.',
    '......A...AO..AO',
    '...O...O.....A..',
    '.......A..O....R',
    '.R............R.',
    '.......R........',
  ],
];

interface Flash {
  readonly e: readonly Grid[];
  readonly se: readonly Grid[];
  /** Row of the barrel tip in the E drawing. The SE drawing always has it at 1,1. */
  readonly tipRow: number;
}

const FLASHES: Record<WeaponId, Flash> = {
  pistol: { e: PISTOL_E, se: PISTOL_SE, tipRow: 4 },
  carbine: { e: CARBINE_E, se: CARBINE_SE, tipRow: 5 },
  shotgun: { e: SHOTGUN_E, se: SHOTGUN_SE, tipRow: 8 },
};

// The anchor is the bullet, so the streak trails back from it.
const TRACER_E: readonly Grid[] = [
  [
    '......OAY...',
    'RROOAAYYWWW.',
    '......OAY...',
  ],
  [
    '.......OA...',
    '...OOAAYWWWW',
    '.......OA...',
  ],
];

const TRACER_SE: readonly Grid[] = [
  [
    'R........',
    '.O.......',
    '..OA.....',
    '...AY....',
    '....YW.A.',
    '....AWW..',
    '......WW.',
    '.......W.',
    '.........',
  ],
  [
    '.........',
    '.........',
    '..O......',
    '...A.....',
    '....YW...',
    '.....WW..',
    '.....AWW.',
    '.......WW',
    '........W',
  ],
];

export function buildMuzzle(): Record<WeaponId, DirClips> {
  const entries = WEAPON_ORDER.map((id): [WeaponId, DirClips] => {
    const { e, se, tipRow } = FLASHES[id];
    return [id, turnedClips(e, se, HOT, [0, tipRow], [1, 1], FLASH_FPS)];
  });
  return Object.fromEntries(entries) as Record<WeaponId, DirClips>;
}

export function buildTracer(): DirClips {
  return turnedClips(TRACER_E, TRACER_SE, HOT, [11, 1], [7, 7], TRACER_FPS, true);
}
