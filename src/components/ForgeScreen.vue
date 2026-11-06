<template>
  <section class="px-screen">
    <div class="px-panel px-frame forge">
      <h2 class="px-heading">Forge</h2>
      <p class="px-note">Jewels become silver here, one at a time, while you stay. Step away and the rest wait.</p>

      <ul class="forge-waiting">
        <li>{{ view.waiting.small }} small jewels, 40 silver each</li>
        <li>{{ view.waiting.large }} large jewels, 200 silver each</li>
      </ul>

      <div class="px-meter forge-meter" :style="{ '--fill': `${Math.round(view.progress * 100)}%` }"><span /></div>
      <p class="px-note">{{ status }}</p>

      <PixelButton primary :disabled="view.idle" @press="game.home.smelt()">Smelt</PixelButton>
      <PixelButton @press="game.home.closeStation()">Close</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { HomeUi } from '../game/home-hud.ts';
import { forgeView } from '../game/home-screens.ts';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

const { home } = defineProps<{ home: HomeUi }>();
const game = useGame();
const view = computed(() => forgeView(home));
const status = computed(() => (view.value.idle ? 'No jewels to smelt.' : `${Math.ceil(view.value.secondsLeft)}s to smelt them all.`));
</script>

<style scoped>
.forge {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 160);
  max-width: 100%;
}

.forge-waiting {
  list-style: none;
}

.forge-meter {
  width: 100%;
  height: calc(var(--u) * 4);
}
</style>
