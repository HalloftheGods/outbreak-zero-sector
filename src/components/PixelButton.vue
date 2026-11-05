<template>
  <button
    class="px-button px-frame"
    :class="{ 'is-primary': primary }"
    type="button"
    :disabled
    @mouseenter="onHover"
    @click="onClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useGame } from './use-game.ts';

const { primary = false, disabled = false, silent = false } = defineProps<{
  primary?: boolean;
  disabled?: boolean;
  /** For actions that already make their own sound. */
  silent?: boolean;
}>();
const emit = defineEmits<{ press: [] }>();
const game = useGame();

function onHover(): void {
  if (!disabled) game.playUi('hover');
}

function onClick(): void {
  if (!silent) game.playUi('click');
  emit('press');
}
</script>
