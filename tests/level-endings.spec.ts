import { liveBoss } from '../shared/bosses.ts';
import { damageZombie } from '../shared/combat.ts';
import { describe, expect, it } from 'vitest';
import { SPAWN_SCATTER, STANDING_POPULATION } from '../shared/constants.ts';
import { FINAL_LEVEL, LEVELS, levelDef } from '../shared/levels.ts';
import { hurtPlayer } from '../shared/player-health.ts';
import type { SnapshotPacket } from '../shared/protocol.ts';
import { GameSimulation } from '../shared/simulation.ts';
import { boardVan, eventsOf, input, openLevelExit, quietSim, SEED, stateOf, steps, surviveHorde } from './helpers/sim-harness.ts';

describe('the end of a run', () => {
  function atFinalLevel(players: readonly string[] = ['a']) {
    const { sim, state } = quietSim(players);
    for (let level = 1; level < FINAL_LEVEL; level++) {
      openLevelExit(state);
      boardVan(sim, state);
    }
    state.zombies = [];
    state.populationTarget = 0;
    state.intermissionLeft = 1e6;
    sim.snapshot();
    return { sim, state };
  }

  it('wins at the van on level 10, with the stats of a game over and the level reached', () => {
    const { sim, state } = atFinalLevel(['a', 'b']);
    const [a, b] = state.players;
    a.score = 900;
    a.kills = 80;
    b.score = 1200;
    b.kills = 70;
    openLevelExit(state);
    boardVan(sim, state);

    const frame = sim.snapshot();
    expect(frame.phase).toBe('gameover');
    expect(frame.gameOver).toMatchObject({ outcome: 'victory', level: FINAL_LEVEL });
    expect(frame.gameOver?.durationSec).toBeGreaterThan(0);
    expect(frame.gameOver?.players.map((p) => p.id)).toEqual(['b', 'a']);
    expect(frame.gameOver?.wave).toBe(LEVELS.reduce((sum, level) => sum + level.hordes, 0));
    expect(eventsOf(frame, 'game_over')).toHaveLength(1);
    expect(eventsOf(frame, 'level_complete')).toHaveLength(0);
  });

  it('freezes the world after a win, as after a defeat', () => {
    const { sim, state } = atFinalLevel();
    openLevelExit(state);
    boardVan(sim, state);
    const { tick } = sim.snapshot();
    sim.step();
    expect(sim.snapshot().tick).toBe(tick);
  });

  it('reports the level reached and every horde survived on a defeat', () => {
    const { sim, state } = quietSim();
    openLevelExit(state);
    boardVan(sim, state);
    openLevelExit(state);
    boardVan(sim, state);
    expect(state.level).toBe(3);
    state.zombies = [];
    surviveHorde(sim, state);
    state.intermissionLeft = 0;
    sim.step();
    expect(state.phase).toBe('wave');
    hurtPlayer(state, state.players[0], 500);
    sim.step();

    const stats = sim.snapshot().gameOver;
    expect(stats).toMatchObject({ outcome: 'defeat', level: 3 });
    expect(stats?.wave).toBe(levelDef(1).hordes + levelDef(2).hordes + 1);
  });

  it('reports a first-town defeat the way it always has', () => {
    const { sim, state } = quietSim();
    surviveHorde(sim, state);
    hurtPlayer(state, state.players[0], 500);
    sim.step();
    expect(sim.snapshot().gameOver).toMatchObject({ outcome: 'defeat', level: 1, wave: 1 });
  });

  it('counts a horde still hunting at the van as unsurvived', () => {
    const { sim, state } = quietSim();
    openLevelExit(state);
    state.phase = 'wave';
    state.wave = levelDef(1).hordes + 1;
    state.hordeLeft = 1e6;
    state.spawnQueue = ['walker'];
    boardVan(sim, state);
    expect(state.level).toBe(2);
    expect(state.hordesBehind).toBe(levelDef(1).hordes);
  });

  it('restarts from level 1 in the town the run began in', () => {
    const { sim, state } = quietSim();
    const firstTownSeed = sim.map.seed;
    for (let level = 1; level <= 3; level++) {
      openLevelExit(state);
      boardVan(sim, state);
    }
    hurtPlayer(state, state.players[0], 500);
    sim.step();
    expect(sim.phase).toBe('gameover');

    sim.restart();
    const frame = sim.snapshot();
    expect(frame).toMatchObject({ level: 1, mapSeed: firstTownSeed, wave: 0, exit: null, gameOver: null, phase: 'intermission' });
    expect(state.populationTarget).toBe(STANDING_POPULATION);
    expect(state.hordesBehind).toBe(0);
    expect(eventsOf(frame, 'level_start')).toEqual([{ type: 'level_start', level: 1 }]);
    const [p] = state.players;
    expect(Math.hypot(p.x - state.map.spawn.x, p.y - state.map.spawn.y)).toBeLessThanOrEqual(SPAWN_SCATTER + 1);
  });

  it('keeps the same town object when restarting from level 1', () => {
    const { sim, state } = quietSim();
    const map = sim.map;
    hurtPlayer(state, state.players[0], 500);
    sim.step();
    sim.restart();
    expect(sim.map).toBe(map);
  });
});

describe('the whole run', () => {
  /** Plays the run by the rules, with no bot in the way: every horde outlasted (and every boss killed), every van boarded on foot. */
  function driveToVictory(seed: number): { readonly frames: readonly SnapshotPacket[]; readonly sim: GameSimulation } {
    const sim = new GameSimulation({ seed });
    sim.addPlayer('a', 'Ann');
    const state = stateOf(sim);
    const frames: SnapshotPacket[] = [];
    for (let turn = 0; turn < 500 && sim.phase !== 'gameover'; turn++) {
      const [p] = state.players;
      p.health = p.maxHealth;
      state.zombies = state.zombies.filter((z) => Math.hypot(z.x - p.x, z.y - p.y) > 200);
      // A boss night's horde cannot be outlasted, only won: the boss has to fall.
      const boss = liveBoss(state);
      if (boss) damageZombie(state, boss, 1e6, 0, 'a');
      if (state.exit) {
        boardVan(sim, state);
        p.health = p.maxHealth;
      } else {
        surviveHorde(sim, state);
      }
      frames.push(sim.snapshot());
    }
    return { frames, sim };
  }

  it('goes through all ten towns in order to a victory', () => {
    const { frames, sim } = driveToVictory(SEED);
    expect(sim.phase).toBe('gameover');
    const last = frames[frames.length - 1];
    expect(last.gameOver).toMatchObject({ outcome: 'victory', level: FINAL_LEVEL });

    const completed = frames.flatMap((frame) => eventsOf(frame, 'level_complete').map((event) => event.level));
    expect(completed).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const seeds = new Set(frames.map((frame) => frame.mapSeed));
    expect(seeds.size).toBe(FINAL_LEVEL);
    const opened = frames.flatMap((frame) => eventsOf(frame, 'exit_open').map((event) => event.level));
    expect(opened).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  }, 60000);

  it('is the same run twice from the same seed and inputs, level changes included', () => {
    const play = (): string[] => {
      const sim = new GameSimulation({ seed: 77 });
      sim.addPlayer('a', 'Ann');
      const state = stateOf(sim);
      const frames: string[] = [];
      for (let level = 1; level <= 3; level++) {
        sim.setInput('a', input({ seq: level, right: true }));
        steps(sim, 30);
        openLevelExit(state);
        boardVan(sim, state);
        frames.push(JSON.stringify(sim.snapshot()));
      }
      return frames;
    };
    expect(play()).toEqual(play());
  }, 60000);
});
