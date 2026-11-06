// The screamer: a walker gone grey, white-haired, in a violet shirt. It moves like a walker,
// so it reads as one until it opens its mouth and the street comes running. The hair is a
// cool steel white so it parts from the warm bone skin; the boots keep the walker's brown.

import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { ZombieArt } from '../types.ts';
import { buildWalker } from './walker.ts';
import { WALKER_LEGEND } from './walker-art.ts';

const { ash, bone, metal, violet } = RAMPS;

export const SCREAMER_LEGEND: Legend = {
  ...WALKER_LEGEND,
  a: ash[0], b: ash[1], c: ash[2], d: bone[2],
  g: violet[0], h: violet[1], i: violet[2],
  w: metal[1], x: metal[2], y: metal[3], Y: bone[3],
};

export const buildScreamer = (): ZombieArt => buildWalker(SCREAMER_LEGEND);
