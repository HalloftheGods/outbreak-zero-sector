// The bloater's hand-drawn parts: a swollen, sagging gut the yellow of old fat, a head
// far too small for it, and pustules ready to go. Pustules are placed by hand per facing
// and stamped apart from the belly so they can throb.

import type { DrawnDir, Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { FacingArt, HandArt } from './body.ts';
import { stamp } from './rig.ts';

const { acid, blood, bone, denim, fire, ink, olive, rot, violet } = RAMPS;

export const BLOATER_LEGEND: Legend = {
  k: ink[0], K: ink[1],
  a: rot[0], b: rot[1], c: olive[1], d: olive[2], e: rot[3], f: bone[2],
  p: acid[0], q: acid[1], Q: acid[2],
  r: blood[0], s: blood[1], t: blood[2],
  g: denim[0], h: denim[1], i: denim[2],
  v: violet[0], z: fire[2],
};

/** The shirt it outgrew and the splits in its skin, laid over the belly grid at x, y. */
export const BLOATER_MARKS: Record<DrawnDir, readonly (readonly [number, number, readonly string[]])[]> = {
  0: [
    [1, 3, [
      '..ii...hg.....',
      '.iiih.hhhg....',
      'iiihhhhhhhg...',
      'iiihhhhhhgg...',
      'iihhhhhgggg...',
      'ihg.hhg.gg....',
      '.h...g........',
    ]],
    [10, 21, ['bb', 'ca']],
  ],
  1: [
    [4, 3, [
      '..iih.hhg....',
      '.iiihhhhhhg..',
      'iiihhhhhhhgg.',
      'iiihhhhhhggg.',
      'iihhhhhhgggg.',
      'ihg.hhg..gg..',
      '.h...g.......',
    ]],
    [15, 20, ['bb', 'ca']],
  ],
  2: [
    [7, 3, [
      '.iii.....hhg...',
      'iiiih...hhhgg..',
      'iiihhhhhhhhhgg.',
      'iiihhhhhhhhggg.',
      'iihhhhhhhgggggg',
      'ihhhhg.hhgggg..',
      '.hg.h...g.gg...',
      '..h........g...',
    ]],
    [12, 13, ['.r', 'rs', 'r.']],
    [14, 20, ['bb', 'ca']],
  ],
  6: [
    [6, 5, [
      '..iiihhhhhhhhgg..',
      '.iiihhhhhhhhhggg.',
      'iiihhhhhhhhhhgggg',
      'iihhhhhhcbhhhgggg',
      'iihhhhhcdbhhggggg',
      'ihhhhg.hhhhg.gggg',
      '.hg.h...hg...gg..',
      '..h...........g..',
    ]],
  ],
  7: [
    [4, 5, [
      '.iiihhhhhhhhgg...',
      'iiihhhhhhhhhggg..',
      'iihhhhhhhhhhgggg.',
      'iihhhhhcbhhhgggg.',
      'iihhhhcdbhhggggg.',
      'ihhhg.hhhhg.gggg.',
      '.hg.h...hg...gg..',
      '..h...........g..',
    ]],
  ],
};

export const BLOATER_FACINGS: Record<DrawnDir, FacingArt> = {
  0: {
    head: stamp([
      '..eedc..',
      '.eddddb.',
      '.dddkQk.',
      '.dcdccb.',
      '.bcddkk.',
      '..bbcqk.',
    ], 3, 4),
    torso: stamp([
      '......eeedd................',
      '....fffeeeddd..............',
      '...ffffeeedddc.............',
      '..effffeeedddcc............',
      '..ffffeeeedddcc............',
      '.eefeeeeeddddccb...........',
      '.eeeeeeeddbbbbbbdd.........',
      '.eeeeeedbbbbeeeedddd.......',
      '.deeedbbfffeeeeeeddddd.....',
      '.ddddbfffffeeeeeedddddc....',
      '..ddbffffffeeeeeedddddcc...',
      '..dbffffffeeeeeeddddddccc..',
      '..eefffffeeeeeeeddddddcccb.',
      '..eeeffeeeeeeeedddddddcccb.',
      '..eeeeeeeeeeeedddddddccccb.',
      '..eeeeeeeeeeeddddddddcccbb.',
      '.deeeeeeeeedddddddddccccbba',
      '..deeeeeeddddddddddccccbbb.',
      '..ddddddddddddddddccccbbba.',
      '..dddddddddddddddccccbbbba.',
      '..dddddddddddddcccccbbbbaa.',
      '...ddddddddddccccccbbbbaa..',
      '....cdddddccccccccbbbbaa...',
      '.....cccccccccccbbbbbaa....',
      '......cccccccbbbbbbaaa.....',
      '........bbbbbbbbbbaa.......',
      '..........bbbbbaaa.........',
    ], 11, 24),
    foot: stamp(['.dedcc.', 'ddddcbb', 'bbbbbaa'], 3, 0),
  },
  1: {
    head: stamp([
      '..eedc..',
      '.eddddb.',
      '.dkQkQk.',
      '.dcdccb.',
      '.bcbkkb.',
      '..bbqkb.',
    ], 3, 4),
    torso: stamp([
      '.........eeeed...............',
      '.......fffeeeddd.............',
      '......ffffeeedddd............',
      '.....ffffeeeeddddc...........',
      '....effffeeeeddddcb..........',
      '....eeeeeeeeddddccb..........',
      '....eeeeeeebbbbbbbb..........',
      '...deeeebbbbeeeeeebbdd.......',
      '....debbbfffeeeeeedddddc.....',
      '....dbbfffffeeeeeeddddddc....',
      '....bfffffffeeeeeeddddddcc...',
      '...efffffffeeeeeeeddddddccc..',
      '...effffffeeeeeeedddddddccc..',
      '..eeeffeeeeeeeeedddddddccccb.',
      '..eeeeeeeeeeeeeddddddddcccbb.',
      '..eeeeeeeeeeeeddddddddccccbb.',
      '.deeeeeeeeeedddddddddccccbbba',
      '..deeeeeeeddddddddddcccccbbb.',
      '..dddddddddddddddddcccccbbba.',
      '..ddddddddddddddddcccccbbbba.',
      '...dddddddddddddccccccbbbba..',
      '...dddddddddddcccccccbbbbaa..',
      '....cddddddccccccccbbbbbaa...',
      '.....ccccccccccccbbbbbbaa....',
      '......ccccccccbbbbbbbaaa.....',
      '........bbbbbbbbbbbaaa.......',
      '...........bbbbbaaa..........',
    ], 14, 24),
    foot: stamp(['.dedc.', 'ddddcb', 'bbbbaa'], 3, 0),
  },
  2: {
    head: stamp([
      '..eedc..',
      '.eddddb.',
      '.dkQdkQb',
      '.ddcdccb',
      '.bcbkkbb',
      '..bbkqb.',
    ], 3, 4),
    torso: stamp([
      '...........eeeeedd...........',
      '.........effeeeedddc.........',
      '........effffeeeedddc........',
      '.......effffeeeeddddcc.......',
      '.......efffeeeeeddddcc.......',
      '......eeeeeeeeedddddccb......',
      '......eeeebbbbbbbbbcccb......',
      '......ebbbbbeeeeebbbbbb......',
      '.....ebbfffeeeeeeedddbbc.....',
      '....fffffffeeeeeeeddddddc....',
      '...ffffffffeeeeeeeddddddcc...',
      '..efffffffeeeeeeedddddddccc..',
      '.eeffffffeeeeeeeedddddddcccb.',
      '.eeeffeeeeeeeeeedddddddccccb.',
      'eeeeeeeeeeeeeeeddddddddccccbb',
      'eeeeeeeeeeeeedddddddddccccbbb',
      'eeeeeeeeeeeedddddddddcccccbbb',
      'deeeeeeeedddddddddddcccccbbba',
      'dddddddddddddddddddcccccbbbba',
      '.ddddddddddddddddccccccbbbba.',
      '.dddddddddddddddccccccbbbbaa.',
      '..ddddddddddddccccccbbbbbaa..',
      '...cddddddcccccccccbbbbbaa...',
      '....cccccccccccccbbbbbbaa....',
      '.....cccccccccbbbbbbbaaa.....',
      '.......bbbbbbbbbbbbaaa.......',
      '..........bbbbbaaaa..........',
    ], 14, 24),
    foot: stamp(['.dedcc.', 'ddddcbb', 'bbbbbaa'], 3, 0),
  },
  6: {
    head: stamp([
      '..eedc..',
      '.eddddb.',
      '.ddddcb.',
      '.dcccbb.',
      '.bcbbba.',
      '..bbba..',
    ], 3, 4),
    torso: stamp([
      '...........eeeeedd...........',
      '.........effeeeedddd.........',
      '........fffffeeeedddc........',
      '.......effffeeeeddddcc.......',
      '......efffffeeeeddddccb......',
      '.....effffeeeeeddddddcbb.....',
      '.....efffeeeeeedddddccbb.....',
      '....eefeeeeeeeedddddcccbb....',
      '....eeeeeeeeeeddddddcccbb....',
      '...feeeeeeeeeeddddddcccbbb...',
      '...ffeeeeeeeeeddddddccccbb...',
      '..efffeeeeeeeeddddddccccbbb..',
      '..effeeeeeeeeedddddcccccbbb..',
      '.eefeeeeeeeeeddddddcccccbbbb.',
      '.eeeeeeeeeeeeddddddcccccbbbb.',
      'eeeeeeeeeeeeedddddcccccbbbbbb',
      'eeeeeeeeeeeedddddccccccbbbbbb',
      'deeeeeeeeedddddddcccccbbbbbba',
      'ddddddddddddddddcccccbbbbbbba',
      '.ddddddddddddddddccccccbbbba.',
      '.dddddddddddddddccccccbbbbaa.',
      '..ddddddddddddccccccbbbbbaa..',
      '...cddddddcccccccccbbbbbaa...',
      '....cccccccccccccbbbbbbaa....',
      '.....cccccccccbbbbbbbaaa.....',
      '.......bbbbbbbbbbbbaaa.......',
      '..........bbbbbaaaa..........',
    ], 14, 24),
    foot: stamp(['.ddcc.', 'dcccbb', 'bbbbaa'], 3, 0),
  },
  7: {
    head: stamp([
      '..eedc..',
      '.eddddb.',
      '.ddddcb.',
      '.dcccbk.',
      '.bcbbba.',
      '..bbba..',
    ], 3, 4),
    torso: stamp([
      '.........eeeedd..............',
      '.......effeeeeddd............',
      '......ffffeeeedddc...........',
      '.....fffffeeeeddddcc.........',
      '....effffeeeeddddddcb........',
      '...effffeeeeedddddccbb.......',
      '...efffeeeeeeddddddccbb......',
      '...eefeeeeeeedddddddccbb.....',
      '..feeeeeeeeeedddddddcccbb....',
      '..ffeeeeeeeeeddddddcccccbb...',
      '..fffeeeeeeeeddddddccccccbb..',
      '.efffeeeeeeeedddddcccccccbb..',
      '.effeeeeeeeedddddcccccccbbbb.',
      '.eefeeeeeeeddddddcccccccbbbb.',
      '.eeeeeeeeeedddddcccccccbbbbbb',
      '.eeeeeeeeedddddcccccccbbbbbbb',
      '.eeeeeeeddddddcccccccbbbbbbbb',
      '.deeeeddddddddcccccccbbbbbbba',
      '..ddddddddddddcccccccbbbbbbba',
      '...dddddddddddddddcccccbbbba.',
      '...ddddddddddddddcccccbbbbaa.',
      '....dddddddddddccccccbbbbba..',
      '....cdddddddcccccccbbbbbaaa..',
      '.....cccccccccccccbbbbbaaa...',
      '.......ccccccccbbbbbbaaa.....',
      '.........bbbbbbbbbbaaa.......',
      '...........bbbbbaaaa.........',
    ], 14, 24),
    foot: stamp(['.ddc.', 'dcccb', 'bbbaa'], 2, 0),
  },
};

export const BLOATER_HAND: HandArt = {
  down: stamp(['fed', 'edc', 'e.c'], 1, 0),
  side: stamp(['fe.', 'edc', 'dcc'], 0, 1),
  up: stamp(['e.c', 'edc', 'fed'], 1, 2),
};

/** The belly giving way: a jagged split of pus and acid. */
export const RUPTURE = [
  '..............Q...............',
  '.......q......Qq.......q......',
  '........Q...qQQq.....QQ.......',
  '.........qQ.qQQQq..qQQ........',
  '..Q.......QQqQQQQqQQQq...q....',
  '...qq...qqQQQQQQQQQQQq.qQ.....',
  '.....qQQQQQQQffQQQQQQQQQq.....',
  '......qQQQQffffffQQQQQq.......',
  '.qqQQQQQQQffffffffQQQQQQQqq...',
  '...qQQQQQQfffffffffQQQQQqqq...',
  '.....qQQQQQffffffQQQQQq.......',
  '......qQQQQQQffQQQQQQQq.......',
  '.....qQ.qQQQQQQQQQQqqQQq......',
  '....Q...qQQqQQQqQQq...qQ......',
  '..q....qQ..qQQ..qQ.....Qq.....',
  '.......Q...qQ....qQ.....q.....',
  '......q.....Q.....Q...........',
];

/** A beat later: the skin slumps open and what was in it is in the air. */
export const SLUMP = [
  '.........edc..........',
  '........eddcb.........',
  '........dkQkb.........',
  '.....deddddcbbcd......',
  '....deeeedcbbcddcb....',
  '...deeedcbqQqbcddcb...',
  '..deeddcqQQQQqbcdccb..',
  '..dedcbqQffQQqpbcccb..',
  '.ddddcbqQQQQQqpbbccbb.',
  '.ddccbbpqQQqqpbbcccbb.',
  'bddcbcbbpqqppbbcdccbba',
  'bbcccbbbbppbbbcdccbbba',
  '.bbbbbcbbbbbbccbbbba..',
  '...aabbbbbbbbbbbaa....',
];

/** Flung drops around the slump, placed by hand at x, y in the cell. */
export const DROPS: readonly (readonly [number, number, readonly string[]])[] = [
  // Three clusters on the ground ellipse (squashed by the 0.5 ground tilt), each with a streak flung outward.
  [1, 21, ['Qqp']], [4, 24, ['qQ']], [1, 26, ['q']], [7, 27, ['Q']],
  [34, 20, ['pqQ']], [37, 23, ['q']], [32, 25, ['Qq']], [36, 27, ['Q']],
  [12, 15, ['q']], [16, 14, ['Qq']], [21, 15, ['Q']], [25, 16, ['pqQ']], [29, 17, ['q']],
];

/** All that is left: the empty skin, the head on top of it, a stub of arm. */
export const SACK = [
  '..........eedc................',
  '.........edddcb...............',
  '.....deeeedkQkcbbcddc.........',
  '...deeeffeddcdbbcdddcbb.......',
  '..deeffeeeddkkkbcddcccbb......',
  '.deeeeeeddcbbbbcddcccbbbb.....',
  '.ddeeeddcbbcdddddcccbbcbbb....',
  'ddddddcbbcdddeedccbbccdcbba...',
  'bcddcbbcddeeddcbbccdddcbbba...',
  '.bbcbbcdddddcbbcdddcccbbaa....',
  '..bbbbbccccbbbbcccbbbbaa......',
  '....aabbbbbbbbbbbbbaa.........',
];

/** The acid that stays behind, small then spreading. */
export const ACID_POOL = [
  [
    '.....pppppqqqpppppp...........',
    '..ppqqqqqqqqQqqqqqqqqpp.......',
    'pqqqqqQqqqqqqqqqqqqqqqqqpp....',
    'pqqqqqqqqqqqqqqqqqqqqqqqqqp...',
    '.ppqqqqqqqqqqqqqqqqqqqqqpp....',
    '...pppppqqqqqqqqqqqppppp......',
  ],
  [
    '........ppppppqqqqqpppppp.........',
    '...pppqqqqqqqqqqQqqqqqqqqqqpp.....',
    '.ppqqqqQqqqqqqqqqqqqqqqqqqqqqqpp..',
    'pqqqqqqqqqqqqqqqqqqqqqqQqqqqqqqqp.',
    'pqqqQqqqqqqqqqqqqqqqqqqqqqqqqqqqqp',
    '.ppqqqqqqqqqqqqqqqqqqqqqqqqqqqpp..',
    '...ppppppqqqqqqqqqqqqqqpppppp.....',
    '..........ppppppppppppp...........',
  ],
] as const;

/** Pustule stamps, small to ripe. */
export const PUSTULES = [
  ['pq', 'qp'],
  ['.q.', 'pQq', '.p.'],
  ['.qq.', 'qQQp', 'qQqp', '.pp.'],
];

/** Hand-placed pustules: grid x, y and ripeness, relative to the belly's top-left. */
export const PUSTULE_SPOTS: Record<DrawnDir, readonly (readonly [number, number, number])[]> = {
  0: [[18, 12, 2], [22, 17, 0], [19, 19, 1], [5, 16, 0], [8, 20, 0]],
  1: [[14, 11, 2], [19, 14, 0], [23, 16, 1], [20, 9, 0], [16, 20, 0]],
  2: [[5, 14, 2], [10, 17, 0], [21, 14, 1], [24, 18, 0], [15, 20, 1]],
  6: [[4, 15, 2], [8, 19, 0], [21, 16, 1], [15, 21, 0]],
  7: [[6, 15, 2], [11, 19, 0], [20, 17, 1], [24, 15, 0]],
};
