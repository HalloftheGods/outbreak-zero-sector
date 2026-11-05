// The undead. Each zombie lives in src/art/zombies/; the rig and body there are shared.
// The walker is the style anchor every art lane copies.

import type { ZombieType } from '../../shared/protocol.ts';
import type { ZombieArt } from './types.ts';
import { buildBloater } from './zombies/bloater.ts';
import { buildBrute } from './zombies/brute.ts';
import { buildRunner } from './zombies/runner.ts';
import { buildWalker } from './zombies/walker.ts';

export { referenceWalker } from './zombies/walker.ts';

export function buildZombies(): Record<ZombieType, ZombieArt> {
  const walker = buildWalker();
  return { walker, runner: buildRunner(), bloater: buildBloater(), brute: buildBrute() };
}
