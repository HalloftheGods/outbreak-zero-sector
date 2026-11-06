<template>
  <ul
    class="forge-tiles"
    aria-label="Jewels waiting"
    :style="ART_BOX"
  >
    <li
      v-for="row in jewels"
      :key="row.size"
      class="forge-tile px-frame"
      :class="{ 'is-chosen': row.size === onForge }"
      :aria-label="`${row.count} ${row.label.toLowerCase()}, ${row.each} silver each`"
    >
      <span class="forge-badge">x{{ row.count }}</span>
      <ShopItemArt
        v-if="icons"
        :sprite="icons[row.icon]"
      />
      <span
        v-else
        class="item-art"
      />
      <span class="forge-name">{{ row.label }}</span>
      <span class="forge-price">{{ row.each }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * The strip under the forge's card: one framed tile per jewel size, drawn like the merchant's shelf tiles,
 * with the jewel's in-game icon, how many wait and the silver each is worth. The jewel on the forge wears
 * the amber frame. Nothing here is picked; the forge takes large jewels first on its own.
 */
import type { UiArt } from '../art/types.ts';
import type { JewelRow, JewelSize } from '../game/home/forge-card.ts';
import ShopItemArt from './ShopItemArt.vue';

const { jewels, onForge, icons } = defineProps<{
  jewels: readonly JewelRow[];
  onForge: JewelSize | null;
  icons: UiArt['pickupIcons'] | null;
}>();
/** Both jewel icons are drawn 15 by 15, so the two tiles draw them at one scale. */
const ART_BOX = { '--art-w': 15, '--art-h': 15 };
</script>

<style scoped>
.forge-tiles {
  display: flex;
  justify-content: center;
  gap: calc(var(--u) * 3);
  margin: 0;
  padding: var(--u);
  list-style: none;
}

.forge-tile {
  --edge: var(--ink-line);
  position: relative;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--u);
  min-width: 0;
  max-width: calc(var(--u) * 72);
  container-type: inline-size;
  padding: calc(var(--u) * 3) 0 calc(var(--u) * 2);
  background: var(--ink-raised);
  color: var(--bone-dim);
}

.forge-tile.is-chosen {
  --edge: var(--amber);
  background: rgba(232, 163, 61, 0.14);
  color: var(--amber);
}

/* The icon box is the tile's width, less an art pixel of air, and a fixed height, before the art book loads too. */
.forge-tile .item-art {
  --art-box-w: calc(100cqw - var(--u) * 2);
  --art-box-h: calc(var(--u) * 24);
  width: var(--art-box-w);
  height: var(--art-box-h);
}

.forge-badge {
  position: absolute;
  top: var(--u);
  right: var(--u);
  padding: 0 var(--u);
  background: rgba(7, 8, 12, 0.82);
  color: var(--bone-dim);
  font-size: calc(var(--u) * 5);
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
}

.forge-name {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(var(--u) * 6);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.forge-price {
  color: var(--bone);
  font-size: calc(var(--u) * 7);
  font-weight: 700;
}
</style>
