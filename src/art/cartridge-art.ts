/**
 * The Install Game cartridge, drawn whole: a grey shell with a ridged grip and gold contacts,
 * and a printed label in the game's own night. Under an INSTALL ribbon, GAME in bone capitals
 * dipped in blood, the logo's moon with its bat, and a survivor whose flashlight finds a zombie
 * in the street. A gold seal sits in the corner. Every colour comes from the master palette.
 */
import { PixelCanvas } from './kit.ts';
import { RAMPS } from './palette.ts';
import type { Color } from './palette.ts';

const { ink, blood, bone, denim, violet, metal, fire, wood, rot, asphalt, concrete } = RAMPS;

export const CARTRIDGE_WIDTH = 48;
export const CARTRIDGE_HEIGHT = 56;
/** Where the printed label sits on the cartridge, in its own pixels. */
export const CARTRIDGE_LABEL = { x: 5, y: 14, width: 38, height: 30 } as const;
/** The label's sky where nothing else is printed: the backing colour of the label recess. */
export const LABEL_SKY: Color = violet[0];

type Grid = readonly string[];

// ---------------------------------------------------------------- lettering

const SMALL: Readonly<Record<string, Grid>> = {
  I: ['###', '.#.', '.#.', '.#.', '###'],
  N: ['#..#', '##.#', '#.##', '#..#', '#..#'],
  S: ['###', '#..', '###', '..#', '###'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  A: ['###', '#.#', '###', '#.#', '#.#'],
  L: ['#..', '#..', '#..', '#..', '###'],
};

const TITLE: Readonly<Record<string, Grid>> = {
  G: ['.####', '##...', '##...', '##.##', '##..#', '##..#', '.####'],
  A: ['.###.', '##.##', '##.##', '#####', '##.##', '##.##', '##.##'],
  M: ['##...##', '###.###', '#######', '##.#.##', '##...##', '##...##', '##...##'],
  E: ['####', '##..', '##..', '###.', '##..', '##..', '####'],
};

function textWidth(text: string, font: Readonly<Record<string, Grid>>): number {
  return [...text].reduce((sum, letter) => sum + font[letter][0].length + 1, -1);
}

function stamp(c: PixelCanvas, x: number, y: number, text: string, font: Readonly<Record<string, Grid>>, color: Color): void {
  let left = x;
  for (const letter of text) {
    c.grid(left, y, font[letter], { '#': color });
    left += font[letter][0].length + 1;
  }
}

// ---------------------------------------------------------------- label pieces

/** The logo's bat, flown across the moon. */
const BAT: Grid = ['#.........#', '##..#.#..##', '###.###.###', '###########', '.##.###.##.', '.....#.....'];

/** A survivor in silhouette, flashlight held out (=). */
const SURVIVOR: Grid = [
  '.##..',
  '.##..',
  '####.',
  '#####=',
  '.##..',
  '.##..',
  '.#.#.',
  '.#.#.',
];

/** Caught in the beam: lit on the near side (O), reaching for the light. */
const ZOMBIE: Grid = [
  '..OOo.',
  '..OOo.',
  'OOOOoo',
  '..OOo.',
  '..OOo.',
  '..O.o.',
  '..O.o.',
];

/** The corner badge: a gold seal stamped Z. */
const SEAL: Grid = ['.ggggg.', 'gLLLLGg', 'gL***Gg', 'gGG*GGg', 'gG*GGGg', 'gG***Gg', '.ggggg.'];

/** Violet high up, dithered down into denim, with a few stars. */
function sky(c: PixelCanvas, w: number, h: number): void {
  c.rect(0, 0, w, h, LABEL_SKY);
  for (let y = 11; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dither = y < 14 ? (x + y) % 2 === 0 : true;
      if (dither) c.px(x, y, denim[0]);
    }
  }
  for (const [x, y] of [[3, 10], [9, 17], [19, 9], [35, 22], [22, 18], [14, 12]]) c.px(x, y, bone[3]);
}

/** The logo's moon: lit upper left, its edge fading into the blue of its shadow. */
function moon(c: PixelCanvas, cx: number, cy: number, r: number): void {
  c.ellipse(cx, cy, r, r, denim[2]);
  c.ellipse(cx - 1, cy - 1, r - 1, r - 1, metal[2]);
  c.ellipse(cx - 1.5, cy - 1.5, r - 2, r - 2, metal[3]);
  c.grid(cx - 5, cy - 2, BAT, { '#': ink[0] });
}

/** Blue rooftops with lit windows, a kerb lit where the beam lands, and the road. */
function street(c: PixelCanvas, w: number, h: number): void {
  const roofs = [[0, 21], [4, 19], [9, 22], [13, 20], [19, 22], [24, 20], [31, 21]];
  roofs.forEach(([x, top], i) => {
    const right = i + 1 < roofs.length ? roofs[i + 1][0] : w;
    c.rect(x, top, right - x, h - top, denim[1]);
  });
  for (const [x, y] of [[6, 21], [15, 22], [26, 22], [33, 23]]) c.px(x, y, fire[2]);
  c.rect(0, 26, w, 1, concrete[1]);
  c.rect(12, 26, 7, 1, concrete[3]);
  c.rect(0, 27, w, h - 27, asphalt[1]);
}

/** The flashlight's cone, widening every third pixel, kept above the kerb. */
function beam(c: PixelCanvas, x: number, y: number): void {
  for (let i = 0; i < 12; i++) {
    const spread = Math.floor((i + 1) / 3);
    for (let j = -spread; j <= Math.min(spread, 2); j++) c.px(x + i, y + j, Math.abs(j) < spread ? fire[3] : fire[2]);
  }
}

/** GAME in bone capitals dipped in blood: the blood line wanders a row, and four drips run off. */
function title(): PixelCanvas {
  const word = 'GAME';
  const t = new PixelCanvas(textWidth(word, TITLE) + 2, 12);
  stamp(t, 1, 1, word, TITLE, bone[3]);
  for (let y = 0; y < t.h; y++) {
    for (let x = 0; x < t.w; x++) {
      const blank = t.get(x, y) === null;
      if (blank) continue;
      const row = y - 1;
      const soak = 3 + ((x * 7) % 5 < 2 ? 1 : 0);
      if (row < 2) t.px(x, y, bone[3]);
      else if (row < soak) t.px(x, y, bone[2]);
      else if (row === soak) t.px(x, y, blood[3]);
      else t.px(x, y, row === 6 ? blood[1] : blood[2]);
    }
  }
  for (const [x, length] of [[4, 1], [8, 2], [14, 2], [24, 1]]) {
    for (let i = 0; i < length; i++) t.px(x, 8 + i, blood[2]);
    t.px(x, 8 + length, blood[1]);
  }
  return t.outline({ color: ink[0] });
}

/** The INSTALL banner across the top, its notched tails folded behind. */
function ribbon(c: PixelCanvas, w: number): void {
  c.rect(0, 3, 4, 7, blood[1]);
  c.rect(w - 4, 3, 4, 7, blood[1]);
  c.px(0, 6, LABEL_SKY);
  c.px(w - 1, 6, LABEL_SKY);
  c.rect(2, 1, w - 4, 7, blood[2]);
  c.rect(2, 1, w - 4, 1, blood[3]);
  c.rect(2, 7, w - 4, 1, blood[1]);
  c.px(2, 8, blood[0]);
  c.px(3, 8, blood[0]);
  c.px(w - 3, 8, blood[0]);
  c.px(w - 4, 8, blood[0]);
  const text = 'INSTALL';
  const left = Math.floor((w - textWidth(text, SMALL)) / 2);
  stamp(c, left, 3, text, SMALL, blood[0]);
  stamp(c, left, 2, text, SMALL, bone[3]);
}

function label(): PixelCanvas {
  const { width: w, height: h } = CARTRIDGE_LABEL;
  const c = new PixelCanvas(w, h);
  sky(c, w, h);
  moon(c, 30, 15, 6);
  street(c, w, h);
  beam(c, 8, 23);
  c.grid(2, 20, SURVIVOR, { '#': ink[0], '=': metal[3] });
  const zombie = new PixelCanvas(8, 9).grid(1, 1, ZOMBIE, { o: rot[1], O: rot[3] }).outline({ color: ink[0] });
  c.blit(zombie, 18, 19);
  ribbon(c, w);
  c.blit(title(), 1, 9);
  c.grid(w - 8, h - 8, SEAL, { g: fire[0], G: fire[2], L: fire[3], '*': ink[0] });
  c.frame(0, 0, w, h, bone[2]);
  return c;
}

// ---------------------------------------------------------------- shell

/** Grey plastic lit from the upper left, a ridged grip, the label recess and the gold contacts. */
function shell(c: PixelCanvas): void {
  const W = CARTRIDGE_WIDTH;
  c.rect(3, 0, W - 6, 48, ink[0]).rect(1, 1, W - 2, 46, ink[0]).rect(0, 3, W, 42, ink[0]);
  c.rect(3, 1, W - 6, 46, metal[2]).rect(2, 2, W - 4, 44, metal[2]).rect(1, 3, W - 2, 42, metal[2]);
  c.rect(3, 1, W - 6, 1, metal[3]).rect(1, 3, 1, 42, metal[3]).px(2, 2, metal[3]);
  c.rect(W - 2, 3, 1, 42, metal[1]).rect(3, 46, W - 6, 1, metal[1]).px(W - 3, 45, metal[1]);
  for (let i = 0; i < 8; i++) {
    c.rect(8 + i * 4, 5, 2, 6, metal[1]);
    c.rect(8 + i * 4, 5, 2, 1, metal[0]);
  }
  const { x, y, width, height } = CARTRIDGE_LABEL;
  c.frame(x - 1, y - 1, width + 2, height + 2, ink[0]);
  c.rect(8, 48, 32, 8, ink[0]);
  c.rect(10, 48, 28, 6, fire[2]);
  c.rect(10, 48, 28, 1, wood[2]);
  for (const gap of [16, 23, 30]) c.rect(gap, 49, 2, 5, wood[2]);
}

export function drawCartridge(): PixelCanvas {
  const c = new PixelCanvas(CARTRIDGE_WIDTH, CARTRIDGE_HEIGHT);
  shell(c);
  c.blit(label(), CARTRIDGE_LABEL.x, CARTRIDGE_LABEL.y);
  return c;
}
