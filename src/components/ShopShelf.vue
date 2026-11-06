<template>
  <div v-if="lines.length > 0" class="shelf" role="radiogroup" aria-label="Shelf" :style="artBox" @keydown="onKey">
    <button
      v-for="(line, index) in lines"
      :key="line.item"
      :ref="(el) => setTile(index, el)"
      class="shelf-tile px-frame"
      :class="{ 'is-chosen': index === chosen }"
      type="button"
      role="radio"
      :aria-checked="index === chosen"
      :aria-label="ariaOf(line)"
      :tabindex="index === chosen ? 0 : -1"
      @mouseenter="emit('preview', index)"
      @mouseleave="emit('preview', null)"
      @blur="emit('preview', null)"
      @click="emit('choose', index)"
    >
      <span v-if="Number.isFinite(line.stock)" class="shelf-badge">x{{ line.stock }} left</span>
      <ShopItemArt :sprite="itemSprite(icons, line.grant)" />
      <span class="shelf-name">{{ line.label }}</span>
      <span class="shelf-price" :class="{ 'is-short': line.price > silver }">{{ line.price }}</span>
    </button>
  </div>
  <p v-else class="shelf shelf-empty px-note">Nothing on the shelf.</p>
</template>

<script setup lang="ts">
/**
 * The merchant's shelf: a row of framed tiles, one per line, each with the item's in-game icon, name, price
 * and what is left. Pointing at one previews it in the column above; arrows move the pick and the focus
 * together, wrapping, as on the survivor roster. Buying is the column's job, never a tile's.
 */
import { computed } from 'vue';
import { rosterStep } from '../game/character-select-view.ts';
import type { MerchantLine } from '../game/home/merchant-view.ts';
import { itemSprite } from '../game/home/shop-item-art.ts';
import type { ShopIcons } from '../game/home/shop-item-art.ts';
import ShopItemArt from './ShopItemArt.vue';

interface ShelfProps {
  lines: readonly MerchantLine[];
  chosen: number;
  icons: ShopIcons;
  silver: number;
  /** The largest icon on this shelf, so every tile draws at one scale. */
  artSize: { w: number; h: number };
}

const { lines, chosen, icons, silver, artSize } = defineProps<ShelfProps>();
const emit = defineEmits<{ choose: [index: number]; preview: [index: number | null] }>();

const tiles = new Map<number, HTMLElement>();
const artBox = computed(() => ({ '--art-w': artSize.w, '--art-h': artSize.h }));

function setTile(index: number, el: unknown): void {
  const isTile = el instanceof HTMLElement;
  if (isTile) tiles.set(index, el);
}

function ariaOf(line: MerchantLine): string {
  const left = Number.isFinite(line.stock) ? `${line.stock} left` : 'always in stock';
  return `${line.label}, ${line.price} silver, ${left}`;
}

/** Arrows stay on the shelf rather than walking the survivor away from the counter. */
function onKey(event: KeyboardEvent): void {
  const next = rosterStep(chosen, event.key, lines.length);
  const moves = next !== null;
  if (!moves) return;
  event.preventDefault();
  event.stopPropagation();
  emit('choose', next);
  tiles.get(next)?.focus();
}

/** Puts the keyboard on the chosen tile, as a radio group lands on its checked option. */
defineExpose({ focus: () => tiles.get(chosen)?.focus() });
</script>

<style scoped>
.shelf {
  display: flex;
  justify-content: center;
  gap: calc(var(--u) * 3);
  min-height: calc(var(--u) * 50);
  margin: 0;
  padding: var(--u);
}

.shelf-empty {
  align-items: center;
  max-width: none;
}

.shelf-tile {
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
  border: 0;
  padding: calc(var(--u) * 3) 0 calc(var(--u) * 2);
  background: var(--ink-raised);
  color: var(--bone-dim);
  font: inherit;
  cursor: pointer;
  outline: none;
}

.shelf-tile:hover,
.shelf-tile:focus-visible {
  --edge: var(--bone-dim);
  color: var(--bone);
}

.shelf-tile.is-chosen {
  --edge: var(--amber);
  background: rgba(232, 163, 61, 0.14);
  color: var(--amber);
}

/* The icon box is the tile's width, less an art pixel of air, and a fixed height. */
.shelf-tile .item-art {
  --art-box-w: calc(100cqw - var(--u) * 2);
  --art-box-h: calc(var(--u) * 24);
}

.shelf-badge {
  position: absolute;
  top: var(--u);
  right: var(--u);
  padding: 0 var(--u);
  background: rgba(7, 8, 12, 0.82);
  color: var(--bone-dim);
  font-size: calc(var(--u) * 5);
  line-height: 1.25;
}

.shelf-name {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(var(--u) * 6);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.shelf-price {
  color: var(--bone);
  font-size: calc(var(--u) * 7);
  font-weight: 700;
}

.shelf-price.is-short {
  color: var(--blood-bright);
}

/* A phone fits four tiles to a row and wraps the rest under them. */
@container shop (max-width: 420px) {
  .shelf {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .shelf-tile {
    max-width: none;
  }
}
</style>
