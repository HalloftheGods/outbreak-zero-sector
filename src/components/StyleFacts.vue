<template>
  <ul class="stat-bars">
    <li v-for="fact in styleFacts(gameStyle)" :key="fact.key" class="stat-bar">
      <span class="stat-bar-label">{{ fact.label }}</span>
      <span class="stat-bar-value">{{ fact.value }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/** One style's facts, stacked like a mode's: a short label and a short value on each row. */
import type { GameStyle } from '../../shared/game-style.ts';
import { styleFacts } from '../game/style-select-view.ts';

defineProps<{ gameStyle: GameStyle }>();
</script>

<style scoped>
.stat-bars {
  display: grid;
  grid-template-columns: max-content max-content;
  gap: calc(var(--u) * 4) calc(var(--u) * 8);
  margin: 0;
  padding: 0;
  list-style: none;
}

.stat-bar {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
  min-height: calc(var(--u) * 9);
}

.stat-bar-label {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 9);
  text-transform: uppercase;
}

.stat-bar-value {
  color: var(--bone);
  font-size: calc(var(--u) * 9);
  text-transform: uppercase;
}
</style>
