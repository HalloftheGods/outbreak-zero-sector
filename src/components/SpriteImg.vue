<template>
  <img class="sprite-img" :src="url" :style="size" alt="" draggable="false" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PixelSprite } from '../art/types.ts';
import { spriteDataUrl } from '../engine/sprite-cache.ts';

const props = withDefaults(defineProps<{ sprite: PixelSprite; scale?: number }>(), { scale: 1 });

const url = computed(() => spriteDataUrl(props.sprite));
const size = computed(() => ({
  width: `calc(var(--u) * ${props.sprite.w * props.scale})`,
  height: `calc(var(--u) * ${props.sprite.h * props.scale})`,
}));
</script>

<style scoped>
.sprite-img {
  display: block;
  image-rendering: pixelated;
}
</style>
