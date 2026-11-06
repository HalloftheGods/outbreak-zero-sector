// #7123: the zombie rig's shared rules. Decals lie flat under a figure without an outline of
// their own, ribbons take a fixed cross-section, and steadyClip holds hand stamps and
// cross-sections steady across a clip without moving a joint.

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DrawnDir, Legend } from '../src/art/kit.ts';
import { RAMPS } from '../src/art/palette.ts';
import type { PixelSprite } from '../src/art/types.ts';
import { drawBody, steadyClip } from '../src/art/zombies/body.ts';
import type { BodyPlan, HandKind, Pose } from '../src/art/zombies/body.ts';
import { Figure, flatFrame, ribbonUpright, viewOf } from '../src/art/zombies/rig.ts';
import type { Joint, Placed, Stamp, Vec } from '../src/art/zombies/rig.ts';
import { WALKER_CLAW, WALKER_FACINGS, WALKER_LEGEND } from '../src/art/zombies/walker-art.ts';

const LEGEND: Legend = { a: RAMPS.ash[2], p: RAMPS.violet[1] };
const CELL = 24;

const opaque = (s: PixelSprite, x: number, y: number): boolean => s.rgba[(y * s.w + x) * 4 + 3] !== 0;
const colour = (s: PixelSprite, x: number, y: number): number | null => {
  const i = (y * s.w + x) * 4;
  return opaque(s, x, y) ? (s.rgba[i] << 16) | (s.rgba[i + 1] << 8) | s.rgba[i + 2] : null;
};
const block = (w: number, h: number, letter: string): string[] => Array.from({ length: h }, () => letter.repeat(w));

describe('flatFrame decals', () => {
  const body: Placed = [8, 6, block(4, 4, 'a')];

  it('draws exactly as before when no decals are passed', () => {
    const before = flatFrame(CELL, 12, 18, LEGEND, [body]);
    const none = flatFrame(CELL, 12, 18, LEGEND, [body], []);
    expect([...none.rgba]).toEqual([...before.rgba]);
    expect([none.ax, none.ay]).toEqual([before.ax, before.ay]);
  });

  it('paints a pool with no outline of its own, away from the figure', () => {
    const pool: Placed = [4, 18, block(8, 2, 'p')];
    const frame = flatFrame(CELL, 12, 18, LEGEND, [body], [pool]);
    for (let x = 4; x < 12; x++) for (let y = 18; y < 20; y++) expect(colour(frame, x, y)).toBe(RAMPS.violet[1]);
    // As a part, the same pool would grow an outline ring; as a decal, its edge meets bare ground.
    const asPart = flatFrame(CELL, 12, 18, LEGEND, [body, pool]);
    for (let x = 3; x <= 12; x++) {
      expect(opaque(frame, x, 17)).toBe(false);
      expect(opaque(frame, x, 20)).toBe(false);
    }
    expect([3, 12].some((x) => opaque(frame, x, 18) || opaque(frame, x, 19))).toBe(false);
    const ringAsPart = [3, 12].flatMap((x) => [opaque(asPart, x, 18), opaque(asPart, x, 19)]).concat([opaque(asPart, 6, 20)]);
    expect(ringAsPart).toContain(true);
  });

  it('keeps the figure and its outline over a pool it lies in, and keeps the anchor', () => {
    const plain = flatFrame(CELL, 12, 18, LEGEND, [body]);
    const pool: Placed = [5, 3, block(10, 10, 'p')];
    const frame = flatFrame(CELL, 12, 18, LEGEND, [body], [pool]);
    for (let y = 0; y < CELL; y++) {
      for (let x = 0; x < CELL; x++) {
        const figurePixel = opaque(plain, x, y);
        const inPool = x >= 5 && x < 15 && y >= 3 && y < 13;
        const ground = inPool ? RAMPS.violet[1] : null;
        expect(colour(frame, x, y)).toBe(figurePixel ? colour(plain, x, y) : ground);
      }
    }
    expect([frame.ax, frame.ay]).toEqual([plain.ax, plain.ay]);
  });

  it('draws a frame of decals alone, unoutlined', () => {
    const frame = flatFrame(CELL, 12, 18, LEGEND, [], [[2, 2, block(3, 3, 'p')]]);
    const painted = Array.from({ length: CELL * CELL }, (_, i) => opaque(frame, i % CELL, Math.floor(i / CELL)));
    expect(painted.filter(Boolean)).toHaveLength(9);
  });
});

describe('Figure decals', () => {
  it('bakes a decal under the outline, as flatFrame does', () => {
    const figure = new Figure(viewOf(2), CELL, 12, 18, LEGEND);
    figure.stamp({ rows: block(4, 4, 'a'), px: 0, py: 0 }, { x: 8, y: 6, z: 0 });
    const plain = figure.bake();
    figure.decal(4, 18, block(8, 2, 'p'));
    const withPool = figure.bake();
    const flat = flatFrame(CELL, 12, 18, LEGEND, [[8, 6, block(4, 4, 'a')]], [[4, 18, block(8, 2, 'p')]]);
    expect([...withPool.rgba]).toEqual([...flat.rgba]);
    expect([withPool.ax, withPool.ay]).toEqual([plain.ax, plain.ay]);
    expect([withPool.ax, withPool.ay]).toEqual([flat.ax, flat.ay]);
  });
});

describe('ribbon cross-sections', () => {
  const a: Joint = { x: 6, y: 6, z: 0 };
  const b: Joint = { x: 12, y: 12, z: 0 };
  const drawn = (upright?: boolean): number[] => {
    const figure = new Figure(viewOf(2), CELL, 12, 18, LEGEND);
    figure.limb(a, b, ['aaa'], 0, false, upright);
    return [...figure.canvas().data];
  };

  it('follows the slope when nothing fixes it, and the fixed way when something does', () => {
    expect(drawn()).toEqual(drawn(ribbonUpright(a, b)));
    expect(drawn(true)).not.toEqual(drawn(false));
  });
});

// The walker's bones, so the clips below exercise a real claw and real limbs.
const PLAN: BodyPlan = {
  cell: 36, ox: 18, oy: 31, legend: WALKER_LEGEND,
  hipWidth: 2.5, hipHeight: 9, shoulderWidth: 5, shoulderHeight: 5, neckHeight: 2,
  thigh: 5, shin: 5, upperArm: 5, foreArm: 5,
  legs: [{ upper: ['qQqp'], lower: ['Qqp', 'Qqp', 'cbp'] }, { upper: ['qQqp'], lower: ['Qqp', 'dcb', 'cba'] }],
  arms: [{ upper: ['ihg', 'ihg', 'dcb'], lower: ['dcb', 'dsb', 'dcb'] }, { upper: ['ihg', 'ihg', 'dcb'], lower: ['dcb', 'cb'] }],
  hands: [WALKER_CLAW, WALKER_CLAW],
  facings: WALKER_FACINGS,
};

const reach = (f: number, u: number): Vec => [f + -1, -1, u + 3];
const limp = (f: number, u: number): Vec => [f, 1, u];

/** A shamble facing the camera whose reaching claw crosses the diagonal for two frames. */
const SHAMBLE: readonly Pose[] = [
  { feet: [[4, -3, 0], [-5, 3, 0]], hands: [reach(8, -6), limp(-2, -8)], body: [0, -1, -1], lean: 2, head: [1, 0, 0] },
  { feet: [[2, -3, 0], [-3, 3, 0]], hands: [reach(8, -5), limp(-3, -8)], body: [0, -1, 0], lean: 2, head: [1, -1, 0] },
  { feet: [[0, -3, 0], [-1, 3, 0]], hands: [reach(8, -5), limp(-2, -8)], body: [0, 0, 0], lean: 2, head: [1, -1, 0] },
  { feet: [[-2, -3, 0], [2, 3, 1]], hands: [reach(8, -6), limp(0, -8)], body: [0, 1, 0], lean: 2, head: [0, 0, 0] },
  { feet: [[-4, -3, 1], [4, 3, 0]], hands: [reach(8, -7), limp(2, -7)], body: [0, 1, -1], lean: 3, head: [1, 1, -1] },
  { feet: [[-1, -3, 2], [2, 3, 0]], hands: [reach(8, -7), limp(0, -8)], body: [0, 0, -1], lean: 3, head: [1, 1, 0] },
];

/** Claws up over the head, then raking down. */
const SWIPE: readonly Pose[] = [
  { feet: [[1, -3, 0], [-2, 3, 0]], hands: [[4, -2, 3], [3, 2, 2]], body: [-1, 0, 0], lean: 0, head: [0, 0, 0] },
  { feet: [[2, -3, 0], [-3, 3, 0]], hands: [[4, -4, 7], [3, 4, 6]], body: [-2, 0, 1], lean: -1, head: [-1, 0, 0] },
  { feet: [[5, -3, 0], [-4, 3, 0]], hands: [[10, 2, -1], [9, -2, 0]], body: [2, 0, -1], lean: 3, head: [1, 0, -1] },
  { feet: [[5, -3, 0], [-3, 3, 0]], hands: [[7, 4, -8], [7, -4, -8]], body: [2, 0, -1], lean: 4, head: [1, 0, 0] },
];

const kindOf = (art: Stamp, flip: boolean): HandKind | null => {
  const kinds = new Map<readonly string[], HandKind>([
    [WALKER_CLAW.down.rows, 'down'],
    [WALKER_CLAW.up.rows, 'up'],
    [WALKER_CLAW.side.rows, flip ? 'left' : 'right'],
  ]);
  return kinds.get(art.rows) ?? null;
};

/** The hand stamps each frame draws, body-left first. */
function handsDrawn(dir: DrawnDir, poses: readonly Pose[]): HandKind[][] {
  const frames: HandKind[][] = [];
  const stamp = Figure.prototype.stamp;
  const spy = vi.spyOn(Figure.prototype, 'stamp').mockImplementation(function (this: Figure, ...args) {
    const [art, , , , flip = false] = args;
    const kind = kindOf(art, flip);
    if (kind) frames[frames.length - 1].push(kind);
    stamp.apply(this, args);
  });
  for (const pose of poses) {
    frames.push([]);
    drawBody(PLAN, dir, pose);
  }
  spy.mockRestore();
  return frames;
}

const side = (frames: HandKind[][], index: 0 | 1): HandKind[] => frames.map((hands) => hands[index]);
const switches = (picks: readonly HandKind[]): number => picks.filter((pick, i) => pick !== picks[(i + 1) % picks.length]).length;

describe('steadyClip', () => {
  afterEach(() => vi.restoreAllMocks());

  it('holds a claw that crosses the diagonal to one stamp for the whole shamble', () => {
    const per = handsDrawn(2, SHAMBLE);
    // The fixture is only a test if the claw does flip frame by frame without steadying.
    expect(switches(side(per, 0))).toBeGreaterThan(0);
    const steady = handsDrawn(2, steadyClip(PLAN, 2, SHAMBLE));
    expect(new Set(side(steady, 0)).size).toBe(1);
    expect(switches(side(steady, 1))).toBeLessThanOrEqual(switches(side(per, 1)));
  });

  it('never draws a raking claw as the raised one', () => {
    const per = handsDrawn(2, SWIPE);
    const steady = handsDrawn(2, steadyClip(PLAN, 2, SWIPE, false));
    for (const index of [0, 1] as const) {
      expect(side(steady, index)[0]).toBe(side(per, index)[0]);
      expect(side(steady, index)[3]).toBe(side(per, index)[3]);
      expect(side(steady, index)[0]).toBe('up');
      expect(side(steady, index)[3]).not.toBe('up');
    }
  });

  it('keeps a stamp a pose fixes', () => {
    const fixed: Pose[] = SHAMBLE.map((pose, i) => (i === 2 ? { ...pose, handKind: ['left', undefined] } : pose));
    const steady = handsDrawn(2, steadyClip(PLAN, 2, fixed));
    expect(steady[2][0]).toBe('left');
  });

  it('moves no joint: the poses keep every field, and every frame keeps its anchor', () => {
    for (const dir of [0, 1, 2, 6, 7] as const) {
      const steady = steadyClip(PLAN, dir, SHAMBLE);
      steady.forEach((pose, i) => {
        const { handKind, upright, ...rest } = pose;
        expect(rest).toEqual(SHAMBLE[i]);
        expect(handKind).toHaveLength(2);
        expect(upright?.legs).toHaveLength(2);
        const [a, b] = [drawBody(PLAN, dir, pose), drawBody(PLAN, dir, SHAMBLE[i])];
        expect([a.w, a.h, a.ax, a.ay]).toEqual([b.w, b.h, b.ax, b.ay]);
      });
    }
  });

  it('leaves a clip that never switches drawing exactly as it was', () => {
    const still: Pose = { feet: [[0, -3, 0], [0, 3, 0]], hands: [[7, -1, -2], [0, 1, -8]], body: [0, 0, 0], lean: 1, head: [0, 0, 0] };
    const clip = [still, still, still];
    const steady = steadyClip(PLAN, 2, clip);
    steady.forEach((pose) => expect([...drawBody(PLAN, 2, pose).rgba]).toEqual([...drawBody(PLAN, 2, still).rgba]));
  });

  it('takes an empty clip', () => {
    expect(steadyClip(PLAN, 2, [])).toEqual([]);
  });
});
