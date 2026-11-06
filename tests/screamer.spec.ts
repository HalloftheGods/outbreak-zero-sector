import { describe, expect, it } from 'vitest';
import { SCREAM_COOLDOWN_SEC, SCREAM_RADIUS, SCREAMER_FROM_LEVEL, ZOMBIES } from '../shared/constants.ts';
import { screamerShare } from '../shared/town-population.ts';
import { waveRoster } from '../shared/waves.ts';
import { createRng } from '../shared/rng.ts';
import { LEVELS } from '../shared/levels.ts';
import { buildZombies } from '../src/art/zombies.ts';
import { addRoamer, eventsOf, quietSim, steps } from './helpers/sim-harness.ts';

/** A screamer in plain sight of the player, and a walker behind it in earshot but out of sight. */
function standoff(type: 'screamer' | 'walker') {
  const quiet = quietSim();
  const [p] = quiet.state.players;
  const caller = addRoamer(quiet.state, type, p.x + 60, p.y);
  caller.speed = 0;
  const listener = addRoamer(quiet.state, 'walker', p.x + 60, p.y);
  listener.speed = 0;
  return { ...quiet, p, caller, listener };
}

describe('the screamer', () => {
  it('is a weak body worth a little more than a walker', () => {
    expect(ZOMBIES.screamer.health).toBeLessThan(ZOMBIES.walker.health);
    expect(ZOMBIES.screamer.points).toBeGreaterThan(ZOMBIES.walker.points);
  });

  it('has art', () => {
    expect(buildZombies().screamer.walk).toBeDefined();
  });

  it('calls a zombie that has not seen the player once it spots them', () => {
    const { sim, state, caller, listener } = standoff('screamer');
    // Out of the player's sight, but well inside the scream.
    listener.x = caller.x + SCREAM_RADIUS / 2;
    listener.senseOffset = 3;
    caller.senseOffset = 0;
    state.tick = 5;
    steps(sim, 1);
    expect(caller.mode).toBe('hunt');
    expect(listener.mode).not.toBe('wander');
    expect(caller.screamLeft).toBeCloseTo(SCREAM_COOLDOWN_SEC, 1);
    expect(eventsOf(sim.snapshot(), 'zombie_alert').some((event) => event.zombieType === 'screamer')).toBe(true);
  });

  it('a walker spotting the player calls nobody', () => {
    const { sim, state, caller, listener } = standoff('walker');
    listener.x = caller.x + SCREAM_RADIUS / 2;
    listener.senseOffset = 3;
    caller.senseOffset = 0;
    state.tick = 5;
    steps(sim, 1);
    expect(caller.mode).toBe('hunt');
    expect(listener.mode).toBe('wander');
  });

  it('roams from level 3 on, more each level, and never comes with a horde', () => {
    expect(screamerShare(SCREAMER_FROM_LEVEL - 1)).toBe(0);
    expect(screamerShare(SCREAMER_FROM_LEVEL)).toBeGreaterThan(0);
    expect(screamerShare(10)).toBeGreaterThan(screamerShare(SCREAMER_FROM_LEVEL));
    for (const level of LEVELS) expect(waveRoster(5, createRng(level.number), level)).not.toContain('screamer');
  });
});
