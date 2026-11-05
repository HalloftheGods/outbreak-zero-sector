import { describe, expect, it } from 'vitest';
import { PLAYER_RADIUS, PLAYER_SPEED, TICK_DT } from '../shared/constants.ts';
import { stepMovement } from '../shared/movement.ts';
import { buildingBox, circleHitsSolid, generateWorldMap } from '../shared/world-map.ts';
import { input, quietSim, steps } from './helpers/sim-harness.ts';

const map = generateWorldMap(7);
const { x: spawnX, y: spawnY } = map.spawn;

function travel(dirX: number, dirY: number, fromX: number, fromY: number, dt: number, seconds: number) {
  let position = { x: fromX, y: fromY };
  for (let i = 0; i < Math.round(seconds / dt); i++) {
    position = stepMovement(map, position.x, position.y, dirX, dirY, PLAYER_SPEED, dt, PLAYER_RADIUS);
  }
  return position;
}

describe('stepMovement', () => {
  it('covers the same ground at any frame rate', () => {
    const at30 = travel(1, 0, spawnX, spawnY, 1 / 30, 1);
    const at60 = travel(1, 0, spawnX, spawnY, 1 / 60, 1);
    const at144 = travel(1, 0, spawnX, spawnY, 1 / 144, 1);
    expect(at30.x - spawnX).toBeCloseTo(PLAYER_SPEED, 5);
    expect(at60.x).toBeCloseTo(at30.x, 5);
    expect(at144.x).toBeCloseTo(at30.x, 5);
  });

  it('normalises diagonals', () => {
    const moved = stepMovement(map, spawnX, spawnY, 1, 1, PLAYER_SPEED, 0.5, PLAYER_RADIUS);
    expect(Math.hypot(moved.x - spawnX, moved.y - spawnY)).toBeCloseTo(PLAYER_SPEED * 0.5, 5);
  });

  it('does nothing without a direction', () => {
    expect(stepMovement(map, 100, 100, 0, 0, PLAYER_SPEED, TICK_DT, PLAYER_RADIUS)).toEqual({ x: 100, y: 100 });
  });

  it('slides along a wall instead of sticking to it', () => {
    const building = map.buildings.find((each) => each.kind === 'warehouse');
    if (!building) throw new Error('no warehouse');
    const box = buildingBox(building);
    const startX = box.x0 + 30;
    const startY = box.y1 + PLAYER_RADIUS + 0.5;
    const moved = travel(1, -1, startX, startY, TICK_DT, 0.5);
    expect(moved.y).toBeGreaterThanOrEqual(box.y1 + PLAYER_RADIUS - 0.01);
    expect(moved.x).toBeGreaterThan(startX + 20);
    expect(circleHitsSolid(map, moved.x, moved.y, PLAYER_RADIUS)).toBe(false);
  });

  it('stops at a wall within a pixel whatever the frame rate', () => {
    const building = map.buildings.find((each) => each.kind === 'warehouse');
    if (!building) throw new Error('no warehouse');
    const box = buildingBox(building);
    const startY = box.y1 + 30;
    for (const dt of [1 / 20, 1 / 30, 1 / 60, 1 / 144]) {
      const moved = travel(0, -1, box.x0 + 40, startY, dt, 1);
      expect(moved.y - (box.y1 + PLAYER_RADIUS)).toBeLessThan(1.01);
      expect(moved.y).toBeGreaterThanOrEqual(box.y1 + PLAYER_RADIUS);
    }
  });

  it('never tunnels through a wall on a huge time step', () => {
    const building = map.buildings.find((each) => each.kind === 'house');
    if (!building) throw new Error('no house');
    const box = buildingBox(building);
    const moved = stepMovement(map, box.x1 - 20, box.y1 + 20, 0, -1, PLAYER_SPEED, 5, PLAYER_RADIUS);
    expect(moved.y).toBeGreaterThanOrEqual(box.y1 + PLAYER_RADIUS);
  });

  it('clamps to the world', () => {
    const moved = stepMovement(map, 20, 20, -1, -1, 500, 1, PLAYER_RADIUS);
    expect(moved.x).toBeGreaterThanOrEqual(PLAYER_RADIUS);
    expect(moved.y).toBeGreaterThanOrEqual(PLAYER_RADIUS);
  });
});

describe('player input', () => {
  it('moves at a fixed speed however many packets arrive per tick', () => {
    const quiet = quietSim(['once', 'many']);
    const { sim, state } = quiet;
    const [once, many] = state.players;
    many.x = once.x;
    many.y = once.y + 40;
    const startX = once.x;
    let seq = 0;

    for (let tick = 0; tick < 30; tick++) {
      sim.setInput('once', input({ seq: tick, right: true }));
      for (let i = 0; i < 5; i++) sim.setInput('many', input({ seq: ++seq, right: true }));
      sim.step();
    }
    expect(once.x - startX).toBeCloseTo(PLAYER_SPEED, 5);
    expect(many.x).toBeCloseTo(once.x, 5);
  });

  it('keeps applying the last input when packets stop', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    const startX = p.x;
    sim.setInput('a', input({ seq: 1, right: true }));
    steps(sim, 15);
    expect(p.x - startX).toBeCloseTo(PLAYER_SPEED / 2, 5);
    expect(p.moving).toBe(true);
  });

  it('reports the applied seq and ignores stale packets', () => {
    const { sim, state } = quietSim();
    const [p] = state.players;
    sim.setInput('a', input({ seq: 10, right: true }));
    sim.setInput('a', input({ seq: 4, left: true }));
    sim.step();
    expect(p.right).toBe(true);
    expect(sim.snapshot().players[0].lastInputSeq).toBe(10);
  });

  it('ignores a NaN or infinite angle and keeps the last good one', () => {
    const { sim, state } = quietSim();
    sim.setInput('a', input({ seq: 1, angle: 1.25 }));
    sim.setInput('a', input({ seq: 2, angle: Number.NaN }));
    sim.setInput('a', input({ seq: 3, angle: Number.POSITIVE_INFINITY }));
    sim.step();
    expect(state.players[0].angle).toBe(1.25);
  });

  it('drops input for unknown players', () => {
    const { sim } = quietSim();
    expect(() => sim.setInput('nobody', input())).not.toThrow();
  });
});
