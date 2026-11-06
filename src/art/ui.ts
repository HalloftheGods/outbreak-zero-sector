// The interface lane. The art lives in fx/icons.ts and fx/logo.ts.

import type { UiArt } from './types.ts';
import { buildBottle, buildCrosshair, buildCrosshairHead, buildHeart, buildPickupIcons, buildSkull, buildWeaponIcons } from './fx/icons.ts';
import { buildDifficultyCards } from './difficulty-cards.ts';
import { buildLevelCards } from './level-cards.ts';
import { buildModeCards } from './mode-cards.ts';
import { buildLogo } from './fx/logo.ts';

export function buildUi(): UiArt {
  return {
    crosshair: buildCrosshair(),
    crosshairHead: buildCrosshairHead(),
    weaponIcons: buildWeaponIcons(),
    pickupIcons: buildPickupIcons(),
    heart: buildHeart(),
    bottle: buildBottle(),
    skull: buildSkull(),
    logo: buildLogo(),
    difficulty: buildDifficultyCards(),
    mode: buildModeCards(),
    levelScenes: buildLevelCards(),
  };
}
