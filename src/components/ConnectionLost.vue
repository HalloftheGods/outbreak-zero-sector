<template>
  <section class="px-screen">
    <div class="px-panel px-frame lost">
      <h2 class="px-heading is-danger">Connection lost</h2>
      <p class="px-note">{{ reason }}</p>
      <PixelButton primary @press="game.toMenu()">Main menu</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

defineProps<{ reason: string }>();
const game = useGame();
</script>

<style scoped>
.lost {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--u) * 6);
  max-width: 100%;
}
</style>
