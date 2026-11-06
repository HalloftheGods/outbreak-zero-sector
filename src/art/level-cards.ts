// Builds the Levels page's hand-drawn scene for each of the ten levels (same 56x40 format as
// the difficulty cards, see difficulty-card.ts). Each grid lives in levels/level-<n>.ts.

import { cardOf } from './difficulty-card.ts';
import { LEVEL_1_CARD } from './levels/level-1.ts';
import { LEVEL_2_CARD } from './levels/level-2.ts';
import { LEVEL_3_CARD } from './levels/level-3.ts';
import { LEVEL_4_CARD } from './levels/level-4.ts';
import { LEVEL_5_CARD } from './levels/level-5.ts';
import { LEVEL_6_CARD } from './levels/level-6.ts';
import { LEVEL_7_CARD } from './levels/level-7.ts';
import { LEVEL_8_CARD } from './levels/level-8.ts';
import { LEVEL_9_CARD } from './levels/level-9.ts';
import { LEVEL_10_CARD } from './levels/level-10.ts';
import type { PixelSprite } from './types.ts';

const SCENES = [LEVEL_1_CARD, LEVEL_2_CARD, LEVEL_3_CARD, LEVEL_4_CARD, LEVEL_5_CARD, LEVEL_6_CARD, LEVEL_7_CARD, LEVEL_8_CARD, LEVEL_9_CARD, LEVEL_10_CARD];

/** Index 0 is level 1. */
export function buildLevelCards(): readonly PixelSprite[] {
  return SCENES.map(cardOf);
}
