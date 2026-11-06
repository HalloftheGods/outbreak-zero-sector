// The undead paper doll. Joints live in a small body space (forward, side, up) and are
// projected into the 3/4 camera, so one pose table animates every facing. Heads, torsos,
// hands and feet are hand-drawn grids per facing; limbs are ribbons with painted cross-sections.

import { PixelCanvas } from '../kit.ts';
import type { DrawnDir, Legend } from '../kit.ts';
import { darker } from '../palette.ts';
import type { PixelSprite } from '../types.ts';

/** Forward along the facing, to the body's right, and up, in pixels. */
export type Vec = readonly [f: number, s: number, u: number];

export interface Joint {
  readonly x: number;
  readonly y: number;
  /** Nearer the camera is larger. */
  readonly z: number;
}

export interface View {
  readonly dir: DrawnDir;
  readonly cos: number;
  readonly sin: number;
}

const FACING_ANGLE: Record<DrawnDir, number> = { 0: 0, 1: Math.PI / 4, 2: Math.PI / 2, 6: -Math.PI / 2, 7: -Math.PI / 4 };

/** The ground plane foreshortens by this much; height does not. */
const GROUND_TILT = 0.5;

export function viewOf(dir: DrawnDir): View {
  return { dir, cos: Math.cos(FACING_ANGLE[dir]), sin: Math.sin(FACING_ANGLE[dir]) };
}

export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const lerp = (a: Vec, b: Vec, t: number): Vec => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/**
 * The middle joint of a two-bone limb. It bends towards `pole`; a limb pulled past its
 * length goes straight rather than stretching the bones.
 */
export function bend(a: Vec, b: Vec, upper: number, lower: number, pole: Vec): Vec {
  const axis: Vec = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const reach = Math.max(0.001, Math.hypot(...axis));
  const unit: Vec = [axis[0] / reach, axis[1] / reach, axis[2] / reach];
  const pulledStraight = reach >= upper + lower;
  if (pulledStraight) return lerp(a, b, upper / (upper + lower));
  const along = (reach * reach + upper * upper - lower * lower) / (2 * reach);
  const out = Math.sqrt(Math.max(0, upper * upper - along * along));
  const dot = pole[0] * unit[0] + pole[1] * unit[1] + pole[2] * unit[2];
  const side: Vec = [pole[0] - dot * unit[0], pole[1] - dot * unit[1], pole[2] - dot * unit[2]];
  const size = Math.max(0.001, Math.hypot(...side));
  return [
    a[0] + unit[0] * along + (side[0] / size) * out,
    a[1] + unit[1] * along + (side[1] / size) * out,
    a[2] + unit[2] * along + (side[2] / size) * out,
  ];
}

/** A grid with a pivot: the grid pixel that lands on the joint it is stamped at. */
export interface Stamp {
  readonly rows: readonly string[];
  readonly px: number;
  readonly py: number;
}

export const stamp = (rows: readonly string[], px: number, py: number): Stamp => ({ rows, px, py });

/**
 * The cross-section a ribbon from a to b gets when nothing fixes it: laid across (true) when
 * the limb runs at least as far down the screen as along it, measured between rounded ends.
 */
export function ribbonUpright(a: Joint, b: Joint): boolean {
  return Math.abs(Math.round(b.y) - Math.round(a.y)) >= Math.abs(Math.round(b.x) - Math.round(a.x));
}

/**
 * A limb as a ribbon: walks the long axis from a to b and lays a painted cross-section
 * at each step. Sections run lit side to shadow side and are picked along the limb,
 * so a sleeve can end in a bare forearm. `upright` fixes which way the sections lie
 * (true: across a limb running down the screen); left out, ribbonUpright picks it.
 */
export function ribbon(c: PixelCanvas, a: Joint, b: Joint, sections: readonly string[], legend: Legend, upright = ribbonUpright(a, b)): void {
  const x0 = Math.round(a.x);
  const y0 = Math.round(a.y);
  const x1 = Math.round(b.x);
  const y1 = Math.round(b.y);
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const section = sections[Math.min(sections.length - 1, Math.floor(t * sections.length))];
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    const start = -Math.floor(section.length / 2);
    for (let k = 0; k < section.length; k++) {
      const letter = section[k];
      const gap = letter === '.';
      if (gap) continue;
      const color = legend[letter];
      const unknown = color === undefined || color === null;
      if (unknown) throw new Error(`ribbon: "${letter}" is not in the legend`);
      if (upright) c.px(x + start + k, y, color);
      else c.px(x, y + start + k, color);
    }
  }
}

/** A grid placed in the cell: its top-left corner, then its rows. */
export type Placed = readonly [x: number, y: number, rows: readonly string[]];

/** Something flat on the ground, such as a pool: painted under the figure, with no outline. */
interface Decal {
  readonly x: number;
  readonly y: number;
  readonly rows: readonly string[];
  readonly legend: Legend;
}

/**
 * A hand-drawn frame with no rig: grids stamped in order, then the usual outline.
 * Decals (pools, splashes) are painted after the outline and only into pixels the figure and
 * its outline left empty: they get no outline of their own, and the figure's outline stays
 * over them. They do not change the anchor. Leaving them out draws the frame as before.
 */
export function flatFrame(cell: number, ox: number, oy: number, legend: Legend, parts: readonly Placed[], decals: readonly Placed[] = []): PixelSprite {
  const c = new PixelCanvas(cell, cell);
  for (const [x, y, rows] of parts) c.grid(x, y, rows, legend);
  const under = decals.map(([x, y, rows]): Decal => ({ x, y, rows, legend }));
  return underlaid(outlined(c), under).toSprite(cell, cell, ox, oy + 1);
}

/** Inclusive pixel bounds of a layer, so compositing skips the empty cell around it. */
interface Box {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

interface Layer {
  readonly z: number;
  readonly seam: boolean;
  readonly box: Box | null;
  readonly draw: (c: PixelCanvas) => void;
}

/** One frame under construction: projects joints and composites layers back to front. */
export class Figure {
  readonly view: View;
  readonly cell: number;
  readonly ox: number;
  readonly oy: number;
  readonly legend: Legend;
  private readonly layers: Layer[] = [];
  private readonly decals: Decal[] = [];

  constructor(view: View, cell: number, ox: number, oy: number, legend: Legend) {
    this.view = view;
    this.cell = cell;
    this.ox = ox;
    this.oy = oy;
    this.legend = legend;
  }

  at(v: Vec): Joint {
    const { cos, sin } = this.view;
    const ground = v[0] * sin + v[1] * cos;
    return { x: this.ox + v[0] * cos - v[1] * sin, y: this.oy + ground * GROUND_TILT - v[2], z: ground };
  }

  layer(z: number, draw: (c: PixelCanvas) => void, seam = true, box: Box | null = null): void {
    this.layers.push({ z, seam, box, draw });
  }

  stamp(art: Stamp, joint: Joint, z = joint.z, seam = true, flip = false): void {
    const x = Math.round(joint.x) - (flip ? art.rows[0].length - 1 - art.px : art.px);
    const y = Math.round(joint.y) - art.py;
    const rows = flip ? art.rows.map((row) => [...row].reverse().join('')) : art.rows;
    const box = { x0: x, y0: y, x1: x + rows[0].length - 1, y1: y + rows.length - 1 };
    this.layer(z, (c) => c.grid(x, y, rows, this.legend), seam, box);
  }

  /** `upright` fixes the cross-sections as ribbon() describes; left out, the limb's slope picks them. */
  limb(a: Joint, b: Joint, sections: readonly string[], z = (a.z + b.z) / 2, seam = true, upright?: boolean): void {
    const reach = Math.max(...sections.map((section) => section.length));
    const box = {
      x0: Math.round(Math.min(a.x, b.x)) - reach,
      y0: Math.round(Math.min(a.y, b.y)) - reach,
      x1: Math.round(Math.max(a.x, b.x)) + reach,
      y1: Math.round(Math.max(a.y, b.y)) + reach,
    };
    this.layer(z, (c) => ribbon(c, a, b, sections, this.legend, upright), seam, box);
  }

  /**
   * A grid flat on the ground at x, y in the cell, such as a pool. bake() paints decals after
   * the outline and only into empty pixels, as flatFrame does, so they are never outlined.
   */
  decal(x: number, y: number, rows: readonly string[], legend: Legend = this.legend): void {
    this.decals.push({ x, y, rows, legend });
  }

  /** Composites the layers, without the outline or the decals. */
  canvas(): PixelCanvas {
    const out = new PixelCanvas(this.cell, this.cell);
    const scratch = new PixelCanvas(this.cell, this.cell);
    const ordered = this.layers.map((layer, i) => ({ layer, i })).sort((a, b) => a.layer.z - b.layer.z || a.i - b.i);
    const whole: Box = { x0: 0, y0: 0, x1: this.cell - 1, y1: this.cell - 1 };
    for (const { layer } of ordered) {
      const box = clip(layer.box ?? whole, this.cell);
      layer.draw(scratch);
      if (layer.seam) seam(out, scratch, box);
      lay(out, scratch, box);
    }
    return out;
  }

  bake(): PixelSprite {
    return underlaid(outlined(this.canvas()), this.decals).toSprite(this.cell, this.cell, this.ox, this.oy + 1);
  }
}

const clip = (box: Box, cell: number): Box => ({
  x0: Math.max(0, box.x0 - 1),
  y0: Math.max(0, box.y0 - 1),
  x1: Math.min(cell - 1, box.x1 + 1),
  y1: Math.min(cell - 1, box.y1 + 1),
});

/** The selective outline, run on just the figure rather than the whole cell. An empty cell stays empty. */
function outlined(c: PixelCanvas): PixelCanvas {
  let [x0, y0, x1, y1] = [c.w, c.h, -1, -1];
  for (let y = 0; y < c.h; y++) {
    for (let x = 0; x < c.w; x++) {
      const clear = c.data[(y * c.w + x) * 4 + 3] === 0;
      if (clear) continue;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  }
  const empty = x1 < 0;
  if (empty) return c;
  const part = c.crop(x0 - 1, y0 - 1, x1 - x0 + 3, y1 - y0 + 3).outline({ selective: true });
  return new PixelCanvas(c.w, c.h).blit(part, x0 - 1, y0 - 1);
}

/** The finished figure over its decals: a decal shows only where the figure left a pixel empty. */
function underlaid(figure: PixelCanvas, decals: readonly Decal[]): PixelCanvas {
  const none = decals.length === 0;
  if (none) return figure;
  const ground = new PixelCanvas(figure.w, figure.h);
  for (const { x, y, rows, legend } of decals) ground.grid(x, y, rows, legend);
  return ground.blit(figure);
}

/** Moves a finished layer onto the frame and clears it for the next one. */
function lay(out: PixelCanvas, layer: PixelCanvas, box: Box): void {
  const from = layer.data;
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const i = (y * out.w + x) * 4;
      const clear = from[i + 3] === 0;
      if (clear) continue;
      out.data[i] = from[i];
      out.data[i + 1] = from[i + 1];
      out.data[i + 2] = from[i + 2];
      out.data[i + 3] = 255;
      from[i + 3] = 0;
    }
  }
}

/**
 * Darkens what sits just below and right of a new layer: a cast contour that keeps a limb
 * readable over a torso of a similar colour.
 */
function seam(under: PixelCanvas, over: PixelCanvas, box: Box): void {
  const { w, h } = under;
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && over.data[(y * w + x) * 4 + 3] !== 0;
  for (let y = box.y0; y <= box.y1; y++) {
    for (let x = box.x0; x <= box.x1; x++) {
      const at = (y * w + x) * 4 + 3;
      const nothingToDarken = under.data[at] === 0 || over.data[at] !== 0;
      if (nothingToDarken) continue;
      const cast = opaque(x - 1, y) || opaque(x, y - 1);
      const touches = cast || opaque(x + 1, y) || opaque(x, y + 1);
      if (touches) under.px(x, y, darker(under.get(x, y)!, cast ? 2 : 1));
    }
  }
}
