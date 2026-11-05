<template>
  <section class="px-screen title">
    <SpriteImg v-if="ui.art" class="title-logo" :sprite="ui.art.ui.logo" :scale="logoScale" />
    <h1 v-else class="px-heading">OUTBREAK: ZERO SECTOR</h1>

    <div class="title-columns">
      <form class="px-panel px-frame title-play" @submit.prevent>
        <label class="px-label" for="callsign">Callsign</label>
        <input
          id="callsign"
          class="px-input px-frame"
          :value="ui.callsign"
          maxlength="12"
          placeholder="SURVIVOR"
          autocomplete="off"
          spellcheck="false"
          @input="game.setCallsign(textOf($event))"
        />

        <PixelButton class="title-solo" primary silent :disabled="!ready" @press="game.startSolo()">
          {{ ready ? 'Solo' : loadingLabel }}
        </PixelButton>

        <label class="px-label" :for="SERVER_FIELD_ID">Co-op server</label>
        <input
          :id="SERVER_FIELD_ID"
          class="px-input px-frame"
          :value="ui.serverAddress"
          :placeholder="defaultServer"
          autocomplete="off"
          spellcheck="false"
          @input="game.setServerAddress(textOf($event))"
        />
        <PixelButton class="title-coop" silent :disabled="!ready" @press="game.startCoop()">
          {{ ui.connecting ? 'Connecting...' : 'Co-op' }}
        </PixelButton>
        <p v-if="ui.error" class="title-error" role="alert">{{ ui.error }}</p>
      </form>

      <aside class="px-panel px-frame title-info">
        <label class="px-label" for="volume">Volume{{ ui.muted ? ' (muted)' : '' }}</label>
        <input
          id="volume"
          class="px-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="ui.volume"
          @input="game.setVolume(numberOf($event))"
        />

        <dl class="title-keys">
          <template v-for="[keys, action] in CONTROLS" :key="action">
            <dt>{{ keys }}</dt>
            <dd>{{ action }}</dd>
          </template>
        </dl>

        <p class="title-best">
          <template v-if="ui.best">
            Best run: {{ ui.best.score }} pts, {{ ui.best.wave }} {{ ui.best.wave === 1 ? 'horde' : 'hordes' }}
          </template>
          <template v-else>No runs survived yet</template>
        </p>
      </aside>
    </div>

    <p class="title-credit">
      <img class="title-omega" :src="BRAND_MARK" alt="" />
      Hall of the Gods, Inc.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DEFAULT_SERVER_PORT } from '../../shared/constants.ts';
import { SERVER_FIELD_ID } from '../game/hud-state.ts';
import type { UiState } from '../game/hud-state.ts';
import { BRAND_MARK } from '../game/studio-splash.ts';
import PixelButton from './PixelButton.vue';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';

const CONTROLS = [
  ['WASD', 'Move'],
  ['Mouse', 'Aim, hold to fire'],
  ['F / Right', 'Shove, makes no noise'],
  ['R', 'Reload'],
  ['H', 'Use a medkit'],
  ['1 2 3 Q', 'Weapons'],
  ['Tab / N', 'Town map'],
  ['Esc', 'Pause'],
  ['M', 'Mute'],
] as const;

const { ui } = defineProps<{ ui: UiState }>();
const game = useGame();

const ready = computed(() => ui.art !== null && !ui.connecting);
const loadingLabel = computed(() => (ui.art ? 'Solo' : 'Loading...'));
const defaultServer = `${window.location.hostname}:${DEFAULT_SERVER_PORT}`;
/** Twice the UI unit matches a world pixel, when the window has the height for it. */
const logoScale = window.innerHeight >= 640 ? 2 : 1;

function textOf(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

function numberOf(event: Event): number {
  return Number((event.target as HTMLInputElement).value);
}
</script>

<style scoped>
.title {
  justify-content: safe center;
}

.title-logo {
  flex: none;
  max-width: 100%;
  object-fit: contain;
}

.title-columns {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: stretch;
  gap: calc(var(--u) * 6);
}

.title-play,
.title-info {
  width: calc(var(--u) * 150);
  max-width: 100%;
}

.title-solo {
  margin: calc(var(--u) * 4) 0 calc(var(--u) * 6);
}

.title-coop {
  margin-top: calc(var(--u) * 4);
}

.title-error {
  margin-top: calc(var(--u) * 4);
  color: var(--blood-bright);
}

.title-keys {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--u) calc(var(--u) * 5);
  margin: calc(var(--u) * 6) 0;
}

.title-keys dt {
  color: var(--amber);
}

.title-keys dd {
  color: var(--bone-dim);
}

.title-best {
  color: var(--sick);
}

.title-credit {
  display: flex;
  flex: none;
  align-items: center;
  gap: calc(var(--u) * 2);
  color: #d9c27a;
}

.title-omega {
  width: calc(var(--u) * 7);
  height: auto;
}
</style>
