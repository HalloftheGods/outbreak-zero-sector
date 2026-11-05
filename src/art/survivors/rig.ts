// The survivor paper doll: draws a person holding a gun in one pose into a cell.
// Parts are hand-drawn grids (legs.ts, weapons.ts, one file per person); only the arms
// are drawn between two points, because they have to follow the hands through reloads.

import type { WeaponId } from '../../../shared/protocol.ts';
import type { PixelSprite } from '../types.ts';
import type { DrawnDir, Legend, Point } from '../kit.ts';
import { INK_SOFT } from '../palette.ts';
import type { Color } from '../palette.ts';
import { ANCHOR_X, Cell } from './cell.ts';
import { LEG_SETS } from './legs.ts';
import { AXIS, GUN_LEGEND, GUN_LEGEND_EMPTY, GUNS, MAG_GRID, MAG_LEGEND, SHELL_GRID, SHELL_LEGEND } from './weapons.ts';
import type { GunView } from './weapons.ts';

const HIP_Y = 26;
export const TORSO_BOTTOM = 27;
export const HEAD_BOTTOM = 19;

export type Tone = readonly [dark: Color, mid: Color, light: Color];

export interface Part {
  readonly rows: readonly string[];
  /** Nudges the part off its centred slot. */
  readonly dx?: number;
  readonly dy?: number;
}

export type Facings = Readonly<Record<DrawnDir, Part>>;

export interface Person {
  /** Every letter the person's heads, torsos and legs use. */
  readonly legend: Legend;
  /** The legs of the far side, a step darker. */
  readonly farLegend: Legend;
  readonly heads: Facings;
  readonly torsos: Facings;
  /** Worn on the back: under the torso from the front, over it from behind. */
  readonly packs?: Partial<Facings>;
  readonly sleeve: Tone;
  /** Forearm, so sleeves can be short or rolled. */
  readonly cuff: Tone;
  readonly hand: Tone;
  /** Shoulders sit this many pixels wider than the standard build. */
  readonly spread: number;
  /** Four pixel upper arms instead of three. */
  readonly thick?: boolean;
  /** A stripe around the forearm. */
  readonly band?: Color;
}

/** What a frame changes. Everything is a pixel offset from the rest pose. */
export interface Pose {
  readonly near?: string;
  readonly far?: string;
  readonly bodyX?: number;
  readonly bodyY?: number;
  readonly headX?: number;
  readonly headY?: number;
  readonly gunX?: number;
  readonly gunY?: number;
  /** Where the support hand is, in cell pixels. Left out, it stays on the fore-end. */
  readonly hand?: Point;
  readonly magOut?: boolean;
  readonly carrying?: 'mag' | 'shell';
  /** Pixels the pump is racked back. */
  readonly rack?: number;
  /** A dropped magazine, in cell pixels. */
  readonly dropped?: Point;
}

interface BodyPoints {
  readonly shoulderNear: Point;
  readonly shoulderFar: Point;
  /** Elbows pushed off the straight line, in pixels. */
  readonly elbowNear: Point;
  readonly elbowFar: Point;
  /** Where the support hand reaches for a spare. */
  readonly belt: Point;
  /** Which way a wider build moves each shoulder. */
  readonly wideNear: number;
  readonly wideFar: number;
}

export const BODY: Readonly<Record<DrawnDir, BodyPoints>> = {
  0: { shoulderNear: [18, 20], shoulderFar: [22, 20], elbowNear: [0, 3], elbowFar: [0, 2], belt: [22, 26], wideNear: 0, wideFar: 0 },
  1: { shoulderNear: [16, 20], shoulderFar: [24, 19], elbowNear: [-1, 3], elbowFar: [2, 2], belt: [24, 26], wideNear: -1, wideFar: 1 },
  2: { shoulderNear: [14, 20], shoulderFar: [25, 20], elbowNear: [-2, 2], elbowFar: [2, 2], belt: [24, 26], wideNear: -1, wideFar: 1 },
  6: { shoulderNear: [25, 20], shoulderFar: [14, 20], elbowNear: [1, 1], elbowFar: [-2, 1], belt: [16, 25], wideNear: 1, wideFar: -1 },
  7: { shoulderNear: [24, 21], shoulderFar: [16, 19], elbowNear: [2, 1], elbowFar: [-1, -1], belt: [17, 25], wideNear: 1, wideFar: -1 },
};

/** Paint order, back to front. */
type Layer = 'gun' | 'farArm' | 'nearArm' | 'nearHand' | 'legs' | 'pack' | 'torso' | 'head';

const ORDER: Readonly<Record<DrawnDir, readonly Layer[]>> = {
  0: ['farArm', 'pack', 'legs', 'torso', 'head', 'nearArm', 'gun', 'nearHand'],
  1: ['pack', 'legs', 'torso', 'head', 'farArm', 'nearArm', 'gun', 'nearHand'],
  2: ['pack', 'legs', 'torso', 'farArm', 'nearArm', 'nearHand', 'gun', 'head'],
  6: ['gun', 'farArm', 'nearArm', 'nearHand', 'legs', 'torso', 'pack', 'head'],
  7: ['gun', 'farArm', 'legs', 'torso', 'pack', 'nearArm', 'nearHand', 'head'],
};

/** A three pixel tube, lit along its upper or left side. Stamped across the line so diagonals stay clean. */
export function limbSegment(c: Cell, a: Point, b: Point, tone: Tone, thick = false): void {
  const [dark, mid, light] = tone;
  const [ax, ay] = a;
  const [bx, by] = b;
  const steep = Math.abs(by - ay) > Math.abs(bx - ax);
  const [ox, oy] = steep ? [1, 0] : [0, 1];
  const far = thick ? 2 : 1;
  c.line(ax + ox * far, ay + oy * far, bx + ox * far, by + oy * far, dark);
  if (thick) c.line(ax + ox, ay + oy, bx + ox, by + oy, mid);
  c.line(ax - ox, ay - oy, bx - ox, by - oy, light);
  c.line(ax, ay, bx, by, mid);
}

export function drawHand(c: Cell, x: number, y: number, tone: Tone): void {
  const [dark, mid, light] = tone;
  c.rect(x - 1, y - 1, 3, 3, mid);
  c.px(x - 1, y - 1, light);
  c.px(x, y - 1, light);
  c.px(x - 1, y, light);
  c.rect(x + 1, y, 1, 2, dark);
  c.rect(x - 1, y + 1, 3, 1, dark);
}

/** A reflective band across the forearm, one pixel long. */
function drawBand(c: Cell, elbow: Point, hand: Point, color: Color): void {
  const x = Math.round((elbow[0] + hand[0]) / 2);
  const y = Math.round((elbow[1] + hand[1]) / 2);
  const steep = Math.abs(hand[1] - elbow[1]) > Math.abs(hand[0] - elbow[0]);
  if (steep) c.line(x - 1, y, x + 1, y, color);
  else c.line(x, y - 1, x, y + 1, color);
}

function drawArm(c: Cell, person: Person, shoulder: Point, bend: Point, hand: Point): void {
  const elbow: Point = [
    Math.round((shoulder[0] + hand[0]) / 2) + bend[0],
    Math.round((shoulder[1] + hand[1]) / 2) + bend[1],
  ];
  c.overlay((layer) => {
    limbSegment(layer, shoulder, elbow, person.sleeve, person.thick);
    // A thick tube ends square; taking the outer corner off gives a deltoid.
    if (person.thick) layer.erase(shoulder[0] + (shoulder[0] < ANCHOR_X ? -1 : 2), shoulder[1]);
    limbSegment(layer, elbow, hand, person.cuff);
    if (person.band !== undefined) drawBand(layer, elbow, hand, person.band);
  }, INK_SOFT);
}

function drawHandOver(c: Cell, person: Person, hand: Point): void {
  c.overlay((layer) => drawHand(layer, hand[0], hand[1], person.hand), INK_SOFT);
}

function drawLegs(c: Cell, person: Person, dir: DrawnDir, pose: Pose): void {
  const set = LEG_SETS[dir];
  const near = pose.near ?? set.stand[0];
  const far = pose.far ?? set.stand[1];
  c.grid(set.farX, HIP_Y, set.strips[far], person.farLegend);
  c.grid(set.nearX, HIP_Y, set.strips[near], person.legend);
}

export function placePart(c: Cell, part: Part, bottom: number, legend: Legend, dx: number, dy: number): void {
  const w = Math.max(...part.rows.map((row) => row.length));
  const x = Math.floor(ANCHOR_X - w / 2) + (part.dx ?? 0) + dx;
  const y = bottom - part.rows.length + (part.dy ?? 0) + dy;
  c.grid(x, y, part.rows, legend);
}

function gunPoint(view: GunView, point: Point, ox: number, oy: number): Point {
  return [view.at[0] + point[0] + ox, view.at[1] + point[1] + oy];
}

function drawGun(c: Cell, view: GunView, ox: number, oy: number, dir: DrawnDir, pose: Pose): void {
  const legend = pose.magOut ? GUN_LEGEND_EMPTY : GUN_LEGEND;
  c.grid(view.at[0] + ox, view.at[1] + oy, view.rows, legend);
  if (!view.pump) return;
  const rack = pose.rack ?? 0;
  const [ax, ay] = AXIS[dir];
  c.grid(view.at[0] + view.pump.at[0] + ox - ax * rack, view.at[1] + view.pump.at[1] + oy - ay * rack, view.pump.rows, GUN_LEGEND);
}

function shoulderOf(point: Point, wide: number, person: Person, bx: number, by: number): Point {
  return [point[0] + wide * person.spread + bx, point[1] + by];
}

export function drawPose(person: Person, weapon: WeaponId, dir: DrawnDir, pose: Pose): PixelSprite {
  const c = new Cell();
  const view = GUNS[weapon].views[dir];
  const body = BODY[dir];
  const bx = pose.bodyX ?? 0;
  const by = pose.bodyY ?? 0;
  const gx = bx + (pose.gunX ?? 0);
  const gy = by + (pose.gunY ?? 0);
  const grip = gunPoint(view, view.grip, gx, gy);
  const rack = pose.rack ?? 0;
  const [axisX, axisY] = AXIS[dir];
  const fore = pose.hand ?? gunPoint(view, view.fore, gx - axisX * rack, gy - axisY * rack);

  for (const layer of ORDER[dir]) {
    if (layer === 'legs') drawLegs(c, person, dir, pose);
    else if (layer === 'torso') placePart(c, person.torsos[dir], TORSO_BOTTOM, person.legend, bx, by);
    else if (layer === 'head') placePart(c, person.heads[dir], HEAD_BOTTOM, person.legend, bx + (pose.headX ?? 0), by + (pose.headY ?? 0));
    else if (layer === 'gun') drawGun(c, view, gx, gy, dir, pose);
    else if (layer === 'nearArm') drawArm(c, person, shoulderOf(body.shoulderNear, body.wideNear, person, bx, by), body.elbowNear, grip);
    else if (layer === 'nearHand') drawHandOver(c, person, grip);
    else if (layer === 'farArm') {
      drawArm(c, person, shoulderOf(body.shoulderFar, body.wideFar, person, bx, by), body.elbowFar, fore);
      drawHandOver(c, person, fore);
    }
    else if (person.packs?.[dir]) placePart(c, person.packs[dir], TORSO_BOTTOM, person.legend, bx, by);
  }
  if (pose.carrying === 'mag') c.grid(fore[0] - 1, fore[1] + 1, MAG_GRID, MAG_LEGEND);
  if (pose.carrying === 'shell') c.grid(fore[0], fore[1] - 2, SHELL_GRID, SHELL_LEGEND);
  if (pose.dropped) c.grid(pose.dropped[0], pose.dropped[1], MAG_GRID, MAG_LEGEND);
  return c.toSprite();
}
