import { TICK_RATE } from '../../shared/constants.ts';
import type { SimState, ZombieState } from '../../shared/sim-state.ts';
import { GameSimulation } from '../../shared/simulation.ts';
import { addZombie, stateOf, stepUntil } from './sim-harness.ts';

/** Long enough to walk most of a town, so distance alone never counts as failing to arrive. */
const LONE_CHASE_TICKS = TICK_RATE * 20;

/**
 * Replays one hunter in the same town with the crowd gone and the players standing where they are.
 * A body that gets there was only waiting its turn. One that does not is held by the world.
 */
export function arrivesAlone(state: SimState, z: ZombieState): boolean {
  const sim = new GameSimulation({ seed: state.runSeed, startLevel: state.level });
  for (const { id } of state.players) sim.addPlayer(id, id);
  const lone = stateOf(sim);
  lone.intermissionLeft = 1e6;
  lone.populationTarget = 0;
  lone.pickups = [];
  lone.zombies = [];
  lone.players.forEach((p, index) => {
    p.x = state.players[index].x;
    p.y = state.players[index].y;
  });
  const body = addZombie(lone, z.type, z.x, z.y);
  body.speed = z.speed;
  return stepUntil(sim, () => body.attacking, LONE_CHASE_TICKS) >= 0;
}
