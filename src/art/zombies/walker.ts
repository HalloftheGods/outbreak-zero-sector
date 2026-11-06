// The walker: a shambling former civilian and the style anchor for every other sprite.
// One arm reaches, the other drags, and a bad leg scrapes along behind the good one.

import { ZOMBIES } from '../../../shared/constants.ts';
import { dirClips, makeClip } from '../kit.ts';
import type { DrawnDir, Legend } from '../kit.ts';
import type { Clip, PixelSprite, ZombieArt } from '../types.ts';
import { drawBody } from './body.ts';
import type { BodyPlan, Pose } from './body.ts';
import { add, flatFrame } from './rig.ts';
import type { Vec } from './rig.ts';
import { WALKER_CLAW, WALKER_CORPSE, WALKER_FACINGS, WALKER_FALL, WALKER_LEGEND, WALKER_POOL } from './walker-art.ts';

const CELL = 36;
const OX = 18;
const OY = 31;

const PLAN: BodyPlan = {
  cell: CELL,
  ox: OX,
  oy: OY,
  legend: WALKER_LEGEND,
  hipWidth: 2.5,
  hipHeight: 9,
  shoulderWidth: 5,
  shoulderHeight: 5,
  neckHeight: 2,
  thigh: 5,
  shin: 5,
  upperArm: 5,
  foreArm: 5,
  legs: [
    { upper: ['qQqp'], lower: ['Qqp', 'Qqp', 'cbp'] },
    { upper: ['qQqp'], lower: ['Qqp', 'dcb', 'cba'] },
  ],
  arms: [
    { upper: ['ihg', 'ihg', 'dcb'], lower: ['dcb', 'dsb', 'dcb'] },
    { upper: ['ihg', 'ihg', 'dcb'], lower: ['dcb', 'cb'] },
  ],
  hands: [WALKER_CLAW, WALKER_CLAW],
  facings: WALKER_FACINGS,
};

// Body-left is the good leg and the reaching arm; body-right the bad leg and the dragged arm.
const reach = (f: number, u: number): Vec => [f, 0, u];
const limp = (f: number, u: number): Vec => [f, 1, u];

const WALK: readonly Pose[] = [
  { feet: [[4, -3, 0], [-5, 3, 0]], hands: [reach(8, -6), limp(-2, -8)], body: [0, -1, -1], lean: 2, head: [1, 0, 0] },
  { feet: [[2, -3, 0], [-3, 3, 0]], hands: [reach(8, -5), limp(-3, -8)], body: [0, -1, 0], lean: 2, head: [1, -1, 0] },
  { feet: [[0, -3, 0], [-1, 3, 0]], hands: [reach(8, -5), limp(-2, -8)], body: [0, 0, 0], lean: 2, head: [1, -1, 0] },
  { feet: [[-2, -3, 0], [2, 3, 1]], hands: [reach(8, -6), limp(0, -8)], body: [0, 1, 0], lean: 2, head: [0, 0, 0] },
  { feet: [[-4, -3, 1], [4, 3, 0]], hands: [reach(8, -7), limp(2, -7)], body: [0, 1, -1], lean: 3, head: [1, 1, -1] },
  { feet: [[-1, -3, 2], [2, 3, 0]], hands: [reach(8, -7), limp(0, -8)], body: [0, 0, -1], lean: 3, head: [1, 1, 0] },
];

const STAND: Pose = { feet: [[0, -3, 0], [0, 3, 0]], hands: [reach(8, -5), limp(0, -8)], body: [0, 0, 0], lean: 1, head: [0, 0, 0] };

// Both claws go up over the head, then rake down and across.
const ATTACK: readonly Pose[] = [
  { feet: [[1, -3, 0], [-2, 3, 0]], hands: [[4, -2, 3], [3, 2, 2]], body: [-1, 0, 0], lean: 0, head: [0, 0, 0] },
  { feet: [[2, -3, 0], [-3, 3, 0]], hands: [[4, -4, 7], [3, 4, 6]], body: [-2, 0, 1], lean: -1, head: [-1, 0, 0] },
  { feet: [[5, -3, 0], [-4, 3, 0]], hands: [[10, 2, -1], [9, -2, 0]], body: [2, 0, -1], lean: 3, head: [1, 0, -1] },
  { feet: [[5, -3, 0], [-3, 3, 0]], hands: [[7, 4, -8], [7, -4, -8]], body: [2, 0, -1], lean: 4, head: [1, 0, 0] },
];

const DEATH: readonly Pose[] = [
  { feet: [[1, -3, 0], [-1, 3, 0]], hands: [[-3, -4, 3], [-2, 4, 2]], body: [-2, 0, 0], lean: -2, head: [-1, 0, 1] },
  { feet: [[2, -3, 0], [0, 3, 0]], hands: [[0, -5, -3], [1, 5, -7]], body: [-1, 0, -3], lean: 3, head: [2, 0, -2] },
];

/** Three frames fill the wind-up, so the last, the follow-through, lands with the hit. */
const ATTACK_FPS = 3 / ZOMBIES.walker.windupSec;

function flat(legend: Legend, rows: readonly string[], pool: readonly string[] = []): PixelSprite {
  return flatFrame(CELL, OX, OY, legend, [[4, 34 - pool.length, pool], [2, 3, rows]]);
}

/** Facing the camera, a reaching arm foreshortens: it stays high and comes straight out. */
function draw(plan: BodyPlan, dir: DrawnDir, pose: Pose): PixelSprite {
  const sideOn = dir !== 2;
  if (sideOn) return drawBody(plan, dir, pose);
  return drawBody(plan, dir, { ...pose, hands: [add(pose.hands[0], [-1, -1, 3]), pose.hands[1]] });
}

/** The walker's body and moves. Another legend recolours it into a cousin, as the screamer is. */
export function buildWalker(legend: Legend = WALKER_LEGEND): ZombieArt {
  const plan: BodyPlan = { ...PLAN, legend };
  return {
    walk: dirClips((dir) => makeClip(WALK.map((pose) => draw(plan, dir, pose)), 8)),
    attack: dirClips((dir) => makeClip(ATTACK.map((pose) => drawBody(plan, dir, pose)), ATTACK_FPS, false)),
    death: makeClip([
      ...DEATH.map((pose) => drawBody(plan, 2, pose)),
      flat(legend, WALKER_FALL),
      flat(legend, WALKER_CORPSE),
      flat(legend, WALKER_CORPSE, WALKER_POOL[0]),
      flat(legend, WALKER_CORPSE, WALKER_POOL[1]),
    ], 9, false),
  };
}

export function referenceWalker(): { idle: PixelSprite; walk: Clip } {
  return { idle: draw(PLAN, 2, STAND), walk: makeClip(WALK.map((pose) => draw(PLAN, 2, pose)), 8) };
}
