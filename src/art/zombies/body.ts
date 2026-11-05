// A two-armed, two-legged undead body on the rig. Each zombie is a BodyPlan (its bones and
// hand-drawn parts) plus pose tables; this file turns a pose into layers in the right order.

import type { DrawnDir, Legend } from '../kit.ts';
import type { PixelSprite } from '../types.ts';
import { add, bend, Figure, viewOf } from './rig.ts';
import type { Joint, Stamp, Vec } from './rig.ts';

export interface HandArt {
  /** Forearm pointing down the screen. */
  readonly down: Stamp;
  /** Forearm pointing along the screen, drawn for the right; left is the same flipped. */
  readonly side: Stamp;
  /** Forearm pointing up the screen. */
  readonly up: Stamp;
}

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
}

export interface PosedBody {
  readonly figure: Figure;
  /** Where the torso's pivot landed. */
  readonly torso: Joint;
  readonly hands: readonly [Vec, Vec];
}

const KNEE_POLE: Vec = [1, 0, 0.1];
const DEFAULT_ELBOW: Vec = [-0.3, 1, -1];

function pickHand(art: HandArt, from: Joint, to: Joint): { hand: Stamp; flip: boolean } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return { hand: art.side, flip: dx < 0 };
  return { hand: dy >= 0 ? art.down : art.up, flip: false };
}

/** Everything of the body at this pose, ready for a zombie to add its own layers. */
export function posed(plan: BodyPlan, dir: DrawnDir, pose: Pose): PosedBody {
  const figure = new Figure(viewOf(dir), plan.cell, plan.ox, plan.oy, plan.legend);
  const art = plan.facings[dir];
  const pelvis = add([0, 0, plan.hipHeight], pose.body);

  [0, 1].forEach((side) => {
    const sign = side === 0 ? -1 : 1;
    const hip = add(pelvis, [0, sign * plan.hipWidth, 0]);
    const foot = pose.feet[side];
    const knee = bend(hip, foot, plan.thigh, plan.shin, KNEE_POLE);
    const [h, k, a] = [figure.at(hip), figure.at(knee), figure.at(foot)];
    const depth = -20 + a.z * 0.5;
    figure.limb(h, k, plan.legs[side].upper, depth, false);
    figure.limb(k, a, plan.legs[side].lower, depth + 0.1, false);
    figure.stamp(art.foot, a, depth + 0.2, false);
  });

  const torso = figure.at(add(pelvis, [pose.lean * 0.5, 0, 0]));
  // Facing away, the head sits behind the shoulders instead of in front of them.
  const away = !plan.headOnTop && (dir === 6 || dir === 7);
  figure.stamp(pose.morph?.(art.torso) ?? art.torso, torso, 0, away);

  const top = add(pelvis, [pose.lean, 0, plan.shoulderHeight]);
  figure.stamp(art.head, figure.at(add(add(top, [0, 0, plan.neckHeight]), pose.head)), away ? -0.5 : 0.5);

  const shoulders: [Vec, Vec] = [add(top, [0, -plan.shoulderWidth, 0]), add(top, [0, plan.shoulderWidth, 0])];
  const hands: [Vec, Vec] = [add(shoulders[0], pose.hands[0]), add(shoulders[1], pose.hands[1])];
  [0, 1].forEach((side) => {
    const sign = side === 0 ? -1 : 1;
    const [pf, ps, pu] = plan.elbowPole ?? DEFAULT_ELBOW;
    const elbow = bend(shoulders[side], hands[side], plan.upperArm, plan.foreArm, [pf, ps * sign, pu]);
    const [s, e, w] = [figure.at(shoulders[side]), figure.at(elbow), figure.at(hands[side])];
    const depth = (s.z + e.z + w.z) / 3;
    figure.limb(s, e, plan.arms[side].upper, depth);
    figure.limb(e, w, plan.arms[side].lower, depth + 0.1);
    const { hand, flip } = pickHand(plan.hands[side], e, w);
    figure.stamp(hand, w, depth + 0.2, false, flip);
  });

  return { figure, torso, hands };
}

export function drawBody(plan: BodyPlan, dir: DrawnDir, pose: Pose): PixelSprite {
  return posed(plan, dir, pose).figure.bake();
}
