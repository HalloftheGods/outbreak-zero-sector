// A two-armed, two-legged undead body on the rig. Each zombie is a BodyPlan (its bones and
// hand-drawn parts) plus pose tables; this file turns a pose into layers in the right order.

import type { DrawnDir, Legend } from '../kit.ts';
import type { PixelSprite } from '../types.ts';
import { add, bend, Figure, ribbonUpright, viewOf } from './rig.ts';
import type { Joint, Stamp, Vec } from './rig.ts';

export interface HandArt {
  /** Forearm pointing down the screen. */
  readonly down: Stamp;
  /** Forearm pointing along the screen, drawn for the right; left is the same flipped. */
  readonly side: Stamp;
  /** Forearm pointing up the screen. */
  readonly up: Stamp;
}

/** Which hand stamp a frame draws: `right` is the side stamp as drawn, `left` the same flipped. */
export type HandKind = 'down' | 'up' | 'right' | 'left';

export interface FacingArt {
  /** Pivot at the base of the neck. */
  readonly head: Stamp;
  /** Pivot at the pelvis. */
  readonly torso: Stamp;
  /** Pivot at the ankle. */
  readonly foot: Stamp;
}

export interface LimbArt {
  readonly upper: readonly string[];
  readonly lower: readonly string[];
}

export interface BodyPlan {
  readonly cell: number;
  readonly ox: number;
  readonly oy: number;
  readonly legend: Legend;
  readonly hipWidth: number;
  readonly hipHeight: number;
  readonly shoulderWidth: number;
  /** Shoulders above the pelvis. */
  readonly shoulderHeight: number;
  readonly neckHeight: number;
  readonly thigh: number;
  readonly shin: number;
  readonly upperArm: number;
  readonly foreArm: number;
  /** Index 0 is the body's left, 1 its right. */
  readonly legs: readonly [LimbArt, LimbArt];
  readonly arms: readonly [LimbArt, LimbArt];
  readonly hands: readonly [HandArt, HandArt];
  readonly facings: Record<DrawnDir, FacingArt>;
  /** Where the elbows point; x is mirrored per side. Defaults to down and out. */
  readonly elbowPole?: Vec;
  /** The head stays in front of the torso from behind too, as when it sits on top of it. */
  readonly headOnTop?: boolean;
}

/** Fixed ribbon cross-sections for one two-bone limb, as ribbon() takes them; a side left out follows the limb's slope. */
export interface LimbUpright {
  readonly upper?: boolean;
  readonly lower?: boolean;
}

/** Fixed ribbon cross-sections per limb; index 0 is the body's left. */
export interface PoseUpright {
  readonly legs?: readonly [LimbUpright, LimbUpright];
  readonly arms?: readonly [LimbUpright, LimbUpright];
}

export interface Pose {
  /** Ankles, in ground space. */
  readonly feet: readonly [Vec, Vec];
  /** Hands, relative to their own shoulder. */
  readonly hands: readonly [Vec, Vec];
  /** Pelvis offset from standing. */
  readonly body: Vec;
  /** Shoulders forward of the pelvis. */
  readonly lean: number;
  /** Head offset from the neck, so it can lag and loll. */
  readonly head: Vec;
  /** Reshapes the torso art for this frame, so a belly can wobble. */
  readonly morph?: (torso: Stamp) => Stamp;
  /**
   * Fixes each hand's stamp (index 0 is the body's left). Left out, a hand follows its forearm's
   * direction on screen this frame. steadyClip fills it for a whole clip.
   */
  readonly handKind?: readonly [HandKind | undefined, HandKind | undefined];
  /** Fixes ribbon cross-sections per limb. steadyClip fills it for a whole clip. */
  readonly upright?: PoseUpright;
}

export interface PosedBody {
  readonly figure: Figure;
  /** Where the torso's pivot landed. */
  readonly torso: Joint;
  readonly hands: readonly [Vec, Vec];
}

const KNEE_POLE: Vec = [1, 0, 0.1];
const DEFAULT_ELBOW: Vec = [-0.3, 1, -1];

/**
 * How far from the diagonal a frame may be and still take its clip's usual pick: neither screen
 * axis more than this many times the other. Hand stamps get a wide band, since a claw that points
 * a little off its forearm reads fine; ribbons a narrow one, since a cross-section laid the wrong
 * way thins a steep limb.
 */
const HAND_BAND = 3;
const RIBBON_BAND = 1.5;

/** The hand stamp a forearm from `from` to `to` points to on screen, when nothing fixes it. */
function handKindOf(from: Joint, to: Joint): HandKind {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const alongScreen = Math.abs(dx) > Math.abs(dy);
  if (alongScreen) return dx < 0 ? 'left' : 'right';
  return dy >= 0 ? 'down' : 'up';
}

function handStamp(art: HandArt, kind: HandKind): { hand: Stamp; flip: boolean } {
  const sideways = kind === 'left' || kind === 'right';
  if (sideways) return { hand: art.side, flip: kind === 'left' };
  return { hand: kind === 'down' ? art.down : art.up, flip: false };
}

/** Screen joints of one side: hip, knee and ankle; shoulder, elbow and wrist. */
interface SideJoints {
  readonly leg: readonly [Joint, Joint, Joint];
  readonly arm: readonly [Joint, Joint, Joint];
}

interface Skeleton {
  readonly pelvis: Vec;
  readonly top: Vec;
  readonly hands: readonly [Vec, Vec];
  readonly sides: readonly [SideJoints, SideJoints];
}

/** Where every joint of the pose lands on screen; drawing nothing. */
function skeleton(plan: BodyPlan, figure: Figure, pose: Pose): Skeleton {
  const pelvis = add([0, 0, plan.hipHeight], pose.body);
  const top = add(pelvis, [pose.lean, 0, plan.shoulderHeight]);
  const shoulders: [Vec, Vec] = [add(top, [0, -plan.shoulderWidth, 0]), add(top, [0, plan.shoulderWidth, 0])];
  const hands: [Vec, Vec] = [add(shoulders[0], pose.hands[0]), add(shoulders[1], pose.hands[1])];
  const side = (index: 0 | 1): SideJoints => {
    const sign = index === 0 ? -1 : 1;
    const hip = add(pelvis, [0, sign * plan.hipWidth, 0]);
    const foot = pose.feet[index];
    const knee = bend(hip, foot, plan.thigh, plan.shin, KNEE_POLE);
    const [pf, ps, pu] = plan.elbowPole ?? DEFAULT_ELBOW;
    const elbow = bend(shoulders[index], hands[index], plan.upperArm, plan.foreArm, [pf, ps * sign, pu]);
    return {
      leg: [figure.at(hip), figure.at(knee), figure.at(foot)],
      arm: [figure.at(shoulders[index]), figure.at(elbow), figure.at(hands[index])],
    };
  };
  return { pelvis, top, hands, sides: [side(0), side(1)] };
}

/** Everything of the body at this pose, ready for a zombie to add its own layers. */
export function posed(plan: BodyPlan, dir: DrawnDir, pose: Pose): PosedBody {
  const figure = new Figure(viewOf(dir), plan.cell, plan.ox, plan.oy, plan.legend);
  const art = plan.facings[dir];
  const { pelvis, top, hands, sides } = skeleton(plan, figure, pose);

  sides.forEach(({ leg: [h, k, a] }, side) => {
    const fixed = pose.upright?.legs?.[side];
    const depth = -20 + a.z * 0.5;
    figure.limb(h, k, plan.legs[side].upper, depth, false, fixed?.upper);
    figure.limb(k, a, plan.legs[side].lower, depth + 0.1, false, fixed?.lower);
    figure.stamp(art.foot, a, depth + 0.2, false);
  });

  const torso = figure.at(add(pelvis, [pose.lean * 0.5, 0, 0]));
  // Facing away, the head sits behind the shoulders instead of in front of them.
  const away = !plan.headOnTop && (dir === 6 || dir === 7);
  figure.stamp(pose.morph?.(art.torso) ?? art.torso, torso, 0, away);
  figure.stamp(art.head, figure.at(add(add(top, [0, 0, plan.neckHeight]), pose.head)), away ? -0.5 : 0.5);

  sides.forEach(({ arm: [s, e, w] }, side) => {
    const fixed = pose.upright?.arms?.[side];
    const depth = (s.z + e.z + w.z) / 3;
    figure.limb(s, e, plan.arms[side].upper, depth, true, fixed?.upper);
    figure.limb(e, w, plan.arms[side].lower, depth + 0.1, true, fixed?.lower);
    const { hand, flip } = handStamp(plan.hands[side], pose.handKind?.[side] ?? handKindOf(e, w));
    figure.stamp(hand, w, depth + 0.2, false, flip);
  });

  return { figure, torso, hands };
}

export function drawBody(plan: BodyPlan, dir: DrawnDir, pose: Pose): PixelSprite {
  return posed(plan, dir, pose).figure.bake();
}

/** Neither screen axis more than `band` times the other: the per-frame pick could go either way. */
function nearDiagonal(a: Joint, b: Joint, band: number): boolean {
  const dx = Math.abs(Math.round(b.x) - Math.round(a.x));
  const dy = Math.abs(Math.round(b.y) - Math.round(a.y));
  return dx <= band * dy && dy <= band * dx;
}

interface Path<T> {
  readonly picks: readonly T[];
  readonly cost: number;
}

const cheapest = <T>(paths: readonly Path<T>[]): Path<T> => paths.reduce((a, b) => (b.cost < a.cost ? b : a));

/**
 * Frame by frame, the picks that switch drawings the fewest times across the clip (counting the
 * wrap from the last frame to the first when it loops), each frame choosing only among its
 * `allowed` picks. Between runs that switch equally often, the one keeping more of the frames'
 * own picks wins, so a clip that never switches comes back unchanged.
 */
function fewestSwitches<T>(own: readonly T[], allowed: readonly (readonly T[])[], loop: boolean): T[] {
  const none = own.length === 0;
  if (none) return [];
  const switchCost = own.length + 1;
  const extend = (path: Path<T>, pick: T, i: number): Path<T> => ({
    picks: [...path.picks, pick],
    cost: path.cost + (pick === path.picks[i - 1] ? 0 : switchCost) + (pick === own[i] ? 0 : 1),
  });
  const runs = allowed[0].map((first) => {
    // The cheapest run so far that ends on each pick this frame allows.
    let ends: Path<T>[] = [{ picks: [first], cost: first === own[0] ? 0 : 1 }];
    for (let i = 1; i < own.length; i++) ends = allowed[i].map((pick) => cheapest(ends.map((path) => extend(path, pick, i))));
    return cheapest(ends.map((path) => ({ ...path, cost: path.cost + (loop && path.picks[own.length - 1] !== first ? switchCost : 0) })));
  });
  return [...cheapest(runs).picks];
}

/** Per frame: one bone's ribbon cross-section; near the diagonal either way may be drawn. */
function steadyRibbon(bones: readonly (readonly [Joint, Joint])[], loop: boolean): boolean[] {
  const own = bones.map(([a, b]) => ribbonUpright(a, b));
  const allowed = bones.map(([a, b], i) => (nearDiagonal(a, b, RIBBON_BAND) ? [own[i], !own[i]] : [own[i]]));
  return fewestSwitches(own, allowed, loop);
}

/** The two stamps a forearm's diagonal lies between: its way up or down the screen, and along it. */
function besideDiagonal(from: Joint, to: Joint): readonly [HandKind, HandKind] {
  return [to.y >= from.y ? 'down' : 'up', to.x < from.x ? 'left' : 'right'];
}

/**
 * Per frame: one hand's stamp. Near the diagonal a frame may take either stamp its diagonal lies
 * beside, and no other, so a claw raking down is never drawn as the raised one.
 */
function steadyHand(forearms: readonly (readonly [Joint, Joint])[], loop: boolean): HandKind[] {
  const own = forearms.map(([e, w]) => handKindOf(e, w));
  const allowed = forearms.map(([e, w], i) => (nearDiagonal(e, w, HAND_BAND) ? besideDiagonal(e, w) : [own[i]]));
  return fewestSwitches(own, allowed, loop);
}

/** Per frame of a clip: the upper bone's cross-section, then the lower's. */
type SteadyLimb = readonly [readonly boolean[], readonly boolean[]];

/**
 * The poses of one clip in one facing, with each hand stamp and limb cross-section held steady,
 * so a claw or a limb does not flip drawings for a frame as it passes the diagonal. A frame whose
 * forearm or limb runs near the diagonal may be drawn either way it lies between; across the
 * clip, steadyClip picks the drawings that switch the fewest times (with the wrap from last frame
 * to first counted when `loop`, as makeClip's default), keeping each frame's own drawing on a tie.
 * A frame pointing clearly one way always keeps its own, so a claw raised over the head stays
 * raised, and a switch the geometry forces stays. A handKind or upright a pose already sets is
 * kept, though it does not steer the others. Only which stamp and which cross-section get drawn
 * changes: joints, pivots and anchors do not move.
 */
export function steadyClip(plan: BodyPlan, dir: DrawnDir, poses: readonly Pose[], loop = true): Pose[] {
  const figure = new Figure(viewOf(dir), plan.cell, plan.ox, plan.oy, plan.legend);
  const frames = poses.map((pose) => skeleton(plan, figure, pose).sides);
  // Bone 0 runs from the hip or shoulder to the knee or elbow, bone 1 on to the ankle or wrist.
  const bone = (side: 0 | 1, limb: 'leg' | 'arm', from: 0 | 1): (readonly [Joint, Joint])[] =>
    frames.map((sides) => [sides[side][limb][from], sides[side][limb][from + 1]] as const);
  const limb = (side: 0 | 1, part: 'leg' | 'arm'): SteadyLimb => [steadyRibbon(bone(side, part, 0), loop), steadyRibbon(bone(side, part, 1), loop)];
  const legs: readonly [SteadyLimb, SteadyLimb] = [limb(0, 'leg'), limb(1, 'leg')];
  const arms: readonly [SteadyLimb, SteadyLimb] = [limb(0, 'arm'), limb(1, 'arm')];
  const hands = [steadyHand(bone(0, 'arm', 1), loop), steadyHand(bone(1, 'arm', 1), loop)];

  return poses.map((pose, i) => {
    const kept = pose.upright;
    const pick = ([upper, lower]: SteadyLimb, own?: LimbUpright): LimbUpright => ({
      upper: own?.upper ?? upper[i],
      lower: own?.lower ?? lower[i],
    });
    return {
      ...pose,
      handKind: [pose.handKind?.[0] ?? hands[0][i], pose.handKind?.[1] ?? hands[1][i]],
      upright: {
        legs: [pick(legs[0], kept?.legs?.[0]), pick(legs[1], kept?.legs?.[1])],
        arms: [pick(arms[0], kept?.arms?.[0]), pick(arms[1], kept?.arms?.[1])],
      },
    };
  });
}
