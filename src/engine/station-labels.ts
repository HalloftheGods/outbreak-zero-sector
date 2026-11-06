// The words over a bunker station you can open, in the bitmap font's capitals.

import type { StationId } from '../../shared/home-protocol.ts';

export const STATION_LABEL: Record<StationId, string> = {
  bench: 'WORKBENCH',
  forge: 'FORGE',
  locker: 'LOCKER',
  level_map: 'LEVEL MAP',
  jukebox: 'JUKEBOX',
  gunsmith: 'GUNSMITH',
  quartermaster: 'QUARTERMASTER',
  medic: 'MEDIC',
  powder: 'POWDER',
};

/** What to show over a head: the key to hold, or the word a finger can press. */
export function stationPrompt(station: StationId, touch: boolean): string {
  return `${touch ? 'OPEN' : 'HOLD E'}: ${STATION_LABEL[station]}`;
}
