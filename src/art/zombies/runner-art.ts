// The runner's hand-drawn parts: a starved, hairless body the colour of old candle wax,
// ribs and spine showing, carrying nothing but a rag at the hips.

import type { DrawnDir, Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { FacingArt, HandArt } from './body.ts';
import { stamp } from './rig.ts';

const { ash, blood, bone, ink, olive } = RAMPS;

export const RUNNER_LEGEND: Legend = {
  k: ink[0], K: ink[1],
  a: ash[0], b: ash[1], c: ash[2], d: bone[2], e: bone[3],
  g: ash[0], h: ash[1], i: ash[2],
  r: blood[0], s: blood[1], t: blood[2], u: blood[3],
  o: olive[0], O: olive[1],
};

export const RUNNER_FACINGS: Record<DrawnDir, FacingArt> = {
  0: {
    head: stamp([
      '..dddc..',
      '.dcccbb.',
      'dcccckkb',
      'ccbcbkuk',
      'gbbbbcbc',
      '.gbbkkkc',
      '..gskek.',
      '...skk..',
    ], 2, 7),
    torso: stamp([
      '....dd.dd.dd...',
      '..ddccdccdcccd.',
      '.dcccccccccccc.',
      'dccabcabcabcccb',
      'ccgacagcagcabcb',
      'OOOabcabcabbbb.',
      'OOoOgbagbabbg..',
      'oOo.o.gg.gg....',
      '.o.............',
    ], 7, 5),
    foot: stamp(['ccb.', 'cbbb'], 1, 0),
  },
  1: {
    head: stamp([
      '..ddc...',
      '.dcccb..',
      'dcccbcb.',
      'ckkckkbb',
      'cbukbukb',
      'gbbcbbcb',
      '.gkkkkb.',
      '.skekek.',
      '..skka..',
    ], 3, 8),
    torso: stamp([
      '..dd.dd.dd...',
      '.dccdccdcccd.',
      'dcccccccccccb',
      'ccabcabcaccbb',
      'cgacagcabccba',
      'OObcabcabcbba',
      'OOoabgabgabb.',
      '.OoOgggbgab..',
      '..o...g......',
    ], 6, 5),
    foot: stamp(['ccb', 'cbbb'], 1, 0),
  },
  2: {
    head: stamp([
      '..ddcc..',
      '.dcccbb.',
      'dcccccbb',
      'ckkcbkkb',
      'cbukcuka',
      'gbbcabba',
      '.gkkkkb.',
      '.skekek.',
      '..skks..',
    ], 3, 8),
    torso: stamp([
      '...dd..dd...',
      '.ddccddccbb.',
      'dcccccccccba',
      'dcabcccbacba',
      'ccgacccagcba',
      'cbabcbcbabba',
      '.gagbcbgagb.',
      '.OOoOOoOoOo.',
      '..o.oO.o.o..',
    ], 6, 4),
    foot: stamp(['ccb', 'cba'], 1, 0),
  },
  6: {
    head: stamp([
      '..ddcc..',
      '.dcccbb.',
      'dcccccbb',
      'dccccbba',
      'cccbbbba',
      'gbbbbaa.',
      '.gbbaa..',
    ], 3, 6),
    torso: stamp([
      '....dd.dd...',
      '..dcccdcccb.',
      '.dccacacbbba',
      'dccbaabaabba',
      'cbacbacabcaa',
      'cbaccabaabaa',
      'cbbaabcabbaa',
      '.cbbaaaabba.',
      '.OOoOOOoOo..',
      '.OoOoOoOoOo.',
      '..o..o..o...',
    ], 6, 8),
    foot: stamp(['bba', 'gaa'], 1, 0),
  },
  7: {
    head: stamp([
      '..ddc...',
      '.dcccb..',
      'dcccbbb.',
      'cccbbbba',
      'ccbbbbka',
      'gbbbbaa.',
      '.gbba...',
    ], 3, 6),
    torso: stamp([
      '...dd.dd.....',
      '.dcccdcccb...',
      'dccacacbbbb..',
      'cbaabaabcba..',
      'caacacabcba..',
      'cbcaabaabba..',
      'OOOdacaaaba..',
      'OoOOoOoOo....',
      '.o...o.......',
    ], 5, 7),
    foot: stamp(['ccb', 'gba'], 1, 0),
  },
};

/** Spreading from under the body. */
export const RUNNER_POOL = [
  [
    '......rrsssrr......',
    '...rrsstsssssrr....',
    '..rssssssssssssr...',
    '...rrrsssssrrrr....',
  ],
  [
    '.....rrrrsssssrrr......',
    '..rrsstsssssssssssrr...',
    '.rsstsssssssssssssssr..',
    '..rrssssssssssssssssrr.',
    '....rrrrsssssssrrrr....',
    '.........rrrr..........',
  ],
] as const;

export const RUNNER_CLAW: HandArt = {
  down: stamp(['dcb', 'dcb.', 'd.b.'], 1, 0),
  side: stamp(['.cd.', 'dcbd', 'cb..', 'd...'], 0, 1),
  up: stamp(['d.b', 'dcb', '.c.'], 1, 2),
};
