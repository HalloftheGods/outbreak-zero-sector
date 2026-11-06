<template>
  <div class="juke-facts" :style="RADIO_BOX">
    <h2 class="juke-title">Jukebox</h2>
    <p class="juke-status" role="status" aria-live="polite">{{ status }}</p>
    <ShopItemBars :rows />
    <p class="juke-hint">
      <ShopItemArt v-if="radio" class="juke-radio" :sprite="radio" />
      <span>{{ hint }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * The column beside the jukebox's scene: what it is doing, then its facts stacked like a gun's bars (tracks
 * unlocked, radio finds, what plays) and where the rest are, by the in-game radio. Its size is fixed, so
 * starting or stopping a track moves nothing.
 */
import { computed } from 'vue';
import type { PixelSprite } from '../art/types.ts';
import type { ItemFact } from '../game/home/shop-item-facts.ts';
import ShopItemArt from './ShopItemArt.vue';
import ShopItemBars from './ShopItemBars.vue';

interface FactsProps {
  status: string;
  rows: readonly ItemFact[];
  hint: string;
  radio: PixelSprite | null;
}

const { status, rows, hint, radio } = defineProps<FactsProps>();
const RADIO_BOX = computed(() => ({ '--art-w': radio?.w ?? 1, '--art-h': radio?.h ?? 1 }));
</script>

<style scoped>
.juke-facts {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 170);
}

.juke-facts p,
.juke-title {
  margin: 0;
}

.juke-title {
  color: var(--bone);
  font-size: calc(var(--u) * 11);
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
}

/* Two lines are always kept, so a long track name never moves the bars. */
.juke-status {
  min-height: 2lh;
  color: var(--bone);
  font-size: calc(var(--u) * 7);
}

.juke-hint {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 3);
  min-height: 2lh;
  color: var(--bone-dim);
  font-size: calc(var(--u) * 6);
}

.juke-radio {
  --art-box-w: calc(var(--u) * 18);
  --art-box-h: calc(var(--u) * 18);
}
</style>
