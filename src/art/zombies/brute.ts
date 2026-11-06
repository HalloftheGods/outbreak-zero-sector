// The brute: a mini boss. It drags a club fused to its right arm, plants each foot like a
// dropped safe, and takes its time raising the club before it comes down.

import { ZOMBIES } from '../../../shared/constants.ts';
import { dirClips, makeClip } from '../kit.ts';
import type { DrawnDir } from '../kit.ts';
import type { PixelSprite, ZombieArt } from '../types.ts';
import { posed, steadyClip } from './body.ts';
import type { BodyPlan, Pose } from './body.ts';
import { add, flatFrame } from './rig.ts';
import type { Figure, Joint, Vec } from './rig.ts';
import { BRUTE_CORPSE, BRUTE_FACINGS, BRUTE_FIST, BRUTE_LEGEND, BRUTE_POOL, CLUB_BLOCK, CLUB_REBAR } from './brute-art.ts';

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

/** The trail a swing leaves, one letter per stretch of the arc: dim where it starts, bright where the club lands. */
const SMEAR = ['m', 'm', 'n', 'n'];

/** A dragged hand lower than this would rise up the screen past the shoulder seen from behind. */
const DRAG_LIFT = -11;

/**
 * Walk speed in frames a second: the brute's 36 px/s over 9 frames is 4 px a frame, the same
 * step the planted foot takes back each frame, so the foot stays put on the ground.
 */
const WALK_FPS = 9;

interface BrutePose extends Pose {
  /** Where the end of the club sits, in ground space. */
  readonly club: Vec;
  /** The arc the club swept to get here this frame, in ground space, drawn as a smear. */
  readonly smear?: readonly Vec[];
  /** The club is down in front of the brute, where from behind the torso would hide it. */
  readonly strikes?: boolean;
}

/** From behind, a dragged arm would rise up the screen past the shoulder, so it hangs closer in. */
function seenFromBehind(standing: BrutePose): BrutePose {
  // The torso art only follows half the lean, so from here a full lean lifts the head off it.
  const pose = { ...standing, head: add(standing.head, [-standing.lean * 0.5, 0, 0]) };
  const raised = pose.hands[1][2] > DRAG_LIFT;
  if (raised) return pose;
  return { ...pose, hands: [pose.hands[0], add(pose.hands[1], [5, 0, 0])], club: add(pose.club, [5, 0, 0]) };
}

/**
 * Straight from behind, a strike lands in front of the torso and vanishes behind it. The arms
 * spread and lift so the club and the other fist show past the shoulders. Art only: the reach
 * is not drawn from the sprite.
 */
function strikeFromBehind(pose: BrutePose): BrutePose {
  return {
    ...pose,
    hands: [add(pose.hands[0], [0, -5, 4]), add(pose.hands[1], [0, 7, 4])],
    club: add(pose.club, [0, 12, 6]),
    smear: pose.smear?.map((point) => add(point, [0, 12, 0])),
  };
}

/** The pose as one facing draws it. */
function facing(dir: DrawnDir, pose: BrutePose): BrutePose {
  const fromBehind = dir === 6 || dir === 7;
  const seen = fromBehind ? seenFromBehind(pose) : pose;
  const strikeHidden = dir === 6 && seen.strikes === true;
  return strikeHidden ? strikeFromBehind(seen) : seen;
}

/** The pixels from a to b, one per step along the longer axis. */
function line(a: Joint, b: Joint): [number, number][] {
  const [x0, y0, x1, y1] = [Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)];
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  return Array.from({ length: steps + 1 }, (_, i) => [Math.round(x0 + ((x1 - x0) * i) / steps), Math.round(y0 + ((y1 - y0) * i) / steps)]);
}

/**
 * The swing's trail as a decal: painted only into pixels the figure left empty, with no outline,
 * so it reads as motion past the brute rather than as a wire. It is two pixels thick across
 * its run, three over the later half of the arc.
 */
function smearDecal(figure: Figure, path: readonly Vec[]): void {
  const points = path.map((point) => figure.at(point));
  const pixels = new Map<string, string>();
  for (let i = 1; i < points.length; i++) {
    const letter = SMEAR[Math.min(SMEAR.length - 1, i - 1)];
    const [a, b] = [points[i - 1], points[i]];
    const flat = Math.abs(b.x - a.x) > Math.abs(b.y - a.y);
    const [across, down] = flat ? [0, 1] : [1, 0];
    const width = i * 2 > points.length ? 3 : 2;
    for (const [x, y] of line(a, b)) {
      for (let k = 0; k < width; k++) pixels.set(`${x + across * k},${y + down * k}`, letter);
    }
  }
  const spots = [...pixels.keys()].map((key) => key.split(',').map(Number));
  const [x0, y0] = [Math.min(...spots.map(([x]) => x)), Math.min(...spots.map(([, y]) => y))];
  const [x1, y1] = [Math.max(...spots.map(([x]) => x)), Math.max(...spots.map(([, y]) => y))];
  const rows = Array.from({ length: y1 - y0 + 1 }, (_, j) => Array.from({ length: x1 - x0 + 1 }, (_, i) => pixels.get(`${x0 + i},${y0 + j}`) ?? '.').join(''));
  figure.decal(x0, y0, rows);
}

function drawBrute(dir: DrawnDir, pose: BrutePose): PixelSprite {
  const { figure, hands } = posed(PLAN, dir, pose);
  const hand = figure.at(hands[1]);
  const tip = figure.at(pose.club);
  const z = Math.max(hand.z, tip.z) + 1;
  const swung = pose.smear !== undefined;
  if (swung) smearDecal(figure, pose.smear);
  figure.limb(hand, tip, CLUB_REBAR, z);
  figure.stamp(CLUB_BLOCK, tip, z + 0.1);
  return figure.bake();
}

/** One facing's walk, with each hand stamp and limb cross-section held steady across the loop. */
function walkClip(dir: DrawnDir) {
  const poses = WALK.map((pose) => facing(dir, pose));
  const steady = steadyClip(PLAN, dir, poses);
  const frames = poses.map((pose, i) => drawBrute(dir, { ...pose, handKind: steady[i].handKind, upright: steady[i].upright }));
  return makeClip(frames, WALK_FPS);
}

// The planted foot steps back 4 px a frame (6, 2, -2, -6), then swings forward lifted.
const WALK: readonly BrutePose[] = [
  { feet: [[6, -6, 0], [-6, 6, 0]], hands: [[5, -3, -15], [-7, 4, -13]], body: [0, -1, -2], lean: 5, head: [2, 0, -3], club: [-14, 17, 4] },
  { feet: [[2, -6, 0], [-2, 6, 3]], hands: [[3, -3, -15], [-6, 4, -13]], body: [0, -1, -1], lean: 5, head: [2, 0, -3], club: [-12, 17, 4] },
  { feet: [[-2, -6, 0], [2, 6, 4]], hands: [[0, -3, -15], [-5, 4, -13]], body: [0, 0, 0], lean: 4, head: [2, 0, -2], club: [-11, 17, 5] },
  { feet: [[-6, -6, 0], [6, 6, 0]], hands: [[-3, -3, -15], [-4, 4, -13]], body: [0, 1, -2], lean: 5, head: [2, 0, -3], club: [-11, 17, 4] },
  { feet: [[-2, -6, 3], [2, 6, 0]], hands: [[-1, -3, -15], [-5, 4, -13]], body: [0, 1, -1], lean: 5, head: [2, 0, -3], club: [-13, 17, 4] },
  { feet: [[2, -6, 4], [-2, 6, 0]], hands: [[2, -3, -15], [-6, 4, -13]], body: [0, 0, 0], lean: 4, head: [2, 0, -2], club: [-14, 17, 5] },
];

// Wind up, raise, strike (with the smear of the swing), and hold on the road. The block cannot
// sink further on the last frame: facing south it would leave the bottom of the cell.
const ATTACK: readonly BrutePose[] = [
  { feet: [[3, -6, 0], [-4, 6, 0]], hands: [[2, -4, -12], [-7, 4, -4]], body: [-1, 0, -1], lean: 2, head: [1, 0, -2], club: [-15, 17, 16] },
  { feet: [[3, -6, 0], [-4, 6, 0]], hands: [[0, -5, -9], [-5, 2, 9]], body: [-2, 0, 0], lean: 0, head: [0, 0, -1], club: [-8, 14, 39] },
  {
    feet: [[7, -6, 0], [-5, 6, 0]], hands: [[4, -5, -12], [13, 2, -9]], body: [3, 0, -3], lean: 7, head: [3, 0, -3], club: [22, 6, 5],
    smear: [[-4, 14, 42], [6, 12, 42], [15, 10, 34], [21, 8, 18], [22, 6, 5]], strikes: true,
  },
  { feet: [[7, -6, 0], [-5, 6, 0]], hands: [[3, -5, -13], [12, 2, -12]], body: [3, 0, -4], lean: 8, head: [3, 0, -2], club: [22, 6, 5], strikes: true },
];

// It takes a while to go down: a stagger, one knee, the other, then the whole slab.
const DEATH: readonly BrutePose[] = [
  { feet: [[3, -6, 0], [-3, 6, 0]], hands: [[-2, -7, -9], [-4, 6, -8]], body: [-3, 0, 0], lean: 0, head: [-1, 0, -2], club: [-10, 22, 8] },
  { feet: [[4, -6, 0], [-5, 6, 0]], hands: [[4, -5, -12], [3, 4, -13]], body: [0, 0, -4], lean: 6, head: [2, 0, -3], club: [3, 20, 4] },
  { feet: [[2, -6, 0], [-6, 6, 0]], hands: [[6, -5, -8], [6, 4, -8]], body: [1, 0, -7], lean: 10, head: [3, 0, -4], club: [6, 18, 4] },
];

/** The body and club on the ground; the pool lies flat under them as a decal, with no outline. */
function corpse(lift: number, pool: readonly string[] = []): PixelSprite {
  return flatFrame(PLAN.cell, PLAN.ox, PLAN.oy, BRUTE_LEGEND, [
    [10, 33 - lift, BRUTE_CORPSE],
    [44, 42 - lift, CLUB_BLOCK.rows],
  ], [[12, 54 - pool.length, pool]]);
}

export function buildBrute(): ZombieArt {
  return {
    walk: dirClips(walkClip),
    attack: dirClips((dir) => makeClip(ATTACK.map((pose) => drawBrute(dir, facing(dir, pose))), 3 / ZOMBIES.brute.windupSec, false)),
    death: makeClip([
      ...DEATH.map((pose) => drawBrute(2, pose)),
      corpse(2),
      corpse(0),
      corpse(0, BRUTE_POOL[0]),
      corpse(0, BRUTE_POOL[1]),
    ], 7, false),
  };
}
