import { inject } from 'vue';
import type { InjectionKey } from 'vue';
import type { GameController } from '../game/game-controller.ts';

export const GAME_KEY: InjectionKey<GameController> = Symbol('game');

/** Screens call the controller directly rather than bubbling every button through App. */
export function useGame(): GameController {
  const game = inject(GAME_KEY);
  if (!game) throw new Error('useGame called outside the game root');
  return game;
}
