// The downed crawl and the death collapse. These face no direction, so they reuse a
// person's own parts: the back view turned on its side, face down, for both. The cast
// are kids and teens, so a fall stays bloodless: they lie down and the gun drops.

import type { Clip, PixelSprite } from '../types.ts';
import { makeClip } from '../kit.ts';
import type { Point } from '../kit.ts';
import { Cell, turnClockwise } from './cell.ts';
import { LEG_SETS } from './legs.ts';
import type { Strip } from './legs.ts';
import { bodyDrop, drawHand, HEAD_BOTTOM, legTrim, limbSegment, placePart, torsoBottom, trimStrip } from './rig.ts';
import type { Person, Tone } from './rig.ts';
import { GUN_LEGEND } from './weapons.ts';

const GROUND_Y = 33;
const TORSO_X = 13;
/** A body lying down is foreshortened, so it is no wider than this. */
const LYING_WIDTH = 10;

const DROPPED_PISTOL = [
  'dddddk',
  'cccbbk',
  'kbbkk.',
  '.ak...',
];

function narrowed(rows: readonly string[], width: number): readonly string[] {
  const extra = Math.max(...rows.map((row) => row.length)) - width;
  if (extra <= 0) return rows;
  const cut = new Set(Array.from({ length: extra }, (_, i) => Math.round(((i + 1) * width) / (extra + 1))));
  return rows.map((row) => [...row].filter((_, x) => !cut.has(x)).join(''));
}

function sideways(rows: readonly string[]): readonly string[] {
  return turnClockwise(narrowed(rows, LYING_WIDTH));
}

interface LyingParts {
  readonly torso: readonly string[];
  readonly nearLeg: Strip;
  readonly farLeg: Strip;
}

function drawLying(c: Cell, person: Person, parts: LyingParts, lift: number, shift: number): number {
  const top = GROUND_Y - parts.torso.length + 1 - lift;
  const legX = TORSO_X + 1 - parts.nearLeg[0].length + shift;
  c.grid(legX, top + 1, parts.farLeg, person.farLegend);
  c.grid(legX, top + 5, parts.nearLeg, person.legend);
  c.grid(TORSO_X + shift, top, parts.torso, person.legend);
  return top;
}

function drawArmBetween(c: Cell, from: Point, to: Point, sleeve: Tone, cuff: Tone, hand: Tone): void {
  const elbow: Point = [Math.round((from[0] + to[0]) / 2), Math.round((from[1] + to[1]) / 2)];
  limbSegment(c, from, elbow, sleeve);
  limbSegment(c, elbow, to, cuff);
  drawHand(c, to[0], to[1], hand);
}

interface CrawlFrame {
  readonly nearHand: number;
  readonly farHand: number;
  readonly nearLeg: string;
  readonly farLeg: string;
  readonly shift: number;
  readonly head: number;
}

const CRAWL: readonly CrawlFrame[] = [
  { nearHand: 34, farHand: 27, nearLeg: 'stand', farLeg: 'short', shift: 0, head: 0 },
  { nearHand: 31, farHand: 29, nearLeg: 'stand', farLeg: 'stand', shift: 1, head: 1 },
  { nearHand: 28, farHand: 33, nearLeg: 'short', farLeg: 'stand', shift: 1, head: 0 },
  { nearHand: 30, farHand: 30, nearLeg: 'stand', farLeg: 'stand', shift: 0, head: 1 },
];

function crawlFrame(person: Person, frame: CrawlFrame): PixelSprite {
  const c = new Cell();
  const back = LEG_SETS[6].strips;
  const torso = sideways(person.torsos[6].rows);
  const trim = legTrim(person);
  const parts = {
    torso,
    nearLeg: turnClockwise(trimStrip(back[frame.nearLeg], trim)),
    farLeg: turnClockwise(trimStrip(back[frame.farLeg], trim)),
  };
  const shoulderX = TORSO_X + torso[0].length - 1 + frame.shift;
  const top = GROUND_Y - torso.length + 1;
  drawArmBetween(c, [shoulderX, top + 2], [frame.farHand + frame.shift, top + 3], person.sleeve, person.cuff, person.hand);
  drawLying(c, person, parts, 0, frame.shift);
  const head = person.heads[0];
  const headBottom = top + 8;
  placePart(c, head, headBottom, person.legend, 11 + frame.shift, frame.head);
  drawArmBetween(c, [shoulderX, top + 7], [frame.nearHand + frame.shift, GROUND_Y - 1], person.sleeve, person.cuff, person.hand);
  return c.toSprite();
}

export function downedClip(person: Person): Clip {
  return makeClip(CRAWL.map((frame) => crawlFrame(person, frame)), 4, true);
}

/** Facing the viewer, hands at the sides. Exported for the portrait, which is this at rest. */
export function standingFrame(person: Person, bodyY: number, leg: string, headX: number, headY: number, armLift: number): PixelSprite {
  const c = new Cell();
  const set = LEG_SETS[2];
  const drop = bodyDrop(person);
  const trim = legTrim(person);
  const pack = person.packs?.[2];
  if (pack) placePart(c, pack, torsoBottom(person), person.legend, 0, drop + bodyY);
  const legRows = set.strips[leg].slice(trim, 8 - bodyY);
  c.grid(set.farX, 26 + trim + bodyY, legRows, person.farLegend);
  c.grid(set.nearX, 26 + trim + bodyY, legRows, person.legend);
  placePart(c, person.torsos[2], torsoBottom(person), person.legend, 0, drop + bodyY);
  const shoulder = 20 + drop + bodyY;
  // Arms are shorter on a smaller build, or the hands would reach the floor.
  const reach = 7 - armLift - Math.ceil(drop / 2);
  const left: Point = [14 - person.spread, shoulder];
  const right: Point = [25 + person.spread, shoulder];
  drawArmBetween(c, left, [left[0] - 2, shoulder + reach], person.sleeve, person.cuff, person.hand);
  drawArmBetween(c, right, [right[0] + 2, shoulder + reach], person.sleeve, person.cuff, person.hand);
  placePart(c, person.heads[2], HEAD_BOTTOM, person.legend, headX, drop + bodyY + headY);
  return c.toSprite();
}

function corpseFrame(person: Person, lift: number, gun: boolean): PixelSprite {
  const c = new Cell();
  const back = LEG_SETS[6].strips;
  const torso = sideways(person.torsos[6].rows);
  const head = sideways(person.heads[6].rows);
  const leg = turnClockwise(trimStrip(back.stand, legTrim(person)));
  const top = GROUND_Y - torso.length + 1 - lift;
  const shoulderX = TORSO_X + torso[0].length - 1;
  drawArmBetween(c, [shoulderX - 1, top + 1], [shoulderX + 5, top - 3], person.sleeve, person.cuff, person.hand);
  drawLying(c, person, { torso, nearLeg: leg, farLeg: leg }, lift, 0);
  c.grid(shoulderX, top + Math.floor((torso.length - head.length) / 2), head, person.legend);
  drawArmBetween(c, [shoulderX - 3, top + torso.length - 2], [shoulderX - 10, top + torso.length], person.sleeve, person.cuff, person.hand);
  if (gun) c.grid(31, 31, DROPPED_PISTOL, GUN_LEGEND);
  return c.toSprite();
}

export function deadClip(person: Person): Clip {
  return makeClip([
    standingFrame(person, 0, 'stand', -1, 0, 3),
    standingFrame(person, 2, 'stand', 1, 0, 1),
    standingFrame(person, 4, 'stand', 1, 1, 0),
    corpseFrame(person, 3, false),
    corpseFrame(person, 0, true),
  ], 7, false);
}
