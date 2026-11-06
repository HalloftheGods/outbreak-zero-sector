// A fast raster for survivor frames. There are over a thousand of them, so instead of
// PixelCanvas this packs pixels into 32-bit words and compiles each grid once.
// Same results: palette colours, the same selective outline, alpha 0 or 255.

import type { PixelSprite } from '../types.ts';
import { litRim } from '../kit.ts';
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

/** litRim, cached per packed colour. */
function rimWord(word: number): number {
  let rim = rimWords.get(word);
  const unseen = rim === undefined;
  if (unseen) {
    rim = pack(litRim(unpack(word)));
    rimWords.set(word, rim);
  }
  return rim as number;
}

/**
 * How an overlaid part meets the body pixels it lands on. Both are given the colour
 * already in the cell under the part.
 */
export interface Contact {
  /** The contact line drawn on the body below and right of the part. */
  readonly rim: (under: Color) => Color;
  /** The part's own pixel where it covers the body. Left out, the part keeps its colour. */
  readonly over?: (part: Color, under: Color) => Color;
}

function inCell(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < CELL_W && y < CELL_H;
}

const stamps = new WeakMap<Rows, Map<Legend, Stamp>>();

function compile(rows: Rows, legend: Legend): Stamp {
  const xs: number[] = [];
  const ys: number[] = [];
  const words: number[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const letter = row[x];
      const blank = letter === '.' || letter === ' ';
      if (blank) continue;
      const color = legend[letter];
      const unknown = color === undefined;
      if (unknown) throw new Error(`survivor grid: "${letter}" is not in the legend (row ${y}: ${row})`);
      const transparent = color === null;
      if (transparent) continue;
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

/** A grid as it was drawn into a cell: its rows, legend and top-left corner. */
export interface PlacedGrid {
  readonly rows: Rows;
  readonly legend: Legend;
  readonly x: number;
  readonly y: number;
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
    this.left = Math.min(this.left, x0);
    this.top = Math.min(this.top, y0);
    this.right = Math.max(this.right, x1);
    this.bottom = Math.max(this.bottom, y1);
  }

  px(x: number, y: number, color: Color): void {
    const inside = inCell(x, y);
    if (inside) {
      this.pixels[y * CELL_W + x] = pack(color);
      this.touch(x, y, x, y);
    }
  }

  erase(x: number, y: number): void {
    const inside = inCell(x, y);
    if (inside) this.pixels[y * CELL_W + x] = 0;
  }

  grid(x: number, y: number, rows: Rows, legend: Legend): void {
    const { offsets, xs, ys, words, w, h } = stampFor(rows, legend);
    const pixels = this.pixels;
    const fits = inCell(x, y) && inCell(x + w - 1, y + h - 1);
    if (fits) {
      const base = y * CELL_W + x;
      for (let i = 0; i < words.length; i++) pixels[base + offsets[i]] = words[i];
      this.touch(x, y, x + w - 1, y + h - 1);
      return;
    }
    for (let i = 0; i < words.length; i++) {
      const px = x + xs[i];
      const py = y + ys[i];
      const inside = inCell(px, py);
      if (inside) {
        pixels[py * CELL_W + px] = words[i];
        this.touch(px, py, px, py);
      }
    }
  }

  /**
   * A cast shadow: darkens by one ramp step the `depth` pixels straight below the lowest
   * pixel of each column of the grid `part` drew. Only pixels that still show what the
   * grid `under` drew there are touched, so whatever was painted over it since keeps its
   * colour.
   */
  shadeBelow(part: PlacedGrid, under: PlacedGrid, depth: number): void {
    const top = stampFor(part.rows, part.legend);
    const base = stampFor(under.rows, under.legend);
    const lowest = new Map<number, number>();
    for (let i = 0; i < top.xs.length; i++) {
      const x = part.x + top.xs[i];
      const y = part.y + top.ys[i];
      const lower = y > (lowest.get(x) ?? -1);
      if (lower) lowest.set(x, y);
    }
    const underWords = new Map<number, number>();
    for (let i = 0; i < base.xs.length; i++) {
      const x = under.x + base.xs[i];
      const y = under.y + base.ys[i];
      const inside = inCell(x, y);
      if (inside) underWords.set(y * CELL_W + x, base.words[i]);
    }
    for (const [x, low] of lowest) {
      for (let y = low + 1; y <= low + depth; y++) {
        const at = y * CELL_W + x;
        const showsUnder = underWords.has(at) && this.pixels[at] === underWords.get(at);
        if (showsUnder) this.pixels[at] = pack(darker(unpack(this.pixels[at]), 1));
      }
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
      const done = x === x1 && y === y1;
      if (done) return;
      const e2 = 2 * err;
      const stepX = e2 >= dy;
      const stepY = e2 <= dx;
      if (stepX) {
        err += dy;
        x += sx;
      }
      if (stepY) {
        err += dx;
        y += sy;
      }
    }
  }

  /**
   * Draws a part on its own layer, then drops a contact line along its lower and right
   * edges wherever it crosses the body, so same-coloured parts stay separate.
   * With a plain colour the line is that colour. With a Contact the line and the
   * covering pixels are worked out from the body pixel under them, and a right-hand
   * line pixel is left out where the part itself carries on below it to the right:
   * there the lower line already follows the edge, and the right one only added lone
   * specks along the top of a sloping part.
   */
  overlay(draw: (layer: Cell) => void, contact: Color | Contact): void {
    const layer = (overlayLayer ??= new Cell());
    draw(layer);
    const plain = typeof contact === 'number';
    if (plain) this.overlayPlain(layer, pack(contact));
    else this.overlayContact(layer, contact);
    this.touch(layer.left, layer.top, layer.right, layer.bottom);
    layer.clear();
  }

  private overlayPlain(layer: Cell, rimValue: number): void {
    const from = layer.pixels;
    const to = this.pixels;
    for (let y = layer.top; y <= layer.bottom; y++) {
      for (let x = layer.left; x <= layer.right; x++) {
        const at = y * CELL_W + x;
        const empty = from[at] === 0;
        if (empty) continue;
        to[at] = from[at];
        const rimBelow = y + 1 < CELL_H && from[at + CELL_W] === 0 && to[at + CELL_W] !== 0;
        if (rimBelow) to[at + CELL_W] = rimValue;
        const rimRight = x + 1 < CELL_W && from[at + 1] === 0 && to[at + 1] !== 0;
        if (rimRight) to[at + 1] = rimValue;
      }
    }
  }

  private overlayContact(layer: Cell, contact: Contact): void {
    const from = layer.pixels;
    const to = this.pixels;
    // Read the body as it was, so a pixel two edges share is not shaded twice.
    const body = to.slice();
    const over = contact.over;
    const rimAt = (at: number): void => {
      to[at] = pack(contact.rim(unpack(body[at])));
    };
    for (let y = layer.top; y <= layer.bottom; y++) {
      for (let x = layer.left; x <= layer.right; x++) {
        const at = y * CELL_W + x;
        const empty = from[at] === 0;
        if (empty) continue;
        const covers = body[at] !== 0 && over !== undefined;
        to[at] = covers ? pack(over(unpack(from[at]), unpack(body[at]))) : from[at];
        const hasBelow = y + 1 < CELL_H;
        const hasRight = x + 1 < CELL_W;
        const rimBelow = hasBelow && from[at + CELL_W] === 0 && body[at + CELL_W] !== 0;
        if (rimBelow) rimAt(at + CELL_W);
        const partGoesOnDownRight = hasBelow && hasRight && from[at + CELL_W + 1] !== 0;
        const rimRight = hasRight && !partGoesOnDownRight && from[at + 1] === 0 && body[at + 1] !== 0;
        if (rimRight) rimAt(at + 1);
      }
    }
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
        const filled = from[at] !== 0;
        if (filled) continue;
        const up = y > 0 ? from[at - CELL_W] : 0;
        const left = x > 0 ? from[at - 1] : 0;
        // The silhouette lies up or left of here, so this pixel faces away from the light.
        const shadowSide = up !== 0 || left !== 0;
        if (shadowSide) {
          out[at] = INK_WORD;
          continue;
        }
        const right = x < CELL_W - 1 ? from[at + 1] : 0;
        const down = y < CELL_H - 1 ? from[at + CELL_W] : 0;
        const edge = right !== 0 ? right : down;
        const touches = edge !== 0;
        if (touches) out[at] = rimWord(edge);
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
