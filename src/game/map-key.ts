// The words beside the map screen. A town has districts, buildings to tick off and a van; the bunker has rooms and stations, so it gets its own key.

import type { TransportKind } from '../network/transport.ts';
import { CURSOR_COLOR } from './map-cursor.ts';
import { BUNKER_LEGEND, TOWN_LEGEND } from './town-map.ts';

/** The first line of every key: the blinking cursor on the map. */
export const YOU_ARE_HERE: readonly [string, string] = [CURSOR_COLOR, 'You are here'];

export interface MapKey {
  /** The screen's name and heading. */
  readonly title: string;
  readonly legend: readonly (readonly [string, string])[];
  /** Whether the check (been inside) and cross (cleared and searched) marks are drawn, so they are in the key. */
  readonly marks: boolean;
  /** Whether the run waits while the map is open: it does for one player, and not for a room. */
  readonly waitNote: (mode: TransportKind) => string;
}

const waitNoteOf = (place: string) => (mode: TransportKind) => (mode === 'solo' ? 'Paused.' : `The ${place} does not wait.`);

const TOWN_KEY: MapKey = { title: 'Town map', legend: [YOU_ARE_HERE, ...TOWN_LEGEND], marks: true, waitNote: waitNoteOf('town') };
const BUNKER_KEY: MapKey = { title: 'Bunker map', legend: [YOU_ARE_HERE, ...BUNKER_LEGEND], marks: false, waitNote: waitNoteOf('bunker') };

export function mapKey(inBunker: boolean): MapKey {
  return inBunker ? BUNKER_KEY : TOWN_KEY;
}
