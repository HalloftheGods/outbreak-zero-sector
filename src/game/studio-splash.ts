export interface SplashTimings {
  /** Fade from black to the mark, in ms. */
  readonly fadeIn: number;
  /** Time the mark stays fully lit, in ms. */
  readonly hold: number;
  /** Fade back to black before the title, in ms. */
  readonly fadeOut: number;
}

/** Served from public/, relative so the build works from any folder. */
export const BRAND_MARK = 'brand/hall-of-the-gods.webp';

/** The dated line games carry on the title screen. */
export const STUDIO_LINE = '© 2026 Hall of the Gods, Inc.';

/** Add this to the address to go straight to the title. */
const SKIP_QUERY = 'nosplash';

/** With reduced motion there is no fade, only a short hold. */
export function splashTimings(reducedMotion: boolean): SplashTimings {
  return reducedMotion ? { fadeIn: 0, hold: 1000, fadeOut: 0 } : { fadeIn: 400, hold: 1600, fadeOut: 500 };
}

export function shouldShowSplash(search: string): boolean {
  return !new URLSearchParams(search).has(SKIP_QUERY);
}
