<template>
  <section class="px-screen">
    <div
      class="px-panel px-frame forge"
      :style="SCENE_SIZE"
    >
      <div class="forge-card">
        <SceneCard
          :sprite="art?.ui.stations.forge ?? null"
          name="Forge"
          :line="FORGE_LINE"
        >
          <ForgeLedger
            :card
            :icons
            :coin="art?.ui.silverIcon ?? null"
          />
        </SceneCard>
      </div>
      <ForgeTiles
        :jewels="card.jewels"
        :on-forge="card.onForge"
        :icons
      />
      <footer class="forge-foot">
        <PixelButton
          class="forge-button"
          primary
          :disabled="view.idle"
          @press="game.home.smelt()"
        >
          Smelt
        </PixelButton>
        <PixelButton
          class="forge-button"
          @press="game.home.closeStation()"
        >
          Close
        </PixelButton>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * The forge, laid out like the merchant's shop: the forge's framed scene with its nameplate and the jewels
 * waiting beside it, over a strip of jewel tiles, with Smelt and Close at the foot. Jewels smelt while you
 * stay; every box is fixed, so the bar filling and the numbers ticking down move nothing.
 */
import { computed } from 'vue';
import { CARD_W } from '../art/difficulty-card.ts';
import type { ArtBook } from '../art/types.ts';
import type { HomeUi } from '../game/home-hud.ts';
import { forgeView } from '../game/home-screens.ts';
import { FORGE_LINE, forgeCard } from '../game/home/forge-card.ts';
import ForgeLedger from './ForgeLedger.vue';
import ForgeTiles from './ForgeTiles.vue';
import PixelButton from './PixelButton.vue';
import SceneCard from './SceneCard.vue';
import { useGame } from './use-game.ts';

const { home, art = null } = defineProps<{ home: HomeUi; art?: ArtBook | null }>();
const game = useGame();
const view = computed(() => forgeView(home));
const card = computed(() => forgeCard(view.value));
const icons = computed(() => art?.ui.pickupIcons ?? null);
/** The scene's width in art pixels, for the panel's width. */
const SCENE_SIZE = { '--card-w': CARD_W };
</script>

<style scoped>
/* As wide as the scene (rounded as SpriteImg rounds it), the card's padding and gap and the column; a phone gets the window. */
.forge {
  --scene-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 4), var(--dpx, 1px)));
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--scene-px) * var(--card-w) + var(--u) * 186);
  max-width: 100%;
}

.forge-card {
  container: select / inline-size;
}

.forge-card :deep(.select-card) {
  padding-block: 0;
}

.forge-foot {
  display: flex;
  justify-content: flex-end;
  gap: calc(var(--u) * 4);
}

.forge-button {
  width: auto;
  padding-inline: calc(var(--u) * 10);
}
</style>
