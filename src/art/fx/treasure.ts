// Treasure on the ground and in the HUD: a pile of silver coins, a cut green stone and a large red one.
// Letters are the pickup legend, plus three teal ones for the green stone.

import { RAMPS } from '../palette.ts';
import type { Legend } from '../kit.ts';
import type { Grid } from './shared.ts';

const { teal } = RAMPS;

export const TREASURE_LEGEND: Legend = { G: teal[0], H: teal[1], I: teal[2] };

/** A tall stack of coins with one lying beside it. Edge rings are dark, faces catch the lamp. */
export const SILVER: Grid = [
  '..oppo.........',
  '.opeepo........',
  '.noooon........',
  '.mnnnnm........',
  '.noooon...oppo.',
  '.mnnnnm..opeepo',
  '.noooon..mnnnnm',
  '.mnnnnm...mmmm.',
  '..mmmm.........',
];

/** A small green stone cut flat on top, one spark on its table. */
export const JEWEL_SMALL: Grid = [
  '..HIIH..',
  '.HIeIIH.',
  'HIIIIIHG',
  'HHIIHHGG',
  '.GHHHGG.',
  '..GHGG..',
  '...GG...',
];

/** A large red stone with a wide table, a spark, and a long dark point. */
export const JEWEL_LARGE: Grid = [
  '..sttuutts..',
  '.stuuuuuuts.',
  'sttueuuuutts',
  'rsttttttttsr',
  '.rsttttttsr.',
  '..rsttttsr..',
  '...rsttsr...',
  '....rssr....',
  '.....rr.....',
];
