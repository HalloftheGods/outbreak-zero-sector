/** Coarse bands, so a number never identifies a single player's run. */

export const SCORE_BANDS = ['0', '1-999', '1000-4999', '5000-9999', '10000-24999', '25000+'] as const;
export type ScoreBand = (typeof SCORE_BANDS)[number];

/** The lowest score of each band after the first, in order. */
const SCORE_FLOORS = [1, 1000, 5000, 10000, 25000] as const;

export const FPS_BANDS = ['under-20', '20-30', '30-45', '45-60', '60-plus'] as const;
export type FpsBand = (typeof FPS_BANDS)[number];

/** The lowest frame rate of each band after the first, in order. */
const FPS_FLOORS = [20, 30, 45, 60] as const;

/** How many floors the value has reached. */
function floorsReached(value: number, floors: readonly number[]): number {
  return floors.filter((floor) => value >= floor).length;
}

export function scoreBand(score: number): ScoreBand {
  return SCORE_BANDS[floorsReached(score, SCORE_FLOORS)];
}

export function fpsBand(fps: number): FpsBand {
  return FPS_BANDS[floorsReached(fps, FPS_FLOORS)];
}
