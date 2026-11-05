// Room to work around a finished prop: what hangs off it or falls out of it lands past its edges,
// and the anchor stays on the footprint, so collisions and depth never notice the mess.

import { PROP_DEFS } from '../../../shared/protocol.ts';
import type { PropKind } from '../../../shared/protocol.ts';
import { PixelCanvas, spriteToCanvas } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { Color } from '../palette.ts';
import type { PixelSprite } from '../types.ts';

const { bone, metal, denim } = RAMPS;

export interface ContainerArt {
  readonly closed: PixelSprite;
  readonly opened: PixelSprite;
}

export interface Stage {
  readonly c: PixelCanvas;
  /** Footprint columns, first and last. */
  readonly left: number;
  readonly right: number;
  /** Footprint south edge. */
  readonly ground: number;
  readonly ax: number;
}

export function stage(kind: PropKind, sprite: PixelSprite, side: number, below: number, above = 0): Stage {
  const c = new PixelCanvas(sprite.w + side * 2, sprite.h + below + above);
  c.blit(spriteToCanvas(sprite), side, above);
  const ax = sprite.ax + side;
  const { w } = PROP_DEFS[kind];
  return { c, left: ax - w / 2, right: ax + w / 2 - 1, ground: sprite.ay + above, ax };
}

/** Draws on a layer of its own, so only the new pieces get an outline, not the prop a second time. */
export function over(c: PixelCanvas, draw: (layer: PixelCanvas) => void): void {
  const layer = new PixelCanvas(c.w, c.h);
  draw(layer);
  c.blit(layer.outline({ selective: true }));
}

export function bakeStage({ c, ax, ground }: Stage): PixelSprite {
  return c.toSprite(c.w, c.h, ax, ground);
}

/** A tin or packet on its side. */
export function tipped(c: PixelCanvas, x: number, y: number, color: Color): void {
  c.rect(x, y, 4, 2, color).px(x, y, bone[3]);
}

/** A tin or packet still upright. */
export function upright(c: PixelCanvas, x: number, y: number, color: Color, height = 3): void {
  c.rect(x, y - height, 2, height, color).px(x, y - height, bone[3]);
}

export function paper(c: PixelCanvas, x: number, y: number): void {
  c.rect(x, y, 4, 2, bone[2]).rect(x + 1, y, 3, 1, bone[3]);
}

/** Bright flecks of broken glass. These go on last, so no outline dulls them. */
export function glints(c: PixelCanvas, spots: readonly (readonly [number, number])[]): void {
  const shades = [bone[3], metal[3], denim[2]];
  spots.forEach(([x, y], i) => c.px(x, y, shades[i % shades.length]));
}
