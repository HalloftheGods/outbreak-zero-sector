<template>
  <div v-if="tiles.length > 0" class="strip" role="radiogroup" aria-label="Gear" :style="artBox" @keydown="onKey">
    <div v-for="(tile, index) in shown" :key="tile.key" class="strip-tile px-frame" :class="{ 'is-chosen': index === chosen }" @mouseenter="emit('hover')">
      <button
        :ref="(el) => setTile(index, el)"
        class="strip-pick"
        type="button"
        role="radio"
        :aria-checked="index === chosen"
        :aria-label="ariaOf(tile)"
        aria-keyshortcuts="Enter Delete"
        :tabindex="index === chosen ? 0 : -1"
        @click="emit('choose', index)"
      >
        <span class="strip-art">
          <ShopItemArt v-if="tile.sprite" :sprite="tile.sprite" />
        </span>
        <span class="strip-name">{{ tile.label }}</span>
        <span class="strip-side"><span>Locker</span><strong>{{ tile.locker }}</strong></span>
        <span class="strip-side" :class="{ 'is-held': tile.hand > 0 }"><span>Hand</span><strong>{{ tile.hand }}</strong></span>
      </button>
      <span class="strip-moves">
        <template v-if="index === chosen">
          <button class="strip-move" type="button" tabindex="-1" :disabled="tile.locker === 0" @click="emit('take', tile.key)">
            Take<kbd>Enter</kbd>
          </button>
          <button class="strip-move" type="button" tabindex="-1" :disabled="tile.hand === 0" @click="emit('stow', tile.key)">
            Stow<kbd>Del</kbd>
          </button>
        </template>
      </span>
    </div>
  </div>
  <p v-else class="strip strip-empty px-note">{{ empty }}</p>
</template>

<script setup lang="ts">
/**
 * The locker's strip: a framed tile for each kind of gear on either side, with its in-game icon, name and how
 * many are in the locker and in hand. The chosen tile carries Take and Stow. Arrows move the pick and the focus
 * together, wrapping, as on the shop's shelf; Enter takes one and Delete (or Backspace) stows one.
 */
import { computed } from 'vue';
import { rosterStep } from '../game/character-select-view.ts';
import type { LockerTile } from '../game/home/locker-view.ts';
import { lockerSprite } from '../game/home/locker-view.ts';
import type { ShopIcons } from '../game/home/shop-item-art.ts';
import ShopItemArt from './ShopItemArt.vue';

interface StripProps {
  tiles: readonly LockerTile[];
  chosen: number;
  icons: ShopIcons | null;
  /** The largest icon in the locker, so every tile draws at one scale. */
  artSize: { w: number; h: number };
  /** What the strip says when it has no tiles. */
  empty: string;
}

const { tiles, chosen, icons, artSize } = defineProps<StripProps>();
interface StripEmits {
  choose: [index: number];
  take: [key: string];
  stow: [key: string];
  hover: [];
}

const emit = defineEmits<StripEmits>();

const pickers = new Map<number, HTMLElement>();
const artBox = computed(() => ({ '--art-w': artSize.w, '--art-h': artSize.h }));
const shown = computed(() => tiles.map((tile) => ({ ...tile, sprite: icons ? lockerSprite(icons, tile.key) : null })));
/** The keys that move gear, each to the side it sends it. */
const MOVE_KEYS: Partial<Record<string, 'take' | 'stow'>> = { Enter: 'take', NumpadEnter: 'take', Delete: 'stow', Backspace: 'stow' };

function setTile(index: number, el: unknown): void {
  const isTile = el instanceof HTMLElement;
  if (isTile) pickers.set(index, el);
}

function ariaOf(tile: LockerTile): string {
  return `${tile.label}, ${tile.locker} in the locker, ${tile.hand} in hand`;
}

/** Arrows stay on the strip rather than walking the survivor away from the locker. */
function onKey(event: KeyboardEvent): void {
  const move = MOVE_KEYS[event.code];
  const tile = tiles[chosen];
  const moves = move !== undefined && tile !== undefined;
  if (moves) {
    event.preventDefault();
    event.stopPropagation();
    const once = !event.repeat;
    const takes = once && move === 'take';
    const stows = once && move === 'stow';
    if (takes) emit('take', tile.key);
    if (stows) emit('stow', tile.key);
    return;
  }
  const next = rosterStep(chosen, event.key, tiles.length);
  const steps = next !== null;
  if (!steps) return;
  event.preventDefault();
  event.stopPropagation();
  emit('choose', next);
  pickers.get(next)?.focus();
}

/** Puts the keyboard on the chosen tile, as a radio group lands on its checked option. */
defineExpose({ focus: () => pickers.get(chosen)?.focus() });
</script>

<style scoped>
/* Room for two rows of nine, so a short locker and a full one make the screen the same size. */
.strip {
  --tile-h: calc(var(--u) * 68);
  --gap: calc(var(--u) * 3);
  --per-row: 9;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  gap: var(--gap);
  min-height: calc(var(--tile-h) * 2 + var(--gap) + var(--u) * 2);
  margin: 0;
  padding: var(--u);
}

.strip-empty {
  align-items: center;
  max-width: none;
}

.strip-tile {
  --edge: var(--ink-line);
  display: flex;
  flex-direction: column;
  flex: 0 0 calc((100% - var(--gap) * (var(--per-row) - 1)) / var(--per-row));
  height: var(--tile-h);
  min-width: 0;
  container-type: inline-size;
  background: var(--ink-raised);
  color: var(--bone-dim);
}

.strip-tile:hover,
.strip-tile:focus-within {
  --edge: var(--bone-dim);
  color: var(--bone);
}

.strip-tile.is-chosen {
  --edge: var(--amber);
  background: rgba(232, 163, 61, 0.14);
  color: var(--amber);
}

.strip-pick {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--u);
  min-width: 0;
  border: 0;
  padding: calc(var(--u) * 3) 0 var(--u);
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  outline: none;
}

/* The icon box is the tile's width, less an art pixel of air, and a fixed height, drawn or not. */
.strip-art {
  display: flex;
  height: calc(var(--u) * 24);
}

.strip-art .item-art {
  --art-box-w: calc(100cqw - var(--u) * 2);
  --art-box-h: calc(var(--u) * 24);
}

.strip-name {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(var(--u) * 6);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.strip-side {
  display: flex;
  justify-content: space-between;
  align-self: stretch;
  padding-inline: calc(var(--u) * 2);
  color: var(--bone-dim);
  font-size: calc(var(--u) * 5);
  text-transform: uppercase;
}

.strip-side strong {
  color: var(--bone);
}

.strip-side.is-held strong {
  color: var(--sick);
}

/* Kept on every tile, empty until it is chosen, so choosing moves nothing. */
.strip-moves {
  display: flex;
  gap: var(--u);
  margin-top: auto;
  padding: 0 var(--u) var(--u);
  min-height: calc(var(--u) * 13);
}

.strip-move {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  border: 0;
  padding: var(--u) 0;
  background: var(--ink);
  box-shadow: 0 0 0 var(--u) var(--bone-dim);
  color: var(--bone);
  font: inherit;
  font-size: calc(var(--u) * 5);
  line-height: 1.1;
  text-transform: uppercase;
  cursor: pointer;
}

.strip-move:hover:not(:disabled) {
  box-shadow: 0 0 0 var(--u) var(--amber);
  color: var(--amber);
}

.strip-move:disabled {
  opacity: 0.35;
  cursor: default;
}

.strip-move kbd {
  color: var(--bone-dim);
  font: inherit;
  font-size: calc(var(--u) * 4);
}

/* A phone fits four tiles to a row and wraps the rest under them. */
@container select (max-width: 420px) {
  .strip {
    --per-row: 4;
    min-height: 0;
  }
}
</style>
