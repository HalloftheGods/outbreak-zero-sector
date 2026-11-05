import { ZOMBIES } from '../../shared/constants.ts';
import type { EntityId, PlayerEntity, ZombieEntity } from '../../shared/protocol.ts';
import { dirFromAngle } from '../art/types.ts';
import type { ArtBook } from '../art/types.ts';
import { drawOutlinedText, FONT_HEIGHT } from './bitmap-font.ts';
import type { SceneView } from './scene.ts';
import { bodyHeight, drawSprite } from './sprite-cache.ts';
import type { VisualStore } from './visuals.ts';

const POINTER_INSET = 8;
/** A hurt zombie's bar only shows where a light finds it; in the dark it would mark the spot. */
const BAR_MIN_LIGHT = 60;
const INK = '#0b0c10';
const BONE = '#e4dcc3';
const BLOOD = '#c8332a';
const SICK = '#8fbf3a';
const AMBER = '#e8a33d';
const DEFAULT_BODY_HEIGHT = 18;

type Pixel = readonly [number, number];

function parsePixels(rows: readonly string[]): Pixel[] {
  const pixels: Pixel[] = [];
  rows.forEach((row, y) => [...row].forEach((cell, x) => {
    if (cell === '#') pixels.push([x - 2, y - 2]);
  }));
  return pixels;
}

const ARROW_EAST = parsePixels(['#....', '###..', '#####', '###..', '#....']);
const ARROW_SOUTHEAST = parsePixels(['....#', '...##', '..###', '.####', '#####']);

function quarterTurns(pixels: readonly Pixel[], turns: number): Pixel[] {
  return pixels.map(([x, y]) => {
    let px = x;
    let py = y;
    for (let i = 0; i < turns; i += 1) [px, py] = [-py, px];
    return [px, py];
  });
}

/** Indexed like dirFromAngle: 0=E 1=SE 2=S and on round. */
const ARROWS: readonly (readonly Pixel[])[] = Array.from({ length: 8 }, (_, dir) =>
  quarterTurns(dir % 2 === 0 ? ARROW_EAST : ARROW_SOUTHEAST, Math.floor(dir / 2)));

export interface EdgePointer {
  readonly x: number;
  readonly y: number;
  readonly dir: number;
}

/** Where to pin an arrow for a point off screen, or null if the point is in view. */
export function edgePointer(screenX: number, screenY: number, viewW: number, viewH: number, inset = POINTER_INSET): EdgePointer | null {
  const inView = screenX >= 0 && screenY >= 0 && screenX < viewW && screenY < viewH;
  if (inView) return null;
  const centerX = viewW / 2;
  const centerY = viewH / 2;
  const dx = screenX - centerX;
  const dy = screenY - centerY;
  const reach = Math.min(
    dx === 0 ? Infinity : (centerX - inset) / Math.abs(dx),
    dy === 0 ? Infinity : (centerY - inset) / Math.abs(dy),
  );
  return {
    x: Math.round(centerX + dx * reach),
    y: Math.round(centerY + dy * reach),
    dir: dirFromAngle(Math.atan2(dy, dx)),
  };
}

export function drawArrow(ctx: CanvasRenderingContext2D, pointer: EdgePointer, color: string): void {
  const pixels = ARROWS[pointer.dir];
  ctx.fillStyle = INK;
  for (const [x, y] of pixels) ctx.fillRect(pointer.x + x + 1, pointer.y + y + 1, 1, 1);
  ctx.fillStyle = color;
  for (const [x, y] of pixels) ctx.fillRect(pointer.x + x, pointer.y + y, 1, 1);
}

function drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, fraction: number, color: string): void {
  ctx.fillStyle = INK;
  ctx.fillRect(x - 1, y - 1, width + 2, 4);
  const filled = Math.max(1, Math.round(width * Math.min(1, fraction)));
  ctx.fillStyle = color;
  ctx.fillRect(x, y, filled, 2);
}

/** Everything drawn on top of the world: bars, names, edge arrows and the crosshair. */
export class OverlayRenderer {
  private readonly art: ArtBook;
  private readonly visuals: VisualStore;

  constructor(art: ArtBook, visuals: VisualStore) {
    this.art = art;
    this.visuals = visuals;
  }

  private heightOf(id: string): number {
    const sprite = this.visuals.get(id).sprite;
    return sprite ? bodyHeight(sprite) : DEFAULT_BODY_HEIGHT;
  }

  private drawZombieBar(ctx: CanvasRenderingContext2D, zombie: ZombieEntity, left: number, top: number): void {
    const width = ZOMBIES[zombie.type].radius * 2;
    const x = Math.round(zombie.x) - left - Math.round(width / 2);
    const y = Math.round(zombie.y) - top - this.heightOf(zombie.id) - 4;
    drawBar(ctx, x, y, width, zombie.health / zombie.maxHealth, BLOOD);
  }

  private drawPlayerTag(ctx: CanvasRenderingContext2D, player: PlayerEntity, isLocal: boolean, left: number, top: number, time: number): void {
    const x = Math.round(player.x) - left;
    let y = Math.round(player.y) - top - this.heightOf(player.id) - 4;

    if (player.status === 'downed') {
      if (player.revive > 0) {
        drawBar(ctx, x - 12, y, 24, player.revive, AMBER);
      } else if (!isLocal && Math.floor(time * 3) % 2 === 0) {
        drawOutlinedText(ctx, 'HELP', x, y - 2, BLOOD);
      }
      y -= FONT_HEIGHT + 3;
    }
    if (isLocal || player.status === 'dead') return;
    if (player.status === 'alive') {
      drawBar(ctx, x - 8, y, 16, player.health / player.maxHealth, SICK);
      y -= FONT_HEIGHT + 3;
    }
    drawOutlinedText(ctx, player.name, x, y, BONE);
  }

  private drawPointers(ctx: CanvasRenderingContext2D, scene: SceneView, left: number, top: number, viewW: number, viewH: number): void {
    for (const player of scene.players) {
      if (player.status !== 'downed' || player.id === scene.localId) continue;
      const pointer = edgePointer(player.x - left, player.y - top, viewW, viewH);
      if (pointer) drawArrow(ctx, pointer, SICK);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    scene: SceneView,
    left: number,
    top: number,
    viewW: number,
    viewH: number,
    time: number,
    lightAt: (x: number, y: number) => number,
    isKilled: (id: EntityId) => boolean,
  ): void {
    for (const zombie of scene.zombies) {
      if (isKilled(zombie.id)) continue;
      const onScreen = zombie.x > left && zombie.x < left + viewW && zombie.y > top && zombie.y < top + viewH;
      const hurt = zombie.health < zombie.maxHealth;
      const showBar = onScreen && hurt && lightAt(zombie.x - left, zombie.y - top) >= BAR_MIN_LIGHT;
      if (showBar) this.drawZombieBar(ctx, zombie, left, top);
    }
    for (const player of scene.players) {
      this.drawPlayerTag(ctx, player, player.id === scene.localId, left, top, time);
    }
    this.drawPointers(ctx, scene, left, top, viewW, viewH);
  }

  drawCrosshair(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    drawSprite(ctx, this.art.ui.crosshair, Math.round(x), Math.round(y));
  }
}
