<template>
  <section class="px-screen">
    <div v-if="open" class="px-panel px-frame shop" :style="{ '--bust-w': BUST_W }">
      <MerchantCard :bust="art.merchants[open.merchant].bust" :name="open.view.name" :role="open.view.role" :greeting="open.view.greeting">
        <ShopItemPanel :line="shown" :icons="art.ui" :silver="open.view.silver" :difficulty="home.difficulty" :art-size @buy="buyChosen" />
      </MerchantCard>
      <ShopShelf ref="shelf" :lines :chosen :icons="art.ui" :silver="open.view.silver" :art-size @choose="choose" @preview="preview" />
      <footer class="shop-foot">
        <p class="px-error shop-error" role="alert">{{ home.saveError ?? '' }}</p>
        <PixelButton class="shop-close" primary silent @press="game.home.closeStation()">Close</PixelButton>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * A merchant's shop, laid out like the survivor select: the merchant's framed bust and the item in focus
 * beside it, over the shelf of items to pick from. Pointing at a tile previews it; Buy buys the picked one.
 */
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue';
import { BUST_W } from '../art/survivors/bust.ts';
import type { ArtBook } from '../art/types.ts';
import type { HomeUi } from '../game/home-hud.ts';
import { merchantView } from '../game/home/merchant-view.ts';
import { itemSprite } from '../game/home/shop-item-art.ts';
import MerchantCard from './MerchantCard.vue';
import PixelButton from './PixelButton.vue';
import ShopItemPanel from './ShopItemPanel.vue';
import ShopShelf from './ShopShelf.vue';
import { useGame } from './use-game.ts';

const { home, art } = defineProps<{ home: HomeUi; art: ArtBook }>();
const game = useGame();
const shelf = useTemplateRef<InstanceType<typeof ShopShelf>>('shelf');

/** Follows the open station, so the screen empties the moment the station clears. */
const open = computed(() => (home.shop ? { merchant: home.shop, view: merchantView(home, home.shop) } : null));
const lines = computed(() => open.value?.view.lines ?? []);

const picked = ref<string | null>(null);
const pickedAt = ref(0);
const previewed = ref<number | null>(null);
/** The pick stays on its item while the shelf changes; once it sells out, the pick falls to what took its place. */
const chosen = computed(() => {
  const at = lines.value.findIndex((line) => line.item === picked.value);
  return at >= 0 ? at : Math.min(pickedAt.value, Math.max(0, lines.value.length - 1));
});
const shown = computed(() => lines.value[previewed.value ?? chosen.value] ?? lines.value[chosen.value] ?? null);

/** The largest icon on this shelf, so the tiles and the column each draw every icon at one scale. */
const artSize = computed(() => {
  const sprites = lines.value.map((line) => itemSprite(art.ui, line.grant));
  return { w: Math.max(1, ...sprites.map((each) => each.w)), h: Math.max(1, ...sprites.map((each) => each.h)) };
});

function choose(index: number): void {
  game.playUi('click');
  picked.value = lines.value[index]?.item ?? null;
  pickedAt.value = index;
}

function preview(index: number | null): void {
  const pointing = index !== null;
  if (pointing) game.playUi('hover');
  previewed.value = index;
}

function buyChosen(): void {
  const merchant = open.value?.merchant;
  const line = lines.value[chosen.value];
  const onShelf = merchant !== undefined && line !== undefined;
  if (onShelf) game.home.buy(merchant, line.item);
}

watch(
  () => home.shop,
  () => {
    picked.value = null;
    pickedAt.value = 0;
    previewed.value = null;
  }
);
onMounted(() => shelf.value?.focus());
</script>

<style scoped>
/* As wide as the bust (rounded as SpriteImg rounds it), the column and the gaps; a phone gets the window. */
.shop {
  --bust-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 3), var(--dpx, 1px)));
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--bust-px) * var(--bust-w) + var(--u) * 220);
  max-width: 100%;
  container: shop / inline-size;
}

.shop-foot {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 4);
}

/* One line is always kept, so a failed save never moves the screen. */
.shop-error {
  flex: 1;
  min-height: 1lh;
  font-size: calc(var(--u) * 6);
}

.shop-close {
  width: auto;
  padding-inline: calc(var(--u) * 10);
}
</style>
