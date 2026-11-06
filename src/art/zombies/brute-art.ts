// The brute's hand-drawn parts: a slab of bruise-grey flesh with a small head sunk between its
// shoulders, bone spurs through the skin, rebar in its back, and a right arm that ends in
// a fused club of rebar and broken concrete.

import type { DrawnDir, Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { FacingArt, HandArt } from './body.ts';
import { stamp } from './rig.ts';

const { ash, blood, bone, concrete, fire, ink, metal, wood } = RAMPS;

// Flesh in three planes, all in the cool metal/ash range: a (ash[0]) the shadow side, b (metal[1])
// the mid plane, c (metal[2]) the lit plane, d (ash[2]) only on top planes such as the shoulders
// and crown. The spurs stay on bone[3]/bone[2], lighter than d, so they do not merge into it.
export const BRUTE_LEGEND: Legend = {
  k: ink[0], K: ink[1],
  a: ash[0], b: metal[1], c: metal[2], d: ash[2],
  r: blood[0], s: blood[1], t: blood[2], u: blood[3],
  e: bone[3], f: bone[2], F: bone[1],
  m: metal[1], n: metal[2], o: metal[3],
  G: concrete[1], H: concrete[2], I: concrete[3], J: bone[1],
  w: wood[0], x: wood[1], y: wood[2],
  z: fire[2], Z: fire[3],
};

export const BRUTE_FACINGS: Record<DrawnDir, FacingArt> = {
  0: {
    head: stamp([
      '...bcccb..',
      '.bccdddcb.',
      'bcdddccbba',
      'bccccbkkka',
      'bbccbkzZkb',
      'abbbbbbbcb',
      '.abbkekeka',
      '..aakkkka.',
    ], 4, 7),
    torso: stamp([
      '.........f...oo.......',
      '....cdfefcc.mn........',
      '..cdddddddccmcc.......',
      '.cddddddccccccccbb....',
      'cddddcccccccbbbbbbba..',
      'cdddcccccccbbbbbbbbba.',
      'cddcccbcccbbbbbbbbbba.',
      'cdcccbcccbbbbbssbbbbaa',
      'ccccbbccbbbbbstssbbbaa',
      'cccbbbbbbbbbbbsssbbbaa',
      'cccbbbaaabbbbbbsbbbaaa',
      '.cbbbaaaabbbbbbbbbbaa.',
      '.cbba..aacbbbbbbbbbaa.',
      '..ba...abbbbbbbbbbba..',
      '.......abbbbbbbbbbba..',
      '.......abbbbbbbbbba...',
      '.......wxxyxxxxxxw....',
      '.......xyxxxwxxxxw....',
      '........xw.xx.wx......',
    ], 11, 17),
    foot: stamp(['.ccbba.', 'cdcbbba', 'ccbbbba', 'kFFkFF.'], 2, 1),
  },
  1: {
    head: stamp([
      '...bcccb..',
      '.bccdddcb.',
      'bcdddccbba',
      'bcckkkbkkk',
      'bbckzZkbzk',
      'abbbbbbbbb',
      '.abkekekek',
      '..aakkkkka',
    ], 4, 7),
    torso: stamp([
      '......f..........f......',
      '....cdfcc...oo..fccb....',
      '..cddddddcc.mnccccccb...',
      '.cdddddcccccmccccbbbbb..',
      'cdddcccbbcccccccbbbbbbb.',
      'cddcccbbbdccccccbbbbbbb.',
      'cdcccbbbaccccccbbbbsbbba',
      'ccccbbbbacccccbbbssbbbba',
      'ccccbbbaaccccbbbstssbbba',
      'cccbbbaaabaaaaaaassabbba',
      '.cbbaa..acccccabbbbbbaa.',
      '.bba....accccbabbbbbaa..',
      '..a.....acccbbabbbbaa...',
      '........accbbbabbbba....',
      '........acbbbbbbbba.....',
      '........abbbbbbbba......',
      '........wxxyxxxxxw......',
      '........xyxxxwxxxw......',
      '.........xw.xx.wx.......',
    ], 13, 17),
    foot: stamp(['.ccbba.', 'cdcbbba', 'ccbbbbaa', '.kFFkFFk'], 2, 1),
  },
  2: {
    head: stamp([
      '...bcccb...',
      '.bccdddccb.',
      'bcddccccbba',
      'bcckkkbkkka',
      'bbkzZkbkzka',
      'abbbbcbbbba',
      '.akekekekb.',
      '..akkkkka..',
    ], 5, 7),
    torso: stamp([
      '.....f................f.....',
      '....efc.............fcF.....',
      '...cddddccc.....ccccccdcb...',
      '..cdddddcccb...cccccccbbba..',
      '.cdddccccccccccccbbbbbcbba..',
      '.cddccbbdcccccbcccccbbacbba.',
      'cddccbaccccccbabbbbbbbacbba.',
      'cdccbbacccccbbabbbbbbbabbba.',
      'ccccbbaccccbbbabbbbbbbabbba.',
      'cccbbaabaaaaaaaaaaaaababbaa.',
      '.ccbaaacccccbbsbbbbbbaabaa..',
      '.cbba.accccbbstsbbbbbaaaa...',
      '..ba..acccbbbbsbbbbbaaaa....',
      '......accccbbbabbbbbaaa.....',
      '......acccbbbbabbbbbaaa.....',
      '......acbbbbbbabbbbaaa......',
      '.......abbbbbbbbbbbaa.......',
      '.......wxxyxxxxxxxww........',
      '.......xyxxxwxxxxxxw........',
      '........xw.xx.wxx.w.........',
    ], 14, 18),
    foot: stamp(['.ccbba.', 'cdcbbba', 'ccbbbba', 'kFFkFFk'], 3, 1),
  },
  6: {
    head: stamp([
      '...bcccb...',
      '.bccdddcbb.',
      'bcddcccbbba',
      'bcdccbbbbba',
      'bccbbbbbbba',
      'abbbbbbbba.',
      '.abbbbbaa..',
      '...aaaa....',
    ], 5, 7),
    torso: stamp([
      '.....f...........oo...f.....',
      '....efc..........mn.fcF.....',
      '...cddddccc.....ccmcccccb...',
      '..cdddddcccccccccccccbbbba..',
      '.cdddccccccccbcccbbbbbcbba..',
      '.cddccbbccccbacccbbbbbacbba.',
      'cddccbaccccbbacbbbbbbbacbba.',
      'cdccbbacccbbbabbbbbbbbabba..',
      'ccccbbaccbbbbabbbbbbbbabba..',
      'cccbbaabbaaaaaaaaabbbbaaba..',
      '.ccbaabcccbbbabbbbbbaaaba...',
      '.cbba.acccbbbabbbbbbbaaa....',
      '..ba..accbbbbabbbbbbbaa.....',
      '......acbbbbbabbbbbbbaa.....',
      '......acbbbbbabbbbbbaa......',
      '......abbbbbbabbbbbbaa......',
      '.......abbbbbbbbbbbaa.......',
      '.......wxxyxxxxxxxww........',
      '.......xyxxxwxxxxxxw........',
      '........xw.xx.wxx.w.........',
    ], 14, 18),
    foot: stamp(['.bbbba.', 'cbbbbba', 'bbbbbaa', 'aaaaaa.'], 3, 1),
  },
  7: {
    head: stamp([
      '...bcccb..',
      '.bccdddcb.',
      'bcddcccbbb',
      'bcdccbbbbk',
      'bccbbbbbbz',
      'abbbbbbbbb',
      '.abbbbbbaa',
      '...aaaaa..',
    ], 4, 7),
    torso: stamp([
      '.....f.........oo.......',
      '....efcc.......mn.fc....',
      '...cddddcc....ccmcccb...',
      '..cdddddccccccccccbbbb..',
      '.cdddccccccccccbbbbbbbb.',
      '.cddccbccccaccbbbbbbbbba',
      'cddcbbacccbacbbbbbbbbbba',
      'cdccbbaccbbabbbbbbbbaba.',
      'cccbbbacbbbabbbbbbbbaba.',
      'ccbbbaabaaaaaaabbbbaaba.',
      '.cbaabccbbbabbbbbaaaba..',
      '.bba.accbbbabbbbbbaaa...',
      '..a..acbbbbabbbbbbaa....',
      '.....acbbbbabbbbbbaa....',
      '.....abbbbbabbbbbaa.....',
      '......abbbbbbbbbaa......',
      '......wxxyxxxxxww.......',
      '......xyxxxwxxxxw.......',
      '.......xw.xx.wx.........',
    ], 11, 18),
    foot: stamp(['.bbba.', 'cbbbba', 'bbbbaa', 'aaaaa.'], 2, 1),
  },
};

export const BRUTE_FIST: HandArt = {
  down: stamp(['.ccbba.', 'cdcbbba', 'cbbbbba', 'cFFbFFa', '.aaaaa.'], 3, 0),
  side: stamp(['.ccbF', 'cccbF', 'cbbbb', 'cbbbF', '.aabF'], 0, 2),
  up: stamp(['.aaaaa.', 'cFFbFFa', 'cbbbbba', 'cdcbbba', '.ccbba.'], 3, 4),
};

/** Face down with the rebar still standing in its back and the club flung out in front. */
export const BRUTE_CORPSE = [
  '......................oo....................',
  '..............f.......mn.........f..........',
  '.............efc.....ccnbb......efc.........',
  '..........bcddddccccccccbbbbbbccddcb........',
  '.......bccdddddcccccccbbbbbbbbcdddccb.......',
  '.....bccddddcccccbbbbbbbbbbbbbbcdccbbbbb....',
  '....bcddcccccbbbbbbbbbbbbbbbbbbbbbbbbbcccb..',
  '...bcdcccbbbbbbbbbbbbbbbabbbbbbbbbbbccdddcb.',
  '...bcccbbbbbbbbbbbbbbbbbabbbbbbbbabbcdddccba',
  '..wxxcbbbbbbbbbbbbbbbbbbabbbbbbbaabbccccbbba',
  '..xyxxbbbbbbbbbbbbbbbbbbbbbbbbaa..abbbbkkkba',
  '..xxwxabbbbbbbbbbbbbbbbbbbbaaa.....abkkkbba.',
  '.ccbbaaaabbbbbbbbbbbbbbaaaaa.......aakkkaa..',
  'cdccba...aaaaaaaaaaaaaaa..ccbba............',
  'cdcbba.....ccbbba........cdcbbba...........',
  'ccbbba....cdcbbbaa.......ccbbbbaa..........',
  '.aaaa.....ccbbbba.........FkFkFk...........',
  '...........kFkFk...........................',
];

export const BRUTE_POOL = [
  [
    '.........rrsssssrrrrsssrrr..........',
    '.....rrsssstssssssssssssssssrr......',
    '...rrsssssssssssssssssssssssssr.....',
    '....rrrsssssssssssssssssssrrrr......',
    '........rrrrrrsssssrrrr.............',
  ],
  [
    '.......rrrrrsssssssrrrrrsssrrrr.........',
    '...rrrssssstssssssssssssssssssssrrr.....',
    '.rrsssssssssssssstssssssssssssssssrr....',
    'rssstssssssssssssssssssssssssssssssssr..',
    '.rrsssssssssssssssssssssssssssssssrrr...',
    '...rrrrrsssssssssssssssssssssrrrr.......',
    '........rrrrrrrssssssrrrrr..............',
  ],
] as const;

/**
 * The rebar from fist to block, as ribbon cross-sections. Every section is filled: a gap inside
 * the club would be inked by the outline and crawl as a checker from frame to frame.
 */
export const CLUB_REBAR: readonly string[] = ['onm', 'nmom', 'onnm', 'onm'];

/** A broken block of kerb at the end of the rebar. Pivot where the rebar goes in. */
export const CLUB_BLOCK = stamp([
  '....JJIIo.....',
  '..IJJIIHon....',
  '.JJIIIIHHHH...',
  'JJIIIHHHHHHG..',
  'JIIIHHHHHHHGGo',
  'IIIHHHoHHGGGG.',
  'IIHHHHnHGGGGG.',
  'IHHHGHHHGGGGG.',
  '.HHGGGHGGGGG..',
  '..GGG.GGGG....',
], 6, 4);
