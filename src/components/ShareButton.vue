<template>
  <PixelButton :disabled="!text" @press="copy">{{ LABELS[state] }}</PixelButton>
</template>

<script setup lang="ts">
/** Copies a line of text for the player to paste anywhere, and says for two seconds whether it worked. */
import { onBeforeUnmount, ref } from 'vue';
import PixelButton from './PixelButton.vue';

const { text } = defineProps<{ text: string | null }>();
const LABELS = { idle: 'Copy result', done: 'Copied', failed: 'Copy failed' } as const;
const state = ref<keyof typeof LABELS>('idle');
let reset: ReturnType<typeof setTimeout> | undefined;

async function copy(): Promise<void> {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    state.value = 'done';
  } catch {
    state.value = 'failed'; // chemx-allow: best-effort the label says it failed, and the player can try again
  }
  clearTimeout(reset);
  reset = setTimeout(() => (state.value = 'idle'), 2000);
}

onBeforeUnmount(() => clearTimeout(reset));
</script>
