<template>
  <section class="px-screen">
    <div v-if="open" class="px-panel px-frame shop">
      <header class="shop-head">
        <SpriteImg :sprite="art.merchants[open.merchant].portrait" />
        <div>
          <h2 class="px-heading">{{ open.view.name }}</h2>
          <p class="px-note">{{ open.view.role }}. {{ open.view.greeting }}</p>
        </div>
        <strong class="shop-silver">{{ open.view.silver }} silver</strong>
      </header>

      <ul class="px-rows">
        <li v-for="line in open.view.lines" :key="line.item" class="px-row">
          <span class="shop-name">{{ line.label }}</span>
          <span v-if="Number.isFinite(line.stock)">{{ line.stock }} left</span>
          <strong>{{ line.price }}</strong>
          <PixelButton :disabled="!line.canBuy" @press="game.home.buy(open.merchant, line.item)">Buy</PixelButton>
        </li>
        <li v-if="open.view.lines.length === 0" class="px-note">Nothing on the shelf.</li>
      </ul>

      <p v-if="home.saveError" class="px-error" role="alert">{{ home.saveError }}</p>
      <PixelButton primary silent @press="game.home.closeStation()">Close</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ArtBook } from '../art/types.ts';
import type { HomeUi } from '../game/home-hud.ts';
import { merchantView } from '../game/home/merchant-view.ts';
import PixelButton from './PixelButton.vue';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';

const { home } = defineProps<{ home: HomeUi; art: ArtBook }>();
const game = useGame();

/** Follows the open station, so the screen empties the moment the station clears. */
const open = computed(() => (home.shop ? { merchant: home.shop, view: merchantView(home, home.shop) } : null));
</script>

<style scoped>
.shop {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 560);
  max-width: 100%;
}

.shop-head {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 4);
}

.shop-silver {
  margin-left: auto;
  color: var(--amber);
}

.shop-name {
  flex: 1;
}
</style>
