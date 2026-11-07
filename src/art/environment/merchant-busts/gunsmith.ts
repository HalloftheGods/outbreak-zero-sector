// Mags the Gunsmith's shop-screen bust, matching her stall figure (merchant-people/gunsmith.ts): a
// seamed leather work cap pulled low, welding goggles pushed up on it with amber lenses
// catching the light; a black jaw-length bob, one lock falling under the peak; a square adult
// jaw, one brow cocked and a lopsided smirk; a smear of gun oil across her cheek. A leather
// apron with brass rivets over a metal-grey work coat, an open-end wrench in the bib pocket.
//
// Lit from the upper left. Cap and apron are wood h/i/j/l, coat and wrench metal m/n/o/p,
// lenses fire f/g/G/F (G also the rivets), hair K with ash w/W strands, the oil smear ash w
// edged in skin a. k is the ink outline.

import { RAMPS } from '../../palette.ts';
import type { BustDef } from '../../survivors/bust.ts';

const { ash, blood, bone, fire, ink, metal, skin, teal, wood } = RAMPS;

export const GUNSMITH_BUST: BustDef = {
  legend: {
    k: ink[0], K: ink[1],
    a: skin[0], b: skin[1], c: skin[2], d: skin[3],
    h: wood[0], i: wood[1], j: wood[2], l: wood[3],
    m: metal[0], n: metal[1], o: metal[2], p: metal[3],
    f: fire[0], g: fire[1], G: fire[2], F: fire[3],
    w: ash[0], W: ash[1],
    z: bone[3], e: teal[1], r: blood[1],
  },
  rows: [
    '................................................',
    '.......................kk.......................',
    '..................kkkkkljkkkkk..................',
    '...............kkkjlljlljjhiiikkk...............',
    '.............kkjjllljllljjihiiiihkk.............',
    '............kjjlllljlljjjiiihiiiihhk............',
    '...........kjjlllljljjjjiiiiihiiihhhk...........',
    '..........kjjlllljjjjjjiiiiiiihiiihhhk..........',
    '..........kjjjkkkkkkkiiiiiikkkkkkkhhhk..........',
    '..........kjjkopppppnkiiiikoppppnnkhhk..........',
    '..........kKKkoFGGGgnkkookkoFGGgfnkKKk..........',
    '..........kKKkoGGGggnkknnkkoGggffnkKKk..........',
    '..........kiiknggggfmkiiihknfffffmkhhk..........',
    '..........kiiikkkkkkkiiihhhkkkkkkkhhhk..........',
    '.........kjjjlllllljjjjjjjjjjiiiiiiiihk.........',
    '.........kkhhhhhhhhhhhhhhhhhhhhhhhhhhkk.........',
    '.........kKkkhhhhhhhhhhhhhhhhhhhhhhkkKk.........',
    '.........kwKKkkkkkkkkkkkkkkkkkkkkkkKKKk.........',
    '.........kWwKbbKKbbbbbbbbbbbbbbbbaaKKKk.........',
    '.........kWwKbcdKdcccccccccKKKKKKbaKwKk.........',
    '.........kwWKbcKKKKKKcccccccccccbKaKwKk.........',
    '.........kKwKbkakkkkkcccccckkkkkkkaKKKk.........',
    '.........kKWKbckzeKekccccbckzeKekbaKKKk.........',
    '.........kwwKbcabbbbaccccbcabbbbbbaKwKk.........',
    '.........kWKKbddcccccccdcbccccccbbaKKKk.........',
    '.........kWwKbdcccwacccdcbccccccbbaKwKk.........',
    '.........kwWKbcawwwccccdcbccccccbbaKwKk.........',
    '.........kKwKbccacccccddcbccccccbbaKKKk.........',
    '.........kKwKbccccccbakbbkabccccbbaKKKk.........',
    '.........kwKKbcccccccccbbcccccccbbaKKwk.........',
    '.........kwKKbccccccccccccckkbccbbaKwKk.........',
    '.........kKKKkbccccakkkkkkkcccccbakKKKk.........',
    '..........kKKkkbcccccbrrrbcccccbakkKKk..........',
    '...........kkk.kbccccccbbbcccccak.kkk...........',
    '................kbccccdcccccbbak................',
    '..................kkaabbbbaakk..................',
    '...................kkkkkkkkkk...................',
    '...................kaaaaaaaak...................',
    '...................kbbbaaaaak...................',
    '..............kkkkkkbcbbaaaakkkkkk..............',
    '..........kkkkppljnoKbbbaaaKnnjinmkkkk..........',
    '.......kkkpppppoljnopKbbaaKonnjinnnnmmkkk.......',
    '.....kkppppooooljnooopKbaKonnnnjinnnnnnmmkk.....',
    '...kkpppooooooljnoooooookknnnkkjinnnnnnnnmmkk...',
    '.kkppooooooonnljnoooooookpknkokjinnnnnnnnnnmmkk.',
    'kpooooooooonnkljkkkkkkkkkppkookjiknnnnnnnnnnnmmk',
    'kpooooonoooooklGllllllllkpppookjGiknnnnnmnnnnmmk',
    'kpooooonoooookljjjjjjjjjjkppokiiihknnnnnmnnnnmmk',
    'kpooooonoooookljjjjjjjjjjjkpokiiihknnnnnmnnnnmmk',
    'kpooooonoooookljjjjjjjjjjjkpokiiihknnnnnmnnnnmmk',
    'kpooooonoooookljjjjjjjjkkkkkkkkkkhknnnnnmnnnnmmk',
    'kpooooonoooookljjjjjjjjklllllljikhknnnnnmnnnnmmk',
    'kpooooonoooookljjhhjjjjkjjjjiiihkhknnnnnmnnnnmmk',
    'kpooooonoooookljhhhjjjjkjjjjiiihkhknnnnnmnnnnmmk',
    'kpooooonoooookljjjjjjjjkjjjjiiihkhknnnnnmnnnnmmk',
    'kpooooonoooookljjjjjjjjkjjjjiiihkhknnnnnmnnnnmmk',
  ],
};
