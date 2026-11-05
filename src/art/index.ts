// Assembles the art book. Each lane owns one build function; see the top of its file.

import type { ArtBook } from './types.ts';
import { buildEnvironment } from './environment.ts';
import { buildFx, buildPickups } from './fx.ts';
import { buildSurvivors } from './survivors.ts';
import { buildUi } from './ui.ts';
import { buildZombies } from './zombies.ts';

let book: ArtBook | null = null;

export function buildArtBook(): ArtBook {
  book ??= {
    survivors: buildSurvivors(),
    zombies: buildZombies(),
    environment: buildEnvironment(),
    pickups: buildPickups(),
    fx: buildFx(),
    ui: buildUi(),
  };
  return book;
}
