<template>
  <ul class="stat-bars" :class="{ 'is-compact': compact }" :aria-hidden="compact || undefined">
    <li v-for="bar in bars" :key="bar.key" class="stat-bar" :class="{ 'is-strong': bar.strong }">
      <span v-if="!compact" class="stat-bar-label">{{ bar.label }}</span>
      <span class="stat-bar-cells" role="img" :aria-label="`${bar.filled} of ${STAT_SLOTS}`">
        <span v-for="n in STAT_SLOTS" :key="n" class="stat-bar-cell" :class="{ 'is-on': n <= bar.filled }" />
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * One survivor's five slotted stat bars, label on the left. Compact drops the labels and
 * shrinks the cells to a thumbnail under a roster tile, in the same order, so the shapes compare.
 */
import { computed } from 'vue';
import { STAT_SLOTS } from '../../shared/character-stats.ts';
import { statBarsOf } from '../game/character-select-view.ts';

const { skin, compact = false } = defineProps<{ skin: number; compact?: boolean }>();
const bars = computed(() => statBarsOf(skin));
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
}

.stat-bar-label {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 9);
  text-transform: uppercase;
}

.stat-bar.is-strong .stat-bar-label {
  color: var(--amber);
}

.stat-bar-cells {
  display: flex;
  gap: var(--u);
}

.stat-bar-cell {
  width: calc(var(--u) * 11);
  height: calc(var(--u) * 7);
  background: var(--ink-line);
}

.stat-bar-cell.is-on {
  background: var(--sick);
}

.stat-bar.is-strong .stat-bar-cell.is-on {
  background: var(--amber);
}

.stat-bars.is-compact {
  grid-template-columns: max-content;
  gap: max(1px, calc(var(--u) / 2));
}

.is-compact .stat-bar-cells {
  gap: max(1px, calc(var(--u) / 2));
}

.is-compact .stat-bar-cell {
  width: calc(var(--u) * 5);
  height: calc(var(--u) * 2);
}
</style>
