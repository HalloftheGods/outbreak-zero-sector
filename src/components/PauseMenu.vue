<template>
  <section class="px-screen">
    <div class="px-panel px-frame pause">
      <h2 class="px-heading">{{ mode === 'solo' ? 'Paused' : 'Menu' }}</h2>
      <p v-if="mode === 'coop'" class="px-note">Co-op does not pause. The horde is still coming.</p>

      <label class="px-label" for="pause-volume">Volume{{ ui.muted ? ' (muted)' : '' }}</label>
      <input
        id="pause-volume"
        class="px-slider"
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="ui.volume"
        @input="onVolume"
      />

      <PixelButton class="pause-resume" primary silent @press="game.togglePause()">Resume</PixelButton>
      <PixelButton @press="game.toMenu()">Main menu</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { UiState } from '../game/hud-state.ts';
import type { TransportKind } from '../network/transport.ts';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

defineProps<{ ui: UiState; mode: TransportKind }>();
const game = useGame();

function onVolume(event: Event): void {
  game.setVolume(Number((event.target as HTMLInputElement).value));
}
</script>

<style scoped>
.pause {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 130);
  max-width: 100%;
}

.pause-resume {
  margin-top: calc(var(--u) * 3);
}
</style>
