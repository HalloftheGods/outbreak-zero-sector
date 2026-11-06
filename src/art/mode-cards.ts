// Builds the two play-mode card pictures (Solo, Multiplayer) for the Play page's first step.
// They share the difficulty cards' size and format (see difficulty-card.ts).

import { cardOf } from './difficulty-card.ts';
import { MULTI_CARD } from './modes/multi.ts';
import { SOLO_CARD } from './modes/solo.ts';
import type { PixelSprite } from './types.ts';

export type ModeCardId = 'solo' | 'multi';

export function buildModeCards(): Record<ModeCardId, PixelSprite> {
  return { solo: cardOf(SOLO_CARD), multi: cardOf(MULTI_CARD) };
}
