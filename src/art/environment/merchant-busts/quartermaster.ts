// Sarge the Quartermaster's shop-screen bust: a gruff veteran in his olive field coat. A flat
// olive patrol cap with a gold badge and a stiff brim shades a lined, square-jawed face: grey
// temples, heavy brows pressed down into a stern squint, a big nose, a bushy brown chevron
// moustache over a thin set mouth, a stub of cigar in the corner and an old scar on the right
// cheek. Rank chevrons on his sleeve, a khaki shirt and dark tie in the collar, a pocket flap,
// and a clipboard gripped in his fist. Colours follow his stall figure (LOOKS in merchants.ts):
// olive coat o/p/q, cap olive, brown moustache. Lit from the upper left.
//
// k/K are ink, skin a-d, wood w/x/y/l for the moustache, brows, cigar and board, ash g/G for the
// grey hair, bone s/S/Z for the shirt, eyes and paper, fire f/F for the badge, buttons and ember.

import { RAMPS } from '../../palette.ts';
import type { BustDef } from '../../survivors/bust.ts';

const { ash, bone, fire, ink, metal, olive, skin, wood } = RAMPS;

export const QUARTERMASTER_BUST: BustDef = {
  legend: {
    k: ink[0], K: ink[1],
    a: skin[0], b: skin[1], c: skin[2], d: skin[3],
    o: olive[0], p: olive[1], q: olive[2],
    w: wood[0], x: wood[1], y: wood[2], l: wood[3],
    g: ash[1], G: ash[2],
    f: fire[2], F: fire[1],
    s: bone[1], S: bone[2], Z: bone[3],
    m: metal[2], M: metal[3],
  },
  rows: [
    '................................................',
    '................................................',
    '............kkkkkkkkkkkkkkkkkkkkkkkk............',
    '...........kqqqqqqqqqppppppppppppoook...........',
    '...........kppppppppoooooooooooooooKk...........',
    '...........kpppppppooooooooooooooooKk...........',
    '...........kppppppooookffkoooooooooKk...........',
    '...........kpppppooookfZfFkooooooooKk...........',
    '...........kppppooooookFFkoooooooooKk...........',
    '...........kpppooooooookkooooooooooKk...........',
    '...........kppoooooooooooooooooooKKKk...........',
    '.........kqqqqqqqqqqqqppppppppppppooook.........',
    '..........kKKKKKKKKKKKKKKKKKKKKKKKKKKk..........',
    '...........kkGbbbbbbbbbbbbbbbbbbbagkk...........',
    '............kGgcddddcccccccccccbbbgk............',
    '............kggdddddccbccbccccccbbgk............',
    '............kgyyyxxdccbccbcccxxxxwgk............',
    '............kgyyyyyxxwbccbwxxxxxwwgk............',
    '...........kkgbbbbwxxxwdcwxxxwbbbagkk...........',
    '..........kcbgcbkkkkkkcdcbkkkkkkabgabk..........',
    '..........kdbgdcaSKkSacdcbaSKksabbgabk..........',
    '..........kdbgddcbbbbccdcbcbbbbcdagabk..........',
    '..........kdbgddddcccccdcbcccbbdabgabk..........',
    '..........kcbgdddccccccdcbbcccdabbgabk..........',
    '..........kbbgddcccccbcddcabcdabbbgaak..........',
    '...........kkgdcccccbabccbabcccbbbgkk...........',
    '............kcddcccxyyyxwxxxwcbbbbak............',
    '............kcddcxyyyyyxwxxxxwwbbbak............',
    '............kcdcxyyyyxxwwxxxxxwwbbak............',
    '.............kccwxxxxxwwwwxxxxxwbbk.............',
    '.............kccwxxwcaKKKKabwxxwkkkkkk..........',
    '..............kcwwcccbddccbcbbwkyylyGfk.........',
    '..............kcdccbcbaaaabbbbbkxxxxgFk.........',
    '...............kccbccddccbbbbbaakkkkkkk.........',
    '................kbccccbcbbbbbaak................',
    '.................kkkkkkkkkkkkkk.................',
    '.................kbaaaaaaaaaaak.................',
    '.............kqqpkcbbbbcbbbbaakpook.............',
    '..........kkkkqqkSSbbbbbbbaaasskppkkkk..........',
    '.......kkkqqqqqpqkSSbbbbbbaasskpppooookkk.......',
    '.....kkqqqqqqqpppqkSSbbbbbasskppppoooooookk.....',
    '...kkqqqqqqqqpppppqkSSSoossskpppppoooooooookk...',
    '..kqqqqqqqqqppppppqkSSSpossskpppppoooooooooook..',
    '.kqqqqqqqqqppppppppqkSSposskppppppooooooooooook.',
    'kqqqqqqqqqpppppppppqkSSposskppppppoooooooooooook',
    'kqqqqqqokpppppppppppqkSposkpppppppokkkkkkkoooook',
    'kqqqkqqokpppppppppppqkSposkppookkkkkMmmmmkkkkkok',
    'kqqkpkqokpkkkkkkkkpppqkpokpppooklllkmmmmKklllkok',
    'kqkpqpkokpkqqqqppkpppqkpokpppooklyyykkkkkyyyxkok',
    'kqqqkqpokppkkkfkkkppppqpoppppkkkkyZZZSSSSSSyxkok',
    'kqqkpkqokpppppppppppppppkpppkcddckZKKKKKSSSyxkok',
    'kqkpqpkokppppppppppppppfkpppkbccbkZZZSSSSSSyxkok',
    'kqqqkqpokpppppppppppppppkpppkkkbkyZKKKKKKSSyxkok',
    'kqqkpkqokpppppppppppppppkpppkccbkyZZZSSSSSSyxkok',
    'kqkpppkokppppppppppppppfkpppkkkbkyZKKKKKKKSyxkok',
    'kqqppppokpppppppppppppppkpppkcbakyZZZSSSSSSyxkok',
  ],
};
