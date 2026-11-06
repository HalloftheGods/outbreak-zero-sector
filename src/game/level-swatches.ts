import type { LevelTheme } from '../../shared/levels.ts';

/** One representative color per town look, for the levels page. */
export const LEVEL_SWATCH: Readonly<Record<LevelTheme, string>> = {
  night: '#1d2440',
  'industrial-dusk': '#7a4a2a',
  flooded: '#1f5a7a',
  contaminated: '#6f9a2c',
  blackout: '#0c0d12',
  emergency: '#a8321f',
  snow: '#c9d8e6',
  infested: '#5a2f55',
  burning: '#e0661a',
  bunker: '#4a3a2c',
};
