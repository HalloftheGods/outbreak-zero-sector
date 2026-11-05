<template>
  <CreditsScreen v-if="rolling" @done="game.toMenu()" />
  <VictoryScreen v-else :result :art @continue="roll" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ArtBook } from '../art/types.ts';
import type { RunResult } from '../game/hud-state.ts';
import CreditsScreen from './CreditsScreen.vue';
import { useGame } from './use-game.ts';
import VictoryScreen from './VictoryScreen.vue';

defineProps<{ result: RunResult; art: ArtBook | null }>();
const game = useGame();
const rolling = ref(false);

/** A win shows the tally, then the credits, then the title. */
function roll(): void {
  rolling.value = true;
  game.endingMusic('credits');
}
</script>