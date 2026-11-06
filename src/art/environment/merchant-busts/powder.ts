// Cinder the Powder maker's shop portrait, matching the stall figure (merchants.ts LOOKS.powder):
// a rust-orange coat under an ink hood, the ink scarf pulled down off the face and bunched at the
// throat. An adult face: long jaw, soot swiped across one cheek, a crooked smirk and one brow
// cocked. The singed fringe that pokes out of the hood ends in ember tips, and the eyes glow
// ember orange with a flame glint. A leather bandolier of red-capped powder cartridges with a
// brass buckle crosses the chest.
//
// Lit from the upper left. The hood is ink K/k with metal m, ash H and a metal M crest along the
// lit rim. Skin is a/b/c/d with the soot in a/H. Hair is wood w/W/l, singed tips fire O/E. The
// coat is fire o with lit shoulders O, blood r shade and R edge. Strap is wood w/l/L, cartridges
// bone z/g/f under blood R/r caps, buckle fire E/O/y. k is the ink outline.
import { RAMPS } from '../../palette.ts';
import type { BustDef } from '../../survivors/bust.ts';

const { ash, blood, bone, fire, ink, metal, skin, wood } = RAMPS;

export const POWDER_BUST: BustDef = {
  legend: {
    k: ink[0], K: ink[1], m: metal[0], H: ash[0], M: metal[1],
    a: skin[0], b: skin[1], c: skin[2], d: skin[3],
    w: wood[0], W: wood[1], l: wood[2], L: wood[3],
    R: blood[0], r: blood[1], o: fire[0], O: fire[1], E: fire[2], y: fire[3],
    z: bone[3], g: bone[2], f: bone[1],
  },
  rows: [
    '................................................',
    '................................................',
    '....................kkkkkkkk....................',
    '.................kkkHHHmmmmmkkk.................',
    '...............kkHHHHHmmmmmmmKKkk...............',
    '..............kHHHHHHmmmmmmmKKKKKk..............',
    '.............kHHHHHHHmmmmmmmKKKKKKk.............',
    '............kHHHHHMMMMMMHHHHHmmKKKKk............',
    '............kHHHMMHmkkkkkkkkmmKKKKKk............',
    '...........kHHHMHmkkwwwwwwwwkkKKKKKKk...........',
    '...........kHHMmHkwWWWWWWWwwwwkKKKKKk...........',
    '..........kHmMmkwWlWWWWwWWWwwwwwkKmKKk..........',
    '..........kHmMmkwWlWWwWlWWwWlWWwkKmKKk..........',
    '..........kHmMmkwWlWwWlWWwWlWwWwkKmKkk..........',
    '..........kHmMmkwWlbwWlWwWlwbwOEkKmKkk..........',
    '..........kHmMmkwOEcbwWlcwOEcbbakKmKkk..........',
    '..........kHmMmkbcccdcwOEcbwwwbakKmKkk..........',
    '..........kHmMmkbWwwwccdccwbbbwakKmKkk..........',
    '..........kHmMmkKkkkkwcdcbkkkkKakKmKkk..........',
    '..........kHmMmkcOyEOkcdcbkOyEOakKmKkk..........',
    '..........kHmMmkcboobccdcbbboobakKmKkk..........',
    '..........kHmMmkcddccccdcbbccbbakKmKkk..........',
    '..........kHmHmkcddddccdcbbcbbbakKmKkk..........',
    '..........kHmHmkcddddccdcbbbbbaakKmKkk..........',
    '..........kmmHmkcaHHacbdcabbbaaakKmKkk..........',
    '..........kmmHmkcccaacabbabbbaaakKmKkk..........',
    '..........kmmHmkbcccccccbbbbbbaakKmKkk..........',
    '..........kmmHmkbccccccbbbbbabbakKmKkk..........',
    '..........kmmHmkkbccbbaaaaaabbakkKmKkk..........',
    '..........kmmHmkkbcccdddcbbbbbakkKmKkk..........',
    '..........kmmHmkkkbccccccbbbbakkkKmKkk..........',
    '..........kmmHmkkkkbcccccbbbakkkkKmKkk..........',
    '.........kmkmmKkkkakbbcccbbbkakkkkkkkkk.........',
    '.........kkmmKKkkkaaakkkkkkaaakkkkkkkkk.........',
    '.........kkmmkHHHmmKkmmmmKKkmmKKKKkkkkk.........',
    '.........kmmkHHmmmKkHHHmmKKkmKKKKKKkkkk.........',
    '..........kmkmHHmKkmmHmmKKkKmmKKKKKkkk..........',
    '.........kOKkKmmKkKmmKKKKkKKmKKKKkKkkrk.........',
    '.......kkOOOKkKKkKKKKKKkkKKKKKKKkKkkOrrkk.......',
    '.....kkOOOOkkkkkKKKKKKKKKKKKKKKkkkOoooorrkk.....',
    '....kOkwllLkRrkKkkkkkkkkkkkkkkkkkOoooooorrrk....',
    '...kOOOOkwlkzgkkkkkoooooooooooOOOoooooooorrRk...',
    '...kOOOOOokkgfkkRrkooooooorooOOoooooooooorrRk...',
    '..kOOOOOoookwllkzgkooooooorooOoooooooooooorrRk..',
    '.kOOOOoooooookwkgfkoooooooroooooooooooooorrrrRk.',
    '.kOOOooooooooookwllLkoooooroooooooooooooorrrrRk.',
    '.kOOoroooooooooookwllkkkkkroooooooooooooorrrrRk.',
    '.kooorooooooooooookwlkEyOkroooooooooooooorrrrRk.',
    '.kooooroooooooooooookkOEokroooooooooooooorrrrRk.',
    '.koooorooooooooooooookkkkkLkokkkkoooooooorrrrRk.',
    '.kooooroooooooooooooooookwllLkRrkoooooooorrrrRk.',
    '.koooooroooooooooooooooookwllkzgkkkkkoorrrrrrRk.',
    '.koooooroooooooooooooooooorkwkgfkkRrkorrrrrrrRk.',
    '.koooooroooooooooooooooooorookwllkzgkrrrrrrrrRk.',
    '.koooooroooooooooooooooooorooookwkgfkrrrrrrrrRk.',
    '.kooooooroooooooooooooooooroooookwllLkrrrrrrrRk.',
  ],
};
