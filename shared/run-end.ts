import { TICK_DT } from './constants.ts';
import { enterTown, moveToNextTown, placeAtEntry } from './level-change.ts';
import { FINAL_LEVEL, FIRST_LEVEL } from './levels.ts';
import { giveReturnKit, giveStartingLoadout } from './player-health.ts';
import type { GameOverStats, RunOutcome } from './protocol.ts';
import type { SimState } from './sim-state.ts';
import { emit, standingPlayers } from './sim-state.ts';
import { announceRunStart, clampLevel } from './sim-factory.ts';
import { round2 } from './snapshot-build.ts';
import { hordesSurvivedHere } from './waves.ts';
import { openBench } from './workbench.ts';

export function leaveTown(sim: SimState): void {
  const lastTown = sim.level >= FINAL_LEVEL;
  if (lastTown) endRun(sim, 'victory');
  else if (!openBench(sim)) moveToNextTown(sim);
}

export function checkGameOver(sim: SimState): void {
  const runActive = sim.phase !== 'gameover' && sim.players.length > 0;
  const everyoneGone = runActive && standingPlayers(sim).length === 0;
  if (everyoneGone) endRun(sim, 'defeat');
}

export function endRun(sim: SimState, outcome: RunOutcome): void {
  const players = [...sim.players]
    .sort((a, b) => b.score - a.score)
    .map(({ id, name, skin, kills, score }) => ({ id, name, skin, kills, score }));
  const stats: GameOverStats = {
    outcome,
    difficulty: sim.difficulty,
    level: sim.level,
    wave: sim.hordesBehind + hordesSurvivedHere(sim),
    durationSec: round2((sim.tick - sim.runStartTick) * TICK_DT),
    players,
  };
  sim.phase = 'gameover';
  sim.gameOver = stats;
  emit(sim, { type: 'game_over', stats });
}

/**
 * Starts a new run with everyone still connected, from level 1 unless told otherwise.
 * Ticks keep counting up. Starting past level 1 hands out the return kit, as for anyone arriving mid-run.
 */
export function restartRun(sim: SimState, fromLevel?: number): void {
  const level = clampLevel(fromLevel);
  sim.runStartTick = sim.tick;
  sim.hordesBehind = 0;
  sim.gameOver = null;
  sim.departed.clear();
  enterTown(sim, level);

  for (const p of sim.players) {
    placeAtEntry(sim, p);
    p.status = 'alive';
    p.health = p.maxHealth;
    p.score = 0;
    p.kills = 0;
    p.dryFireCooldown = 0;
    if (level > FIRST_LEVEL) giveReturnKit(p);
    else giveStartingLoadout(p);
  }
  announceRunStart(sim);
}
