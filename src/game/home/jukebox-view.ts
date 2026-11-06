// The jukebox screen's plain parts: the plate over its scene, the facts in its column and the pages of tiles.

import type { MusicEntry } from '../sound-test.ts';
import type { ItemFact } from './shop-item-facts.ts';
import { ITEM_SLOTS } from './shop-item-facts.ts';

/** Tiles on one page of the strip: two rows of five, so even fifty tracks never scroll the screen. */
export const JUKEBOX_PAGE = 10;

/** The plate over the scene: the track playing and where it is heard, or a prompt while nothing plays. */
export function jukeboxPlate(playing: MusicEntry | null): { readonly name: string; readonly line: string } {
  if (!playing) return { name: 'Choose a track', line: 'Nothing playing' };
  return { name: playing.name, line: `Now playing: ${playing.where}` };
}

/** Lit cells out of ITEM_SLOTS for part of a whole; none lit while nothing is in hand. */
export function slotsOf(part: number, whole: number): number {
  const none = whole <= 0 || part <= 0;
  return none ? 0 : Math.max(1, Math.round((Math.min(part, whole) / whole) * ITEM_SLOTS));
}

export interface TrackCounts {
  readonly unlocked: number;
  readonly total: number;
  readonly found: number;
  readonly finds: number;
}

/** The column's rows, read off the real track list: what is unlocked, what the radios gave up and what plays. */
export function jukeboxFacts(counts: TrackCounts, playing: MusicEntry | null): readonly ItemFact[] {
  const { unlocked, total, found, finds } = counts;
  return [
    { label: 'Tracks', value: `${unlocked} of ${total}`, filled: slotsOf(unlocked, total) },
    { label: 'Radio finds', value: `${found} of ${finds}`, filled: slotsOf(found, finds) },
    { label: 'Playing', value: playing?.name ?? 'Nothing', filled: null },
  ];
}

export function pageCount(tracks: number): number {
  return Math.max(1, Math.ceil(tracks / JUKEBOX_PAGE));
}

/** The page a track's tile is on. */
export function pageOf(index: number): number {
  return Math.floor(Math.max(0, index) / JUKEBOX_PAGE);
}

/** The tracks on one page, in list order. */
export function pageTracks<T>(tracks: readonly T[], page: number): readonly T[] {
  return tracks.slice(page * JUKEBOX_PAGE, (page + 1) * JUKEBOX_PAGE);
}
