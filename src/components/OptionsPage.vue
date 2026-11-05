<template>
  <TitlePage heading="Options" @close="emit('close')">
    <div class="options-sound">
      <div class="options-volume">
        <label class="px-label" for="volume">Volume</label>
        <input
          id="volume"
          class="px-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="ui.volume"
          @input="onVolume"
        />
      </div>
      <PixelButton class="options-mute" :aria-pressed="ui.muted" @press="game.toggleMute()">{{ muteLabel }}</PixelButton>
    </div>

    <div>
      <p class="px-label">Controls</p>
      <dl class="options-keys">
        <template v-for="[keys, action] in CONTROLS" :key="action">
          <dt>{{ keys }}</dt>
          <dd>{{ action }}</dd>
        </template>
      </dl>
    </div>
  </TitlePage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UiState } from '../game/hud-state.ts';
import { CONTROLS } from '../game/title-menu.ts';
import PixelButton from './PixelButton.vue';
import TitlePage from './TitlePage.vue';
import { useGame } from './use-game.ts';

const { ui } = defineProps<{ ui: UiState }>();
const emit = defineEmits<{ close: [] }>();
const game = useGame();

const muteLabel = computed(() => (ui.muted ? 'Unmute' : 'Mute'));

function onVolume(event: Event): void {
  game.setVolume(Number((event.target as HTMLInputElement).value));
}
</script>

<style scoped>
.options-sound {
  display: flex;
  align-items: flex-end;
  gap: calc(var(--u) * 6);
}

.options-volume {
  flex: 1;
  padding-bottom: calc(var(--u) * 3);
}

.options-mute {
  width: calc(var(--u) * 56);
}

.options-keys {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--u) calc(var(--u) * 6);
  margin: 0;
}

.options-keys dt {
  color: var(--amber);
}

.options-keys dd {
  margin: 0;
  color: var(--bone-dim);
}
</style>
