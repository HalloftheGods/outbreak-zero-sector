<template>
  <img class="sprite-img" :src="url" :style="size" alt="" draggable="false" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PixelSprite } from '../art/types.ts';
import { spriteDataUrl } from '../engine/sprite-cache.ts';

const props = withDefaults(defineProps<{ sprite: PixelSprite; scale?: number }>(), { scale: 1 });

const url = computed(() => spriteDataUrl(props.sprite));
// One art pixel is --spx css px wide: whole device pixels where the browser has CSS round()
// (see the @supports block), else the plain unit times the scale. A parent may set --sprite-px.
const size = computed(() => ({
  '--sprite-scale': props.scale,
  width: `calc(var(--sprite-px, var(--spx)) * ${props.sprite.w})`,
  height: `calc(var(--sprite-px, var(--spx)) * ${props.sprite.h})`,
}));
</script>

<style scoped>
.sprite-img {
  --spx: calc(var(--u) * var(--sprite-scale, 1));
  display: block;
  image-rendering: pixelated;
}

/* --dpx is one device pixel in css px, set by fitWindow. */
@supports (width: round(1px, 1px)) {
  .sprite-img {
    --spx: max(var(--dpx, 1px), round(nearest, calc(var(--u) * var(--sprite-scale, 1)), var(--dpx, 1px)));
  }
}
</style>
