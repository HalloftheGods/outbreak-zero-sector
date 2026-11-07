<template>
  <section class="px-screen">
    <div class="px-panel px-frame lost">
      <h2 class="px-heading is-danger">Connection lost</h2>
      <p class="px-note">{{ reason }}</p>
      <PixelButton v-if="needsReload" primary @press="reload">Reload</PixelButton>
      <PixelButton :primary="!needsReload" @press="game.toMenu()">Main menu</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { NEEDS_UPDATE_TEXT } from '../../shared/close-codes.ts';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

const props = defineProps<{ reason: string }>();
const game = useGame();
// Only this build is behind, and a reload is what fetches the newer one.
const needsReload = computed(() => props.reason === NEEDS_UPDATE_TEXT);

function reload(): void {
  window.location.reload();
}
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
