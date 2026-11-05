// The bloater: a walking gut. It waddles side to side on stub legs while the belly lags
// behind and throbs, and its death is a rupture.

import { ZOMBIES } from '../../../shared/constants.ts';
import { dirClips, makeClip } from '../kit.ts';
import type { DrawnDir, PixelCanvas } from '../kit.ts';
import type { PixelSprite, ZombieArt } from '../types.ts';
import { posed } from './body.ts';
import type { BodyPlan, Pose } from './body.ts';
import { flatFrame, stamp } from './rig.ts';
import type { Stamp } from './rig.ts';
import {
  ACID_POOL, BLOATER_FACINGS, BLOATER_HAND, BLOATER_LEGEND, BLOATER_MARKS, DROPS, PUSTULE_SPOTS, PUSTULES, RUPTURE, SACK, SLUMP,
} from './bloater-art.ts';

const PLAN: BodyPlan = {
  cell: 44,
  ox: 22,
  oy: 37,
  legend: BLOATER_LEGEND,
  hipWidth: 6,
  hipHeight: 5,
  shoulderWidth: 9,
  shoulderHeight: 15,
  neckHeight: 5,
  thigh: 3,
  shin: 3,
  upperArm: 4,
  foreArm: 4,
  legs: [
    { upper: ['eddcb'], lower: ['ddccb'] },
    { upper: ['eddcb'], lower: ['ddccb'] },
  ],
  arms: [
    { upper: ['fed'], lower: ['edc'] },
    { upper: ['fed'], lower: ['edc'] },
  ],
  hands: [BLOATER_HAND, BLOATER_HAND],
  facings: BLOATER_FACINGS,
  headOnTop: true,
};

/** Grows or shrinks a belly through its plain middle row and column, so its outline stays clean. */
function swell(art: Stamp, dw: number, dh: number): Stamp {
  const rowAt = Math.floor(art.rows.length * 0.55);
  const colAt = Math.floor(art.rows[0].length * 0.5);
  const rows = [...art.rows];
  if (dh > 0) rows.splice(rowAt, 0, ...Array<string>(dh).fill(rows[rowAt]));
  if (dh < 0) rows.splice(rowAt, -dh);
  const wide = rows.map((row) => {
    if (dw > 0) return row.slice(0, colAt) + row[colAt].repeat(dw) + row.slice(colAt);
    if (dw < 0) return row.slice(0, colAt) + row.slice(colAt - dw);
    return row;
  });
  return stamp(wide, art.px + Math.ceil(dw / 2), art.py + dh);
}

interface Belly {
  readonly dw: number;
  readonly dh: number;
  /** Pustule ripeness shift for the throb. */
  readonly ripe: number;
}

function drawBloater(dir: DrawnDir, pose: Pose, belly: Belly): PixelSprite {
  const shaped = swell(BLOATER_FACINGS[dir].torso, belly.dw, belly.dh);
  const { figure, torso } = posed(PLAN, dir, { ...pose, morph: () => shaped });
  const left = Math.round(torso.x) - shaped.px;
  const top = Math.round(torso.y) - shaped.py;
  figure.layer(0.1, (c: PixelCanvas) => {
    for (const [x, y, rows] of BLOATER_MARKS[dir]) c.grid(left + x, top + y, rows, BLOATER_LEGEND);
    for (const [x, y, size] of PUSTULE_SPOTS[dir]) {
      const ripe = Math.max(0, Math.min(PUSTULES.length - 1, size + belly.ripe));
      c.grid(left + x + Math.round((belly.dw * x) / 26), top + y + Math.round((belly.dh * y) / 23), PUSTULES[ripe], BLOATER_LEGEND);
    }
  }, false);
  return figure.bake();
}

const WALK: readonly (readonly [Pose, Belly])[] = [
  [{ feet: [[3, -6, 0], [-3, 6, 0]], hands: [[5, -3, -4], [3, 3, -5]], body: [0, -2, -1], lean: 0, head: [0, -1, -1] }, { dw: 2, dh: -2, ripe: 0 }],
  [{ feet: [[1, -6, 0], [-3, 6, 2]], hands: [[4, -3, -5], [4, 3, -5]], body: [0, -2, 0], lean: 0, head: [0, -1, 0] }, { dw: 0, dh: 0, ripe: 0 }],
  [{ feet: [[-1, -6, 0], [1, 6, 2]], hands: [[3, -3, -4], [5, 3, -5]], body: [0, -1, 1], lean: 0, head: [0, 0, 0] }, { dw: -1, dh: 2, ripe: 1 }],
  [{ feet: [[-3, -6, 0], [3, 6, 0]], hands: [[3, -3, -5], [5, 3, -4]], body: [0, 2, -1], lean: 0, head: [0, 1, -1] }, { dw: 2, dh: -2, ripe: 0 }],
  [{ feet: [[-3, -6, 2], [1, 6, 0]], hands: [[4, -3, -5], [4, 3, -5]], body: [0, 2, 0], lean: 0, head: [0, 1, 0] }, { dw: 0, dh: 0, ripe: 0 }],
  [{ feet: [[1, -6, 2], [-1, 6, 0]], hands: [[5, -3, -5], [3, 3, -4]], body: [0, 1, 1], lean: 0, head: [0, 0, 0] }, { dw: -1, dh: 2, ripe: 1 }],
];

const ATTACK: readonly (readonly [Pose, Belly])[] = [
  [{ feet: [[1, -6, 0], [-1, 6, 0]], hands: [[-2, -3, -2], [-2, 3, -2]], body: [-2, 0, 0], lean: -1, head: [-1, 0, 1] }, { dw: 0, dh: 1, ripe: 0 }],
  [{ feet: [[1, -6, 0], [-1, 6, 0]], hands: [[-3, -3, 3], [-3, 3, 3]], body: [-3, 0, 1], lean: -2, head: [-1, 0, 2] }, { dw: -1, dh: 2, ripe: 1 }],
  [{ feet: [[3, -6, 0], [0, 6, 0]], hands: [[7, -2, 0], [7, 2, 0]], body: [4, 0, -1], lean: 2, head: [1, 0, -1] }, { dw: 2, dh: -2, ripe: 1 }],
  [{ feet: [[3, -6, 0], [0, 6, 0]], hands: [[6, -3, -5], [6, 3, -5]], body: [3, 0, -1], lean: 1, head: [1, 0, 0] }, { dw: 1, dh: -1, ripe: 0 }],
];

const STAND: Pose = { feet: [[0, -6, 0], [0, 6, 0]], hands: [[0, -3, -4], [0, 3, -4]], body: [0, 0, 0], lean: 0, head: [0, 0, 0] };
const SHUDDER: Pose = { ...STAND, hands: [[1, -5, 1], [1, 5, 1]], head: [0, 0, 1] };

function aftermath(parts: readonly (readonly [number, number, readonly string[]])[]): PixelSprite {
  return flatFrame(PLAN.cell, PLAN.ox, PLAN.oy, BLOATER_LEGEND, parts.map(([x, y, rows]) => [x + 2, y, rows]));
}

/** Swells past what skin can hold, splits, and leaves a sack in a pool. */
function rupture(): PixelSprite[] {
  const [small, wide] = ACID_POOL;
  const burst = posed(PLAN, 2, { ...SHUDDER, morph: (art) => swell(art, 4, 3) }).figure;
  burst.layer(1, (c: PixelCanvas) => c.grid(7, 8, RUPTURE, BLOATER_LEGEND), false);
  return [
    drawBloater(2, STAND, { dw: 2, dh: 2, ripe: 1 }),
    drawBloater(2, SHUDDER, { dw: 4, dh: 3, ripe: 2 }),
    burst.bake(),
    aftermath([...DROPS, [9, 21, SLUMP]]),
    aftermath([[5, 23, SACK]]),
    aftermath([[5, 30, small], [5, 23, SACK]]),
    aftermath([[3, 30, wide], [5, 23, SACK]]),
  ];
}

export function buildBloater(): ZombieArt {
  return {
    walk: dirClips((dir) => makeClip(WALK.map(([pose, belly]) => drawBloater(dir, pose, belly)), 7)),
    attack: dirClips((dir) => makeClip(ATTACK.map(([pose, belly]) => drawBloater(dir, pose, belly)), 3 / ZOMBIES.bloater.windupSec, false)),
    death: makeClip(rupture(), 9, false),
  };
}
