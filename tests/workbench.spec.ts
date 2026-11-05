import { describe, expect, it } from 'vitest';
import { parseClientPacket } from '../server/packets.ts';
import { TICK_RATE, WEAPONS } from '../shared/constants.ts';
import { UPGRADES } from '../shared/gun-upgrade-data.ts';
import { FINAL_LEVEL, levelSeed } from '../shared/levels.ts';
import type { SimState } from '../shared/sim-state.ts';
import { GameSimulation } from '../shared/simulation.ts';
import type { WorkbenchMode } from '../shared/workbench.ts';
import { BENCH_TIMER_SEC, isBenchAction } from '../shared/workbench.ts';
import { isSnapshotPacket } from '../src/network/packet-guards.ts';
import { addZombie, boardVan, input, openLevelExit, SEED, stateOf, steps } from './helpers/sim-harness.ts';

function benchSim(workbench: WorkbenchMode, players: readonly string[] = ['a']): { sim: GameSimulation; state: SimState } {
  const sim = new GameSimulation({ seed: SEED, workbench });
  for (const id of players) sim.addPlayer(id, id);
  const state = stateOf(sim);
  state.intermissionLeft = 1e6;
  state.zombies = [];
  state.pickups = [];
  state.populationTarget = 0;
  sim.snapshot();
  return { sim, state };
}

function atBench(workbench: WorkbenchMode, players?: readonly string[]): { sim: GameSimulation; state: SimState } {
  const quiet = benchSim(workbench, players);
  openLevelExit(quiet.state);
  boardVan(quiet.sim, quiet.state);
  return quiet;
}

describe('the bench after the van', () => {
  it('is skipped altogether when the run has none', () => {
    const { state } = atBench('off');
    expect(state.level).toBe(2);
    expect(state.bench).toBeNull();
  });

  it('holds the run in the old town until the player is ready', () => {
    const { sim, state } = atBench('hold');
    expect(state.level).toBe(1);
    expect(sim.snapshot().bench).toEqual({ level: 1, secondsLeft: null, riders: ['a'], ready: [] });
    steps(sim, TICK_RATE * 120);
    expect(state.level).toBe(1);

    sim.benchCommand('a', { kind: 'ready', ready: true });
    steps(sim, 1);
    expect(state.level).toBe(2);
    expect(state.bench).toBeNull();
    expect(sim.snapshot().bench).toBeUndefined();
  });

  it('stops the world: nobody walks, shoots or gets hurt, and zombies stay put', () => {
    const { sim, state } = atBench('hold');
    const [p] = state.players;
    const zombie = addZombie(state, 'walker', p.x + 8, p.y);
    const before = { x: p.x, y: p.y, health: p.health, ammo: p.ammo, zombieX: zombie.x };
    sim.setInput('a', input({ seq: 77, right: true, shoot: true }));
    steps(sim, TICK_RATE * 3);
    expect({ x: p.x, y: p.y, health: p.health, ammo: p.ammo, zombieX: zombie.x }).toEqual(before);
    expect(p.lastInputSeq).toBe(77);
  });

  it('runs out the clock in co-op even if someone never answers', () => {
    const { sim, state } = atBench('timed', ['a', 'b']);
    sim.benchCommand('a', { kind: 'ready', ready: true });
    expect(sim.snapshot().bench?.secondsLeft).toBe(BENCH_TIMER_SEC);
    steps(sim, BENCH_TIMER_SEC * TICK_RATE - 2);
    expect(state.level).toBe(1);
    steps(sim, 3);
    expect(state.level).toBe(2);
  });

  it('goes as soon as everyone is ready, timer or not', () => {
    const { sim, state } = atBench('timed', ['a', 'b']);
    sim.benchCommand('a', { kind: 'ready', ready: true });
    steps(sim, 2);
    expect(state.level).toBe(1);
    sim.benchCommand('a', { kind: 'ready', ready: false });
    sim.benchCommand('b', { kind: 'ready', ready: true });
    steps(sim, 2);
    expect(state.level).toBe(1);
    sim.benchCommand('a', { kind: 'ready', ready: true });
    steps(sim, 1);
    expect(state.level).toBe(2);
  });

  it('waits only for people on their feet, and the left behind cannot use it', () => {
    const quiet = benchSim('timed', ['a', 'b']);
    const { sim, state } = quiet;
    const [a, b] = state.players;
    b.status = 'downed';
    b.bleedout = 1e6;
    b.parts.barrel = 1;
    openLevelExit(state);
    boardVan(sim, state);
    expect(sim.snapshot().bench?.riders).toEqual(['a']);
    sim.benchCommand('b', { kind: 'fit', weapon: 'pistol', upgrade: 'damage' });
    expect(b.parts.barrel).toBe(1);
    sim.benchCommand('a', { kind: 'ready', ready: true });
    steps(sim, 1);
    expect(state.level).toBe(2);
    expect(a.status).toBe('alive');
    expect(b.status).toBe('alive');
  });

  it('does not wait on someone who left, and takes them along', () => {
    const { sim, state } = atBench('timed', ['a', 'b']);
    sim.benchCommand('b', { kind: 'ready', ready: true });
    sim.removePlayer('a');
    steps(sim, 1);
    expect(state.level).toBe(2);
  });

  it('asks everyone again at the next bench', () => {
    const { sim, state } = atBench('hold');
    sim.benchCommand('a', { kind: 'ready', ready: true });
    steps(sim, 1);
    openLevelExit(state);
    boardVan(sim, state);
    expect(state.level).toBe(2);
    expect(sim.snapshot().bench?.ready).toEqual([]);
  });

  it('never comes after the last town: that van ends the run', () => {
    const { sim, state } = benchSim('hold');
    state.level = FINAL_LEVEL;
    openLevelExit(state);
    boardVan(sim, state);
    expect(state.bench).toBeNull();
    expect(sim.snapshot().gameOver?.outcome).toBe('victory');
  });

  it('is gone after a restart', () => {
    const { sim, state } = atBench('hold');
    sim.restart();
    expect(state.bench).toBeNull();
    expect(sim.snapshot().bench).toBeUndefined();
  });
});

describe('work at the bench', () => {
  it('only happens at the bench', () => {
    const { sim, state } = benchSim('hold');
    const [p] = state.players;
    p.parts.barrel = 1;
    sim.benchCommand('a', { kind: 'fit', weapon: 'pistol', upgrade: 'damage' });
    expect(p.parts.barrel).toBe(1);
    expect(p.guns.pistol?.fit).toBeUndefined();
  });

  it('carries into the next town, on the snapshot and in the magazine size', () => {
    const { sim, state } = atBench('hold');
    const [p] = state.players;
    p.parts.magazine = 1;
    sim.benchCommand('a', { kind: 'fit', weapon: 'pistol', upgrade: 'magazine' });
    sim.benchCommand('a', { kind: 'ready', ready: true });
    steps(sim, 1);
    expect(state.map.seed).toBe(levelSeed(SEED, 2));
    const frame = sim.snapshot();
    expect(frame.players[0].gear?.fits.pistol?.ranks.magazine).toBe(1);
    expect(frame.players[0].magSize).toBe(Math.round(WEAPONS.pistol.magSize * (1 + UPGRADES.magazine.gain)));
    expect(isSnapshotPacket(JSON.parse(JSON.stringify(frame)))).toBe(true);
  });

  it('sends no gear for someone with nothing to show', () => {
    const { sim } = benchSim('hold');
    expect(sim.snapshot().players[0]).not.toHaveProperty('gear');
  });
});

describe('bench packets', () => {
  it('accepts exactly the three actions', () => {
    expect(isBenchAction({ kind: 'fit', weapon: 'pistol', upgrade: 'damage' })).toBe(true);
    expect(isBenchAction({ kind: 'move', upgrade: 'reload', from: 'pistol', to: 'carbine' })).toBe(true);
    expect(isBenchAction({ kind: 'ready', ready: false })).toBe(true);
    expect(isBenchAction({ kind: 'fit', weapon: 'rocket', upgrade: 'damage' })).toBe(false);
    expect(isBenchAction({ kind: 'fit', weapon: 'pistol', upgrade: 'wings' })).toBe(false);
    expect(isBenchAction({ kind: 'ready', ready: 'yes' })).toBe(false);
    expect(isBenchAction({ kind: 'move', upgrade: 'reload', from: 'pistol' })).toBe(false);
    expect(isBenchAction(null)).toBe(false);
    expect(isBenchAction('ready')).toBe(false);
  });

  it('come through the server parser only when valid', () => {
    const packet = { type: 'bench', action: { kind: 'ready', ready: true } };
    expect(parseClientPacket(JSON.stringify(packet))).toEqual(packet);
    expect(parseClientPacket(JSON.stringify({ type: 'bench', action: { kind: 'buy' } }))).toBeNull();
  });
});
