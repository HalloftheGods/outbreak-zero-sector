// The van seen from the side, for the drive between the bunker and a town (VanTransition.vue).
// The same grey panel van as the one parked in town, nose right, with its red band and roof rack.
// The wheels are their own two-frame sprite so they turn while the body bounces over them.
// Lit from the upper left like the rest of the book; k is the ink outline.

import type { PixelSprite, VanSideArt } from '../types.ts';
import { PixelCanvas, seeded } from '../kit.ts';
import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';

const { ash, blood, bone, denim, fire, ink, metal, wood } = RAMPS;

const BODY_W = 64;
const BODY_H = 27;
/** The wheels' centres along the body. */
const WHEEL_X = [14, 50] as const;
const WHEEL_TOP = 17;

const WHEEL_LEGEND: Legend = { K: ink[0], k: ink[1], m: metal[1], M: metal[2], c: metal[3] };

const WHEEL_A = [
  '..KKKKK..',
  '.KkkkkkK.',
  'KkkkMkkkK',
  'KkkmMmkkK',
  'KkMMcMMkK',
  'KkkmMmkkK',
  'KkkkMkkkK',
  '.KkkkkkK.',
  '..KKKKK..',
];

const WHEEL_B = [
  '..KKKKK..',
  '.KkkkkkK.',
  'KkMkkkMkK',
  'KkkmmmkkK',
  'KkkmcmkkK',
  'KkkmmmkkK',
  'KkMkkkMkK',
  '.KkkkkkK.',
  '..KKKKK..',
];

function wheel(rows: readonly string[]): PixelSprite {
  return PixelCanvas.fromGrid(rows, WHEEL_LEGEND).toSprite();
}

function drawCargo(c: PixelCanvas): void {
  c.rect(2, 4, 44, 16, ash[1]);
  c.rect(2, 3, 46, 1, ash[2]);
  // Roof rack on three posts, and a vent.
  c.rect(4, 1, 34, 1, metal[1]);
  for (const x of [5, 20, 36]) c.px(x, 2, metal[0]);
  c.rect(40, 1, 5, 2, metal[2]).rect(40, 1, 5, 1, metal[3]);
  // Sliding door, its rail and a faded square where a name was painted out.
  c.rect(24, 4, 1, 15, ash[0]).rect(40, 4, 1, 15, ash[0]);
  c.rect(24, 6, 16, 1, ash[0]);
  c.rect(29, 8, 7, 3, ash[2]).rect(30, 9, 5, 1, ash[0]);
  // Tail lamp.
  c.rect(2, 5, 2, 4, blood[2]).rect(2, 5, 2, 1, blood[3]);
}

function drawCab(c: PixelCanvas): void {
  c.poly([[46, 3], [50, 3], [57, 10], [61, 11], [61, 19], [46, 19]], ash[1]);
  c.rect(46, 3, 4, 1, ash[2]);
  c.line(50, 3, 57, 10, ash[2]).line(57, 10, 61, 11, ash[2]);
  // Door window with a glint, the seam and the handle.
  c.poly([[47, 5], [50, 5], [55, 10], [47, 10]], denim[0]);
  c.line(48, 9, 51, 6, denim[1]).line(49, 9, 51, 7, denim[2]);
  c.rect(46, 4, 1, 15, ash[0]);
  c.rect(48, 12, 2, 1, metal[3]);
  // Headlamp, amber marker and grille.
  c.rect(59, 11, 3, 2, bone[3]).rect(59, 12, 3, 1, bone[2]);
  c.rect(60, 16, 2, 1, fire[2]);
  c.rect(61, 14, 1, 2, ink[1]);
}

function drawRunningGear(c: PixelCanvas): void {
  // The red band the length of the van.
  c.rect(2, 13, 44, 3, blood[1]).rect(2, 13, 44, 1, blood[2]);
  c.rect(47, 13, 12, 3, blood[1]).rect(47, 13, 12, 1, blood[2]);
  c.rect(2, 19, 60, 1, ash[0]);
  // Bumpers, the exhaust and the dark under the sill.
  c.rect(1, 18, 3, 2, metal[2]);
  c.rect(58, 18, 5, 2, metal[2]).rect(58, 18, 5, 1, metal[3]);
  c.rect(6, 20, 52, 1, ink[1]);
  c.rect(1, 20, 3, 1, metal[1]);
  // Arches the wheels sit in.
  for (const x of WHEEL_X) c.rect(x - 5, 16, 11, 5, ink[0]).rect(x - 4, 15, 9, 1, ink[0]);
  // Road dirt and rust.
  for (const [x, y, w] of [[3, 17, 4], [21, 18, 3], [27, 17, 9], [43, 18, 2], [56, 17, 2]] as const) c.rect(x, y, w, 1, ash[0]);
  for (const [x, y] of [[9, 10], [33, 16], [44, 7], [52, 17]] as const) c.px(x, y, wood[1]);
}

function buildBody(): PixelSprite {
  const c = new PixelCanvas(BODY_W, BODY_H);
  drawCargo(c);
  drawCab(c);
  drawRunningGear(c);
  c.outline({ selective: true });
  return c.toSprite(BODY_W, BODY_H, BODY_W / 2, BODY_H - 1);
}

const SKYLINE_W = 96;
const SKYLINE_H = 24;

/** Dead blocks and leaning poles against the night, cut so the strip tiles end to end. */
function buildSkyline(): PixelSprite {
  const c = new PixelCanvas(SKYLINE_W, SKYLINE_H);
  const rand = seeded(0x7a11);
  let x = 0;
  let shade = 0;
  while (x < SKYLINE_W) {
    const w = Math.min(SKYLINE_W - x, 6 + Math.floor(rand() * 11));
    const top = 4 + Math.floor(rand() * 14);
    const face = shade % 2 === 0 ? ink[0] : ink[1];
    c.rect(x, top, w, SKYLINE_H - top, face);
    // A broken corner off some roofs, and the odd window still lit.
    const broken = rand() < 0.5 && w > 3;
    if (broken) c.rect(x + w - 3, top, 3, 2, ink[0]).rect(x + w - 2, top, 2, 1, ink[0]);
    const lit = rand() < 0.35 && SKYLINE_H - top > 6;
    if (lit) c.px(x + 1 + Math.floor(rand() * Math.max(1, w - 2)), top + 3, fire[rand() < 0.5 ? 0 : 1]);
    x += w;
    shade += 1;
  }
  for (const pole of [18, 66]) {
    c.rect(pole, 2, 1, SKYLINE_H - 2, wood[0]);
    c.rect(pole - 3, 4, 7, 1, wood[0]);
  }
  return c.toSprite(SKYLINE_W, SKYLINE_H, 0, SKYLINE_H);
}

export function buildVanSide(): VanSideArt {
  return {
    body: buildBody(),
    wheel: [wheel(WHEEL_A), wheel(WHEEL_B)],
    wheelAt: WHEEL_X.map((x) => ({ x: x - 4, y: WHEEL_TOP })),
    lamp: { x: 62, y: 12 },
    exhaust: { x: 0, y: 20 },
    skyline: buildSkyline(),
  };
}
