// The interface lane. The art lives in fx/icons.ts and fx/logo.ts.

import type { UiArt } from './types.ts';
import { buildCrosshair, buildHeart, buildPickupIcons, buildSkull, buildWeaponIcons } from './fx/icons.ts';
import { buildLogo } from './fx/logo.ts';

export function buildUi(): UiArt {
  return {
    crosshair: buildCrosshair(),
    weaponIcons: buildWeaponIcons(),
    pickupIcons: buildPickupIcons(),
    heart: buildHeart(),
    skull: buildSkull(),
    logo: buildLogo(),
  };
}
