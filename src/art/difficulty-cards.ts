// Builds the four difficulty card pictures, keyed by difficulty id.

import type { DifficultyId } from '../../shared/difficulty.ts';
import { cardOf } from './difficulty-card.ts';
import { LIGHTS_OUT_CARD } from './difficulty/lights-out.ts';
import { NIGHT_LIGHT_CARD } from './difficulty/night-light.ts';
import { STAY_CLOSE_CARD } from './difficulty/stay-close.ts';
import { UNDEAD_TIRED_CARD } from './difficulty/undead-tired.ts';
import type { PixelSprite } from './types.ts';

export function buildDifficultyCards(): Record<DifficultyId, PixelSprite> {
  return {
    night_light: cardOf(NIGHT_LIGHT_CARD),
    stay_close: cardOf(STAY_CLOSE_CARD),
    lights_out: cardOf(LIGHTS_OUT_CARD),
    undead_tired: cardOf(UNDEAD_TIRED_CARD),
  };
}
