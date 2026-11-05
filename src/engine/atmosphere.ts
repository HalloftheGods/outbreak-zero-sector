import type { LevelTheme } from '../../shared/levels.ts';
import { LEVEL_LOOKS } from './level-look.ts';
import type { LevelLook, WeatherKind } from './level-look.ts';

const WASH_PULSE_RATE = 2.2;
/** Golden-ratio steps spread flakes evenly with no random numbers to carry around. */
const SPREAD_X = 0.6180339887;
const SPREAD_Y = 0.7548776662;

interface WeatherSpec {
  readonly count: number;
  /** Buffer pixels a second at full speed. */
  readonly driftX: number;
  readonly driftY: number;
  /** Side to side, in pixels. */
  readonly sway: number;
  readonly width: number;
  readonly height: number;
  readonly colors: readonly [string, string];
}

/** The worst case for a frame: one rectangle each, however busy the street. */
export const MAX_FLAKES = 150;

const WEATHER: Record<WeatherKind, WeatherSpec> = {
  soot: { count: 40, driftX: -14, driftY: 10, sway: 6, width: 1, height: 1, colors: ['#3a384e', '#6c6a78'] },
  rain: { count: 110, driftX: -46, driftY: 300, sway: 0, width: 1, height: 5, colors: ['#6488bc', '#3a5288'] },
  spores: { count: 50, driftX: 6, driftY: -9, sway: 8, width: 1, height: 1, colors: ['#c4f048', '#5ca82c'] },
  snow: { count: MAX_FLAKES, driftX: -12, driftY: 38, sway: 10, width: 2, height: 1, colors: ['#faf2d4', '#c0c6c8'] },
  hive: { count: 56, driftX: -5, driftY: -7, sway: 9, width: 1, height: 1, colors: ['#b070d0', '#6c3c9c'] },
  embers: { count: 70, driftX: 10, driftY: -34, sway: 7, width: 1, height: 1, colors: ['#ffc03c', '#e8701c'] },
};

function wrap(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/** Where a flake is. Pinned to the world through left and top, so it scrolls with the street. */
export function flakeX(spec: WeatherSpec, index: number, time: number, left: number, viewW: number): number {
  const speed = 0.7 + 0.3 * ((index * SPREAD_Y) % 1);
  const sway = spec.sway * Math.sin(time * 0.9 + index);
  return Math.floor(wrap(((index * SPREAD_X) % 1) * viewW + spec.driftX * speed * time + sway - left, viewW));
}

export function flakeY(spec: WeatherSpec, index: number, time: number, top: number, viewH: number): number {
  const speed = 0.7 + 0.3 * ((index * SPREAD_Y) % 1);
  return Math.floor(wrap(((index * SPREAD_Y) % 1) * viewH + spec.driftY * speed * time - top, viewH));
}

/** The level's palette and weather over the finished frame. It holds still for reduced motion. */
export class Atmosphere {
  look: LevelLook = LEVEL_LOOKS.night;
  private readonly reducedMotion: boolean;

  constructor(reducedMotion: boolean) {
    this.reducedMotion = reducedMotion;
  }

  setTheme(theme: LevelTheme): void {
    this.look = LEVEL_LOOKS[theme];
  }

  /** The wash's alpha right now. */
  washAlpha(time: number): number {
    const { wash, washPulse } = this.look;
    if (!wash) return 0;
    const pulsing = washPulse > 0 && !this.reducedMotion;
    return pulsing ? wash.alpha + washPulse * Math.sin(time * WASH_PULSE_RATE) : wash.alpha;
  }

  /** outdoors is 0..1 as the room the viewer is in opens: the sky stays outside. */
  drawWash(ctx: CanvasRenderingContext2D, viewW: number, viewH: number, time: number, outdoors: number): void {
    const { wash } = this.look;
    if (!wash) return;
    ctx.globalAlpha = this.washAlpha(time) * outdoors;
    ctx.fillStyle = wash.color;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.globalAlpha = 1;
  }

  drawWeather(
    ctx: CanvasRenderingContext2D,
    left: number,
    top: number,
    viewW: number,
    viewH: number,
    time: number,
    outdoors: number,
  ): void {
    const { weather } = this.look;
    const unseen = weather === null || outdoors <= 0;
    if (unseen) return;
    const spec = WEATHER[weather];
    const shownTime = this.reducedMotion ? 0 : time;
    ctx.globalAlpha = outdoors;
    for (let shade = 0; shade < spec.colors.length; shade += 1) {
      ctx.fillStyle = spec.colors[shade];
      for (let i = shade; i < spec.count; i += spec.colors.length) {
        ctx.fillRect(flakeX(spec, i, shownTime, left, viewW), flakeY(spec, i, shownTime, top, viewH), spec.width, spec.height);
      }
    }
    ctx.globalAlpha = 1;
  }
}
