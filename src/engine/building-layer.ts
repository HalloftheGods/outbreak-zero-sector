import { BUILDING_DEFS, DOOR_WIDTH, WALL_THICKNESS } from '../../shared/protocol.ts';
import type { BuildingInstance, BuildingKind, WorldMap } from '../../shared/protocol.ts';
import { buildingAt } from '../../shared/world-map.ts';
import type { EnvironmentArt, PixelSprite } from '../art/types.ts';
import type { ScreenRect } from './light-field.ts';
import { fadedCanvas, FADE_STEPS, spriteCanvas } from './sprite-cache.ts';

const REVEAL_SEC = 0.22;

export interface PlacedBuilding {
  readonly building: BuildingInstance;
  readonly sprite: PixelSprite;
  /** Where the shell's art lands, which can rise past the footprint. */
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
  readonly width: number;
  readonly height: number;
  /** South edge of the footprint: the shell sorts here, so all that is inside goes under it. */
  readonly depthY: number;
  /** 0 is a closed shell, 1 is the shell gone. */
  reveal: number;
}

function tileStrip(
  ctx: CanvasRenderingContext2D,
  sprite: PixelSprite,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  const source = spriteCanvas(sprite);
  for (let tileY = 0; tileY < height; tileY += sprite.h) {
    const tall = Math.min(sprite.h, height - tileY);
    for (let tileX = 0; tileX < width; tileX += sprite.w) {
      const wide = Math.min(sprite.w, width - tileX);
      ctx.drawImage(source, 0, 0, wide, tall, x + tileX, y + tileY, wide, tall);
    }
  }
}

/** What a room shows once its roof has gone: the north wall's face, every wall top and the door mat. */
function paintInterior(kind: BuildingKind, art: EnvironmentArt['interior']): HTMLCanvasElement {
  const { w, h, doorX } = BUILDING_DEFS[kind];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const wall = WALL_THICKNESS;
  const doorLeft = doorX - DOOR_WIDTH / 2;
  const doorRight = doorX + DOOR_WIDTH / 2;

  tileStrip(ctx, art.wallFace, wall, wall, w - wall * 2, art.wallFace.h);
  tileStrip(ctx, art.wallCap, 0, 0, w, wall);
  tileStrip(ctx, art.wallCap, 0, 0, wall, h);
  tileStrip(ctx, art.wallCap, w - wall, 0, wall, h);
  tileStrip(ctx, art.wallCap, 0, h - wall, doorLeft, wall);
  tileStrip(ctx, art.wallCap, doorRight, h - wall, w - doorRight, wall);
  ctx.drawImage(
    spriteCanvas(art.doorMat),
    doorX - Math.round(art.doorMat.w / 2),
    h - wall - art.doorMat.h,
  );
  return canvas;
}

/** The town's buildings: closed shells from outside, opened rooms from within. */
export class BuildingLayer {
  placed: PlacedBuilding[] = [];
  private readonly art: EnvironmentArt;
  private readonly interiors = new Map<BuildingKind, HTMLCanvasElement>();
  private readonly byId = new Map<string, PlacedBuilding>();
  private map: WorldMap | null = null;

  constructor(art: EnvironmentArt) {
    this.art = art;
  }

  setMap(map: WorldMap): void {
    this.map = map;
    this.byId.clear();
    this.placed = map.buildings.map((building) => {
      const variants = this.art.buildings[building.kind];
      const sprite = variants[building.variant % variants.length];
      const { w, h } = BUILDING_DEFS[building.kind];
      const x0 = building.x + w / 2 - sprite.ax;
      const y0 = building.y + h - sprite.ay;
      const placed = {
        building,
        sprite,
        x0,
        y0,
        x1: x0 + sprite.w,
        y1: y0 + sprite.h,
        width: w,
        height: h,
        depthY: building.y + h,
        reveal: 0,
      };
      this.byId.set(building.id, placed);
      return placed;
    });
  }

  reset(): void {
    for (const placed of this.placed) placed.reveal = 0;
  }

  /** Moves each shell toward open if it is the one the viewer stands in, otherwise toward closed. */
  update(indoorsId: string | null, dt: number): void {
    const step = dt / REVEAL_SEC;
    for (const placed of this.placed) {
      const target = placed.building.id === indoorsId ? 1 : 0;
      placed.reveal += Math.max(-step, Math.min(step, target - placed.reveal));
    }
  }

  placedAt(x: number, y: number): PlacedBuilding | null {
    const building = this.map ? buildingAt(this.map, x, y) : null;
    return building ? this.byId.get(building.id) ?? null : null;
  }

  /** True for a point under a shell that has not begun to open. */
  isHidden(x: number, y: number): boolean {
    const placed = this.placedAt(x, y);
    return placed !== null && placed.reveal === 0;
  }

  /** The room that is open, or opening, around the viewer. */
  openRoom(): PlacedBuilding | null {
    let room: PlacedBuilding | null = null;
    for (const placed of this.placed) {
      const moreOpen = placed.reveal > (room?.reveal ?? 0);
      if (moreOpen) room = placed;
    }
    return room;
  }

  private interior(kind: BuildingKind): HTMLCanvasElement {
    let canvas = this.interiors.get(kind);
    if (!canvas) {
      canvas = paintInterior(kind, this.art.interior);
      this.interiors.set(kind, canvas);
    }
    return canvas;
  }

  drawInteriors(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    for (const placed of this.placed) {
      const showing = placed.reveal > 0;
      if (showing) ctx.drawImage(this.interior(placed.building.kind), placed.building.x - left, placed.building.y - top);
    }
  }

  /** The fade punches pixels out through the dither matrix, so the art stays hard-edged. */
  drawShell(ctx: CanvasRenderingContext2D, placed: PlacedBuilding, left: number, top: number): void {
    const step = Math.round(placed.reveal * FADE_STEPS);
    const gone = step >= FADE_STEPS;
    if (gone) return;
    const canvas = step === 0 ? spriteCanvas(placed.sprite) : fadedCanvas(placed.sprite, step);
    ctx.drawImage(canvas, placed.x0 - left, placed.y0 - top);
  }
}

export function roomRect(placed: PlacedBuilding, left: number, top: number): ScreenRect {
  const x0 = placed.building.x - left;
  const y0 = placed.building.y - top;
  return { x0, y0, x1: x0 + placed.width, y1: y0 + placed.height };
}
