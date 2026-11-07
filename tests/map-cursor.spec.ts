import { describe, expect, it } from 'vitest';
import { FONT_HEIGHT, textWidth } from '../src/engine/bitmap-font.ts';
import { blinkPhase, bracketRects, BLINK_HZ, cursorLabel, labelSpot, LONG_LABEL_MS } from '../src/game/map-cursor.ts';

const PERIOD = 1000 / BLINK_HZ;

describe('the You Are Here blink', () => {
  it('beats about one and a half times a second', () => {
    expect(BLINK_HZ).toBe(1.5);
  });

  it('is bright at the start of a beat, dim near its end, and repeats every beat', () => {
    expect(blinkPhase(0, false)).toBe('bright');
    expect(blinkPhase(PERIOD * 0.9, false)).toBe('dim');
    expect(blinkPhase(PERIOD * 3 + 1, false)).toBe('bright');
    expect(blinkPhase(PERIOD * 3 + PERIOD * 0.9, false)).toBe('dim');
  });

  it('spends most of each beat bright, so the dim half is a flicker and not a gap', () => {
    let bright = 0;
    const samples = 1000;
    for (let i = 0; i < samples; i += 1) if (blinkPhase((i / samples) * PERIOD, false) === 'bright') bright += 1;
    expect(bright / samples).toBeGreaterThan(0.5);
    expect(bright / samples).toBeLessThan(0.8);
  });

  it('holds steady for someone who asked for less motion', () => {
    for (let ms = 0; ms < 2000; ms += 37) expect(blinkPhase(ms, true)).toBe('bright');
  });

  it('copes with a clock before zero', () => {
    expect(['bright', 'dim']).toContain(blinkPhase(-123, false));
  });
});

describe('the cursor label', () => {
  it('says the whole sentence while the map is new, then settles on YOU', () => {
    expect(cursorLabel(0)).toBe('YOU ARE HERE');
    expect(cursorLabel(LONG_LABEL_MS - 1)).toBe('YOU ARE HERE');
    expect(cursorLabel(LONG_LABEL_MS)).toBe('YOU');
  });

  it('sits to the right of the cursor with room to spare', () => {
    const width = textWidth('YOU ARE HERE');
    const spot = labelSpot(100, 100, width, 400, 400);
    expect(spot.side).toBe('right');
    expect(spot.left).toBeGreaterThan(100);
  });

  it('flips to the left near the right edge', () => {
    const width = textWidth('YOU ARE HERE');
    const spot = labelSpot(390, 100, width, 400, 400);
    expect(spot.side).toBe('left');
    expect(spot.left + width).toBeLessThan(390);
  });

  it('stays inside the map in every corner, town and bunker sizes', () => {
    const sizes: readonly (readonly [number, number])[] = [[400, 400], [240, 240], [120, 120]];
    for (const text of ['YOU', 'YOU ARE HERE']) {
      const width = textWidth(text);
      for (const [w, h] of sizes) {
        for (const x of [0, 5, w / 2, w - 5, w]) {
          for (const y of [0, 5, h / 2, h - 5, h]) {
            const spot = labelSpot(x, y, width, w, h);
            expect(spot.left).toBeGreaterThanOrEqual(1);
            expect(spot.top).toBeGreaterThanOrEqual(1);
            expect(spot.left + width).toBeLessThanOrEqual(w - 1);
            expect(spot.top + FONT_HEIGHT).toBeLessThanOrEqual(h - 1);
          }
        }
      }
    }
  });
});

describe('the cursor shape', () => {
  it('is four corner brackets, a few times wider than the 5 pixel dots it replaces', () => {
    const rects = bracketRects();
    expect(rects).toHaveLength(8);
    const left = Math.min(...rects.map(([x]) => x));
    const right = Math.max(...rects.map(([x, , w]) => x + w));
    expect(right - left).toBeGreaterThanOrEqual(13);
  });

  it('is centred on the player', () => {
    const rects = bracketRects();
    const left = Math.min(...rects.map(([x]) => x));
    const right = Math.max(...rects.map(([x, , w]) => x + w));
    expect(Math.abs(left + right)).toBeLessThanOrEqual(1);
  });
});
