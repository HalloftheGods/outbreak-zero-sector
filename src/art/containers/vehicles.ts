// Cars after someone has been through them: the glass punched out, flecks of it on the ground, and
// a door left hanging. Glass is found by colour, so one pass fits every body and facing.

import type { PropKind } from '../../../shared/protocol.ts';
import { seeded } from '../kit.ts';
import type { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color, Ramp } from '../palette.ts';
import type { PixelSprite } from '../types.ts';
import { bakeStage, glints, over, stage, tipped } from './stage.ts';
import type { ContainerArt } from './stage.ts';

const { ink, metal, denim, bone, brick, wood, ash } = RAMPS;

const GLASS: readonly Color[] = [denim[0], denim[1]];

function isGlass(c: PixelCanvas, x: number, y: number): boolean {
  const color = c.get(x, y);
  return color !== null && GLASS.includes(color);
}

/** Every pane goes dark, with a few jagged teeth of glass left in the frame. */
function shatter(c: PixelCanvas, seed: number): void {
  const rng = seeded(seed);
  const before = c.clone();
  const teeth = [denim[2], metal[3], denim[2], bone[3]];
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      if (!isGlass(before, x, y)) continue;
      const rim = [[0, -1], [-1, 0], [1, 0], [0, 1]].some(([dx, dy]) => !isGlass(before, x + dx, y + dy));
      c.px(x, y, rim && rng() < 0.2 ? teeth[Math.floor(rng() * teeth.length)] : ink[0]);
    }
  }
}

/** A side door opened out towards the camera, foreshortened, over the dark of the cabin. */
function sideDoor(c: PixelCanvas, x: number, y: number, w: number, h: number, paint: Ramp): void {
  c.rect(x, y, w, h, ink[0]).rect(x + 3, y + 1, 4, h - 2, wood[1]);
  over(c, (layer) => {
    layer.poly([[x, y - 4], [x + 6, y - 1], [x + 6, y + h + 3], [x, y + h]], paint[2]);
    layer.line(x, y - 4, x + 6, y - 1, paint[1]);
    layer.poly([[x + 1, y - 2], [x + 5, y], [x + 5, y + 3], [x + 1, y + 1]], ink[0]);
    layer.px(x + 2, y, denim[2]).px(x + 4, y + 2, metal[3]);
    layer.rect(x + 4, y + 5, 1, 2, paint[0]);
  });
}

/** A boot lid raised on its hinge over the dark well it covered, on a car parked across the view. */
function poppedBoot(c: PixelCanvas, x: number, y: number, h: number, paint: Ramp): void {
  const reach = 6;
  const rise = 9;
  c.rect(x, y, 6, h, ink[0]).rect(x + 1, y + h - 3, 2, 2, wood[1]);
  over(c, (layer) => {
    layer.poly([[x, y], [x, y + h], [x + reach, y + h - rise], [x + reach, y - rise]], paint[1]);
    layer.line(x + reach, y - rise, x + reach, y + h - rise, paint[2]).line(x, y, x + reach, y - rise, paint[2]);
  });
}

const STEEL: Ramp = [metal[0], metal[1], metal[2]];
const RUST: Ramp = [brick[0], brick[1], brick[2]];
/** Spare rows over a car for the raised boot lid. */
const LID_ROOM = 8;

function sedanHOpened(sedan: PixelSprite): PixelSprite {
  const s = stage('car_sedan_h', sedan, 3, 7, LID_ROOM);
  const { c, left, ground } = s;
  shatter(c, 11);
  poppedBoot(c, left + 38, LID_ROOM + 5, 9, STEEL);
  sideDoor(c, left + 17, LID_ROOM + 15, 8, 7, STEEL);
  glints(c, [[left + 3, ground + 2], [left + 9, ground + 4], [left + 27, ground + 1], [left + 31, ground + 3], [left + 35, ground + 1], [left + 39, ground + 3], [left + 24, ground + 4]]);
  return bakeStage(s);
}

/** The glass burned out long ago, so what was left of it glints in the frames. */
function wreckOpened(wreck: PixelSprite): PixelSprite {
  const s = stage('car_wreck_h', wreck, 3, 7, LID_ROOM);
  const { c, left, ground } = s;
  poppedBoot(c, left + 38, LID_ROOM + 8, 8, RUST);
  sideDoor(c, left + 17, LID_ROOM + 16, 8, 6, RUST);
  const y = LID_ROOM;
  glints(c, [[left + 11, y + 8], [left + 13, y + 10], [left + 33, y + 8], [left + 35, y + 11], [left + 4, ground + 2], [left + 28, ground + 2], [left + 33, ground + 4], [left + 38, ground + 1]]);
  return bakeStage(s);
}

function sedanVOpened(sedan: PixelSprite): PixelSprite {
  const s = stage('car_sedan_v', sedan, 7, 5);
  const { c, left, right, ground } = s;
  shatter(c, 23);
  over(c, (layer) => {
    // The driver's door, thrown wide from the front pillar.
    const y = 20;
    layer.poly([[left, y], [left - 5, y + 3], [left - 5, y + 9], [left, y + 8]], RUST[2]);
    layer.line(left, y, left - 5, y + 3, RUST[1]);
    layer.rect(left - 4, y + 3, 3, 2, ink[0]);
  });
  glints(c, [[right + 2, 22], [right + 3, 27], [right + 2, 33], [left - 3, 33], [left - 2, 37], [left + 4, ground + 2], [left + 14, ground + 3]]);
  return bakeStage(s);
}

function vanOpened(van: PixelSprite): PixelSprite {
  const s = stage('van_h', van, 3, 7);
  const { c, left, ground } = s;
  const side = 15;
  shatter(c, 37);
  // The sliding door run back along its rail, the load bay turned out on the road.
  c.rect(left + 22, side + 1, 14, 15, ink[0]);
  c.rect(left + 24, side + 8, 4, 7, wood[1]).rect(left + 24, side + 8, 4, 1, wood[2]);
  c.rect(left + 30, side + 11, 4, 4, ash[0]);
  over(c, (layer) => {
    layer.rect(left + 37, side + 1, 12, 15, metal[1]).rect(left + 37, side + 1, 12, 1, ash[1]).rect(left + 37, side + 1, 1, 15, ash[2]);
    tipped(layer, left + 25, ground + 1, wood[2]);
    tipped(layer, left + 33, ground + 3, bone[1]);
  });
  glints(c, [[left + 3, ground + 2], [left + 8, ground + 4], [left + 13, ground + 1], [left + 17, ground + 3], [left + 44, ground + 2]]);
  return bakeStage(s);
}

export function buildCarArt(props: Record<PropKind, PixelSprite>): Record<'car' | 'car_v' | 'wreck' | 'van', ContainerArt> {
  const { car_sedan_h: sedan, car_sedan_v: parked, car_wreck_h: wreck, van_h: van } = props;
  return {
    car: { closed: sedan, opened: sedanHOpened(sedan) },
    car_v: { closed: parked, opened: sedanVOpened(parked) },
    wreck: { closed: wreck, opened: wreckOpened(wreck) },
    van: { closed: van, opened: vanOpened(van) },
  };
}
