// Bullet impacts, smoke and spent brass.

import type { Clip, PixelSprite } from '../types.ts';
import { makeClip } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { cell, gridClip, gridSprite, HOT } from './shared.ts';
import type { Grid } from './shared.ts';

const { ash, blood, fire } = RAMPS;

const IMPACT: readonly Grid[] = [
  [
    '...............',
    '...............',
    '...............',
    '.......A.......',
    '.......Y.......',
    '......AWA......',
    '.....AYWYA.....',
    '...AYWWWWWYA...',
    '.....AYWYA.....',
    '......AWA......',
    '.......Y.......',
    '.......A.......',
    '...............',
    '...............',
    '...............',
  ],
  [
    '.......O.......',
    '.......A.......',
    '...O...Y...O...',
    '....A..Y..A....',
    '.....AYWYA.....',
    '......WWW......',
    '..AYYWWWWWYYA..',
    'OA....WWW....AO',
    '.....AYWYA.....',
    '....A..Y..A....',
    '...O...Y...O...',
    '.......A.......',
    '.......O.......',
    '...............',
    '...............',
  ],
  [
    '...O.......A...',
    '.......A.......',
    '....A.....Y....',
    '.......Y.......',
    '.....AY.A......',
    '......AY.......',
    'A...AYYAA....A.',
    '.......A.Y....O',
    '.....A...A.....',
    '.......Y.......',
    '...A.......O...',
    '.......O.......',
    '..O............',
    '...............',
    '...............',
  ],
  [
    '...............',
    '...R.......O...',
    '...............',
    '....O.....A....',
    '.......O.......',
    '...............',
    'O.......O......',
    '.....O.A.....O.',
    '...............',
    '.....O.........',
    '.......O.......',
    '...O.......R...',
    '...............',
    '...............',
    '...............',
  ],
];

const ASH: Legend = { a: ash[0], b: ash[1], c: ash[2] };
const BRASS: Legend = { a: fire[3], b: fire[2], c: fire[1], d: fire[0] };
const SHELL: Legend = { a: fire[3], b: fire[2], t: blood[3], u: blood[2], v: blood[1] };

const SMOKE_W = 22;
const SMOKE_H = 22;

interface Puff {
  /** How far down the cell this frame starts; the puff rises as it goes. */
  readonly y: number;
  readonly rows: Grid;
}

// Scalloped edges, one thin lit rim and a shadow underneath. There is no alpha,
// so the puff thins by opening holes and coming apart into wisps.
const SMOKE: readonly Puff[] = [
  {
    y: 10,
    rows: [
      '.........bbbb.........',
      '........cbbbba........',
      '.......cbbbbbba.......',
      '.......bbbbbbba.......',
      '.......bbbbbaa........',
      '.........aaa..........',
    ],
  },
  {
    y: 8,
    rows: [
      '..........bbb.........',
      '.........cbbbba.......',
      '......bbbcbbbbba......',
      '.....cbbbbbbbbba......',
      '.....cbbbbbbbbbba.....',
      '.....bbbbbbbbbbaa.....',
      '......bbbbaabbaa......',
      '.......aaa..aa........',
    ],
  },
  {
    y: 6,
    rows: [
      '...........bbbb.......',
      '..........cbbbbba.....',
      '.....bbb.cbbbbbbba....',
      '....cbbbbcbbbbbbba....',
      '...cbbbbbbbbbbbbbbbb..',
      '...cbbbbbbbbbbbbbbbba.',
      '...bbbbbbbbbbbbbbbbba.',
      '....bbbbbbbbbbbbbbaa..',
      '.....abbbbaabbbbaa....',
      '.......aaa...aaa......',
    ],
  },
  {
    y: 4,
    rows: [
      '..........cbbbb.......',
      '.........cbbbbbba.....',
      '....bbb.cbbbbbbbba....',
      '...cbbbbbbbbbbbbbba...',
      '..cbbbbbbba.abbbbbbb..',
      '..cbbbbba....abbbbbba.',
      '..bbbbbba...abbbbbbba.',
      '...bbbbbbbbbbbbbbbaa..',
      '....abbbbbbbbbbbaa....',
      '......aaaabbbaaa......',
      '..........aaa.........',
    ],
  },
  {
    y: 2,
    rows: [
      '..........cbbb........',
      '.........cbbbba...bb..',
      '...bb....bbbbaa..cbba.',
      '..cbbb....bbaa..cbbba.',
      '.cbbbba.........bbbba.',
      '.bbbbba...........aa..',
      '..bbaa...bbb..........',
      '...aa...cbbba...bba...',
      '.........bbaa..cbba...',
      '..........a.....aa....',
    ],
  },
  {
    y: 1,
    rows: [
      '...........aa.........',
      '..........baa.....a...',
      '..................aa..',
      '..aa..................',
      '.baa...........aa.....',
      '..a.....aa.....ba.....',
      '........baa...........',
    ],
  },
];

export function buildImpact(): Clip {
  return gridClip(IMPACT, HOT, [7, 7], 22);
}

export function buildSmoke(): Clip {
  const frames = SMOKE.map(({ y, rows }) => cell(SMOKE_W, SMOKE_H, rows, ASH, 0, y).lightEdges().toSprite(SMOKE_W, SMOKE_H, 11, 13));
  return makeClip(frames, 12, false);
}

export function buildCasing(): PixelSprite {
  return gridSprite(['abc', 'bcd'], BRASS, 1, 1);
}

export function buildShell(): PixelSprite {
  return gridSprite(['atu', 'buv'], SHELL, 1, 1);
}
