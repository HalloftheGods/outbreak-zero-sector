import { levelDef } from './levels.ts';
import type { LevelTheme } from './levels.ts';
import type { EntityId, WorldMap } from './protocol.ts';
import { buildingAt } from './world-query.ts';

/** What a town's weather does to play, on top of how it looks. */
export interface TownRule {
  readonly name: string;
  readonly blurb: string;
}

export const TOWN_RULES: Readonly<Partial<Record<LevelTheme, TownRule>>> = {
  flooded: { name: 'Floodwater', blurb: 'Wading outdoors slows you down. Buildings are dry.' },
  blackout: { name: 'Blackout', blurb: 'Zombies see less in the dark, but they hear further.' },
  snow: { name: 'Fresh snow', blurb: 'Zombies follow your footprints. Sneak to tread lightly.' },
};

/** Walking speed outdoors in a flooded town. */
export const FLOOD_SPEED_SCALE = 0.8;
/** In a blackout zombies spot survivors from this share of the usual range, and hear this much further. */
export const BLACKOUT_SIGHT_SCALE = 0.7;
export const BLACKOUT_HEARING_SCALE = 1.3;
/** A footprint goes down every so many ticks while walking in snow, and fills in after this long. */
export const TRACK_EVERY_TICKS = 9;
export const TRACK_LIFE_SEC = 20;
/** A roamer this close to a footprint picks up the trail. */
export const TRACK_SNIFF_RADIUS = 18;
/** Footprints kept at once, oldest dropped first. */
export const TRACK_LIMIT = 240;

export interface Footprint {
  readonly x: number;
  readonly y: number;
  readonly by: EntityId;
  left: number;
}

export const themeOf = (level: number): LevelTheme => levelDef(level).theme;

export function townRule(level: number): TownRule | null {
  return TOWN_RULES[themeOf(level)] ?? null;
}

/** Shared with the client, so prediction wades at the sim's pace. */
export function groundSpeedScale(level: number, map: WorldMap, x: number, y: number): number {
  const wading = themeOf(level) === 'flooded' && buildingAt(map, x, y) === null;
  return wading ? FLOOD_SPEED_SCALE : 1;
}

export function sightScale(level: number): number {
  return themeOf(level) === 'blackout' ? BLACKOUT_SIGHT_SCALE : 1;
}

export function hearingScale(level: number): number {
  return themeOf(level) === 'blackout' ? BLACKOUT_HEARING_SCALE : 1;
}
