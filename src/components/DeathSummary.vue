<template>
  <section class="px-screen">
    <div class="px-panel px-frame summary">
      <h2 class="px-heading is-danger">You died on level {{ death.receipt.level }}</h2>
      <p class="px-note">You wake in the bunker with what was stored. Lost:</p>
      <ul class="summary-lost">
        <li v-for="line in lines" :key="line">{{ line }}</li>
      </ul>
      <PixelButton primary silent @press="game.home.wake()">Wake up</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HomeDeath } from '../game/home-hud.ts';
import { deathSummary } from '../game/home-screens.ts';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

const { death } = defineProps<{ death: HomeDeath }>();
const game = useGame();
const lines = computed(() => deathSummary(death));
</script>

<style scoped>
.summary {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 160);
  max-width: 100%;
}

.summary-lost {
  list-style: none;
  color: var(--bone);
}
</style>
