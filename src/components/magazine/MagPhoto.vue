<template>
  <figure class="mag-photo" :class="`is-${block.size}`">
    <div class="mag-photo-frame">
      <div class="mag-print" :style="printStyle">
        <SpriteImg class="mag-print-img" :sprite="block.sprite" />
        <svg class="mag-marks" :viewBox="`0 0 ${block.sprite.w} ${block.sprite.h}`" aria-hidden="true">
          <path v-for="(path, index) in paths" :key="index" :d="path" />
        </svg>
        <span
          v-for="note in notes"
          :key="note.text"
          class="mag-mark-note"
          :style="note.place"
        >
          {{ note.text }}
        </span>
      </div>
    </div>
    <figcaption class="mag-caption">{{ block.caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { handArrowPath, handCirclePath } from '../../game/magazine-marks.ts';
import type { MagazineBlock, PhotoMark } from '../../game/magazine-types.ts';
import SpriteImg from '../SpriteImg.vue';

const props = defineProps<{ block: Extract<MagazineBlock, { kind: 'photo' }> }>();

const printStyle = computed(() => ({
  '--ratio': `${props.block.sprite.w / props.block.sprite.h}`,
  '--tilt': `${props.block.tilt}deg`,
}));

function pathOf(mark: PhotoMark): string[] {
  switch (mark.kind) {
    case 'circle':
      return [handCirclePath(mark.x, mark.y, mark.r)];
    case 'arrow':
      return [handArrowPath(mark.x1, mark.y1, mark.x2, mark.y2)];
    default:
      return [];
  }
}

const paths = computed(() => props.block.marks.flatMap(pathOf));
const notes = computed(() => {
  const { w, h } = props.block.sprite;
  return props.block.marks.flatMap((mark) => {
    const place = mark.kind === 'note' ? { '--x': `${(mark.x / w) * 100}%`, '--y': `${(mark.y / h) * 100}%` } : {};
    return mark.kind === 'note' ? [{ text: mark.text, place }] : [];
  });
});
</script>
