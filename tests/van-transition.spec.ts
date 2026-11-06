import { describe, expect, it } from 'vitest';
import { nextRun, runOver, skipRun, tripFor, vanCues, vanFrame, vanPixel, vanPuffs, vanTimeline } from '../src/game/van-transition.ts';
import type { VanTrip } from '../src/game/van-transition.ts';

const TRIPS: readonly VanTrip[] = ['leaving', 'returning'];

describe('tripFor', () => {
  it('drives out when the party leaves the bunker and home when it comes back', () => {
    expect(tripFor(true, false)).toBe('leaving');
    expect(tripFor(false, true)).toBe('returning');
  });

  it('plays nothing on the first sighting, with no change, or outside home mode', () => {
    expect(tripFor(null, true)).toBeNull();
    expect(tripFor(null, false)).toBeNull();
    expect(tripFor(true, true)).toBeNull();
    expect(tripFor(false, false)).toBeNull();
    expect(tripFor(true, null)).toBeNull();
    expect(tripFor(null, null)).toBeNull();
  });
});

describe('vanFrame', () => {
  it('hides the world whole until the cut, then lifts to nothing by the end', () => {
    for (const trip of TRIPS) {
      for (const reduced of [false, true]) {
        const { cut, total } = vanTimeline(trip, reduced);
        expect(vanFrame(trip, 0, reduced).cover).toBe(1);
        expect(vanFrame(trip, cut - 1, reduced).cover).toBe(1);
        const lifting = vanFrame(trip, (cut + total) / 2, reduced).cover;
        expect(lifting).toBeGreaterThan(0);
        expect(lifting).toBeLessThan(1);
        expect(vanFrame(trip, total, reduced).cover).toBe(0);
      }
    }
  });

  it('runs about two and a half seconds', () => {
    for (const trip of TRIPS) expect(vanTimeline(trip, false).total).toBe(2500);
  });

  it('leaving crosses left to right, nose right, and is off screen by the cut', () => {
    const start = vanFrame('leaving', 0, false);
    const middle = vanFrame('leaving', 1000, false);
    const cut = vanFrame('leaving', vanTimeline('leaving', false).cut, false);
    expect(start.facing).toBe(1);
    expect(start.x).toBeLessThan(0);
    expect(middle.x).toBeGreaterThan(start.x);
    expect(cut.x).toBeGreaterThan(1);
    expect(middle.speed).toBeGreaterThan(start.speed);
  });

  it('coming home drives in from the right and brakes to a stop in the middle before the door', () => {
    const line = vanTimeline('returning', false);
    const start = vanFrame('returning', 0, false);
    const parked = vanFrame('returning', line.driveMs, false);
    expect(start.facing).toBe(-1);
    expect(start.x).toBeGreaterThan(1);
    expect(parked.x).toBeCloseTo(0.5);
    expect(parked.speed).toBe(0);
    expect(vanFrame('returning', 1000, false).speed).toBeLessThan(vanFrame('returning', 200, false).speed);
    expect(line.doorAt).toBeGreaterThan(line.driveMs);
    expect(line.doorAt).toBeLessThan(line.cut);
  });

  it('keeps the van still and centred with reduced motion', () => {
    for (const trip of TRIPS) {
      for (const ms of [0, 300, 900]) {
        const frame = vanFrame(trip, ms, true);
        expect(frame.x).toBe(0.5);
        expect(frame.speed).toBe(0);
        expect(frame.travelled).toBe(0);
        expect(frame.bob).toBe(0);
      }
      expect(vanPuffs(trip, 300, true)).toEqual([]);
    }
  });

  it('only travels forward, so the road never scrolls back', () => {
    for (const trip of TRIPS) {
      let last = -1;
      for (let ms = 0; ms <= 2500; ms += 50) {
        const { travelled } = vanFrame(trip, ms, false);
        expect(travelled).toBeGreaterThanOrEqual(last);
        last = travelled;
      }
    }
  });
});

describe('vanPuffs', () => {
  it('lets out puffs while moving that age out, and none once parked', () => {
    const early = vanPuffs('leaving', 500, false);
    expect(early.length).toBeGreaterThan(0);
    for (const puff of early) {
      expect(puff.age).toBeGreaterThanOrEqual(0);
      expect(puff.age).toBeLessThan(1);
    }
    expect(vanPuffs('returning', 2400, false)).toEqual([]);
  });
});

describe('vanPixel', () => {
  it('sizes the van in whole pixels to about half a desktop window', () => {
    const px = vanPixel(1024, 768, 64, 27);
    expect(Number.isInteger(px)).toBe(true);
    expect(64 * px).toBeLessThanOrEqual(1024 * 0.5);
    expect(64 * px).toBeGreaterThan(1024 * 0.35);
  });

  it('keeps the van readable on a phone and never under two pixels', () => {
    const px = vanPixel(375, 812, 64, 27);
    expect(64 * px).toBeLessThanOrEqual(375 * 0.6);
    expect(px).toBeGreaterThanOrEqual(3);
    expect(vanPixel(100, 100, 64, 27)).toBe(2);
  });
});

describe('runs', () => {
  it('a second sighting of the same drive keeps the one on screen', () => {
    const run = nextRun(null, 'leaving', 1000, false);
    expect(run).not.toBeNull();
    expect(nextRun(run, 'leaving', 1500, false)).toBe(run);
    expect(nextRun(run, null, 1500, false)).toBe(run);
  });

  it('a turn the other way starts again from a whole cover', () => {
    const out = nextRun(null, 'leaving', 1000, false);
    const back = nextRun(out, 'returning', 1800, false);
    expect(back?.trip).toBe('returning');
    expect(back?.startedMs).toBe(1800);
  });

  it('the same drive after the last one ended plays again', () => {
    const first = nextRun(null, 'leaving', 0, false);
    const again = nextRun(first, 'leaving', 5000, false);
    expect(again).not.toBe(first);
    expect(again?.startedMs).toBe(5000);
  });

  it('a skip jumps to the cut and silences the door', () => {
    const run = nextRun(null, 'returning', 1000, false)!;
    const skipped = skipRun(run, 1200, false);
    const { cut, total } = vanTimeline('returning', false);
    expect(1200 - skipped.startedMs).toBe(cut);
    expect(vanFrame('returning', 1200 - skipped.startedMs, false).cover).toBe(1);
    expect(runOver(skipped, 1200 + (total - cut), false)).toBe(true);
    expect(vanCues(skipped, 0, total, false)).not.toContain('door');
    expect(skipRun(skipped, 1200, false).startedMs).toBe(skipped.startedMs);
  });

  it('cues the engine at the start and the door once on the way home', () => {
    const out = nextRun(null, 'leaving', 0, false)!;
    expect(vanCues(out, -1, 16, false)).toEqual(['depart']);
    expect(vanCues(out, 16, 2500, false)).toEqual([]);
    const home = nextRun(null, 'returning', 0, false)!;
    expect(vanCues(home, -1, 16, false)).toEqual(['arrive']);
    expect(vanCues(home, 1600, 1750, false)).toEqual(['door']);
    expect(vanCues(home, 1750, 2500, false)).toEqual([]);
  });
});
