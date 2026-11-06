<template>
  <figure class="mag-diagram">
    <div class="mag-diagram-sheet">
      <SpriteImg class="mag-diagram-gun" :sprite="block.gun" :scale="7" />
      <div v-for="(part, index) in block.parts" :key="part.id" class="mag-diagram-part" :class="`is-part-${index}`">
        <SpriteImg :sprite="part.sprite" :scale="3.2" />
        <span>{{ part.title }}</span>
      </div>
      <svg class="mag-marks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path v-for="(path, index) in LEADERS" :key="index" :d="path" />
      </svg>
    </div>
    <figcaption class="mag-caption">{{ block.caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { handArrowPath } from '../../game/magazine-marks.ts';
import type { MagazineBlock } from '../../game/magazine-types.ts';
import SpriteImg from '../SpriteImg.vue';

defineProps<{ block: Extract<MagazineBlock, { kind: 'diagram' }> }>();

/** From each part in a corner of the sheet to the gun in the middle. */
const LEADERS: readonly string[] = [
  handArrowPath(26, 26, 40, 42),
  handArrowPath(74, 26, 62, 42),
  handArrowPath(26, 74, 40, 58),
  handArrowPath(74, 74, 62, 58),
];
</script>
