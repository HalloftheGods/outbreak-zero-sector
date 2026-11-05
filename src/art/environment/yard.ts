// Forecourt and boundary props. Fence segments have no margins and no outline: they sit end
// to end, the mesh is genuinely see-through, and one post per segment carries the run.

import { PROP_DEFS } from '../../../shared/protocol.ts';
import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import { bake, groundShadow } from './common.ts';

const { ink, metal, bone, fire, teal, concrete, ash, asphalt } = RAMPS;

const FENCE_RISE = 24;
const WIRE_ROWS = 4;
const POST_W = 2;

export function buildFenceH(): PixelSprite {
  const { w, h } = PROP_DEFS.fence_h;
  const ground = FENCE_RISE + h;
  const c = new PixelCanvas(w, ground + 1);
  const foot = ground - Math.floor(h / 2);
  const top = foot - FENCE_RISE + WIRE_ROWS;
  // A dark line where the mesh meets the ground, then diamonds with real holes in them.
  c.rect(0, foot + 1, w, 1, ink[1]);
  for (let y = top + 1; y < foot; y++) {
    for (let x = 0; x < w; x++) {
      const onDiamond = (x + y) % 6 === 0 || (x - y + 60) % 6 === 0;
      if (onDiamond) c.px(x, y, (x + y) % 12 === 0 ? metal[2] : metal[1]);
    }
  }
  c.rect(0, top, w, 2, metal[2]).rect(0, top, w, 1, metal[3]).rect(0, foot, w, 1, metal[1]);
  c.rect(0, top - WIRE_ROWS, POST_W, foot - top + WIRE_ROWS + 1, metal[1]).rect(0, top - WIRE_ROWS, 1, foot - top + WIRE_ROWS + 1, metal[3]);
  // Two strands of barbed wire on the post's arm, a barb every 8px.
  for (const y of [top - 3, top - 1]) c.rect(0, y, w, 1, metal[0]);
  for (let x = 4; x < w; x += 8) c.px(x, top - 4, metal[2]).px(x + 1, top - 3, metal[3]).px(x + 2, top - 2, metal[2]);
  return bake(c, 0, w, ground);
}

export function buildFenceV(): PixelSprite {
  const { w, h } = PROP_DEFS.fence_v;
  const ground = FENCE_RISE + h;
  const c = new PixelCanvas(w, ground + 1);
  const mid = Math.floor(w / 2);
  const foot = ground - 1;
  // Edge-on, a run is a strip of mesh with its rail along the top of it.
  for (let y = 0; y < foot; y++) {
    const onDiamond = y % 3 === 0;
    if (onDiamond) c.px(mid - 1, y, metal[1]).px(mid, y, metal[0]);
  }
  c.rect(mid - 2, 0, 1, foot, metal[3]);
  c.rect(mid + 1, 0, 1, foot, metal[0]);
  // The post at the segment's south end, climbing to the rail.
  const top = foot - FENCE_RISE + 1;
  c.rect(mid - 2, top, 3, FENCE_RISE, metal[1]).rect(mid - 2, top, 1, FENCE_RISE, metal[3]);
  c.rect(mid - 3, top, 5, 1, metal[2]).rect(mid - 2, foot, 4, 1, ink[1]);
  return bake(c, 0, w, ground);
}

export function buildGasPump(): PixelSprite {
  const { w, h } = PROP_DEFS.gas_pump;
  const rise = 20;
  const left = 4;
  const ground = h + rise + 1;
  const c = new PixelCanvas(w + 8, ground + 4);
  const right = left + w - 1;
  const top = ground - rise - h;
  groundShadow(c, left, ground - 1, w + 2, 3);
  c.rect(left - 2, ground - 3, w + 4, 3, concrete[1]).rect(left - 2, ground - 3, w + 4, 1, concrete[3]);
  c.rect(left, top, w, 8, bone[1]).rect(left, top, w, 1, bone[3]).rect(left, top, 1, 8, bone[2]);
  c.rect(left + 2, top + 2, w - 4, 3, fire[0]).rect(left + 2, top + 2, w - 4, 1, fire[1]);
  c.rect(left, ground - rise, w, rise - 3, bone[0]);
  c.rect(left, ground - rise, 1, rise - 3, bone[1]).rect(right, ground - rise, 1, rise - 3, ash[0]);
  c.rect(left, ground - rise, w, 2, fire[0]).rect(left, ground - rise, w, 1, fire[1]);
  // Dead display, a row of numbers that stopped, and the nozzle torn off its cradle.
  c.rect(left + 2, ground - 17, w - 4, 6, ink[1]);
  c.rect(left + 3, ground - 16, 2, 1, teal[1]).rect(left + 6, ground - 16, 3, 1, teal[1]).rect(left + 3, ground - 14, 5, 1, teal[0]);
  c.rect(left + 2, ground - 9, w - 4, 4, metal[0]).rect(left + 3, ground - 8, 2, 1, metal[2]).rect(left + 6, ground - 8, 2, 1, metal[2]);
  c.line(right + 1, ground - 13, right + 3, ground - 7, ink[1]).line(right + 3, ground - 7, right + 1, ground - 2, ink[1]);
  c.rect(right - 1, ground - 2, 3, 2, metal[2]).px(right - 2, ground - 1, metal[1]);
  c.rect(left + 3, ground - 5, 3, 1, asphalt[2]);
  c.outline({ selective: true });
  return bake(c, left, w, ground);
}
