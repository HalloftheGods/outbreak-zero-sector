import type { Clip, PixelSprite } from '../art/types.ts';
import { FloatingTexts } from './floating-texts.ts';
import { clipDuration, clipFrame, drawSprite } from './sprite-cache.ts';

const GRAVITY = 260;
const CASING_RESTITUTION = 0.45;
const CASING_FRICTION = 0.6;
const MAX_DOTS = 320;
const MAX_CASINGS = 48;
const MAX_CLIPS = 64;

export interface Dot {
  x: number;
  y: number;
  /** Height above the ground. */
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: string;
  size: number;
  /** Glows through the dark, so it draws after the lightmap. */
  emissive: boolean;
}

export interface Casing {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  sprite: PixelSprite;
  bounces: number;
}

interface ClipEffect {
  clip: Clip;
  x: number;
  y: number;
  age: number;
  emissive: boolean;
}

function removeWhere<T>(items: T[], gone: (item: T) => boolean): void {
  let kept = 0;
  for (const item of items) {
    if (!gone(item)) items[kept++] = item;
  }
  items.length = kept;
}

/** One casing's flight for dt. Returns true once it has come to rest. */
export function stepCasing(casing: Casing, dt: number): boolean {
  casing.x += casing.vx * dt;
  casing.y += casing.vy * dt;
  casing.z += casing.vz * dt;
  casing.vz -= GRAVITY * dt;
  if (casing.z > 0) return false;
  casing.z = 0;
  casing.bounces += 1;
  casing.vz = -casing.vz * CASING_RESTITUTION;
  casing.vx *= CASING_FRICTION;
  casing.vy *= CASING_FRICTION;
  return casing.bounces >= 3 || casing.vz < 12;
}

function stepDot(dot: Dot, dt: number): boolean {
  dot.life -= dt;
  dot.x += dot.vx * dt;
  dot.y += dot.vy * dt;
  dot.z += dot.vz * dt;
  dot.vz -= GRAVITY * dt;
  if (dot.z < 0) {
    dot.z = 0;
    dot.vx = 0;
    dot.vy = 0;
    dot.vz = 0;
  }
  return dot.life <= 0;
}

/** Short-lived, client-only debris. Sim state never depends on any of it. */
export class ParticleSystem {
  readonly dots: Dot[] = [];
  readonly casings: Casing[] = [];
  private readonly clips: ClipEffect[] = [];
  private readonly texts = new FloatingTexts();
  private readonly stamp: (sprite: PixelSprite, x: number, y: number) => void;

  constructor(stamp: (sprite: PixelSprite, x: number, y: number) => void) {
    this.stamp = stamp;
  }

  clear(): void {
    this.dots.length = 0;
    this.casings.length = 0;
    this.clips.length = 0;
    this.texts.clear();
  }

  addDot(dot: Dot): void {
    if (this.dots.length < MAX_DOTS) this.dots.push(dot);
  }

  addCasing(casing: Casing): void {
    if (this.casings.length >= MAX_CASINGS) this.casings.shift();
    this.casings.push(casing);
  }

  addClip(clip: Clip, x: number, y: number, emissive: boolean): void {
    if (this.clips.length < MAX_CLIPS) this.clips.push({ clip, x, y, age: 0, emissive });
  }

  addText(text: string, x: number, y: number, color: string): void {
    this.texts.add(text, x, y, color);
  }

  update(dt: number): void {
    removeWhere(this.dots, (dot) => stepDot(dot, dt));
    removeWhere(this.casings, (casing) => {
      const atRest = stepCasing(casing, dt);
      if (atRest) this.stamp(casing.sprite, casing.x, casing.y);
      return atRest;
    });
    removeWhere(this.clips, (effect) => {
      effect.age += dt;
      return effect.age >= clipDuration(effect.clip);
    });
    this.texts.update(dt);
  }

  private drawDots(ctx: CanvasRenderingContext2D, left: number, top: number, emissive: boolean): void {
    for (const dot of this.dots) {
      if (dot.emissive !== emissive) continue;
      ctx.fillStyle = dot.color;
      ctx.fillRect(Math.round(dot.x) - left, Math.round(dot.y - dot.z) - top, dot.size, dot.size);
    }
  }

  private drawClips(ctx: CanvasRenderingContext2D, left: number, top: number, emissive: boolean): void {
    for (const effect of this.clips) {
      if (effect.emissive !== emissive) continue;
      drawSprite(ctx, clipFrame(effect.clip, effect.age), Math.round(effect.x) - left, Math.round(effect.y) - top);
    }
  }

  /** Under the lightmap: blood and smoke are as dark as whatever they land on. */
  drawLit(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    for (const casing of this.casings) {
      drawSprite(ctx, casing.sprite, Math.round(casing.x) - left, Math.round(casing.y - casing.z) - top);
    }
    this.drawClips(ctx, left, top, false);
    this.drawDots(ctx, left, top, false);
  }

  /** Over the lightmap: muzzle flashes and sparks are their own light. */
  drawEmissive(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    this.drawClips(ctx, left, top, true);
    this.drawDots(ctx, left, top, true);
  }

  drawTexts(ctx: CanvasRenderingContext2D, left: number, top: number): void {
    this.texts.draw(ctx, left, top);
  }
}
