// The runner: gaunt, near hairless and sprinting on all fours. Its arms are longer than
// its legs, the elbows ride high, and the whole body gallops rather than walks.

import { ZOMBIES } from '../../../shared/constants.ts';
import { dirClips, makeClip } from '../kit.ts';
import type { DrawnDir } from '../kit.ts';
import type { PixelSprite, ZombieArt } from '../types.ts';
import { drawBody, posed } from './body.ts';
import type { BodyPlan, Pose } from './body.ts';
import { add } from './rig.ts';
import type { Vec } from './rig.ts';
import { RUNNER_CLAW, RUNNER_FACINGS, RUNNER_LEGEND, RUNNER_POOL } from './runner-art.ts';

const PLAN: BodyPlan = {
  cell: 36,
  ox: 14,
  oy: 31,
  legend: RUNNER_LEGEND,
  hipWidth: 2.5,
  hipHeight: 8,
  shoulderWidth: 4.5,
  shoulderHeight: 3,
  neckHeight: 0,
  thigh: 6,
  shin: 6,
  upperArm: 6,
  foreArm: 7,
  legs: [
    { upper: ['dcb'], lower: ['cb'] },
    { upper: ['dcb'], lower: ['cb'] },
  ],
  arms: [
    { upper: ['dcb', 'cb'], lower: ['dc', 'cb'] },
    { upper: ['dcb', 'cb'], lower: ['dc', 'cb'] },
  ],
  hands: [RUNNER_CLAW, RUNNER_CLAW],
  facings: RUNNER_FACINGS,
  elbowPole: [-1, 0.6, 0.6],
};

// One rotary gallop: the right limbs trail the left by a frame.
const HAND_PATH: readonly Vec[] = [[10, 0, -8], [5, 0, -10], [-1, 0, -10], [-5, 0, -6], [3, 0, -3], [9, 0, -4]];
const FOOT_PATH: readonly Vec[] = [[-9, 0, 2], [-3, 0, 3], [3, 0, 1], [5, 0, 0], [-1, 0, 0], [-6, 0, 0]];
const BODY: readonly { readonly u: number; readonly lean: number }[] = [
  { u: 1, lean: 8 }, { u: 0, lean: 7 }, { u: -1, lean: 6 }, { u: 0, lean: 6 }, { u: 2, lean: 7 }, { u: 2, lean: 8 },
];

const WALK: readonly Pose[] = BODY.map(({ u, lean }, i) => {
  const trail = (i + 5) % 6;
  const [hl, hr] = [HAND_PATH[i], HAND_PATH[trail]];
  const [fl, fr] = [FOOT_PATH[i], FOOT_PATH[trail]];
  return {
    feet: [[fl[0], -3, fl[2]], [fr[0], 3, fr[2]]],
    hands: [[hl[0], -1, hl[2]], [hr[0], 1, hr[2]]],
    body: [0, 0, u],
    lean,
    head: [1, 0, -u],
  };
});

/**
 * Head-on, the gallop's reach foreshortens away and the legs read as stilts. So the body
 * drops, the feet splay and the arms plant wide: a crouch seen from the front or back.
 */
function headOn(pose: Pose): Pose {
  const [left, right] = pose.feet;
  const [handL, handR] = pose.hands;
  return {
    ...pose,
    feet: [[left[0] * 0.5, -7, left[2]], [right[0] * 0.5, 7, right[2]]],
    hands: [[handL[0] * 0.5, -5, handL[2] + 2], [handR[0] * 0.5, 5, handR[2] + 2]],
    body: add(pose.body, [0, 0, -3]),
  };
}

// From behind the head sits under the hunched back, so the back views lift it clear of the hump.
const raiseHead = (pose: Pose): Pose => ({ ...pose, head: add(pose.head, [0, 0, 1]) });

const FACING_POSE: Partial<Record<DrawnDir, (pose: Pose) => Pose>> = {
  2: headOn,
  6: (pose) => raiseHead(headOn(pose)),
  7: raiseHead,
};

const facing = (dir: DrawnDir, pose: Pose): Pose => (FACING_POSE[dir] ?? ((p: Pose) => p))(pose);

const ATTACK: readonly Pose[] = [
  { feet: [[1, -3, 0], [-1, 3, 0]], hands: [[0, -1, -6], [-2, 1, -6]], body: [-2, 0, -1], lean: 5, head: [0, 0, 1] },
  { feet: [[0, -3, 0], [-2, 3, 0]], hands: [[0, -2, 5], [-1, 2, 5]], body: [-1, 0, 1], lean: 4, head: [-1, 0, 2] },
  { feet: [[-3, -3, 0], [-6, 3, 0]], hands: [[12, 0, -1], [11, 3, -3]], body: [3, 0, 1], lean: 9, head: [2, 0, 0] },
  { feet: [[-2, -3, 0], [-4, 3, 0]], hands: [[9, 3, -8], [9, 5, -8]], body: [2, 0, 0], lean: 8, head: [1, 0, -1] },
];

// Shot at a sprint: the head snaps back, the front end folds, and it skids flat.
const DEATH: readonly Pose[] = [
  { feet: [[-2, -3, 0], [-4, 3, 0]], hands: [[2, -2, 0], [0, 2, 1]], body: [0, 0, 1], lean: 5, head: [-2, 0, 2] },
  { feet: [[-8, -3, 1], [-6, 3, 3]], hands: [[7, -3, -5], [6, 3, -4]], body: [0, 0, -1], lean: 9, head: [3, 0, -3] },
  { feet: [[-11, -3, 2], [-10, 3, 4]], hands: [[9, -5, -5], [7, 6, -5]], body: [1, 0, -4], lean: 10, head: [3, 0, -3] },
];

const CORPSE: Pose = {
  feet: [[-11, -7, 0], [-9, 8, 0]], hands: [[7, -11, -5], [4, 12, -4]], body: [-3, 0, -7], lean: 8, head: [3, 2, -7],
};

// The eyes go out with it.
const DEAD_PLAN: BodyPlan = { ...PLAN, legend: { ...RUNNER_LEGEND, u: RUNNER_LEGEND.k } };

function corpse(pool?: readonly string[]): PixelSprite {
  const { figure } = posed(DEAD_PLAN, 0, CORPSE);
  if (pool) figure.decal(3, 35 - pool.length, pool, RUNNER_LEGEND);
  return figure.bake();
}

export function buildRunner(): ZombieArt {
  return {
    walk: dirClips((dir) => makeClip(WALK.map((pose) => drawBody(PLAN, dir, facing(dir, pose))), 12)),
    attack: dirClips((dir) => makeClip(ATTACK.map((pose) => drawBody(PLAN, dir, facing(dir, pose))), 3 / ZOMBIES.runner.windupSec, false)),
    death: makeClip([
      ...DEATH.map((pose) => drawBody(PLAN, 0, pose)),
      corpse(),
      corpse(RUNNER_POOL[0]),
      corpse(RUNNER_POOL[1]),
    ], 11, false),
  };
}
