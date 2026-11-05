import { describe, expect, it } from 'vitest';
import { LocalPredictor } from '../src/game/prediction.ts';
import type { MoveStep } from '../src/game/prediction.ts';

const TICK_DT = 1 / 30;
const SPEED = 84;

const freeStep: MoveStep = (x, y, dirX, dirY, dt) => ({ x: x + dirX * SPEED * dt, y: y + dirY * SPEED * dt });

const nothingSolid = (): boolean => false;

function predictor(): LocalPredictor {
  const p = new LocalPredictor(freeStep, TICK_DT, nothingSolid);
  p.reset(100, 100);
  return p;
}

/** A wall filling everything from x = WALL_X, which movement stops at the way stepMovement does. */
const WALL_X = 120;
const insideWall = (x: number): boolean => x > WALL_X;
const wallStep: MoveStep = (x, y, dirX, dirY, dt) => {
  const nextX = x + dirX * SPEED * dt;
  return { x: insideWall(nextX) ? x : nextX, y: y + dirY * SPEED * dt };
};

function walledPredictor(x: number): LocalPredictor {
  const p = new LocalPredictor(wallStep, TICK_DT, insideWall);
  p.reset(x, 100);
  return p;
}

describe('LocalPredictor', () => {
  it('moves at once on input, without waiting for the sim', () => {
    const p = predictor();
    p.advance(1, 0, 1 / 60);
    expect(p.x).toBeCloseTo(100 + SPEED / 60);
  });

  it('agrees with a sim that is simply behind by the unacked inputs', () => {
    const p = predictor();
    let seq = 0;
    let serverX = 100;
    const inFlight: number[] = [];
    for (let tick = 0; tick < 60; tick += 1) {
      p.advance(1, 0, TICK_DT);
      seq += 1;
      p.record(seq, 1, 0);
      inFlight.push(seq);
      if (inFlight.length > 3) {
        const acked = inFlight.shift()!;
        serverX += SPEED * TICK_DT;
        p.reconcile(serverX, 100, acked);
      }
    }
    expect(p.x).toBeCloseTo(100 + 60 * SPEED * TICK_DT, 1);
  });

  it('eases a small error away rather than popping', () => {
    const p = predictor();
    p.reconcile(110, 100, 0);
    expect(p.x).toBe(100);
    p.advance(0, 0, 1 / 60);
    expect(p.x).toBeGreaterThan(100);
    expect(p.x).toBeLessThan(105);
    for (let i = 0; i < 120; i += 1) p.advance(0, 0, 1 / 60);
    expect(p.x).toBeCloseTo(110, 1);
  });

  it('snaps straight to the server past the limit', () => {
    const p = predictor();
    p.reconcile(200, 100, 0);
    expect(p.x).toBe(200);
  });

  it('ignores rounding-sized differences', () => {
    const p = predictor();
    p.reconcile(100.4, 100, 0);
    p.advance(0, 0, 1 / 60);
    expect(p.x).toBe(100);
  });

  it('forgets acked inputs', () => {
    const p = predictor();
    p.record(1, 1, 0);
    p.record(2, 1, 0);
    p.reconcile(100, 100, 2);
    expect(p.x).toBe(100);
  });

  it('never lets a correction carry the body into a wall', () => {
    const p = walledPredictor(119.5);
    p.reconcile(WALL_X, 100, 0);
    for (let frame = 0; frame < 30; frame += 1) {
      p.advance(1, 0, 1 / 60);
      expect(p.x).toBeLessThanOrEqual(WALL_X);
    }
  });

  it('keeps the free axis of a correction when the other is blocked', () => {
    const p = walledPredictor(WALL_X);
    p.reconcile(WALL_X + 5, 110, 0);
    p.advance(0, 0, 1 / 60);
    expect(p.x).toBe(WALL_X);
    expect(p.y).toBeGreaterThan(100);
  });

  it('snaps out of a solid, however small the error', () => {
    const p = walledPredictor(WALL_X + 0.3);
    p.reconcile(WALL_X, 100, 0);
    expect(p.x).toBe(WALL_X);
  });

  it('snaps across a wall the correction cannot pass', () => {
    const solidBetween = (x: number): boolean => x > 104 && x < 106;
    const stopAtWall: MoveStep = (x, y) => ({ x, y });
    const p = new LocalPredictor(stopAtWall, TICK_DT, solidBetween);
    p.reset(103, 100);
    p.reconcile(110, 100, 0);
    for (let frame = 0; frame < 60; frame += 1) p.advance(0, 0, 1 / 60);
    expect(p.x).toBeLessThan(106);
    p.reconcile(110, 100, 0);
    expect(p.x).toBe(110);
  });

  it('does not snap over a refusal that left no real error', () => {
    const p = walledPredictor(WALL_X);
    p.reconcile(WALL_X + 2, 100, 0);
    p.advance(0, 0, 1 / 60);
    p.reconcile(WALL_X - 0.4, 100, 0);
    expect(p.x).toBe(WALL_X);
  });

  it('sets position outright on reset', () => {
    const p = predictor();
    p.reconcile(120, 100, 0);
    p.reset(5, 6);
    p.advance(0, 0, 1 / 60);
    expect([p.x, p.y]).toEqual([5, 6]);
  });
});
