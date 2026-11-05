import { describe, expect, it } from 'vitest';
import type { PlayerEntity, SnapshotPacket, ZombieEntity } from '../shared/protocol.ts';
import {
  extrapolateBullets,
  interpolatePlayers,
  interpolateZombies,
  lerpAngle,
  SnapshotBuffer,
} from '../src/game/snapshot-buffer.ts';

const TICK_MS = 1000 / 30;

function zombie(id: string, x: number, y: number, angle = 0): ZombieEntity {
  return { id, type: 'walker', x, y, angle, health: 60, maxHealth: 60, attacking: false };
}

function snapshot(tick: number, zombies: ZombieEntity[] = [], players: PlayerEntity[] = []): SnapshotPacket {
  return {
    type: 'snapshot',
    tick,
    phase: 'wave',
    level: 1,
    mapSeed: 1,
    wave: 1,
    intermission: 0,
    hostiles: zombies.length,
    players,
    zombies,
    bullets: [],
    pickups: [],
    exit: null,
    openedContainers: [],
    events: [],
    gameOver: null,
  };
}

describe('SnapshotBuffer', () => {
  it('returns nothing until a snapshot arrives', () => {
    expect(new SnapshotBuffer(TICK_MS).sample(100, 100)).toBeNull();
  });

  it('samples between the two snapshots around the render time', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    for (let tick = 0; tick < 10; tick += 1) buffer.push(snapshot(tick), 1000 + tick * TICK_MS);
    const now = 1000 + 9 * TICK_MS;
    const sample = buffer.sample(now, 2.5 * TICK_MS)!;
    expect(sample.from.snapshot.tick).toBe(6);
    expect(sample.to.snapshot.tick).toBe(7);
    expect(sample.alpha).toBeCloseTo(0.5);
  });

  it('holds at the newest snapshot rather than extrapolating', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(snapshot(1), 1000);
    buffer.push(snapshot(2), 1000 + TICK_MS);
    const sample = buffer.sample(5000, 0)!;
    expect(sample.to.snapshot.tick).toBe(2);
    expect(sample.alpha).toBe(1);
  });

  it('holds at the oldest snapshot before the timeline starts', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(snapshot(5), 1000);
    const sample = buffer.sample(1000, 100)!;
    expect(sample.from.snapshot.tick).toBe(5);
    expect(sample.alpha).toBe(0);
  });

  it('smooths arrival jitter out of the clock', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    for (let tick = 0; tick < 30; tick += 1) {
      const jitter = tick % 2 === 0 ? 12 : -12;
      buffer.push(snapshot(tick), 1000 + tick * TICK_MS + jitter);
    }
    const now = 1000 + 29 * TICK_MS;
    const sample = buffer.sample(now, 100)!;
    const renderedTick = sample.from.snapshot.tick + sample.alpha;
    expect(renderedTick).toBeGreaterThan(29 - 100 / TICK_MS - 0.5);
    expect(renderedTick).toBeLessThan(29 - 100 / TICK_MS + 0.5);
  });

  it('re-anchors after a long gap such as a pause', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(snapshot(1), 1000);
    buffer.push(snapshot(2), 1000 + TICK_MS);
    const resumed = 60_000;
    buffer.push(snapshot(3), resumed);
    expect(buffer.sample(resumed, 0)!.to.snapshot.tick).toBe(3);
  });

  it('ignores stale and repeated ticks', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(snapshot(40), 1000);
    buffer.push(snapshot(40), 1010);
    buffer.push(snapshot(39), 1020);
    expect(buffer.size).toBe(1);
  });

  it('takes a repeated tick whose phase moved, as when a run ends between ticks', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(snapshot(39), 1000 - TICK_MS);
    buffer.push(snapshot(40), 1000);
    buffer.push({ ...snapshot(40), phase: 'gameover' }, 1010);
    expect(buffer.size).toBe(2);
    expect(buffer.latest?.snapshot.phase).toBe('gameover');
  });

  it('keeps the timeline sound after replacing a frame in place', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(snapshot(39), 1000 - TICK_MS);
    buffer.push(snapshot(40), 1000);
    buffer.push({ ...snapshot(40), phase: 'gameover' }, 1010);
    const sample = buffer.sample(1000, TICK_MS / 2)!;
    expect(sample.alpha).toBeCloseTo(0.5);
    expect(sample.to.snapshot.phase).toBe('gameover');
  });

  it('starts over when the tick counter falls far behind', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(snapshot(500), 1000);
    buffer.push(snapshot(1), 1100);
    expect(buffer.size).toBe(1);
    expect(buffer.latest?.snapshot.tick).toBe(1);
  });

  it('caps how much history it keeps', () => {
    const buffer = new SnapshotBuffer(TICK_MS);
    for (let tick = 0; tick < 100; tick += 1) buffer.push(snapshot(tick), tick * TICK_MS);
    expect(buffer.size).toBeLessThanOrEqual(32);
  });
});

describe('interpolation', () => {
  it('turns the short way across the wrap', () => {
    const start = Math.PI - 0.1;
    const end = -Math.PI + 0.1;
    const middle = lerpAngle(start, end, 0.5);
    expect(Math.abs(Math.sin(middle))).toBeLessThan(0.001);
    expect(Math.cos(middle)).toBeLessThan(0);
  });

  it('stops exactly at either end', () => {
    expect(lerpAngle(0.3, 1.1, 0)).toBeCloseTo(0.3);
    expect(lerpAngle(0.3, 1.1, 1)).toBeCloseTo(1.1);
  });

  function sampleOf(from: SnapshotPacket, to: SnapshotPacket, alpha: number) {
    const buffer = new SnapshotBuffer(TICK_MS);
    buffer.push(from, 1000);
    buffer.push(to, 1000 + TICK_MS);
    const sample = buffer.sample(1000 + TICK_MS, (1 - alpha) * TICK_MS)!;
    return sample;
  }

  it('moves zombies between their two positions', () => {
    const sample = sampleOf(snapshot(1, [zombie('a', 10, 10)]), snapshot(2, [zombie('a', 20, 30)]), 0.5);
    const [shown] = interpolateZombies(sample);
    expect(shown.x).toBeCloseTo(15);
    expect(shown.y).toBeCloseTo(20);
  });

  it('shows a new zombie where it stands and drops a removed one', () => {
    const sample = sampleOf(snapshot(1, [zombie('gone', 1, 1)]), snapshot(2, [zombie('new', 50, 50)]), 0.5);
    const shown = interpolateZombies(sample);
    expect(shown.map((z) => z.id)).toEqual(['new']);
    expect(shown[0].x).toBe(50);
  });

  it('does not slide an entity across a teleport', () => {
    const sample = sampleOf(snapshot(1, [zombie('a', 0, 0)]), snapshot(2, [zombie('a', 500, 0)]), 0.5);
    expect(interpolateZombies(sample)[0].x).toBe(500);
  });

  it('keeps the newest non-positional fields on players', () => {
    const player = { id: 'p', x: 0, y: 0, angle: 0, health: 100 } as PlayerEntity;
    const hurt = { ...player, x: 10, health: 40 };
    const sample = sampleOf(snapshot(1, [], [player]), snapshot(2, [], [hurt]), 0.5);
    const [shown] = interpolatePlayers(sample);
    expect(shown.x).toBeCloseTo(5);
    expect(shown.health).toBe(40);
  });

  it('runs bullets forward along their velocity', () => {
    const bullets = [{ id: 'b', shooterId: 'p', x: 10, y: 20, vx: 100, vy: -50 }];
    expect(extrapolateBullets(bullets, 0.1)[0]).toMatchObject({ x: 20, y: 15 });
  });
});
