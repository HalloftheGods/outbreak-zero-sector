import type { GameController } from './game-controller.ts';

declare global {
  interface Window {
    /** Dev builds only: lets a play-test inspect the running game. */
    __outbreak?: GameController;
  }
}
