// Shelves, lockers and fridges: the upright pieces. Shut, everything is squared away. Searched, the
// shelf is half empty with its stock on the floor, and a door hangs off its hinge past the frame.

import { finish, startPiece } from '../environment/furniture.ts';
import type { Piece } from '../environment/furniture.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import type { PixelSprite } from '../types.ts';
import { bakeStage, over, paper, stage, tipped, upright } from './stage.ts';
import type { ContainerArt } from './stage.ts';

const { ink, metal, wood, bone, denim, teal, blood, olive, fire, ash } = RAMPS;

function shelfFrame(): Piece {
  const p = startPiece('shelf', 16);
  const { c, left, right, front, top, w } = p;
  c.rect(left, top, w, 10, metal[1]);
  c.rect(left, top, w, 1, metal[3]).rect(left, top, 1, 10, metal[2]).rect(left + 3, top + 3, w - 6, 5, metal[0]);
  c.rect(left, front, w, 16, ink[1]);
  c.rect(left, front, 2, 16, metal[1]).rect(right - 1, front, 2, 16, metal[0]).rect(left, front, 1, 16, metal[2]);
  c.rect(left + 15, front, 1, 16, metal[0]);
  return p;
}

function board({ c, left, w }: Piece, y: number): void {
  c.rect(left + 1, y, w - 2, 1, metal[2]).rect(left + 1, y + 1, w - 2, 1, ink[1]);
}

/** Two matching runs of stock per board, every tin the same height and the same gap apart. */
const STOCK: readonly (readonly [Color, Color])[] = [[teal[2], bone[2]], [blood[2], olive[2]], [denim[2], fire[1]]];

function shelfClosed(): PixelSprite {
  const p = shelfFrame();
  const { c, left, front, top } = p;
  STOCK.forEach(([first, second], row) => {
    const y = front + 5 + row * 5;
    board(p, y);
    for (let x = 2; x < 14; x += 3) upright(c, left + x, y, first, 4);
    for (let x = 17; x < 29; x += 3) upright(c, left + x, y, second, 4);
  });
  // Cartons on top, side by side and square to the edge.
  for (const x of [left + 5, left + 19]) {
    c.rect(x, top - 2, 8, 6, wood[2]).rect(x, top - 2, 8, 1, wood[3]).rect(x + 3, top - 2, 2, 6, bone[1]);
  }
  return finish(p);
}

function shelfOpened(): PixelSprite {
  const p = shelfFrame();
  const { c, left, right, front, top } = p;
  board(p, front + 5);
  board(p, front + 15);
  // The middle board has dropped off its pin at the right end.
  c.line(left + 2, front + 10, left + 14, front + 10, metal[2]).line(left + 16, front + 10, right - 2, front + 15, metal[2]);
  // What is left has been shoved about: lying down, leaning, bunched at one end.
  upright(c, left + 3, front + 5, teal[2], 4);
  tipped(c, left + 7, front + 3, bone[2]);
  tipped(c, left + 24, front + 3, olive[2]);
  c.line(left + 21, front + 4, left + 19, front + 1, blood[2]);
  tipped(c, left + 3, front + 8, denim[2]);
  tipped(c, left + 5, front + 13, blood[2]);
  upright(c, left + 18, front + 15, fire[1], 3);
  // One carton shoved to the edge and skewed, the other gone.
  c.poly([[left + 21, top + 1], [left + 28, top - 3], [left + 31, top + 2], [left + 24, top + 6]], wood[2]);
  c.line(left + 21, top + 1, left + 28, top - 3, wood[3]).line(left + 24, top - 1, left + 27, top + 4, bone[1]);
  const s = stage('shelf', finish(p), 4, 6);
  over(s.c, (layer) => {
    const y = s.ground;
    tipped(layer, s.left + 2, y + 1, teal[2]);
    tipped(layer, s.left + 12, y + 3, bone[2]);
    tipped(layer, s.left + 22, y + 1, blood[2]);
    upright(layer, s.left + 8, y + 3, denim[2], 3);
    upright(layer, s.left + 29, y + 4, fire[1], 3);
    paper(layer, s.left + 17, y);
  });
  return bakeStage(s);
}

export function buildShelfArt(): ContainerArt {
  return { closed: shelfClosed(), opened: shelfOpened() };
}

/** Which colours make up a tall steel-or-enamel box. */
interface Skin {
  readonly lid: Color;
  readonly lidEdge: Color;
  readonly face: Color;
  readonly faceEdge: Color;
  readonly seam: Color;
}

const LOCKER: Skin = { lid: metal[1], lidEdge: metal[3], face: ash[0], faceEdge: metal[1], seam: metal[0] };
const FRIDGE: Skin = { lid: bone[1], lidEdge: bone[3], face: bone[2], faceEdge: bone[3], seam: bone[0] };

const RISE = 22;

/** Lockers and fridges share a body, so a fridge stands exactly as big as a locker. */
function tallBody(kind: 'locker' | 'fridge', skin: Skin): Piece {
  const p = startPiece(kind, RISE);
  const { c, left, ground, front, top, w } = p;
  c.rect(left, top, w, 8, skin.lid).rect(left, top, w, 1, skin.lidEdge).rect(left, top, 1, 8, skin.lidEdge);
  c.rect(left, front, w, RISE, skin.face);
  c.rect(left, front, w, 1, skin.faceEdge).rect(left, front, 1, RISE, skin.faceEdge);
  c.rect(left, ground - 1, w, 1, ink[1]);
  return p;
}

export function buildLocker(): PixelSprite {
  const p = tallBody('locker', LOCKER);
  const { c, left, front } = p;
  c.rect(left + 7, front, 2, RISE, metal[0]);
  for (const x of [left + 2, left + 10]) {
    for (const y of [front + 3, front + 5, front + 7]) c.rect(x, y, 4, 1, ink[1]);
  }
  c.rect(left + 5, front + 11, 1, 3, metal[3]).rect(left + 10, front + 11, 1, 3, metal[3]);
  return finish(p);
}

function lockerOpened(): PixelSprite {
  const p = tallBody('locker', LOCKER);
  const { c, left, right, ground, front } = p;
  c.rect(left + 7, front, 2, RISE, metal[0]);
  for (const y of [front + 3, front + 5, front + 7]) c.rect(left + 2, y, 4, 1, ink[1]);
  c.rect(left + 5, front + 11, 1, 3, metal[3]);
  // The right door is gone from the frame: an empty hole with a shelf gone slack.
  c.rect(left + 9, front + 1, 7, RISE - 1, ink[0]);
  c.line(left + 9, front + 6, right, front + 8, metal[1]);
  c.line(left + 11, front + 2, left + 13, front + 2, metal[3]).px(left + 12, front + 3, metal[2]);
  // A jacket slumped at the bottom of it.
  c.rect(left + 10, ground - 7, 5, 6, denim[1]).rect(left + 10, ground - 7, 5, 1, denim[2]);
  const s = stage('locker', finish(p), 7, 5);
  over(s.c, (layer) => {
    // The door itself, swung out on its hinge: its inside face catches the light.
    const hinge = s.right + 1;
    const y = s.ground - RISE;
    layer.poly([[hinge, y], [hinge + 4, y + 2], [hinge + 4, y + RISE + 2], [hinge, y + RISE - 1]], metal[2]);
    layer.line(hinge, y, hinge + 4, y + 2, metal[3]);
    layer.rect(hinge + 1, y + 8, 3, 1, metal[1]).rect(hinge + 1, y + 13, 3, 1, metal[1]);
    tipped(layer, s.left + 4, s.ground + 1, bone[2]);
    paper(layer, s.left + 9, s.ground + 2);
  });
  return bakeStage(s);
}

export function buildLockerArt(closed: PixelSprite): ContainerArt {
  return { closed, opened: lockerOpened() };
}

const FREEZER = 7;

export function buildFridge(): PixelSprite {
  const p = tallBody('fridge', FRIDGE);
  const { c, left, right, ground, front } = p;
  c.rect(right, front, 1, RISE, bone[1]);
  c.rect(left, front + FREEZER, p.w, 1, bone[0]);
  c.rect(left + 2, front + 3, 1, 3, metal[1]).rect(left + 2, front + FREEZER + 2, 1, 6, metal[1]);
  c.rect(left + 2, ground - 3, 12, 2, ink[1]);
  for (const x of [left + 3, left + 6, left + 9, left + 12]) c.px(x, ground - 3, metal[1]);
  return finish(p);
}

function fridgeOpened(): PixelSprite {
  const p = tallBody('fridge', FRIDGE);
  const { c, left, right, ground, front } = p;
  // Lit inside, the last thing still working, and picked almost bare.
  c.rect(left + 1, front + 1, 14, RISE - 2, bone[3]);
  c.rect(left + 1, front + 1, 14, 2, fire[3]);
  c.rect(left + 1, front + 1, 1, RISE - 2, bone[1]).rect(right - 1, front + 1, 1, RISE - 2, bone[1]);
  c.rect(left + 1, front + FREEZER, 14, 1, bone[0]);
  for (const y of [front + 12, front + 17]) c.rect(left + 2, y, 12, 1, metal[1]);
  c.rect(left + 3, front + 9, 2, 3, olive[1]).rect(left + 10, front + 15, 3, 2, blood[1]);
  c.rect(left + 2, ground - 3, 12, 2, ink[1]);
  const s = stage('fridge', finish(p), 7, 5);
  over(s.c, (layer) => {
    const hinge = s.right + 1;
    const y = s.ground - RISE;
    layer.poly([[hinge, y + FREEZER + 1], [hinge + 4, y + FREEZER + 3], [hinge + 4, y + RISE + 2], [hinge, y + RISE - 1]], bone[1]);
    layer.poly([[hinge, y], [hinge + 3, y + 1], [hinge + 3, y + FREEZER], [hinge, y + FREEZER - 1]], bone[2]);
    for (const row of [FREEZER + 6, FREEZER + 11]) layer.rect(hinge + 1, y + row, 3, 1, metal[1]);
    tipped(layer, s.left + 2, s.ground + 1, teal[1]);
    upright(layer, s.left + 10, s.ground + 4, bone[2], 3);
  });
  return bakeStage(s);
}

export function buildFridgeArt(closed: PixelSprite): ContainerArt {
  return { closed, opened: fridgeOpened() };
}
