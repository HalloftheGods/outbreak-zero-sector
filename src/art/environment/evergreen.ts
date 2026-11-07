// The spruce: a tall dark conifer built from stacked, hand-drawn bough tiers. Darker and
// bluer than the oak so the two species read apart at a glance, with a few dead lower boughs.

import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { bake } from './common.ts';

const { ink, wood, grass, teal } = RAMPS;

// s shade, d body, a blue-green body, m sparse highlight, w/b dead wood.
const NEEDLES: Legend = { s: grass[0], d: grass[1], a: teal[0], m: grass[2], w: wood[1], b: wood[0] };

const TOP = [
  '....ss....',
  '...sdas...',
  '...dama...',
  '..sdaads..',
  '..daamad..',
  '.sdaddads.',
  '.dadsdadds',
  'sd.s.d.sd.',
];

const TIER_1 = [
  '.......ss.......',
  '......sdas......',
  '.....sdaads.....',
  '....sdaamads....',
  '...sdaaddaads...',
  '..sdamaddaadds..',
  '.sdaaddsdmaaads.',
  'sdaddsd.sddaadds',
  'dd.sd....sd.sd.s',
  's.......s....s..',
];

const TIER_2 = [
  '........sd........',
  '......sdaads......',
  '....sdaamaads.....',
  '...sdaaddaaads....',
  '..sdammaddaadds...',
  '.sdaaddsdaamaads..',
  'sdaddsdd.sddaaadds',
  'dd.sdd....sddsdd.s',
  's..sd......sd..s..',
];

const TIER_3 = [
  '...........sd...........',
  '........sdaaads.........',
  '......sdaamaaads........',
  '....sdaaddaaaadds.......',
  '...sdaamaddsdaaads......',
  '..sdaaddsdaadmaaads.....',
  '.sdaddsddsdaaddaadds....',
  'sdaddsd.dsddaadd.sddss..',
  'dd.sdd...sd.sddd..sdd.s.',
  's..sd.....s..sd....s....',
];

const TIER_4 = [
  '...............sd...............',
  '............sdaaads.............',
  '.........sdaaamaaads............',
  '.......sdaaddaaaaadds...........',
  '.....sdaamaddsdaaaaads..........',
  '...sdaaddsdaadmaaaaddds.........',
  '..sdaddsddsdaaddaaaadsds........',
  '.sdaddsd.dsddaadd.sdddaads......',
  'sddsdd...sd.sddd..sdsd.sds......',
  'd.sd.....s..sd.....s....s.......',
];

// Dead lower boughs: bare, grey-brown, snapped short.
const DEAD_L = [
  '..b.......',
  '...bb.....',
  'b..wwbb...',
  '.bbwwwwbb.',
  '....b..wwb',
];
const DEAD_R = [
  '.......b..',
  '....bbb...',
  '...bwwwb.b',
  'bbwwwbb.b.',
  'wwb.b.....',
];

export function buildPine(): PixelSprite {
  const c = new PixelCanvas(38, 76);
  const ground = 72;
  const cx = 19;
  // Contact shadow, tight round the footprint.
  c.ellipse(cx, ground - 1, 9, 3, ink[1]);
  // Trunk: bare for the lowest stretch, then lost in the boughs.
  c.grid(cx - 3, ground - 18, [
    '..hwwd..',
    '..hwwd..',
    '..hwwd..',
    '..hwwd..',
    '..hwwd..',
    '..hwwd..',
    '..hwwd..',
    '..hwwd..',
    '..hwkd..',
    '..hwwd..',
    '.hhwwdd.',
    '.hwwwwdd',
    'hhwwwdwd',
    'hwdwwwdd',
    'hwwdwwdd',
    'hwwdwwwd',
    'hhwwdwdd',
    '.dd.dd.d',
  ], { h: wood[2], w: wood[1], d: wood[0], k: ink[1] });

  // Tiers from the ground up: the widest sit lowest, each overlapping the one above it.
  c.grid(cx - 16, 46, TIER_4, NEEDLES);
  c.grid(cx - 20, 50, DEAD_L, NEEDLES);
  c.grid(cx + 11, 52, DEAD_R, NEEDLES);
  c.grid(cx - 12, 37, TIER_3, NEEDLES);
  c.grid(cx - 9, 28, TIER_2, NEEDLES);
  c.grid(cx - 8, 19, TIER_1, NEEDLES);
  c.grid(cx - 5, 9, TOP, NEEDLES);
  c.outline({ selective: true });
  return bake(c, cx - 5, 10, ground);
}
