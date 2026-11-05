// The brute: a mini boss. It drags a club fused to its right arm, plants each foot like a
// dropped safe, and takes its time raising the club before it comes down.

import { ZOMBIES } from '../../../shared/constants.ts';
import { dirClips, makeClip } from '../kit.ts';
import type { DrawnDir } from '../kit.ts';
import type { PixelSprite, ZombieArt } from '../types.ts';
import { posed } from './body.ts';
import type { BodyPlan, Pose } from './body.ts';
import { add, flatFrame } from './rig.ts';
import type { Vec } from './rig.ts';
import { BRUTE_CORPSE, BRUTE_FACINGS, BRUTE_FIST, BRUTE_LEGEND, BRUTE_POOL, CLUB_BLOCK } from './brute-art.ts';

const PLAN: BodyPlan = {
  cell: 64,
  ox: 32,
  oy: 50,
  legend: BRUTE_LEGEND,
  hipWidth: 6,
  hipHeight: 10,
  shoulderWidth: 12,
  shoulderHeight: 16,
  neckHeight: 1,
  thigh: 6,
  shin: 6,
  upperArm: 9,
  foreArm: 9,
  legs: [
    { upper: ['ccbbbba'], lower: ['cccbbba', 'ccbbba'] },
    { upper: ['ccbbbba'], lower: ['cccbbba', 'ccbbba'] },
  ],
  arms: [
    { upper: ['dccbba', 'dcssba', 'dccbba'], lower: ['ccbbba', 'cbbba'] },
    { upper: ['dcccbbba', 'dccssbba', 'dcccbbba'], lower: ['dccbbbaa', 'onnmmnnm', 'dccbbbaa', 'ccbbbbaa', 'onnmmnm', 'ccbbbba'] },
  ],
  hands: [BRUTE_FIST, BRUTE_FIST],
  facings: BRUTE_FACINGS,
};

interface BrutePose extends Pose {
  /** Where the end of the club sits, in ground space. */
  readonly club: Vec;
}

/** From behind, a dragged arm would rise up the screen past the shoulder, so it hangs closer in. */
function seenFromBehind(standing: BrutePose): BrutePose {
  // The torso art only follows half the lean, so from here a full lean lifts the head off it.
  const pose = { ...standing, head: add(standing.head, [-standing.lean * 0.5, 0, 0]) };
  if (pose.hands[1][2] > -11) return pose;
  return { ...pose, hands: [pose.hands[0], add(pose.hands[1], [5, 0, 0])], club: add(pose.club, [5, 0, 0]) };
}

function drawBrute(dir: DrawnDir, standing: BrutePose): PixelSprite {
  const pose = dir === 6 || dir === 7 ? seenFromBehind(standing) : standing;
  const { figure, hands } = posed(PLAN, dir, pose);
  const hand = figure.at(hands[1]);
  const tip = figure.at(pose.club);
  const z = Math.max(hand.z, tip.z) + 1;
  figure.limb(hand, tip, ['onm', 'n.om', 'o.nm', 'onm'], z);
  figure.stamp(CLUB_BLOCK, tip, z + 0.1);
  return figure.bake();
}

const WALK: readonly BrutePose[] = [
  { feet: [[6, -6, 0], [-6, 6, 0]], hands: [[5, -3, -15], [-7, 4, -13]], body: [0, -1, -2], lean: 5, head: [2, 0, -3], club: [-14, 17, 4] },
  { feet: [[4, -6, 0], [-5, 6, 2]], hands: [[3, -3, -15], [-6, 4, -13]], body: [0, -1, -1], lean: 5, head: [2, 0, -3], club: [-12, 17, 4] },
  { feet: [[0, -6, 0], [0, 6, 4]], hands: [[0, -3, -15], [-5, 4, -13]], body: [0, 0, 0], lean: 4, head: [2, 0, -2], club: [-11, 17, 5] },
  { feet: [[-6, -6, 0], [6, 6, 0]], hands: [[-3, -3, -15], [-4, 4, -13]], body: [0, 1, -2], lean: 5, head: [2, 0, -3], club: [-11, 17, 4] },
  { feet: [[-5, -6, 2], [4, 6, 0]], hands: [[-1, -3, -15], [-5, 4, -13]], body: [0, 1, -1], lean: 5, head: [2, 0, -3], club: [-13, 17, 4] },
  { feet: [[0, -6, 4], [0, 6, 0]], hands: [[2, -3, -15], [-6, 4, -13]], body: [0, 0, 0], lean: 4, head: [2, 0, -2], club: [-14, 17, 5] },
];

const ATTACK: readonly BrutePose[] = [
  { feet: [[3, -6, 0], [-4, 6, 0]], hands: [[2, -4, -12], [-7, 4, -4]], body: [-1, 0, -1], lean: 2, head: [1, 0, -2], club: [-15, 17, 16] },
  { feet: [[3, -6, 0], [-4, 6, 0]], hands: [[0, -5, -9], [-5, 2, 9]], body: [-2, 0, 0], lean: 0, head: [0, 0, -1], club: [-8, 14, 39] },
  { feet: [[7, -6, 0], [-5, 6, 0]], hands: [[4, -5, -12], [13, 2, -9]], body: [3, 0, -3], lean: 7, head: [3, 0, -3], club: [22, 6, 5] },
  { feet: [[7, -6, 0], [-5, 6, 0]], hands: [[3, -5, -13], [12, 2, -12]], body: [3, 0, -4], lean: 8, head: [3, 0, -2], club: [22, 6, 5] },
];

// It takes a while to go down: a stagger, one knee, the other, then the whole slab.
const DEATH: readonly BrutePose[] = [
  { feet: [[3, -6, 0], [-3, 6, 0]], hands: [[-2, -7, -9], [-4, 6, -8]], body: [-3, 0, 0], lean: 0, head: [-1, 0, -2], club: [-10, 22, 8] },
  { feet: [[4, -6, 0], [-5, 6, 0]], hands: [[4, -5, -12], [3, 4, -13]], body: [0, 0, -4], lean: 6, head: [2, 0, -3], club: [3, 20, 4] },
  { feet: [[2, -6, 0], [-6, 6, 0]], hands: [[6, -5, -8], [6, 4, -8]], body: [1, 0, -7], lean: 10, head: [3, 0, -4], club: [6, 18, 4] },
];

function corpse(lift: number, pool: readonly string[] = []): PixelSprite {
  return flatFrame(PLAN.cell, PLAN.ox, PLAN.oy, BRUTE_LEGEND, [
    [12, 54 - pool.length, pool],
    [10, 33 - lift, BRUTE_CORPSE],
    [44, 42 - lift, CLUB_BLOCK.rows],
  ]);
}

export function buildBrute(): ZombieArt {
  return {
    walk: dirClips((dir) => makeClip(WALK.map((pose) => drawBrute(dir, pose)), 7)),
    attack: dirClips((dir) => makeClip(ATTACK.map((pose) => drawBrute(dir, pose)), 3 / ZOMBIES.brute.windupSec, false)),
    death: makeClip([
      ...DEATH.map((pose) => drawBrute(2, pose)),
      corpse(2),
      corpse(0),
      corpse(0, BRUTE_POOL[0]),
      corpse(0, BRUTE_POOL[1]),
    ], 7, false),
  };
}
