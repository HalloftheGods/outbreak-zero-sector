// The title lockup. Bone block capitals dipped in blood, with the blood line wandering
// across the word and running off the bottom in drips. Damage is placed by hand: every
// bite, crack and bullet hole below sits where it breaks a letter without losing it.

import type { PixelSprite } from '../types.ts';
import { PixelCanvas } from '../kit.ts';
import type { Legend, Point } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import { GLYPH_W, OUTBREAK, STENCIL } from './lettering.ts';
import type { Grid } from './shared.ts';

const { blood, bone, fire, ink } = RAMPS;

const W = 246;
const H = 78;
const WORD_X = 4;
const WORD_Y = 4;
const PITCH = GLYPH_W + 5;
const WORD_W = PITCH * 7 + GLYPH_W;
const EXTRUDE = 2;
const SUB_Y = 60;
const SUBTITLE = 'ZERO SECTOR';
const SUB_PITCH = 11;
const SUB_SPACE = 7;
const TAPE_H = 6;

const BLOOD: Legend = { u: blood[3], t: blood[2], s: blood[1], e: bone[3] };

/** The blood line across the word: x and the y it stands at, joined up in small steps. */
const SOAK: readonly Point[] = [
  [0, 26], [8, 24], [14, 25], [20, 21], [30, 25], [38, 27], [46, 25], [58, 22], [66, 18], [72, 24],
  [84, 26], [94, 22], [104, 24], [116, 19], [124, 23], [134, 26], [144, 21], [152, 25], [162, 23],
  [172, 27], [182, 22], [190, 20], [200, 24], [212, 26], [222, 22], [235, 25],
];

interface RunShape {
  readonly head: Grid;
  readonly neck: string;
  readonly bead: Grid;
}

const RUNS: readonly RunShape[] = [
  {
    head: ['uttttts', '.utttss', '..utts.'],
    neck: '..uts..',
    bead: ['..utts.', '.uutts.', '.uettss', '.utttss', '..tsss.'],
  },
  {
    head: ['uttts', '.utts'],
    neck: '.ut..',
    bead: ['.uts.', 'uetss', 'utsss', '.sss.'],
  },
  {
    head: ['uttss', '.uts.'],
    neck: '.us..',
    bead: ['.uts.', '.ets.', '.tss.'],
  },
];

/** x across the word, which run shape, and how long its neck is. */
const DRIPS: readonly (readonly [number, number, number])[] = [
  [2, 1, 6], [14, 2, 1], [33, 0, 10], [46, 2, 3], [69, 1, 8], [92, 2, 2], [101, 0, 5], [108, 2, 0],
  [122, 1, 3], [139, 0, 8], [155, 2, 1], [163, 1, 13], [182, 2, 4], [189, 2, 1], [212, 0, 7], [227, 1, 2],
];

/** A drop that has let go of its run. */
const LOOSE: readonly Point[] = [[15, 46], [183, 50]];
const DROP: Grid = ['.u.', 'uts', 'uts', '.s.'];

/** Chunks missing from the letters, as small polygons in word space. */
const BITES: readonly (readonly Point[])[] = [
  [[0, 11], [4, 13], [2, 15], [0, 18]],
  [[12, 0], [14, 3], [17, 2], [19, 0]],
  [[24, 19], [20, 22], [24, 25]],
  [[39, 0], [41, 3], [44, 0]],
  [[47, 1], [51, 4], [54, 0]],
  [[60, 3], [64, 5], [62, 7], [66, 8], [60, 8]],
  [[80, 0], [78, 3], [81, 4], [84, 7], [85, 0]],
  [[90, 11], [93, 13], [90, 16]],
  [[106, 0], [108, 3], [112, 0]],
  [[114, 18], [111, 21], [115, 23]],
  [[120, 0], [124, 3], [123, 5], [120, 6]],
  [[131, 0], [134, 2], [137, 0]],
  [[143, 7], [141, 11], [145, 13]],
  [[152, 0], [154, 2], [157, 0]],
  [[169, 6], [172, 3], [170, 1], [175, 0], [175, 7]],
  [[150, 28], [153, 30], [150, 33]],
  [[170, 33], [168, 30], [172, 28], [175, 33]],
  [[187, 2], [190, 4], [192, 2]],
  [[201, 19], [204, 23], [206, 19]],
  [[228, 0], [231, 3], [235, 0]],
  [[210, 8], [213, 11], [210, 13]],
];

/** Hairline cracks as polylines in word space. */
const CRACKS: readonly (readonly Point[])[] = [
  [[4, 2], [6, 6], [4, 9], [7, 13]],
  [[36, 2], [34, 6], [36, 10], [34, 14]],
  [[69, 8], [72, 12], [70, 17], [72, 22]],
  [[97, 0], [94, 4], [96, 7]],
  [[128, 21], [126, 25], [128, 29]],
  [[160, 0], [162, 3], [160, 5]],
  [[156, 14], [154, 18], [156, 22], [153, 26]],
  [[218, 28], [216, 24], [219, 19], [216, 15]],
];

/** Bullet holes, centre in word space, on stems wide enough to take one. */
const HOLES: readonly Point[] = [[71, 12], [4, 21], [216, 8]];
const HOLE: Grid = ['.##.', '####', '####', '.##.'];

/** Scrapes on the bone: x, y and length of each dash, in small groups. */
const SCUFFS: readonly (readonly [number, number, number])[] = [
  [10, 3, 4], [12, 4, 2], [18, 10, 3], [20, 15, 2], [3, 17, 2],
  [33, 16, 3], [34, 17, 2], [42, 7, 3], [50, 12, 3],
  [62, 3, 5], [66, 4, 2], [74, 3, 3],
  [93, 15, 3], [104, 3, 4], [106, 16, 3], [96, 18, 2],
  [122, 10, 2], [134, 4, 4], [136, 16, 2], [132, 17, 3],
  [152, 10, 3], [163, 3, 4], [160, 14, 3],
  [192, 8, 3], [186, 17, 3], [197, 14, 2],
  [212, 3, 2], [214, 16, 2], [224, 8, 3],
];

/** Blood flung up onto the bone. */
const FLECKS: readonly Point[] = [
  [12, 18], [16, 14], [41, 18], [52, 16], [71, 7], [98, 16], [111, 12], [124, 15], [141, 18],
  [162, 16], [181, 12], [205, 17], [228, 12],
];

function stamped(mask: PixelCanvas, rows: Grid, x: number, y: number): void {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) if (row[i] === '#') mask.erase(x + i, y + j);
  });
}

function wordMask(): PixelCanvas {
  const mask = new PixelCanvas(W, H);
  const cuts = new PixelCanvas(W, H);
  OUTBREAK.forEach((glyph, i) => {
    const x = WORD_X + i * PITCH;
    const y = WORD_Y + 1 + glyph.dy;
    mask.poly(glyph.outer.map(([px, py]) => [px + x, py + y]), bone[2]);
    for (const hole of glyph.holes) cuts.poly(hole.map(([px, py]) => [px + x, py + y]), ink[0]);
  });
  for (const bite of BITES) cuts.poly(bite.map(([x, y]) => [x + WORD_X, y + WORD_Y]), ink[0]);
  for (const crack of CRACKS) {
    for (let i = 0; i + 1 < crack.length; i++) {
      cuts.line(crack[i][0] + WORD_X, crack[i][1] + WORD_Y, crack[i + 1][0] + WORD_X, crack[i + 1][1] + WORD_Y, ink[0]);
    }
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) if (cuts.get(x, y) !== null) mask.erase(x, y);
  }
  for (const [x, y] of HOLES) stamped(mask, HOLE, x + WORD_X, y + WORD_Y);
  return mask;
}

function soakAt(x: number): number {
  const local = x - WORD_X;
  for (let i = 0; i + 1 < SOAK.length; i++) {
    const [x0, y0] = SOAK[i];
    const [x1, y1] = SOAK[i + 1];
    if (local >= x0 && local < x1) return WORD_Y + Math.round(y0 + ((local - x0) / (x1 - x0)) * (y1 - y0));
  }
  return WORD_Y + SOAK[SOAK.length - 1][1];
}

function faceColor(mask: PixelCanvas, x: number, y: number): Color {
  const open = (dx: number, dy: number) => mask.get(x + dx, y + dy) === null;
  const soak = soakAt(x);
  const litEdge = open(-1, 0) || open(0, -1);
  const shadeEdge = open(1, 0) || open(0, 1);
  if (y >= soak) {
    if (shadeEdge) return blood[1];
    if (y === soak || litEdge) return blood[3];
    return y > soak + 7 ? blood[1] : blood[2];
  }
  if (y === soak - 1) return bone[1];
  if (shadeEdge) return bone[1];
  if (litEdge) return bone[3];
  return y < WORD_Y + 9 ? bone[3] : bone[2];
}

function paintFace(mask: PixelCanvas): PixelCanvas {
  const face = new PixelCanvas(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) if (mask.get(x, y) !== null) face.px(x, y, faceColor(mask, x, y));
  }
  for (const [x, y, length] of SCUFFS) {
    for (let i = 0; i < length; i++) {
      const px = x + i + WORD_X;
      const py = y + WORD_Y;
      if (face.get(px, py) === bone[3]) face.px(px, py, bone[2]);
      else if (face.get(px, py) === bone[2]) face.px(px, py, bone[1]);
    }
  }
  for (const [x, y] of FLECKS) {
    const px = x + WORD_X;
    const py = y + WORD_Y;
    for (const [dx, dy, color] of [[0, 0, blood[2]], [1, 0, blood[1]], [0, 1, blood[1]]]) {
      if (mask.get(px + dx, py + dy) !== null) face.px(px + dx, py + dy, color);
    }
  }
  return face;
}

function extrusion(mask: PixelCanvas): PixelCanvas {
  const block = new PixelCanvas(W, H);
  for (let d = EXTRUDE; d >= 1; d--) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) if (mask.get(x, y) !== null) block.px(x + d, y + d, d === 1 ? blood[0] : ink[1]);
    }
  }
  return block;
}

function bottomOf(mask: PixelCanvas, x: number): number {
  for (let y = H - 1; y >= 0; y--) if (mask.get(x, y) !== null) return y;
  return -1;
}

function paintDrips(target: PixelCanvas, mask: PixelCanvas): void {
  for (const [dx, shape, neck] of DRIPS) {
    const { head, neck: neckRow, bead } = RUNS[shape];
    const x = WORD_X + dx;
    const top = bottomOf(mask, x + 1);
    if (top < 0) continue;
    const rows = [...head, ...Array.from({ length: neck }, () => neckRow), ...bead];
    target.grid(x, top, rows, BLOOD);
  }
  for (const [x, y] of LOOSE) target.grid(x + WORD_X, y + WORD_Y, DROP, BLOOD);
}

function subtitleColor(row: number): Color {
  if (row < 2) return fire[3];
  return row < 7 ? fire[2] : fire[1];
}

/** Quarantine tape: slanted amber and dark bars, torn off at the end nearest the text. */
function paintTape(target: PixelCanvas, from: number, to: number, tornAtEnd: boolean): void {
  const top = SUB_Y + 2;
  const tear = [3, 1, 4, 2, 5, 2];
  for (let j = 0; j < TAPE_H; j++) {
    const start = tornAtEnd ? from : from + tear[j];
    const end = tornAtEnd ? to - tear[j] : to;
    for (let x = start; x < end; x++) {
      const amber = Math.floor((x + j + 2) / 5) % 2 === 0;
      target.px(x, top + j, amber ? (j < 1 ? fire[3] : fire[2]) : ink[1]);
    }
  }
}

function paintSubtitle(target: PixelCanvas): void {
  const width = [...SUBTITLE].reduce((sum, letter) => sum + (letter === ' ' ? SUB_SPACE : SUB_PITCH), -2);
  const left = WORD_X + Math.floor((WORD_W - width) / 2);
  const layer = new PixelCanvas(W, H);
  let pen = left;
  for (const letter of SUBTITLE) {
    if (letter === ' ') {
      pen += SUB_SPACE;
      continue;
    }
    STENCIL[letter].forEach((row, j) => {
      for (let i = 0; i < row.length; i++) if (row[i] === '#') layer.px(pen + i, SUB_Y + j, subtitleColor(j));
    });
    pen += SUB_PITCH;
  }
  paintTape(layer, WORD_X, left - 8, true);
  paintTape(layer, left + width + 8, WORD_X + WORD_W, false);
  layer.outline({ color: ink[0] });
  target.blit(layer);
}

export function buildLogo(): PixelSprite {
  const mask = wordMask();
  const art = new PixelCanvas(W, H).blit(extrusion(mask)).blit(paintFace(mask));
  paintDrips(art, mask);
  art.outline({ color: ink[0] });
  paintSubtitle(art);
  return art.toSprite(W, H, W / 2, H / 2);
}
