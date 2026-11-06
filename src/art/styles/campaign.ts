// The Campaign card, a placeholder until the card painter gets to it: a vault door in a concrete wall,
// a warm lamp over it, and a lit floor. Outline and shadow are k; the ramps are listed in the legend.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';
import { Grid } from './grid.ts';

const { concrete, fire, ink, metal } = RAMPS;

function scene(): readonly string[] {
  const board = new Grid('c').rect(0, 30, 56, 10, 'f');
  for (const x of [0, 13, 27, 41, 55]) board.rect(x, 0, 1, 30, 'w');
  board.rect(0, 9, 56, 1, 'w').rect(0, 29, 56, 1, 'k');
  board.rect(21, 1, 14, 3, 'k').rect(22, 2, 12, 1, 'L').rect(14, 4, 28, 3, 'h').rect(20, 4, 16, 2, 'H');
  board.disc(28, 19, 12, 'k').disc(28, 19, 10, 'm').disc(28, 19, 8, 'M').disc(28, 19, 3, 'k').disc(28, 19, 2, 'm');
  board.rect(27, 11, 2, 16, 'm').rect(20, 18, 16, 2, 'm').rect(27, 18, 2, 2, 'M');
  board.rect(9, 33, 38, 3, 'h').rect(15, 36, 26, 2, 'H');
  return board.rows();
}

export const CAMPAIGN_CARD: CardDef = {
  legend: {
    k: ink[0],
    c: concrete[1],
    w: concrete[0],
    f: concrete[2],
    m: metal[1],
    M: metal[2],
    L: fire[3],
    h: fire[0],
    H: fire[1],
  },
  rows: scene(),
};
