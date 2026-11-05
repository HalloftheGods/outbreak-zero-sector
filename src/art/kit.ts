// The pixel kit every art lane builds on. Pure JS on purpose: it runs in Node for
// contact sheets and tests, and in the browser at load.

import type { Clip, DirClips, PixelSprite } from './types.ts';
import { darker, INK, lighter } from './palette.ts';
import type { Color, Ramp } from './palette.ts';

/** Grid letter to colour. '.' and ' ' are always transparent; null also means transparent. */
export type Legend = Readonly<Record<string, Color | null>>;

export interface BlitOptions {
  readonly flipX?: boolean;
  readonly flipY?: boolean;
}

export interface OutlineOptions {
  readonly color?: Color;
  /**
   * Selective outlining: on the lit upper-left of the silhouette the outline is a
   * dark shade of the colour next to it rather than the outline colour.
   */
  readonly selective?: boolean;
  /** Also fill diagonal neighbours, for a heavier outline. */
  readonly diagonals?: boolean;
}

export type Point = readonly [number, number];

export class PixelCanvas {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8ClampedArray;

  constructor(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  static fromGrid(rows: readonly string[], legend: Legend): PixelCanvas {
    const canvas = new PixelCanvas(Math.max(...rows.map((row) => row.length)), rows.length);
    canvas.grid(0, 0, rows, legend);
    return canvas;
  }

  clone(): PixelCanvas {
    const copy = new PixelCanvas(this.w, this.h);
    copy.data.set(this.data);
    return copy;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  /** The colour at x,y, or null when transparent or out of bounds. */
  get(x: number, y: number): Color | null {
    if (!this.inBounds(x, y)) return null;
    const i = (y * this.w + x) * 4;
    if (this.data[i + 3] === 0) return null;
    return (this.data[i] << 16) | (this.data[i + 1] << 8) | this.data[i + 2];
  }

  px(x: number, y: number, color: Color): this {
    if (!this.inBounds(x, y)) return this;
    const i = (y * this.w + x) * 4;
    this.data[i] = color >> 16;
    this.data[i + 1] = (color >> 8) & 255;
    this.data[i + 2] = color & 255;
    this.data[i + 3] = 255;
    return this;
  }

  erase(x: number, y: number): this {
    if (!this.inBounds(x, y)) return this;
    this.data.fill(0, (y * this.w + x) * 4, (y * this.w + x) * 4 + 4);
    return this;
  }

  fill(color: Color): this {
    return this.rect(0, 0, this.w, this.h, color);
  }

  rect(x: number, y: number, w: number, h: number, color: Color): this {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.px(i, j, color);
    return this;
  }

  /** A one pixel rectangle outline. */
  frame(x: number, y: number, w: number, h: number, color: Color): this {
    this.rect(x, y, w, 1, color).rect(x, y + h - 1, w, 1, color);
    return this.rect(x, y, 1, h, color).rect(x + w - 1, y, 1, h, color);
  }

  /** Bresenham. */
  line(x0: number, y0: number, x1: number, y1: number, color: Color): this {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, color);
      if (x === x1 && y === y1) return this;
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

  /** Filled ellipse. Half-pixel centres and radii are fine and give even widths. */
  ellipse(cx: number, cy: number, rx: number, ry: number, color: Color): this {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (insideEllipse(x - cx, y - cy, rx, ry)) this.px(x, y, color);
      }
    }
    return this;
  }

  ellipseOutline(cx: number, cy: number, rx: number, ry: number, color: Color): this {
    const inside = (x: number, y: number) => insideEllipse(x - cx, y - cy, rx, ry);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (!inside(x, y)) continue;
        if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) this.px(x, y, color);
      }
    }
    return this;
  }

  /** Filled polygon by even-odd scanline. Integer vertices; every vertex and edge pixel is drawn. */
  poly(points: readonly Point[], color: Color): this {
    const ys = points.map((p) => p[1]);
    for (let y = Math.min(...ys); y <= Math.max(...ys); y++) {
      const crossings: number[] = [];
      points.forEach(([x0, y0], i) => {
        const [x1, y1] = points[(i + 1) % points.length];
        if (y0 <= y + 0.5 !== y1 <= y + 0.5) crossings.push(x0 + ((y + 0.5 - y0) / (y1 - y0)) * (x1 - x0));
      });
      crossings.sort((a, b) => a - b);
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        for (let x = Math.round(crossings[i]); x <= Math.round(crossings[i + 1]); x++) this.px(x, y, color);
      }
    }
    points.forEach(([x0, y0], i) => {
      const [x1, y1] = points[(i + 1) % points.length];
      this.line(x0, y0, x1, y1, color);
    });
    return this;
  }

  /** Stamps ASCII art. Transparent letters leave what is under them alone. */
  grid(x: number, y: number, rows: readonly string[], legend: Legend): this {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const letter = row[i];
        if (letter === '.' || letter === ' ') continue;
        const color = legend[letter];
        if (color === undefined) throw new Error(`fromGrid: "${letter}" is not in the legend (row ${j}: ${row})`);
        if (color !== null) this.px(x + i, y + j, color);
      }
    });
    return this;
  }

  blit(src: PixelCanvas, x = 0, y = 0, options: BlitOptions = {}): this {
    for (let j = 0; j < src.h; j++) {
      for (let i = 0; i < src.w; i++) {
        const color = src.get(options.flipX ? src.w - 1 - i : i, options.flipY ? src.h - 1 - j : j);
        if (color !== null) this.px(x + i, y + j, color);
      }
    }
    return this;
  }

  mirrorX(): PixelCanvas {
    return new PixelCanvas(this.w, this.h).blit(this, 0, 0, { flipX: true });
  }

  crop(x: number, y: number, w: number, h: number): PixelCanvas {
    return new PixelCanvas(w, h).blit(this, -x, -y);
  }

  /** Adds a one pixel outline on transparent pixels touching the silhouette. Needs a clear margin. */
  outline(options: OutlineOptions = {}): this {
    const { color = INK, selective = false, diagonals = false } = options;
    const source = this.clone();
    const sides: readonly Point[] = diagonals
      ? [[0, -1], [-1, 0], [1, 0], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]
      : [[0, -1], [-1, 0], [1, 0], [0, 1]];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (source.get(x, y) !== null) continue;
        let edge: Color | null = null;
        let shadowSide = false;
        for (const [dx, dy] of sides) {
          const neighbour = source.get(x + dx, y + dy);
          if (neighbour === null) continue;
          edge ??= neighbour;
          // The silhouette lies up or left of here, so this pixel faces away from the light.
          if (dx < 0 || dy < 0) shadowSide = true;
        }
        if (edge === null) continue;
        this.px(x, y, selective && !shadowSide ? darker(edge, 2) : color);
      }
    }
    return this;
  }

  /** Swaps colours through a map. Anything not in the map stays. */
  recolor(map: ReadonlyMap<Color, Color>): this {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const color = this.get(x, y);
        const next = color === null ? undefined : map.get(color);
        if (next !== undefined) this.px(x, y, next);
      }
    }
    return this;
  }

  /**
   * Directional form shading for one part of a paper doll, before compositing.
   * Pixels on the part's upper-left edge step lighter and its lower-right edge steps
   * darker. One-sided, so it does not read as pillow shading.
   */
  lightEdges(lit = 1, shade = 1): this {
    const source = this.clone();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const color = source.get(x, y);
        if (color === null) continue;
        const open = (dx: number, dy: number) => source.get(x + dx, y + dy) === null;
        if (shade && (open(1, 0) || open(0, 1))) this.px(x, y, darker(color, shade));
        else if (lit && (open(-1, 0) || open(0, -1))) this.px(x, y, lighter(color, lit));
      }
    }
    return this;
  }

  /**
   * A ball lit from the upper left: the ramp in clean offset bands, darkest at the
   * lower right, not concentric rings.
   */
  shadedEllipse(cx: number, cy: number, rx: number, ry: number, ramp: Ramp): this {
    this.ellipse(cx, cy, rx, ry, ramp[0]);
    for (let i = 1; i < ramp.length; i++) {
      const t = 1 - i / ramp.length;
      const off = (1 - t) * 0.45;
      this.ellipse(cx - rx * off, cy - ry * off, rx * t, ry * t, ramp[i]);
    }
    return this;
  }

  /** A box with its top and left lit and its bottom and right in shadow. `face` indexes the ramp. */
  shadedRect(x: number, y: number, w: number, h: number, ramp: Ramp, face = 1): this {
    this.rect(x, y, w, h, ramp[face]);
    const top = ramp[Math.min(face + 1, ramp.length - 1)];
    const bottom = ramp[Math.max(face - 1, 0)];
    this.rect(x, y, w, 1, top).rect(x, y, 1, h - 1, top);
    return this.rect(x, y + h - 1, w, 1, bottom).rect(x + w - 1, y + 1, 1, h - 1, bottom);
  }

  /** Bakes a sprite of exactly w by h from the top-left. Nothing is trimmed. */
  toSprite(w = this.w, h = this.h, ax = Math.floor(w / 2), ay = h): PixelSprite {
    const baked = w === this.w && h === this.h ? this : this.crop(0, 0, w, h);
    return { w, h, ax, ay, rgba: baked.data.slice() };
  }
}

function insideEllipse(dx: number, dy: number, rx: number, ry: number): boolean {
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

/** Maps one ramp onto another by position, so a jacket can change colour with its shading intact. */
export function rampMap(from: Ramp, to: Ramp): Map<Color, Color> {
  const map = new Map<Color, Color>();
  from.forEach((color, i) => {
    const t = from.length === 1 ? 0 : i / (from.length - 1);
    map.set(color, to[Math.round(t * (to.length - 1))]);
  });
  return map;
}

export function mergeMaps(...maps: readonly ReadonlyMap<Color, Color>[]): Map<Color, Color> {
  return new Map(maps.flatMap((map) => [...map]));
}

export function spriteToCanvas(sprite: PixelSprite): PixelCanvas {
  const canvas = new PixelCanvas(sprite.w, sprite.h);
  canvas.data.set(sprite.rgba);
  return canvas;
}

/** Flips a sprite with its anchor. Anchors are edge coordinates, so x goes to w - x. */
export function mirrorSprite(sprite: PixelSprite): PixelSprite {
  const flipped = spriteToCanvas(sprite).mirrorX();
  return { ...sprite, ax: sprite.w - sprite.ax, rgba: flipped.data };
}

export function recolorSprite(sprite: PixelSprite, map: ReadonlyMap<Color, Color>): PixelSprite {
  return { ...sprite, rgba: spriteToCanvas(sprite).recolor(map).data };
}

export function makeClip(frames: readonly PixelSprite[], fps: number, loop = true): Clip {
  return { frames, fps, loop };
}

export function mirrorClip(clip: Clip): Clip {
  return { ...clip, frames: clip.frames.map(mirrorSprite) };
}

export function recolorClip(clip: Clip, map: ReadonlyMap<Color, Color>): Clip {
  return { ...clip, frames: clip.frames.map((frame) => recolorSprite(frame, map)) };
}

export function recolorDirClips(clips: DirClips, map: ReadonlyMap<Color, Color>): DirClips {
  return clips.map((clip) => recolorClip(clip, map));
}

/** The facings drawn by hand. dirClips mirrors the rest. */
export type DrawnDir = 0 | 1 | 2 | 6 | 7;

/**
 * Builds the eight clips of a DirClips, indexed 0=E 1=SE 2=S 3=SW 4=W 5=NW 6=N 7=NE.
 * fn draws E, SE, S, N and NE; the W side is those mirrored.
 */
export function dirClips(fn: (dir: DrawnDir) => Clip): DirClips {
  const e = fn(0);
  const se = fn(1);
  const s = fn(2);
  const n = fn(6);
  const ne = fn(7);
  return [e, se, s, mirrorClip(se), mirrorClip(e), mirrorClip(ne), n, ne];
}

/** A small seeded generator (mulberry32), so art is identical on every build. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
