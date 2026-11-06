// The screamer: a walker gone grey, white-haired, in a violet shirt. It moves like a walker,
// so it reads as one until it opens its mouth and the street comes running.

import type { Legend } from '../kit.ts';
import { RAMPS } from '../palette.ts';
import type { ZombieArt } from '../types.ts';
import { buildWalker } from './walker.ts';
import { WALKER_LEGEND } from './walker-art.ts';

const { ash, bone, violet } = RAMPS;

export const SCREAMER_LEGEND: Legend = {
  ...WALKER_LEGEND,
  a: ash[0], b: ash[1], c: ash[2], d: bone[2],
  g: violet[0], h: violet[1], i: violet[2],
  w: ash[0], x: bone[1], y: bone[2], Y: bone[3],
};

export const buildScreamer = (): ZombieArt => buildWalker(SCREAMER_LEGEND);
