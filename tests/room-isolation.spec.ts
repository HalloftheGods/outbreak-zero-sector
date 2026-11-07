// Two sims in one process (#7274): the module-level WeakMap caches in world-query, exit-van, loot and
// containers must not leak between rooms. A worker hosting several rooms, or a host browser running a
// sim beside solo code, shares those modules, so sim B beside a busy sim A must match sim B alone.
import { describe, expect, it } from 'vitest';
import { GameSimulation } from '../shared/simulation.ts';
import { input, SEED } from './helpers/sim-harness.ts';

type Options = ConstructorParameters<typeof GameSimulation>[0];

const TICKS = 600;
const ARCADE: Options = { seed: SEED };
const CAMPAIGN: Options = { seed: SEED, overrun: true, home: true };

/** Scripted walkers: heading and trigger rhythm differ per player and per salt. */
function drive(sim: GameSimulation, ids: readonly string[], tick: number, salt: number): void {
  ids.forEach((id, i) => {
    const phase = Math.floor(tick / 30) + salt + i;
    sim.setInput(id, input({
      seq: tick + 1,
      up: phase % 4 === 0,
      down: phase % 4 === 2,
      left: phase % 3 === 0,
      right: phase % 3 === 1,
      angle: (phase * 0.7) % 6.28,
      shoot: tick % 7 < 3,
      reload: tick % 90 === 0,
      search: tick % 40 === 0,
    }));
  });
}

function build(options: Options, ids: readonly string[]): GameSimulation {
  const sim = new GameSimulation(options);
  for (const id of ids) sim.addPlayer(id, id);
  return sim;
}

/** Steps a sim, recording the JSON of every snapshot; `beside` runs each tick before the step. */
function record(sim: GameSimulation, ids: readonly string[], salt: number, beside?: () => void): string[] {
  const frames: string[] = [];
  for (let tick = 0; tick < TICKS; tick++) {
    drive(sim, ids, tick, salt);
    beside?.();
    sim.step();
    frames.push(JSON.stringify(sim.snapshot()));
  }
  return frames;
}

/** A second room that advances one tick every time it is called. */
function neighbour(options: Options, ids: readonly string[], salt: number): () => void {
  const sim = build(options, ids);
  let tick = 0;
  return () => {
    drive(sim, ids, tick, salt);
    sim.step();
    sim.snapshot();
    tick += 1;
  };
}

describe('two sims in one process', () => {
  it.each([
    ['Arcade', ARCADE],
    ['Campaign', CAMPAIGN],
  ])('%s: sim B beside a busy sim A with the same seed matches sim B run alone', (_name, options) => {
    const idsB = ['b1', 'b2'];
    const alone = record(build(options, idsB), idsB, 5);
    const together = record(build(options, idsB), idsB, 5, neighbour(options, ['a1', 'a2', 'a3'], 0));
    expect(together).toHaveLength(TICKS);
    expect(together).toEqual(alone);
  }, 120000);

  it('different inputs really do diverge two same-seed sims, so the comparison has teeth', () => {
    const ids = ['p1', 'p2'];
    const a = record(build(ARCADE, ids), ids, 0);
    const b = record(build(ARCADE, ids), ids, 9);
    expect(a).not.toEqual(b);
  }, 120000);

  it('the order does not matter: sim A beside sim B matches sim A alone', () => {
    const idsA = ['a1', 'a2'];
    const alone = record(build(ARCADE, idsA), idsA, 0);
    const together = record(build(ARCADE, idsA), idsA, 0, neighbour(ARCADE, ['b1'], 11));
    expect(together).toEqual(alone);
  }, 120000);
});
