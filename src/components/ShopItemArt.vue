<template>
  <span class="item-art">
    <SpriteImg :sprite />
  </span>
</template>

<script setup lang="ts">
/**
 * One shop item's in-game icon in a fixed box, at whole device pixels per art pixel. The parent sets the box
 * (--art-box-w, --art-box-h) and the largest icon it holds (--art-w, --art-h), so every icon in one
 * shelf or column is drawn at the same scale and nothing moves when the icon changes.
 */
import type { PixelSprite } from '../art/types.ts';
import SpriteImg from './SpriteImg.vue';

defineProps<{ sprite: PixelSprite }>();
</script>

<style scoped>
/* The most whole device pixels per art pixel that fit the largest icon with one art pixel of air each side. */
.item-art {
  --sprite-px: max(
    var(--dpx, 1px),
    min(
      round(down, calc(var(--art-box-w) / (var(--art-w) + 2)), var(--dpx, 1px)),
      round(down, calc(var(--art-box-h) / (var(--art-h) + 2)), var(--dpx, 1px))
    )
  );
  display: flex;
  justify-content: center;
  align-items: center;
  flex: none;
  width: var(--art-box-w);
  height: var(--art-box-h);
}

.item-art img {
  flex: none;
}
</style>
