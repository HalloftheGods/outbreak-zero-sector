// The stack by the wall: taped cartons, three high. Searched, the top one is on the floor, the flaps
// are torn back on the next, and the last has been stood on.

import { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { PixelSprite } from '../types.ts';
import { groundShadow } from '../environment/common.ts';
import { bakeStage, over, stage } from './stage.ts';
import type { ContainerArt } from './stage.ts';

const { ink, wood, bone } = RAMPS;

const FOOT_W = 20;
const GROUND = 30;
const LEFT = 2;

function carton(c: PixelCanvas, x: number, y: number, w: number, lid: number, face: number): void {
  const fy = y + lid;
  const tape = x + Math.floor(w / 2) - 1;
  c.rect(x, y, w, lid, wood[3]).rect(x, y, 1, lid, bone[1]);
  c.rect(x, fy, w, face, wood[2]).rect(x, fy, w, 1, wood[1]).rect(x + w - 1, fy, 1, face, wood[1]);
  c.rect(x, fy + face - 1, w, 1, wood[1]);
  c.rect(tape, y, 2, lid, bone[3]).rect(tape, fy, 2, 3, bone[2]);
  c.rect(x + 2, fy + face - 4, 3, 2, wood[1]);
}

function stackBase(): PixelCanvas {
  const c = new PixelCanvas(FOOT_W + 4, 34);
  groundShadow(c, LEFT + 1, GROUND - 1, FOOT_W, 3);
  return c;
}

export function buildCrates(): PixelSprite {
  const c = stackBase();
  carton(c, LEFT + 9, GROUND - 15, 12, 5, 10);
  carton(c, LEFT - 1, GROUND - 16, 12, 5, 11);
  carton(c, LEFT + 2, GROUND - 28, 13, 5, 8);
  c.rect(LEFT + 10, GROUND - 15, 1, 15, ink[1]);
  c.outline({ selective: true });
  return c.toSprite(c.w, c.h, LEFT + FOOT_W / 2, GROUND);
}

/** Flaps torn back from a wide hole: one stood up behind, one flat down each side, one down the face. */
function rifled(c: PixelCanvas, x: number, y: number, w: number, lid: number, face: number): void {
  const fy = y + lid;
  c.rect(x, fy, w, face, wood[2]).rect(x + w - 1, fy, 1, face, wood[1]).rect(x, fy + face - 1, w, 1, wood[1]);
  c.rect(x, y, w, lid, wood[1]).rect(x + 1, y + 1, w - 2, lid - 1, ink[0]);
  // Crumpled packing at the bottom of the hole, what the searcher left.
  c.rect(x + 1, fy - 2, w - 2, 2, bone[0]).rect(x + 2, fy - 2, 3, 1, bone[1]).rect(x + 7, fy - 1, 2, 1, bone[1]);
  c.poly([[x, y], [x + 1, y - 5], [x + w - 2, y - 6], [x + w - 1, y]], wood[3]);
  c.line(x + 1, y - 5, x + w - 2, y - 6, bone[1]).line(x + 3, y - 1, x + 6, y - 4, wood[2]);
  c.poly([[x, y + 1], [x - 4, y + 4], [x - 4, y + 7], [x, y + lid]], wood[3]);
  c.poly([[x + w - 1, y + 1], [x + w + 2, y + 4], [x + w + 2, y + 7], [x + w - 1, y + lid]], wood[3]);
  c.poly([[x, fy], [x + w - 1, fy], [x + w - 2, fy + 3], [x + 7, fy + 4], [x + 5, fy + 2], [x + 1, fy + 4]], wood[3]);
  c.rect(x, fy, w, 1, bone[1]);
}

/** Stamped flat: the top folded into the box, the face buckled, the tape split. */
function crushed(c: PixelCanvas, x: number, y: number, w: number, h: number): void {
  const bottom = y + h;
  c.poly([[x, y + 3], [x + 4, y + 1], [x + 7, y + 4], [x + w - 1, y], [x + w - 1, bottom], [x, bottom]], wood[2]);
  c.poly([[x, y + 3], [x + 4, y + 1], [x + 7, y + 4], [x + w - 1, y], [x + w - 2, y - 2], [x + 2, y - 1]], wood[3]);
  c.line(x, y + 3, x + 4, y + 1, wood[1]).line(x + 4, y + 1, x + 7, y + 4, wood[0]).line(x + 7, y + 4, x + w - 1, y, wood[1]);
  c.line(x + 7, y + 5, x + 4, bottom - 2, wood[0]).line(x + 8, y + 5, x + 10, bottom - 2, wood[0]);
  c.rect(x, bottom - 1, w, 1, wood[1]);
  c.rect(x + 5, y, 2, 1, bone[3]).rect(x + 8, y + 1, 2, 1, bone[3]);
}

function cratesOpened(): PixelSprite {
  const c = stackBase();
  crushed(c, LEFT + 10, GROUND - 8, 12, 8);
  rifled(c, LEFT - 1, GROUND - 15, 12, 6, 9);
  c.outline({ selective: true });
  const s = stage('crate_stack', c.toSprite(c.w, c.h, LEFT + FOOT_W / 2, GROUND), 4, 6);
  over(s.c, (layer) => {
    // The top carton, thrown down and flattened.
    const y = s.ground;
    layer.poly([[s.left + 6, y + 1], [s.left + 17, y], [s.left + 21, y + 3], [s.left + 9, y + 5]], wood[3]);
    layer.line(s.left + 9, y + 2, s.left + 18, y + 2, bone[2]);
    layer.line(s.left + 9, y + 5, s.left + 21, y + 3, wood[1]);
    layer.rect(s.left, y + 3, 3, 1, wood[3]);
  });
  return bakeStage(s);
}

export function buildCrateArt(closed: PixelSprite): ContainerArt {
  return { closed, opened: cratesOpened() };
}
