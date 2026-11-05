import { characterOf } from '../../shared/characters.ts';
import { EXIT_RADIUS, ZOMBIES } from '../../shared/constants.ts';
import { CONTAINER_LABEL } from '../../shared/containers.ts';
import { HEAD_MARGIN, isOnHead } from '../../shared/headshots.ts';
import type { EntityId, ExitEntity, PlayerEntity, ZombieEntity } from '../../shared/protocol.ts';
import { dirFromAngle } from '../art/types.ts';
import type { ArtBook } from '../art/types.ts';
import { drawOutlinedText, FONT_HEIGHT } from './bitmap-font.ts';
import type { SceneView } from './scene.ts';
import { bodyHeight, drawSprite } from './sprite-cache.ts';
import type { VisualStore } from './visuals.ts';

const POINTER_INSET = 8;
/** Clear of the HUD in every corner, and of the screen's edge, where the van must not be missed. */
const VAN_POINTER_INSET = 26;
const VAN_POINTER_LABEL_GAP = 5;
/** A hurt zombie's bar only shows where a light finds it; in the dark it would mark the spot. */
const BAR_MIN_LIGHT = 60;
const INK = '#0b0c10';
const BONE = '#e4dcc3';
const BLOOD = '#c8332a';
const SICK = '#8fbf3a';
const AMBER = '#e8a33d';
const DEFAULT_BODY_HEIGHT = 18;
/** Words and the wait bar sit this far over the van's ground line. */
const VAN_TAG_HEIGHT = 46;
const VAN_BAR_WIDTH = 32;
const EXIT_RING_DOTS = 28;
/** A search's bar and prompt sit this far over a head, clear of a teammate's own tag. */
const SEARCH_TAG_HEIGHT = FONT_HEIGHT * 2 + 12;
const SEARCH_BAR_WIDTH = 24;

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

/**
 * Whether a screen point is on a head the player can make out. A head in the dark
 * stays unmarked, for the same reason a hurt zombie's bar does: it would mark the spot.
 */
export function onSeenHead(
  zombies: readonly ZombieEntity[],
  screenX: number,
  screenY: number,
  left: number,
  top: number,
  lightAt: (x: number, y: number) => number,
  isKilled: (id: EntityId) => boolean,
): boolean {
  return zombies.some((zombie) => {
    const aimedAt = !isKilled(zombie.id) && isOnHead(zombie, screenX + left, screenY + top, HEAD_MARGIN);
    return aimedAt && lightAt(zombie.x - left, zombie.y - top) >= BAR_MIN_LIGHT;
  });
}

/** Dots around the spot that counts as being at the van. */
const EXIT_RING: readonly Pixel[] = Array.from({ length: EXIT_RING_DOTS }, (_, dot) => {
  const angle = (dot / EXIT_RING_DOTS) * Math.PI * 2;
  return [Math.round(Math.cos(angle) * EXIT_RADIUS), Math.round(Math.sin(angle) * EXIT_RADIUS)];
});

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
    drawOutlinedText(ctx, `${player.name} / ${characterOf(player.skin).name}`, x, y, BONE);
  }

  private drawPointers(ctx: CanvasRenderingContext2D, scene: SceneView, left: number, top: number, viewW: number, viewH: number): void {
    for (const player of scene.players) {
      if (player.status !== 'downed' || player.id === scene.localId) continue;
      const pointer = edgePointer(player.x - left, player.y - top, viewW, viewH);
      if (pointer) drawArrow(ctx, pointer, SICK);
    }
  }

  /** A bar over anyone searching, and for the local player the key to hold. */
  private drawSearch(ctx: CanvasRenderingContext2D, scene: SceneView, left: number, top: number): void {
    for (const player of scene.players) {
      const x = Math.round(player.x) - left;
      const y = Math.round(player.y) - top - this.heightOf(player.id) - SEARCH_TAG_HEIGHT;
      const prompted = player.id === scene.localId && scene.searchable !== null;
      if (player.search > 0) drawBar(ctx, x - SEARCH_BAR_WIDTH / 2, y, SEARCH_BAR_WIDTH, player.search, BONE);
      else if (prompted) drawOutlinedText(ctx, `HOLD E: ${CONTAINER_LABEL[scene.searchable.kind]}`, x, y, AMBER);
    }
  }

  /** An arrow to the van while it is out of sight. In sight, the ring to stand in and the wait. */
  private drawExit(ctx: CanvasRenderingContext2D, exit: ExitEntity, left: number, top: number, viewW: number, viewH: number): void {
    const x = Math.round(exit.x) - left;
    const y = Math.round(exit.y) - top;
    const pointer = edgePointer(x, y, viewW, viewH, VAN_POINTER_INSET);
    if (pointer) {
      drawArrow(ctx, pointer, AMBER);
      const labelBelow = pointer.y < viewH / 2;
      const labelY = labelBelow ? pointer.y + VAN_POINTER_LABEL_GAP : pointer.y - VAN_POINTER_LABEL_GAP - FONT_HEIGHT;
      drawOutlinedText(ctx, 'VAN', pointer.x, labelY, AMBER);
      return;
    }
    ctx.fillStyle = AMBER;
    for (const [dx, dy] of EXIT_RING) ctx.fillRect(x + dx, y + dy, 1, 1);
    const tagY = y - VAN_TAG_HEIGHT;
    if (exit.progress > 0) drawBar(ctx, x - VAN_BAR_WIDTH / 2, tagY, VAN_BAR_WIDTH, exit.progress, SICK);
    else drawOutlinedText(ctx, 'VAN', x, tagY, AMBER);
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
    this.drawSearch(ctx, scene, left, top);
    this.drawPointers(ctx, scene, left, top, viewW, viewH);
    const exitShown = scene.exit !== null && scene.phase !== 'gameover';
    if (exitShown) this.drawExit(ctx, scene.exit, left, top, viewW, viewH);
  }

  drawCrosshair(
    ctx: CanvasRenderingContext2D,
    scene: SceneView,
    left: number,
    top: number,
    lightAt: (x: number, y: number) => number,
    isKilled: (id: EntityId) => boolean,
  ): void {
    const { pointerX: x, pointerY: y } = scene;
    const noPointer = x === null || y === null;
    if (noPointer) return;
    const { crosshair, crosshairHead } = this.art.ui;
    const sprite = onSeenHead(scene.zombies, x, y, left, top, lightAt, isKilled) ? crosshairHead : crosshair;
    drawSprite(ctx, sprite, Math.round(x), Math.round(y));
  }
}
