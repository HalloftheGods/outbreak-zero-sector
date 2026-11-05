// The three guns, one hand-drawn grid per drawn facing. Local ink is baked in so a gun
// reads over the jacket; the figure's outline goes around everything afterwards.
//
// All points are in grid pixels. `at` puts the grid in the cell at rest.

import type { WeaponId } from '../../../shared/protocol.ts';
import type { DrawnDir, Legend, Point } from '../kit.ts';
import { RAMPS } from '../palette.ts';

const { blood, bone, fire, ink, metal, wood } = RAMPS;

export const GUN_LEGEND: Legend = {
  k: ink[0], K: ink[1],
  a: metal[0], b: metal[1], c: metal[2], d: metal[3],
  w: wood[0], x: wood[1], y: wood[2], z: wood[3],
  M: metal[0], N: metal[1],
};

/** The same gun with the magazine pulled: its letters go transparent. */
export const GUN_LEGEND_EMPTY: Legend = { ...GUN_LEGEND, M: null, N: null };

export const SHELL_LEGEND: Legend = { r: blood[2], R: blood[1], g: fire[2], G: bone[2] };
export const MAG_LEGEND: Legend = { k: ink[0], a: metal[0], b: metal[1], c: metal[2] };

export const MAG_GRID = ['cb', 'cb', 'ba'];
export const SHELL_GRID = ['rr', 'rR', 'gg'];

export interface GunView {
  readonly rows: readonly string[];
  readonly at: Point;
  /** Where the trigger hand closes. */
  readonly grip: Point;
  /** Where the support hand closes. */
  readonly fore: Point;
  /** Where a magazine or shell goes in. */
  readonly port: Point;
  /** The last pixel of the barrel. */
  readonly tip: Point;
  /** A pump that slides back on its own, for the shotgun. */
  readonly pump?: { readonly rows: readonly string[]; readonly at: Point };
}

export interface GunDefinition {
  readonly views: Readonly<Record<DrawnDir, GunView>>;
  /** Pixels the gun jumps back along its axis on the two recoil frames. */
  readonly kick: readonly [number, number];
}

const PISTOL: GunDefinition = {
  kick: [1, 2],
  views: {
    0: {
      at: [27, 20],
      rows: [
        'dddddddk',
        'cccccbbk',
        'kbbkkkk.',
        '.bak....',
        '.aak....',
      ],
      grip: [2, 3], fore: [1, 4], port: [2, 5], tip: [7, 0],
    },
    1: {
      at: [27, 25],
      rows: [
        'ddk....',
        'cdck...',
        'kcddk..',
        '.kbddk.',
        '..kbck.',
        '...kk..',
      ],
      grip: [1, 2], fore: [0, 3], port: [0, 3], tip: [4, 4],
    },
    2: {
      at: [18, 22],
      rows: [
        '.kk.',
        'kddk',
        'kdck',
        'kcbk',
        'kcbk',
        'kKak',
        '.kk.',
      ],
      grip: [-1, 2], fore: [4, 3], port: [1, 2], tip: [1, 5],
    },
    6: {
      at: [25, 9],
      rows: [
        '.kk.',
        'kdbk',
        'kcbk',
        'kcak',
        'kcak',
        'kcak',
      ],
      grip: [1, 6], fore: [2, 6], port: [1, 6], tip: [1, 0],
    },
    7: {
      at: [26, 10],
      rows: [
        '....kk.',
        '...kdbk',
        '..kdcbk',
        '.kdcbk.',
        'kdcbk..',
        'kcbk...',
        '.kk....',
      ],
      grip: [1, 6], fore: [0, 6], port: [0, 6], tip: [5, 0],
    },
  },
};

const CARBINE: GunDefinition = {
  kick: [1, 2],
  views: {
    0: {
      at: [18, 19],
      rows: [
        '.....ddk............',
        'yx...cbbk.......d...',
        'zyxkcdddddddddcccccck',
        'yxxkbbbbbbbbbaabkkkk.',
        'xx..kkMNbakkkkkk.....',
        '.....kMNk............',
        '.....kMNk............',
        '......kMNk...........',
      ],
      grip: [5, 4], fore: [12, 4], port: [6, 5], tip: [20, 2],
    },
    1: {
      at: [17, 19],
      rows: [
        'xy..............',
        'yyxk............',
        '.xyxkck.........',
        '..kbcdck........',
        '...kbcddck......',
        '...MkbcddbK.....',
        '..MNkkbcbdck....',
        '...MNk.kbbcdk...',
        '....N...kkbcdk..',
        '..........kbcdk.',
        '...........kbbk.',
        '............kk..',
      ],
      grip: [5, 5], fore: [9, 7], port: [3, 7], tip: [13, 10],
    },
    2: {
      at: [17, 19],
      rows: [
        '.kdk.',
        'kzyxk',
        'kdcbk',
        'kdcbk',
        'kdcak',
        'kcbak',
        '.dck.',
        '.dck.',
        'kdcak',
        'kcKak',
        '.kkk.',
      ],
      grip: [-1, 4], fore: [5, 6], port: [2, 4], tip: [2, 9],
    },
    6: {
      at: [24, 5],
      rows: [
        '..kk..',
        '.kcbk.',
        '.kcbk.',
        '.kcbk.',
        '.kdbk.',
        '.kdbk.',
        'kdcbak',
        'kdcbak',
        'kcbbak',
        'kcbbak',
        'kcbbak',
        'kcbbak',
      ],
      grip: [2, 12], fore: [3, 8], port: [2, 10], tip: [2, 0],
    },
    7: {
      at: [23, 6],
      rows: [
        '..........kk.',
        '.........kdbk',
        '........kdbk.',
        '.......kdbk..',
        '......kdcbk..',
        '.....kdcbk...',
        '....kdcbk....',
        '...kdcbak....',
        '..kdcbak.....',
        '.kdcbak......',
        'kcbbak.......',
        '.kkkk........',
      ],
      grip: [3, 9], fore: [6, 6], port: [4, 8], tip: [11, 1],
    },
  },
};

const SHOTGUN: GunDefinition = {
  kick: [2, 3],
  views: {
    0: {
      at: [17, 19],
      rows: [
        'wxx..............',
        'yyxwkbbcddddddddk',
        'xxxwkbbbaaaaaaabk',
        'xwwkkkkkkkkkkkkk.',
        'ww.....bbaabaa...',
      ],
      grip: [5, 3], fore: [11, 3], port: [7, 3], tip: [16, 1],
      pump: {
        at: [9, 2],
        rows: [
          'yyzyyyx',
          'xyyyyxw',
          '.wwwww.',
        ],
      },
    },
    1: {
      at: [17, 19],
      rows: [
        'xy..............',
        'yxxk............',
        '.xxwkck.........',
        '..wwbdck........',
        '...kbcddk.......',
        '....kbcddk......',
        '.....kbcddk.....',
        '......kbcddk....',
        '.......kbcddk...',
        '........kbcddk..',
        '.........kbcdk..',
        '..........kbbk..',
        '...........kk...',
      ],
      grip: [5, 4], fore: [9, 7], port: [6, 5], tip: [12, 10],
      pump: {
        at: [6, 5],
        rows: [
          '.yy...',
          'xyyy..',
          'wxyyy.',
          '.wxyyy',
          '..wxyx',
          '...ww.',
        ],
      },
    },
    2: {
      at: [17, 19],
      rows: [
        '.kxk.',
        'kyxwk',
        'kxxwk',
        'kdcbk',
        'kdcbk',
        'kdcbk',
        'kdcbk',
        'kdcbk',
        'kdcbk',
        'kcKak',
        '.kkk.',
      ],
      grip: [-1, 3], fore: [5, 6], port: [2, 3], tip: [2, 9],
      pump: {
        at: [0, 5],
        rows: ['kyyxk', 'kyyxk', 'kxxwk'],
      },
    },
    6: {
      at: [25, 7],
      rows: [
        '.kk.',
        'kdbk',
        'kdbk',
        'kdbk',
        'kdbk',
        'kdbk',
        'kdbk',
        'kcbk',
        'kcbk',
        'kcbk',
      ],
      grip: [2, 10], fore: [2, 6], port: [2, 7], tip: [1, 0],
      pump: {
        at: [-1, 4],
        rows: ['kyyxwk', 'kyyxwk', 'kxxwwk'],
      },
    },
    7: {
      at: [23, 7],
      rows: [
        '.........kkk',
        '........kdcb',
        '.......kdcbk',
        '......kdcbk.',
        '.....kdcbk..',
        '....kdcbk...',
        '...kdcbk....',
        '..kdcbak....',
        '.kdcbak.....',
        'kcbbak......',
        '.kkkk.......',
      ],
      grip: [3, 8], fore: [6, 5], port: [4, 7], tip: [11, 1],
      pump: {
        at: [4, 3],
        rows: [
          '....yy',
          '...yyx',
          '..yyxw',
          '.yyxw.',
          'yyxw..',
        ],
      },
    },
  },
};

export const GUNS: Readonly<Record<WeaponId, GunDefinition>> = { pistol: PISTOL, carbine: CARBINE, shotgun: SHOTGUN };

/** Unit steps along each facing, in cell space. */
export const AXIS: Readonly<Record<DrawnDir, Point>> = {
  0: [1, 0],
  1: [1, 1],
  2: [0, 1],
  6: [0, -1],
  7: [1, -1],
};
