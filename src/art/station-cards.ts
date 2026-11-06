// Builds the scene picture for each home station screen (Locker, Forge, Jukebox, Workbench),
// in the same 56x40 format as the difficulty cards (see difficulty-card.ts).

import { cardOf } from './difficulty-card.ts';
import { BENCH_CARD } from './stations/bench.ts';
import { FORGE_CARD } from './stations/forge.ts';
import { JUKEBOX_CARD } from './stations/jukebox.ts';
import { LOCKER_CARD } from './stations/locker.ts';
import type { PixelSprite } from './types.ts';

export type StationCardId = 'locker' | 'forge' | 'jukebox' | 'bench';

export function buildStationCards(): Record<StationCardId, PixelSprite> {
  return { locker: cardOf(LOCKER_CARD), forge: cardOf(FORGE_CARD), jukebox: cardOf(JUKEBOX_CARD), bench: cardOf(BENCH_CARD) };
}
