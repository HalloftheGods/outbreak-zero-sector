// The overrun's two pieces: the blast door in the market hall's west wall, and the reward chest by it.
// The door is seen face-on as two steel leaves meeting at a seam: whole, buckling from the second
// warning, and burst. The chest is timber and steel, shut and open.

import { PROP_DEFS } from '../../../shared/protocol.ts';
import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { bake, groundShadow } from './common.ts';
import { finish, startPiece } from './furniture.ts';
import type { Piece } from './furniture.ts';

const { ash, bone, concrete, fire, ink, metal, olive, wood } = RAMPS;

const DOOR_RISE = 4;
const CHEST_RISE = 6;
const STRIPE_BAND = 4;
const STRIPE_PERIOD = 4;
const FRAME = 2;
const LID_HEIGHT = 5;
const LID_LIFT = 6;
const SHADOW_DEPTH = 3;

/** Where the leaves sit inside the frame: the seam row and the plates' span. */
function doorLayout(p: Piece) {
  const { left, top, front, w } = p;
  const x = left + FRAME;
  const inner = w - FRAME * 2;
  const y0 = top + STRIPE_BAND;
  const y1 = front - STRIPE_BAND - 1;
  const seam = Math.floor((y0 + y1) / 2);
  return { x, inner, y0, y1, seam };
}

/** The concrete frame around the door, with a hazard stripe band across its head and foot. */
function paintFrame(p: Piece, torn: boolean): void {
  const { c, left, right, top, front, ground, w } = p;
  c.rect(left, top, w, front - top, concrete[1]).rect(left, top, 1, front - top, concrete[2]).rect(right, top, 1, front - top, concrete[0]);
  for (const y of [top, front - STRIPE_BAND]) {
    c.rect(left + 1, y, w - 2, STRIPE_BAND, ink[0]);
    for (let row = 0; row < STRIPE_BAND; row += 1) {
      for (let x = left + 1; x < right; x += 1) {
        const lit = (x - left + row) % STRIPE_PERIOD < STRIPE_PERIOD / 2;
        const bitten = torn && (x * 7 + y) % 5 === 0;
        const painted = lit && !bitten;
        if (painted) c.px(x, y + row, fire[1]);
      }
    }
  }
  // The sill the leaves rest on, and the lip below it.
  c.rect(left, front, w, ground - front, concrete[1]).rect(left, front, w, 1, concrete[2]).rect(left, front + 1, w, 1, concrete[0]);
}

/** One steel leaf: plate, lit edge, shaded edge and a rivet in each corner. */
function paintLeaf(c: PixelCanvas, x: number, y: number, w: number, h: number, plate = metal[1]): void {
  c.rect(x, y, w, h, plate).rect(x, y, w, 1, metal[2]).rect(x, y, 1, h, metal[2]).rect(x + w - 1, y, 1, h, metal[0]).rect(x, y + h - 1, w, 1, metal[0]);
  for (const [rx, ry] of [[x + 2, y + 2], [x + w - 3, y + 2], [x + 2, y + h - 3], [x + w - 3, y + h - 3]] as const) c.px(rx, ry, metal[3]);
}

/** Shut: two plates, a seam locked with bars, and a wheel at its middle. */
function paintShut(p: Piece): void {
  const { c } = p;
  const { x, inner, y0, y1, seam } = doorLayout(p);
  paintLeaf(c, x, y0, inner, seam - y0);
  paintLeaf(c, x, seam + 1, inner, y1 - seam);
  c.rect(x, seam, inner, 1, ink[0]);
  for (const bx of [x + 1, x + inner - 4]) c.rect(bx, seam - 2, 3, 5, metal[3]).rect(bx, seam - 2, 3, 1, bone[3]).rect(bx, seam + 2, 3, 1, metal[1]);
  const cx = x + Math.floor(inner / 2);
  c.ellipse(cx, seam, 3.5, 3.5, metal[2]).ellipse(cx, seam, 2.5, 2.5, ink[0]).ellipse(cx, seam, 1.5, 1.5, metal[3]);
  c.px(cx, seam, ink[0]);
}

/** The door a horde has found: plates bowed in, the seam gaping with a light behind it, cracks and lost rivets. */
function paintBuckling(p: Piece): void {
  const { c } = p;
  const { x, inner, y0, y1, seam } = doorLayout(p);
  paintLeaf(c, x, y0, inner, seam - y0);
  paintLeaf(c, x, seam + 1, inner, y1 - seam);
  const cx = x + Math.floor(inner / 2);
  // Each plate bellies toward the seam: a dark dent with a lit crown on its far side.
  const dent = (y: number, h: number, dir: number): void => {
    const mid = y + Math.floor(h / 2) + dir * 3;
    c.ellipse(cx, mid, 5.5, 4.5, metal[0]).ellipse(cx - 1, mid - dir, 4, 3, metal[1]).ellipse(cx - 1, mid - dir * 2, 2.5, 1.5, metal[2]);
    c.line(cx - 4, mid - dir * 4, cx + 3, mid - dir * 4, metal[3]);
  };
  dent(y0, seam - y0, 1);
  dent(seam + 1, y1 - seam, -1);
  // The seam has sprung: a ragged slit with the lamp-lit dark beyond.
  c.rect(x, seam - 1, inner, 3, ink[0]).rect(x + 1, seam, inner - 2, 1, fire[1]).rect(x + 3, seam, inner - 6, 1, fire[2]).px(cx, seam, fire[3]);
  for (const bx of [x + 1, x + inner - 4]) c.rect(bx, seam - 3, 3, 3, metal[2]).rect(bx, seam - 3, 3, 1, metal[3]).rect(bx + 1, seam + 2, 3, 2, metal[1]);
  // Cracks running out from the seam, and rivets sheared off.
  c.line(x + 2, seam - 3, x + 4, y0 + 4, ink[0]).line(x + inner - 3, seam + 3, x + inner - 5, y1 - 4, ink[0]);
  c.px(x + 2, y0 + 2, metal[0]).px(x + inner - 3, y1 - 2, metal[0]);
}

/** Past breaking: the leaves torn back on their hinges, a black gap between, rubble across the sill. */
function paintBurst(p: Piece): void {
  const { c, left, right, front, ground } = p;
  const { x, inner, y0, y1, seam } = doorLayout(p);
  c.rect(x, y0, inner, y1 - y0 + 1, ink[0]);
  c.rect(x, seam - 2, inner, 5, ink[1]);
  // Fog drifting in from the dark.
  c.rect(x + 1, seam - 1, inner - 2, 1, ash[0]).rect(x + 3, seam + 1, inner - 6, 1, ash[0]);
  // The north leaf hangs by its top hinge, folded; the south leaf by its foot.
  c.poly([[x, y0], [x + inner, y0], [x + inner, y0 + 5], [x + 3, y0 + 9], [x, y0 + 7]], metal[1]);
  c.line(x, y0, x + inner - 1, y0, metal[2]).line(x, y0 + 7, x + 3, y0 + 9, metal[3]).line(x + 3, y0 + 9, x + inner - 1, y0 + 5, metal[0]);
  c.poly([[x, y1], [x + inner, y1], [x + inner, y1 - 4], [x + inner - 3, y1 - 8], [x + 2, y1 - 6]], metal[1]);
  c.line(x + 2, y1 - 6, x + inner - 3, y1 - 8, metal[3]).line(x, y1, x + inner - 1, y1, metal[0]);
  c.px(x + 2, y0 + 2, metal[3]).px(x + inner - 3, y1 - 2, metal[3]);
  // Bent locking bars sticking out of the jamb.
  c.line(x, seam - 4, x + 4, seam - 2, metal[3]).line(x + inner - 1, seam + 4, x + inner - 5, seam + 2, metal[2]);
  // Rubble thrown across the sill and the floor in front.
  for (const [dx, dy, dw, dh, shade] of [[1, 0, 3, 2, concrete[2]], [6, 1, 2, 2, concrete[3]], [10, 0, 3, 2, concrete[1]], [3, 2, 2, 1, concrete[3]], [12, 2, 2, 1, concrete[2]]] as const) {
    c.rect(left + dx, front + dy, dw, dh, shade).rect(left + dx, front + dy, dw, 1, concrete[3]);
  }
  c.rect(left + 8, ground - 1, 3, 1, olive[0]);
  c.px(right - 3, front + 1, ash[2]);
}

function doorSprite(paint: (p: Piece) => void, torn: boolean): PixelSprite {
  const p = startPiece('blast_door', DOOR_RISE);
  paintFrame(p, torn);
  paint(p);
  return finish(p);
}

/** A steel slab set into the rock, banded with hazard stripes. Drawn shut. */
export function buildBlastDoor(): PixelSprite {
  return doorSprite(paintShut, false);
}

/** From the second warning: bowed in, the seam sprung. */
export function buildBlastDoorBuckling(): PixelSprite {
  return doorSprite(paintBuckling, false);
}

/** From the breach: torn open. */
export function buildBlastDoorBurst(): PixelSprite {
  return doorSprite(paintBurst, true);
}

/** The chest's body: timber boards, steel corner bands and the front lip. */
function paintChestBody(p: Piece, lidFrom: number): void {
  const { c, left, right, front, top, w, ground } = p;
  c.rect(left, lidFrom, w, front - lidFrom, wood[2]).rect(left, lidFrom, w, 1, wood[3]);
  c.rect(left, front, w, ground - front, wood[1]).rect(left, front, w, 1, wood[2]).rect(left, ground - 1, w, 1, wood[0]);
  c.rect(left, top, 1, ground - top, wood[3]).rect(right, top, 1, ground - top, wood[0]);
  for (const x of [left + 2, right - 3]) c.rect(x, lidFrom, 2, ground - lidFrom, metal[2]).rect(x, lidFrom, 1, ground - lidFrom, metal[3]).rect(x + 1, front, 1, ground - front, metal[1]);
  c.px(left + 2, front + 2, ink[0]).px(right - 3, front + 2, ink[0]);
}

/** A timber chest with steel bands and a brass hasp. */
export function buildChest(): PixelSprite {
  const p = startPiece('chest', CHEST_RISE);
  const { c, left, front, top, w } = p;
  paintChestBody(p, top);
  // The lid's seam, then the hasp across it.
  c.rect(left, front - 1, w, 1, wood[0]);
  const mid = left + Math.floor(w / 2);
  c.rect(mid - 1, front - 2, 3, 5, fire[1]).rect(mid - 1, front - 2, 3, 1, fire[2]).px(mid, front + 1, ink[0]).px(mid - 1, front - 2, fire[3]);
  return finish(p);
}

/** The same chest with its lid thrown back and the reward showing. */
export function buildChestOpen(): PixelSprite {
  const { w, h } = PROP_DEFS.chest;
  const left = 2;
  const ground = h + CHEST_RISE + 1 + LID_LIFT;
  const c = new PixelCanvas(w + left * 2, ground + 4);
  groundShadow(c, left + 1, ground - 1, w, SHADOW_DEPTH);
  const front = ground - CHEST_RISE;
  const top = front - h;
  const p: Piece = { c, left, right: left + w - 1, w, ground, front, top };
  // The lid stands up behind the box, its inside toward us, one row clear of the rim.
  const lidTop = top - LID_HEIGHT - 1;
  c.rect(left + 1, lidTop, w - 2, LID_HEIGHT, wood[1]).rect(left + 1, lidTop, w - 2, 1, wood[3]).rect(left + 2, lidTop + 1, w - 4, LID_HEIGHT - 1, wood[0]);
  for (const x of [left + 3, left + w - 4]) c.rect(x, lidTop + 1, 1, LID_HEIGHT - 1, metal[1]);
  // The box: front face and sides, then its top as a hollow under a timber rim.
  paintChestBody(p, front);
  c.rect(left, top, w, front - top, wood[3]).rect(left + 1, top + 1, w - 2, front - top - 2, ink[0]);
  // What the horde was guarding: an ammo box, a stack of silver and a jewel.
  const inside = left + 3;
  c.rect(inside, top + 1, 5, 4, olive[1]).rect(inside, top + 1, 5, 1, olive[2]).rect(inside + 1, top + 3, 3, 1, fire[2]);
  c.rect(inside + 6, top + 2, 3, 3, metal[3]).rect(inside + 6, top + 2, 3, 1, bone[3]).rect(inside + 7, top + 3, 1, 1, metal[2]);
  c.rect(inside + 10, top + 3, 2, 2, fire[2]).px(inside + 10, top + 3, fire[3]);
  return bake(c.outline({ selective: true }), left, w, ground);
}
