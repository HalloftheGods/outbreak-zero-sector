<template>
  <div class="select-card">
    <div class="select-bust px-frame" :class="{ 'is-closed': closed }" :style="BUST_SIZE">
      <span class="merchant-bust">
        <SpriteImg :sprite="bust" />
      </span>
      <div class="select-plate">
        <p class="select-name">{{ name }}</p>
        <p class="select-role">{{ role }}</p>
        <p class="select-trait">{{ greeting }}</p>
      </div>
    </div>
    <div class="select-stats">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * The merchant's big card, built like the survivor select's: their framed bust, a plate over its foot with
 * name, trade and today's greeting, and a column beside it (the slot) for the item in focus. Every box is
 * fixed, so moving along the shelf moves nothing.
 */
import { BUST_H, BUST_W } from '../art/survivors/bust.ts';
import type { PixelSprite } from '../art/types.ts';
import SpriteImg from './SpriteImg.vue';

interface MerchantCardProps {
  bust: PixelSprite;
  name: string;
  role: string;
  greeting: string;
  /** No one keeps the stall: the bust is drawn greyed out. */
  closed?: boolean;
}

const { bust, name, role, greeting, closed = false } = defineProps<MerchantCardProps>();
/** Art sizes for the bust's box, the survivor bust's, which every merchant bust is drawn to. */
const BUST_SIZE = { '--bust-w': BUST_W, '--bust-h': BUST_H };
</script>

<style scoped>
.select-card {
  display: grid;
  grid-template-columns: auto auto;
  justify-content: center;
  align-items: stretch;
  gap: calc(var(--u) * 14);
  padding: calc(var(--u) * 2) calc(var(--u) * 4);
}

.select-stats {
  min-width: 0;
}

/* Whole device pixels per art pixel, as SpriteImg rounds them: the bust is drawn at 3, as a survivor's is. */
.select-bust {
  --sprite-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 3), var(--dpx, 1px)));
  --edge: var(--amber);
  position: relative;
  flex: none;
  padding: calc(var(--u) * 3);
  background: var(--ink-raised);
}

/* The bust's box keeps its size whatever the sprite, so a placeholder or a redraw moves nothing. */
.merchant-bust {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: calc(var(--sprite-px) * var(--bust-w));
  height: calc(var(--sprite-px) * var(--bust-h));
  overflow: hidden;
}

.merchant-bust img {
  flex: none;
}

.is-closed .merchant-bust {
  filter: grayscale(1) brightness(0.4);
}

/* The nameplate sits over the bust's shoulders, so it adds no height to the card. */
.select-plate {
  position: absolute;
  inset: auto 0 0;
  padding: calc(var(--u) * 3);
  background: rgba(7, 8, 12, 0.82);
  border-top: var(--u) solid var(--amber);
  text-align: center;
}

.select-plate p {
  margin: 0;
}

.select-name {
  color: var(--amber);
  font-size: calc(var(--u) * 14);
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}

.select-plate .select-role {
  margin: var(--u) 0 calc(var(--u) * 2);
  color: var(--bone);
  font-size: calc(var(--u) * 6);
  text-transform: uppercase;
}

/* Two lines are always kept, so a short greeting never changes the plate's height. */
.select-trait {
  min-height: 2lh;
  color: var(--bone-dim);
}

/* A phone has no room beside the bust: the column stacks under it. */
@container shop (max-width: 420px) {
  .select-card {
    grid-template-columns: 1fr;
    justify-items: center;
    gap: calc(var(--u) * 4);
    padding: 0;
  }

  .select-bust {
    order: -1;
  }
}
</style>
