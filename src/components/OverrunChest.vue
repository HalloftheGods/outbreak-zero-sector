<template>
  <section class="px-screen">
    <div class="px-panel px-frame chest">
      <h2 class="px-heading">{{ CHEST_HEADING }}</h2>
      <ul class="chest-held">
        <li v-for="line in lines" :key="line">{{ line }}</li>
      </ul>
      <p class="px-note">{{ CHEST_NOTE }}</p>
      <PixelButton primary silent @press="game.home.closeChest()">Close</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
/** What the reward chest held after the bunker was held. It is already in the locker and the bank. */
import { computed } from 'vue';
import type { ChestOpened } from '../game/home-hud.ts';
import { CHEST_HEADING, CHEST_NOTE, chestLines } from '../game/home-screens.ts';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

const { chest } = defineProps<{ chest: ChestOpened }>();
const game = useGame();
const lines = computed(() => chestLines(chest));
</script>

<style scoped>
.chest {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 160);
  max-width: 100%;
}

.chest-held {
  list-style: none;
  color: var(--bone);
}
</style>
