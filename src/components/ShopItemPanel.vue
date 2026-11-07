<template>
  <div class="item-panel" :style="artBox">
    <p class="item-silver">
      <SpriteImg :sprite="icons.silverIcon" />
      <span class="item-silver-label">Silver</span>
      <strong class="item-silver-count">{{ silver }}</strong>
    </p>
    <div v-if="line" class="item-head">
      <span class="item-frame px-frame">
        <ShopItemArt :sprite="itemSprite(icons, line.grant)" />
      </span>
      <div class="item-title">
        <p class="item-name">{{ line.label }}</p>
        <p class="item-price" :class="{ 'is-short': line.price > silver }">{{ line.price }} silver</p>
        <p class="item-stock">{{ stockText }}</p>
      </div>
    </div>
    <template v-if="line && facts">
      <p class="item-note">{{ facts.note }}</p>
      <ShopItemBars :rows="facts.rows" />
      <PixelButton class="item-buy" :disabled="!line.canBuy" @press="emit('buy')">Buy</PixelButton>
      <p class="item-refusal">{{ line.refusal ?? '' }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * The column beside the merchant: the silver to spend, then the item in focus with its in-game icon, price,
 * stock, what it does and Buy. The column's size is fixed, so moving along the shelf moves nothing.
 */
import { computed } from 'vue';
import type { DifficultyId } from '../../shared/difficulty.ts';
import type { UiArt } from '../art/types.ts';
import type { MerchantLine } from '../game/home/merchant-view.ts';
import { itemSprite } from '../game/home/shop-item-art.ts';
import type { ShopIcons } from '../game/home/shop-item-art.ts';
import { itemFacts } from '../game/home/shop-item-facts.ts';
import PixelButton from './PixelButton.vue';
import ShopItemArt from './ShopItemArt.vue';
import ShopItemBars from './ShopItemBars.vue';
import SpriteImg from './SpriteImg.vue';

interface ItemPanelProps {
  line: MerchantLine | null;
  icons: ShopIcons & Pick<UiArt, 'silverIcon'>;
  silver: number;
  difficulty: DifficultyId;
  /** The largest icon on this shelf, so the column draws at one scale for all of them. */
  artSize: { w: number; h: number };
}

const { line, icons, silver, difficulty, artSize } = defineProps<ItemPanelProps>();
const emit = defineEmits<{ buy: [] }>();

const facts = computed(() => (line ? itemFacts(line.grant, difficulty) : null));
const stockText = computed(() => (line && Number.isFinite(line.stock) ? `${line.stock} left` : 'Always in stock'));
const artBox = computed(() => ({ '--art-w': artSize.w, '--art-h': artSize.h }));
</script>

<style scoped>
.item-panel {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 3);
  width: calc(var(--u) * 180);
  height: 100%;
}

.item-panel p {
  margin: 0;
}

/* The purse, read like the HUD's treasure: amber and bold. */
.item-silver {
  --sprite-px: max(var(--dpx, 1px), round(nearest, var(--u), var(--dpx, 1px)));
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 3);
  padding: calc(var(--u) * 2) calc(var(--u) * 3);
  background: rgba(11, 12, 16, 0.78);
}

.item-silver-label {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 7);
  text-transform: uppercase;
}

.item-silver-count {
  margin-left: auto;
  color: var(--amber);
  font-size: calc(var(--u) * 11);
  line-height: 1;
}

.item-head {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 5);
}

.item-frame {
  --edge: var(--ink-line);
  --art-box-w: calc(var(--u) * 70);
  --art-box-h: calc(var(--u) * 36);
  flex: none;
  padding: calc(var(--u) * 2);
  background: var(--ink-raised);
}

.item-title {
  display: flex;
  flex-direction: column;
  gap: var(--u);
  min-width: 0;
}

.item-name {
  overflow: hidden;
  color: var(--amber);
  font-size: calc(var(--u) * 10);
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.item-price {
  color: var(--bone);
  font-weight: 700;
}

.item-price.is-short {
  color: var(--blood-bright);
}

.item-stock {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 6);
  text-transform: uppercase;
}

/* Three lines are always kept, so a short note never moves the rows under it. */
.item-note {
  display: -webkit-box;
  min-height: 3lh;
  overflow: hidden;
  color: var(--bone-dim);
  font-size: calc(var(--u) * 7);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.item-buy {
  margin-top: auto;
}

/* One line is always kept, empty when the sale would go through. */
.item-refusal {
  min-height: 1lh;
  color: var(--blood-bright);
  font-size: calc(var(--u) * 6);
  text-align: center;
  text-transform: uppercase;
}
</style>
