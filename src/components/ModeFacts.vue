<template>
  <ul class="stat-bars" :class="{ 'is-compact': compact }" :aria-hidden="compact || undefined">
    <li v-for="fact in shown" :key="fact.key" class="stat-bar">
      <span v-if="!compact" class="stat-bar-label">{{ fact.label }}</span>
      <span v-if="fact.filled !== undefined" class="stat-bar-cells" role="img" :aria-label="`${fact.label} ${fact.value}`">
        <span v-for="n in PLAYER_SLOTS" :key="n" class="stat-bar-cell" :class="{ 'is-on': n <= (fact.filled ?? 0) }" />
      </span>
      <span v-else class="stat-bar-value">{{ fact.value }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * One mode's facts, stacked like a survivor's StatBars: Players as slotted cells, the rest as a short value.
 * Compact keeps only the Players cells, the thumbnail under a roster tile.
 */
import { computed } from 'vue';
import { modeFacts, PLAYER_SLOTS } from '../game/mode-select-view.ts';
import type { PlayMode } from '../game/play-flow.ts';

const { mode, compact = false } = defineProps<{ mode: PlayMode; compact?: boolean }>();
const shown = computed(() => modeFacts(mode).filter((fact) => !compact || fact.filled !== undefined));
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

.stat-bars.is-compact {
  grid-template-columns: max-content;
}

.is-compact .stat-bar {
  min-height: 0;
}

.is-compact .stat-bar-cells {
  gap: max(1px, calc(var(--u) / 2));
}

.is-compact .stat-bar-cell {
  width: calc(var(--u) * 5);
  height: calc(var(--u) * 2);
}
</style>
