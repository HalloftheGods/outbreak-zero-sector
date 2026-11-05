// A fast raster for survivor frames. There are over a thousand of them, so instead of
// PixelCanvas this packs pixels into 32-bit words and compiles each grid once.
// Same results: palette colours, the same selective outline, alpha 0 or 255.

import type { PixelSprite } from '../types.ts';
import type { Legend } from '../kit.ts';
import { darker, INK } from '../palette.ts';
import type { Color } from '../palette.ts';

export const CELL_W = 40;
export const CELL_H = 38;
export const ANCHOR_X = 20;
export const ANCHOR_Y = 34;

type Rows = readonly string[];

/** A grid baked to row-major offsets and packed colours, with its bounds. */
interface Stamp {
  readonly offsets: Int32Array;
  readonly xs: Int16Array;
  readonly ys: Int16Array;
  readonly words: Uint32Array;
  readonly w: number;
  readonly h: number;
}

function pack(color: Color): number {
  return (0xff000000 | ((color & 0xff) << 16) | (color & 0xff00) | ((color >> 16) & 0xff)) >>> 0;
}

function unpack(word: number): Color {
  return ((word & 0xff) << 16) | (word & 0xff00) | ((word >> 16) & 0xff);
}

const INK_WORD = pack(INK);
const rimWords = new Map<number, number>();

function rimWord(word: number): number {
  let rim = rimWords.get(word);
  if (rim === undefined) {
    rim = pack(darker(unpack(word), 2));
    rimWords.set(word, rim);
  }
  return rim;
}

const stamps = new WeakMap<Rows, Map<Legend, Stamp>>();

function compile(rows: Rows, legend: Legend): Stamp {
  const xs: number[] = [];
  const ys: number[] = [];
  const words: number[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const letter = row[x];
      if (letter === '.' || letter === ' ') continue;
      const color = legend[letter];
      if (color === undefined) throw new Error(`survivor grid: "${letter}" is not in the legend (row ${y}: ${row})`);
      if (color === null) continue;
      xs.push(x);
      ys.push(y);
      words.push(pack(color));
    }
  });
  return {
    offsets: Int32Array.from(xs.map((x, i) => ys[i] * CELL_W + x)),
    xs: Int16Array.from(xs),
    ys: Int16Array.from(ys),
    words: Uint32Array.from(words),
    w: Math.max(...rows.map((row) => row.length)),
    h: rows.length,
  };
}

function stampFor(rows: Rows, legend: Legend): Stamp {
  let byLegend = stamps.get(rows);
  if (!byLegend) {
    byLegend = new Map();
    stamps.set(rows, byLegend);
  }
  let stamp = byLegend.get(legend);
  if (!stamp) {
    stamp = compile(rows, legend);
    byLegend.set(legend, stamp);
  }
  return stamp;
}

let overlayLayer: Cell | null = null;

export class Cell {
  readonly pixels = new Uint32Array(CELL_W * CELL_H);
  /** Bounds of everything drawn so far, so later passes skip the empty margin. */
  private left = CELL_W;
  private right = -1;
  private top = CELL_H;
  private bottom = -1;

  private touch(x0: number, y0: number, x1: number, y1: number): void {
    if (x0 < this.left) this.left = x0;
    if (y0 < this.top) this.top = y0;
    if (x1 > this.right) this.right = x1;
    if (y1 > this.bottom) this.bottom = y1;
  }

  px(x: number, y: number, color: Color): void {
    if (x < 0 || y < 0 || x >= CELL_W || y >= CELL_H) return;
    this.pixels[y * CELL_W + x] = pack(color);
    this.touch(x, y, x, y);
  }

  erase(x: number, y: number): void {
    if (x >= 0 && y >= 0 && x < CELL_W && y < CELL_H) this.pixels[y * CELL_W + x] = 0;
  }

  grid(x: number, y: number, rows: Rows, legend: Legend): void {
    const { offsets, xs, ys, words, w, h } = stampFor(rows, legend);
    const pixels = this.pixels;
    if (x >= 0 && y >= 0 && x + w <= CELL_W && y + h <= CELL_H) {
      const base = y * CELL_W + x;
      for (let i = 0; i < words.length; i++) pixels[base + offsets[i]] = words[i];
      this.touch(x, y, x + w - 1, y + h - 1);
      return;
    }
    for (let i = 0; i < words.length; i++) {
      const px = x + xs[i];
      const py = y + ys[i];
      if (px < 0 || py < 0 || px >= CELL_W || py >= CELL_H) continue;
      pixels[py * CELL_W + px] = words[i];
      this.touch(px, py, px, py);
    }
  }

  rect(x: number, y: number, w: number, h: number, color: Color): void {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, color);
  }

  /** Bresenham. */
  line(x0: number, y0: number, x1: number, y1: number, color: Color): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, color);
      if (x === x1 && y === y1) return;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Draws a part on its own layer, then drops a dark contact line along its lower and
   * right edges wherever it crosses the body, so same-coloured parts stay separate.
   */
  overlay(draw: (layer: Cell) => void, rim: Color): void {
    const layer = (overlayLayer ??= new Cell());
    draw(layer);
    const from = layer.pixels;
    const to = this.pixels;
    const rimValue = pack(rim);
    for (let y = layer.top; y <= layer.bottom; y++) {
      for (let x = layer.left; x <= layer.right; x++) {
        const at = y * CELL_W + x;
        if (from[at] === 0) continue;
        to[at] = from[at];
        const below = at + CELL_W;
        if (y + 1 < CELL_H && from[below] === 0 && to[below] !== 0) to[below] = rimValue;
        if (x + 1 < CELL_W && from[at + 1] === 0 && to[at + 1] !== 0) to[at + 1] = rimValue;
      }
    }
    this.touch(layer.left, layer.top, layer.right, layer.bottom);
    layer.clear();
  }

  private clear(): void {
    for (let y = this.top; y <= this.bottom; y++) this.pixels.fill(0, y * CELL_W + this.left, y * CELL_W + this.right + 1);
    this.left = CELL_W;
    this.right = -1;
    this.top = CELL_H;
    this.bottom = -1;
  }

  /** The selective outline of PixelCanvas.outline, baked into a sprite. */
  toSprite(): PixelSprite {
    const from = this.pixels;
    const out = from.slice();
    const x0 = Math.max(this.left - 1, 0);
    const x1 = Math.min(this.right + 1, CELL_W - 1);
    const y0 = Math.max(this.top - 1, 0);
    const y1 = Math.min(this.bottom + 1, CELL_H - 1);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const at = y * CELL_W + x;
        if (from[at] !== 0) continue;
        const up = y > 0 ? from[at - CELL_W] : 0;
        const left = x > 0 ? from[at - 1] : 0;
        if (up !== 0 || left !== 0) {
          out[at] = INK_WORD;
          continue;
        }
        const right = x < CELL_W - 1 ? from[at + 1] : 0;
        const down = y < CELL_H - 1 ? from[at + CELL_W] : 0;
        if (right !== 0) out[at] = rimWord(right);
        else if (down !== 0) out[at] = rimWord(down);
      }
    }
    return { w: CELL_W, h: CELL_H, ax: ANCHOR_X, ay: ANCHOR_Y, rgba: new Uint8ClampedArray(out.buffer) };
  }
}

function mirrorFrame(sprite: PixelSprite): PixelSprite {
  const from = new Uint32Array(sprite.rgba.buffer, sprite.rgba.byteOffset, sprite.w * sprite.h);
  const out = new Uint32Array(sprite.w * sprite.h);
  for (let y = 0; y < sprite.h; y++) {
    const row = y * sprite.w;
    for (let x = 0; x < sprite.w; x++) out[row + x] = from[row + sprite.w - 1 - x];
  }
  return { ...sprite, ax: sprite.w - sprite.ax, rgba: new Uint8ClampedArray(out.buffer) };
}

export function mirrorFrames(frames: readonly PixelSprite[]): readonly PixelSprite[] {
  return frames.map(mirrorFrame);
}

/** Turns a grid a quarter turn clockwise, for figures lying on the ground. */
export function turnClockwise(rows: Rows): Rows {
  const width = Math.max(...rows.map((row) => row.length));
  return Array.from({ length: width }, (_, x) => rows.map((row) => row[x] ?? '.').reverse().join(''));
}
