// Where the stage last built the world, written the moment it builds it. The HUD only catches up on
// its next beat (100 ms), too late to hide the cut, so the van drive (VanTransition.vue) listens here.

import { shallowRef } from 'vue';

export interface StageCut {
  readonly inBunker: boolean;
  /** Counts builds, so building the same place twice still reads as news. */
  readonly seq: number;
}

export const stageCut = shallowRef<StageCut | null>(null);

export function noteStageCut(inBunker: boolean): void {
  stageCut.value = { inBunker, seq: (stageCut.value?.seq ?? 0) + 1 };
}
