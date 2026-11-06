// The survivor paper doll: draws a person holding a gun in one pose into a cell.
// Parts are hand-drawn grids (legs.ts, weapons.ts, one file per person); only the arms
// are drawn between two points, because they have to follow the hands through reloads.

import type { WeaponId } from '../../../shared/protocol.ts';
import type { PixelSprite } from '../types.ts';
import type { DrawnDir, Legend, Point } from '../kit.ts';
import { darker, INK_SOFT, RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import { ANCHOR_X, Cell } from './cell.ts';
import type { Contact, PlacedGrid } from './cell.ts';
import { LEG_SETS } from './legs.ts';
import type { Strip } from './legs.ts';
import { AXIS, GUN_LEGEND, GUN_LEGEND_EMPTY, GUNS, MAG_GRID, MAG_LEGEND, SHELL_GRID, SHELL_LEGEND } from './weapons.ts';
import type { GunView } from './weapons.ts';

const HIP_Y = 26;
/** The lowest row a dropped magazine lands on. */
const FLOOR_Y = 33;
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
  /** A smaller build: rows gone from the top of each leg and from the torso, which lowers everything above. */
  readonly shorter?: { readonly legs: number; readonly torso: number };
}

export function legTrim(person: Person): number {
  return person.shorter?.legs ?? 0;
}

/** How far this person's shoulders, head and gun sit below the standard build's. */
export function bodyDrop(person: Person): number {
  return legTrim(person) + (person.shorter?.torso ?? 0);
}

/**
 * How far this person's gun sits below the standard build's. A smaller build holds it
 * higher than its body drop by the leg trim, so the hands stay at the chest instead of
 * covering the legs. The muzzle flash reads this through SurvivorArt.gunDrop.
 */
export function gunDrop(person: Person): number {
  return bodyDrop(person) - legTrim(person);
}

/** Where a torso of this person's height ends, before the body offset moves it down. */
export function torsoBottom(person: Person): number {
  return TORSO_BOTTOM - (person.shorter?.torso ?? 0);
}

/** The grid compiler caches by array, so a trimmed strip has to stay the same array. */
const trimmedStrips = new WeakMap<Strip, Map<number, Strip>>();

export function trimStrip(strip: Strip, rows: number): Strip {
  const untrimmed = rows === 0;
  if (untrimmed) return strip;
  const trims = trimmedStrips.get(strip) ?? new Map<number, Strip>();
  trimmedStrips.set(strip, trims);
  const trimmed = trims.get(rows) ?? strip.slice(rows);
  trims.set(rows, trimmed);
  return trimmed;
}

/** A standing leg strip for one build, and how far it sits below the hip line. */
interface BuiltLeg {
  readonly rows: Strip;
  readonly dy: number;
}

const builtLegs = new WeakMap<Strip, Map<number, BuiltLeg>>();

function isBootRow(row: string): boolean {
  return row.includes('g') || row.includes('f');
}

/**
 * trimStrip for a standing leg. Two or more rows off the top would leave the boot as
 * tall as the shin, so such a trim also drops the first of two or more boot rows and
 * moves the strip down one, keeping the sole on the same floor row.
 */
export function legStrip(strip: Strip, trim: number): BuiltLeg {
  const builds = builtLegs.get(strip) ?? new Map<number, BuiltLeg>();
  builtLegs.set(strip, builds);
  const known = builds.get(trim);
  if (known) return known;
  const rows = trimStrip(strip, trim);
  const bootRows = rows.filter(isBootRow).length;
  const dropBoot = trim >= 2 && bootRows >= 2;
  const firstBoot = rows.findIndex(isBootRow);
  const built: BuiltLeg = dropBoot
    ? { rows: rows.filter((_, i) => i !== firstBoot), dy: 1 }
    : { rows, dy: 0 };
  builds.set(trim, built);
  return built;
}

const INKS: ReadonlySet<Color> = new Set<Color>(RAMPS.ink);
const LEG_LETTERS = 'rqpRQPgfe';
const drawnFarLegends = new WeakMap<Person, Legend>();

function isInk(color: Color | null | undefined): boolean {
  return color !== null && color !== undefined && INKS.has(color);
}

/**
 * The far leg's legend as drawn. The far leg stays a step darker than the near one,
 * but a leg letter the far legend sets to outline ink, where the near legend does not,
 * takes the near colour one step darker instead, so a far boot or shin never merges
 * with the outline. Where the near leg is ink too, the far leg copies it.
 */
export function farLegsLegend(person: Person): Legend {
  const known = drawnFarLegends.get(person);
  if (known) return known;
  const legend: Record<string, Color | null> = { ...person.farLegend };
  for (const letter of LEG_LETTERS) {
    const near = person.legend[letter];
    const far = person.farLegend[letter];
    const fixable = isInk(far) && near !== null && near !== undefined;
    if (!fixable) continue;
    legend[letter] = isInk(near) ? near : darker(near, 1);
  }
  drawnFarLegends.set(person, legend);
  return legend;
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

/**
 * Seen from the side the support hand is the far one, behind the body. While it works a
 * reload it comes round in front of the torso, or the magazine it carries would float.
 */
const WORKING_EAST: readonly Layer[] = ['pack', 'legs', 'torso', 'farArm', 'head', 'nearArm', 'gun', 'nearHand'];

function layersOf(dir: DrawnDir, pose: Pose): readonly Layer[] {
  const handAtWork = pose.hand !== undefined;
  return handAtWork && dir === 0 ? WORKING_EAST : ORDER[dir];
}

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

const rampOfColor = new Map<Color, readonly Color[]>();
for (const ramp of Object.values(RAMPS)) for (const color of ramp) rampOfColor.set(color, ramp);

function sameRamp(a: Color, b: Color): boolean {
  const ramp = rampOfColor.get(a);
  return ramp !== undefined && ramp === rampOfColor.get(b);
}

/** A contact line two steps darker than the body under it, in its own hue; soft ink where the body is already its ramp's darkest. */
function armRim(under: Color): Color {
  const shade = darker(under, 2);
  return shade === under ? INK_SOFT : shade;
}

/** A tone that can go a whole step darker without two of its shades becoming one. */
function hasRoomBelow(tone: Tone): boolean {
  return darker(tone[0], 1) !== tone[0];
}

const armContacts = new WeakMap<Person, Contact>();

/**
 * Where an arm crosses the body. The contact line is in the body's own hue instead of
 * near-black specks. Where a sleeve or cuff is in the same ramp as the body under it,
 * and its ramp has a darker colour to spare, that part of the arm goes one step darker,
 * so it reads as a form in front of the lit chest.
 */
function armContact(person: Person): Contact {
  const known = armContacts.get(person);
  if (known) return known;
  const darkens = new Set<Color>([person.sleeve, person.cuff].filter(hasRoomBelow).flat());
  const contact: Contact = {
    rim: armRim,
    over: (part, under) => (darkens.has(part) && sameRamp(part, under) ? darker(part, 1) : part),
  };
  armContacts.set(person, contact);
  return contact;
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
    const band = person.band;
    const banded = band !== undefined;
    if (banded) drawBand(layer, elbow, hand, band);
  }, armContact(person));
}

function drawHandOver(c: Cell, person: Person, hand: Point): void {
  c.overlay((layer) => drawHand(layer, hand[0], hand[1], person.hand), INK_SOFT);
}

function drawLegs(c: Cell, person: Person, dir: DrawnDir, pose: Pose): void {
  const set = LEG_SETS[dir];
  const near = pose.near ?? set.stand[0];
  const far = pose.far ?? set.stand[1];
  const trim = legTrim(person);
  const farLeg = legStrip(set.strips[far], trim);
  const nearLeg = legStrip(set.strips[near], trim);
  // Light comes from the upper left, so seen from behind the shaded leg is the near one on the right.
  const shadeNear = dir === 6;
  const farLegs = farLegsLegend(person);
  c.grid(set.farX, HIP_Y + trim + farLeg.dy, farLeg.rows, shadeNear ? person.legend : farLegs);
  c.grid(set.nearX, HIP_Y + trim + nearLeg.dy, nearLeg.rows, shadeNear ? farLegs : person.legend);
}

export function placePart(c: Cell, part: Part, bottom: number, legend: Legend, dx: number, dy: number): PlacedGrid {
  const w = Math.max(...part.rows.map((row) => row.length));
  const x = Math.floor(ANCHOR_X - w / 2) + (part.dx ?? 0) + dx;
  const y = bottom - part.rows.length + (part.dy ?? 0) + dy;
  c.grid(x, y, part.rows, legend);
  return { rows: part.rows, legend, x, y };
}

/** Facings seen from behind, where the head casts a shadow across the shoulders. */
const COLLAR_SHADOW: ReadonlySet<DrawnDir> = new Set<DrawnDir>([6, 7]);
/** Rows of that shadow under the head. */
const COLLAR_DEPTH = 2;

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
  const drop = bodyDrop(person);
  const by = (pose.bodyY ?? 0) + drop;
  const gx = bx + (pose.gunX ?? 0);
  const gy = (pose.bodyY ?? 0) + gunDrop(person) + (pose.gunY ?? 0);
  const grip = gunPoint(view, view.grip, gx, gy);
  const rack = pose.rack ?? 0;
  const [axisX, axisY] = AXIS[dir];
  // A reaching hand moves with the body, as the gun it works on does.
  const reached: Point | null = pose.hand ? [pose.hand[0] + bx, pose.hand[1] + by] : null;
  const fore = reached ?? gunPoint(view, view.fore, gx - axisX * rack, gy - axisY * rack);

  let torso: PlacedGrid | null = null;
  for (const layer of layersOf(dir, pose)) {
    if (layer === 'legs') drawLegs(c, person, dir, pose);
    else if (layer === 'torso') torso = placePart(c, person.torsos[dir], torsoBottom(person), person.legend, bx, by);
    else if (layer === 'head') {
      const head = placePart(c, person.heads[dir], HEAD_BOTTOM, person.legend, bx + (pose.headX ?? 0), by + (pose.headY ?? 0));
      const shaded = torso !== null && COLLAR_SHADOW.has(dir);
      if (shaded) c.shadeBelow(head, torso as PlacedGrid, COLLAR_DEPTH);
    }
    else if (layer === 'gun') drawGun(c, view, gx, gy, dir, pose);
    else if (layer === 'nearArm') drawArm(c, person, shoulderOf(body.shoulderNear, body.wideNear, person, bx, by), body.elbowNear, grip);
    else if (layer === 'nearHand') drawHandOver(c, person, grip);
    else if (layer === 'farArm') {
      drawArm(c, person, shoulderOf(body.shoulderFar, body.wideFar, person, bx, by), body.elbowFar, fore);
      drawHandOver(c, person, fore);
    }
    else if (person.packs?.[dir]) placePart(c, person.packs[dir], torsoBottom(person), person.legend, bx, by);
  }
  const carriesMag = pose.carrying === 'mag';
  const carriesShell = pose.carrying === 'shell';
  if (carriesMag) c.grid(fore[0] - 1, fore[1] + 1, MAG_GRID, MAG_LEGEND);
  if (carriesShell) c.grid(fore[0], fore[1] - 2, SHELL_GRID, SHELL_LEGEND);
  if (pose.dropped) c.grid(pose.dropped[0], Math.min(pose.dropped[1] + drop, FLOOR_Y), MAG_GRID, MAG_LEGEND);
  return c.toSprite();
}
