import type { SimState } from '../../shared/sim-state.ts';
import { GameSimulation } from '../../shared/simulation.ts';
import type { SimulationOptions } from '../../shared/simulation.ts';
import { SEED, stateOf } from './sim-harness.ts';

export interface HomeSimOptions extends Partial<SimulationOptions> {
  /** Who is in the room. One player unless a test says otherwise. */
  readonly players?: readonly string[];
}

/** A home room with everyone standing in the bunker and the first frame's events drained. */
export function homeSim(options: HomeSimOptions = {}): { sim: GameSimulation; state: SimState } {
  const { players = ['a'], ...simOptions } = options;
  const sim = new GameSimulation({ seed: SEED, ...simOptions, home: true });
  for (const id of players) sim.addPlayer(id, id);
  sim.snapshot();
  return { sim, state: stateOf(sim) };
}
