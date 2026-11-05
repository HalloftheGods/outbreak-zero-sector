<template>
  <nav class="touch-pad" data-touch-pad aria-label="Touch controls">
    <button
      v-for="each in TOUCH_BUTTONS"
      :key="each.code"
      class="touch-button"
      :class="{ 'is-held': held.includes(each.code) }"
      type="button"
      @pointerdown.prevent="press(each.code)"
      @pointerup="release(each.code)"
      @pointercancel="release(each.code)"
      @pointerleave="release(each.code)"
      @mousedown.stop
      @contextmenu.prevent
    >
      {{ each.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { TOUCH_BUTTONS } from '../game/touch-pad.ts';
import { useGame } from './use-game.ts';

const { input } = useGame();
const held = ref<string[]>([]);

function press(code: string): void {
  held.value = [...held.value, code];
  input.padDown(code);
}

function release(code: string): void {
  const wasDown = held.value.includes(code);
  if (!wasDown) return;
  held.value = held.value.filter((each) => each !== code);
  input.padUp(code);
}

// The run can end under a held thumb, and the next one must not start with Search down.
onBeforeUnmount(() => held.value.forEach((code) => input.padUp(code)));
</script>
