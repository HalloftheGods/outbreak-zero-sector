import { describe, expect, it } from 'vitest';
import { TILE_KINDS, TILE_SIZE } from '../shared/protocol.ts';
import type { WorldMap } from '../shared/protocol.ts';
import { generateWorldMap } from '../shared/world-map.ts';
import { Atmosphere, MAX_FLAKES } from '../src/engine/atmosphere.ts';
import { GroundMotion, MAX_GROUND_MARKS, windSpeed, windTravel } from '../src/engine/ground-motion.ts';

const VIEW_W = 480;
const VIEW_H = 270;

interface Mark {
  x: number;
  y: number;
  w: number;
  alpha: number;
}

function recorder(): { ctx: CanvasRenderingContext2D; marks: Mark[] } {
  const marks: Mark[] = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    fillRect(x: number, y: number, w: number) {
      marks.push({ x, y, w, alpha: this.globalAlpha });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, marks };
}

/** A map that is open street everywhere, with one block of floor in the middle. */
function streetWithRoom(): WorldMap {
  const cols = 60;
  const rows = 40;
  const tiles = new Uint8Array(cols * rows).fill(TILE_KINDS.indexOf('asphalt'));
  const floor = TILE_KINDS.indexOf('floor_wood');
  for (let row = 10; row < 25; row += 1) {
    for (let col = 15; col < 40; col += 1) tiles[row * cols + col] = floor;
  }
  return { ...generateWorldMap(4242), cols, rows, width: cols * TILE_SIZE, height: rows * TILE_SIZE, tiles };
}

function groundMarks(theme: 'flooded' | 'snow' | 'night', time: number, reducedMotion = false, left = 0, top = 0): Mark[] {
  const motion = new GroundMotion(reducedMotion);
  motion.setMap(streetWithRoom());
  motion.setTheme(theme);
  const { ctx, marks } = recorder();
  motion.draw(ctx, left, top, VIEW_W, VIEW_H, time, theme === 'flooded' ? 'lit' : 'ground');
  return marks;
}

function weatherMarks(theme: 'snow' | 'flooded', time: number): Mark[] {
  const atmosphere = new Atmosphere(false);
  atmosphere.setTheme(theme);
  const { ctx, marks } = recorder();
  atmosphere.drawWeather(ctx, 0, 0, VIEW_W, VIEW_H, time, 1);
  return marks;
}

describe('the ground moving in the weather towns', () => {
  it('runs light over the flood water and the loose snow along the street', () => {
    for (const theme of ['flooded', 'snow'] as const) {
      const now = groundMarks(theme, 4);
      const later = groundMarks(theme, 4.7);
      expect(now.length).toBeGreaterThan(5);
      expect(later).not.toEqual(now);
    }
  });

  it('leaves the plain night ground alone', () => {
    expect(groundMarks('night', 4)).toEqual([]);
  });

  it('draws each town in its own pass: snow under the light, water over it', () => {
    for (const [theme, wrong] of [['flooded', 'ground'], ['snow', 'lit']] as const) {
      const motion = new GroundMotion(false);
      motion.setMap(streetWithRoom());
      motion.setTheme(theme);
      const { ctx, marks } = recorder();
      motion.draw(ctx, 0, 0, VIEW_W, VIEW_H, 4, wrong);
      expect(marks).toEqual([]);
    }
  });

  it('keeps building floors dry and still', () => {
    for (const theme of ['flooded', 'snow'] as const) {
      for (const time of [1, 3.3, 8.1, 20]) {
        const indoors = groundMarks(theme, time).filter(({ x, y }) => {
          const col = Math.floor(x / TILE_SIZE);
          const row = Math.floor(y / TILE_SIZE);
          return col >= 15 && col < 40 && row >= 10 && row < 25;
        });
        expect(indoors).toEqual([]);
      }
    }
  });

  it('stays on screen and inside its budget wherever the camera is', () => {
    for (const theme of ['flooded', 'snow'] as const) {
      for (const time of [0.5, 7.25, 31]) {
        const marks = groundMarks(theme, time, false, 123.4, 57.8);
        expect(marks.length).toBeLessThanOrEqual(MAX_GROUND_MARKS);
        expect(marks.every(({ x, y, w }) => x >= -4 && x + w <= VIEW_W + 4 && y >= -4 && y <= VIEW_H + 4)).toBe(true);
        expect(marks.every(({ alpha }) => alpha >= 0 && alpha <= 1)).toBe(true);
      }
    }
  });

  it('holds the water and snow still for reduced motion', () => {
    for (const theme of ['flooded', 'snow'] as const) {
      expect(groundMarks(theme, 9, true)).toEqual(groundMarks(theme, 0, true));
    }
  });
});

describe('the wind', () => {
  it('gusts and lulls but never blows backwards or jumps', () => {
    const speeds = Array.from({ length: 400 }, (_, i) => windSpeed(i * 0.1));
    expect(Math.min(...speeds)).toBeGreaterThan(0.2);
    expect(Math.max(...speeds)).toBeGreaterThan(1.4);
    for (let i = 1; i < 400; i += 1) {
      const step = windTravel(i * 0.1) - windTravel((i - 1) * 0.1);
      expect(step).toBeGreaterThan(0);
      expect(step).toBeLessThan(0.2);
    }
  });
});

describe('the falling weather', () => {
  it('draws the snow in two depths, big near flakes over small far ones', () => {
    const marks = weatherMarks('snow', 5);
    expect(marks.length).toBeLessThanOrEqual(MAX_FLAKES);
    expect(marks.some(({ w }) => w === 2)).toBe(true);
    expect(marks.some(({ w }) => w === 1)).toBe(true);
  });

  it('lets the snow drift sideways with the wind as it falls', () => {
    const near = (marks: Mark[]) => marks.filter(({ w }) => w === 2);
    const before = near(weatherMarks('snow', 2));
    const after = near(weatherMarks('snow', 2.5));
    expect(after.map(({ x }) => x)).not.toEqual(before.map(({ x }) => x));
    expect(after.map(({ y }) => y)).not.toEqual(before.map(({ y }) => y));
  });

  it('keeps the rain inside the budget too', () => {
    expect(weatherMarks('flooded', 5).length).toBeLessThanOrEqual(MAX_FLAKES);
  });
});
