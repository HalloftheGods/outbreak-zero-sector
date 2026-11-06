<template>
  <div class="select-card">
    <div class="select-bust px-frame" :style="CARD_SIZE">
      <span class="select-scene">
        <SpriteImg v-if="sprite" :sprite />
      </span>
      <div class="select-plate">
        <p class="select-name">{{ name }}</p>
        <p class="select-trait">{{ line }}</p>
      </div>
    </div>
    <div class="select-stats">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The big card on the Play page's mode and difficulty steps, built like the survivor select's: a framed
 * scene as tall as a survivor bust, its name and one line on a plate over its foot, and a column beside it
 * (the slot) for the stacked rows. Every box is fixed, so changing the scene moves nothing.
 */
import { BUST_H } from '../art/survivors/bust.ts';
import { CARD_W } from '../art/difficulty-card.ts';
import type { PixelSprite } from '../art/types.ts';
import SpriteImg from './SpriteImg.vue';

const { sprite, name, line } = defineProps<{ sprite: PixelSprite | null; name: string; line: string }>();
/** Art sizes for the scene's box, which is exactly as tall as the survivor bust so the steps' cards match. */
const CARD_SIZE = { '--card-w': CARD_W, '--bust-h': BUST_H };
</script>

<style scoped>
.select-card {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: center;
  align-items: center;
  gap: calc(var(--u) * 14);
  padding: calc(var(--u) * 2) calc(var(--u) * 4);
}

.select-stats {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 6);
  min-width: 0;
}

/* Whole device pixels per art pixel, as SpriteImg rounds them: the bust is drawn at 3, the wider scene at 4. */
.select-bust {
  --bust-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 3), var(--dpx, 1px)));
  --sprite-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 4), var(--dpx, 1px)));
  --edge: var(--amber);
  position: relative;
  flex: none;
  padding: calc(var(--u) * 3);
  background: var(--ink-raised);
}

/* The scene's box keeps its size before the art book loads; the scene sits at its top, the plate over its foot. */
.select-scene {
  display: block;
  width: calc(var(--sprite-px) * var(--card-w));
  height: calc(var(--bust-px) * var(--bust-h));
  background: var(--ink);
}

/* The nameplate sits over the foot of the scene, so it adds no height to the card. */
.select-plate {
  position: absolute;
  inset: auto 0 0;
  padding: calc(var(--u) * 3);
  background: rgba(7, 8, 12, 0.82);
  border-top: var(--u) solid var(--amber);
  text-align: center;
}

.select-name {
  margin: 0 0 calc(var(--u) * 2);
  color: var(--amber);
  font-size: calc(var(--u) * 14);
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}

/* Two lines are always kept, so a short line never changes the plate's height. */
.select-trait {
  margin: 0;
  min-height: 2lh;
  color: var(--bone-dim);
}

/* A phone has no room beside the scene: the column stacks under it, and the scene drops to the bust's scale. */
@container select (max-width: 420px) {
  .select-card {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: calc(var(--u) * 4);
    padding: 0;
  }

  .select-bust {
    --sprite-px: var(--bust-px);
    order: -1;
  }
}
</style>
