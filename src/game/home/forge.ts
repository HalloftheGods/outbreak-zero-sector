// Jewels become money here and nowhere else, one jewel at a time.

import type { HomeSave } from './home-store.ts';

export const SMELT_SECONDS = 3;
export const SMALL_JEWEL_SILVER = 40;
export const LARGE_JEWEL_SILVER = 200;

/**
 * Smelts as many whole jewels as the time covers, large ones first so stepping away early costs least.
 * A part-done jewel stays raw, so the caller keeps the leftover seconds. Staying at the forge is the caller's check.
 */
export function smeltTick(save: HomeSave, seconds: number): HomeSave {
  const whole = Math.floor(seconds / SMELT_SECONDS);
  const large = Math.min(whole, save.rawJewels.large);
  const small = Math.min(whole - large, save.rawJewels.small);
  const nothingDone = large + small === 0;
  if (nothingDone) return save;
  return {
    ...save,
    silver: save.silver + large * LARGE_JEWEL_SILVER + small * SMALL_JEWEL_SILVER,
    rawJewels: { small: save.rawJewels.small - small, large: save.rawJewels.large - large },
  };
}
