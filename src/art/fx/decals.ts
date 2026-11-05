// Permanent ground stains. They sit under everything, so they stay dark: most of a
// stain is the two lowest steps of its ramp, and the wet highlight is a few pixels.

import type { PixelSprite } from '../types.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { gridSprite } from './shared.ts';
import type { Grid } from './shared.ts';

const { acid, blood, rot } = RAMPS;

const BLOOD: Legend = { a: blood[0], b: blood[1], c: blood[2] };
const ACID: Legend = { a: rot[0], b: acid[0], c: acid[1] };

const BLOOD_STAINS: readonly Grid[] = [
  [
    '.aa...a.',
    'abba....',
    'abbba...',
    '.aaa..a.',
  ],
  [
    '.aa....a....',
    'aba......aa.',
    '.a...aa..aa.',
    '....abba....',
    '.a...aa...a.',
  ],
  [
    '...aa.......',
    '..abbaa...a.',
    '.abbbbbaa...',
    '.abcbbbbba..',
    'aabbbbbbbba.',
    '.aabbbbbaa..',
    '...aaabba...',
    '.a....aa....',
  ],
  [
    '.....aaa.......',
    '..a.abbba..a...',
    '...abbbbbaa....',
    '..abccbbbbba...',
    '.abbcbbbbbbaa.a',
    '.abbbbbbbbbbba.',
    'aabbbbbbbbbaa..',
    '.aaabbbbbaa....',
    '....aabaa..aa..',
    '.a...aa....a...',
  ],
  [
    '........aaa...........',
    '.a...aaabbbaa.....a...',
    '....abbbbbbbbaa.......',
    '...abbccbbbbbbbaa..aa.',
    '..abbbcbbbbbbbbbbaabba',
    '.aabbbbbbbbbbbbbbbbbaa',
    'aabbbbbbbbbbbbbbaaa...',
    '.aabbbbbbbbbbbba...aa.',
    '...aaabbbbbbaaa...abba',
    '.a....aabbaa.......aa.',
    '...a...aaa..aa........',
    '..............a.......',
  ],
  [
    '..........aaaa............',
    '.....aaa.abbbbaa....aa....',
    '...aabbbabbbbbbbaaaabba...',
    '..abbbbbbbccbbbbbbbbbbbaa.',
    '..abbbbbbbcbbbbbbbbbbbbba.',
    '.aabbbbbbbbbbbbbbbbbbbbbaa',
    'abbbbcbbbbbbbbbbbbbbbbbbba',
    'aabbbbbbbbbbbbbbbbbbbbbaa.',
    '.aaabbbbbbbbbbbbbbbbaaa...',
    '...aabbbbbbbbbbbbbbba.....',
    '....aabbbaaabbbbbaaa...a..',
    '.a...aaa.....aaba.....aba.',
    '..............aa.......a..',
  ],
  [
    '......................a.',
    '.....aa.......a.......ab',
    '..aaabbaa...aa....aa..a.',
    '.abbbbbbaa.abba..abba...',
    'aabcbbbbbbaabbba..aa..a.',
    '.abbbbbbaa.abba.......ab',
    '..aaabbaa...aa....a.....',
    '.....aa............a....',
  ],
  [
    '...a..................a.....',
    '..aabbaa.aab..a..ab.a.......',
    'aabbbbbbbbbbbaabbb.abb..a...',
    'abbcbbbcbbbbbbbbbbbabbba.ab.',
    'aabbbbbbbbbbbabbbbb.bba.a...',
    '..aabbbaabaa..aa.ab..a......',
    '.....a...........a..........',
  ],
];

const ACID_STAINS: readonly Grid[] = [
  [
    '...aaa....a...',
    '.aabbbaaa.....',
    'abbbbbbbbaa...',
    'abccbbbbbbba.a',
    'aabbbbbbbbbaa.',
    '.aaabbbbbaa...',
    '....aaaaa..aa.',
    '.a.........aa.',
  ],
  [
    '.......aaaa.........',
    '...aaaabbbbaa...a...',
    '..abbbbbbbbbbaa.....',
    '.abbbcbbbbbbbbbaaa..',
    'aabbccbbbbaabbbbbba.',
    'abbbbbbbbbaabbbcbbaa',
    'aabbbbbbbbbbbbbbbaa.',
    '.aaabbbbbbbbbbaaa...',
    '....aaabbbbaaa...aa.',
    '.a.....aaaa......aa.',
  ],
  [
    '.........aaaa.....aa......',
    '....aaaaabbbbaa.aabba.....',
    '..aabbbbbbbbbbbabbbbbaa...',
    '.abbbccbbbbbbbbbbbbbbbbaa.',
    'aabbbcbbbbbbaabbbbbbbbbbba',
    'abbbbbbbbbbbaabbbbcbbbbbaa',
    'aabbbaabbbbbbbbbbbbbbbba..',
    '.aabbaabbbbbbbbbbbbbbaa...',
    '...aabbbbbbbbbbbaabbba..aa',
    '.a...aaabbbbbbbaaaaaa...aa',
    '.......aaaabbaa...........',
    '...aa......aa.............',
  ],
];

function stains(grids: readonly Grid[], legend: Legend): PixelSprite[] {
  return grids.map((rows) => gridSprite(rows, legend, Math.floor(rows[0].length / 2), Math.floor(rows.length / 2)));
}

export function buildBloodDecals(): PixelSprite[] {
  return stains(BLOOD_STAINS, BLOOD);
}

export function buildAcidDecals(): PixelSprite[] {
  return stains(ACID_STAINS, ACID);
}
