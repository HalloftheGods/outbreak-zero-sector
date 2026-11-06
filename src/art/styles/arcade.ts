// The Arcade card, a placeholder until the card painter gets to it: ten lamps along the top for ten levels,
// a moon over a night road, and the escape van waiting at the end of it.

import { RAMPS } from '../palette.ts';
import type { CardDef } from '../difficulty-card.ts';
import { Grid } from './grid.ts';

const { asphalt, bone, denim, fire, ink, metal, violet } = RAMPS;

function scene(): readonly string[] {
  const board = new Grid('v').rect(0, 0, 56, 14, 'V').rect(0, 26, 56, 14, 'a');
  for (let level = 0; level < 10; level++) board.rect(3 + level * 5, 3, 3, 3, 'y').rect(4 + level * 5, 6, 1, 3, 'k');
  board.disc(10, 18, 5, 'z').disc(12, 17, 4, 'v');
  board.rect(0, 26, 56, 1, 'k').rect(0, 32, 56, 1, 'b');
  for (const x of [3, 15, 27]) board.rect(x, 34, 8, 1, 'z');
  board.rect(30, 19, 22, 11, 'k').rect(31, 20, 20, 9, 'm').rect(31, 20, 20, 3, 'M').rect(44, 21, 6, 4, 'd');
  board.rect(33, 21, 8, 4, 'd').rect(31, 28, 20, 1, 'k').rect(50, 26, 3, 2, 'o');
  board.disc(36, 30, 3, 'k').disc(36, 30, 1, 'M').disc(46, 30, 3, 'k').disc(46, 30, 1, 'M');
  return board.rows();
}

export const ARCADE_CARD: CardDef = {
  legend: {
    k: ink[0],
    V: violet[0],
    v: violet[1],
    a: asphalt[1],
    b: asphalt[2],
    y: fire[2],
    z: bone[2],
    m: metal[1],
    M: metal[3],
    d: denim[1],
    o: fire[1],
  },
  rows: scene(),
};
