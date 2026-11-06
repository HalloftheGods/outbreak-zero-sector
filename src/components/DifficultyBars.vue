<template>
  <ul class="stat-bars" :class="{ 'is-compact': compact }" :aria-hidden="compact || undefined">
    <li v-for="meter in meters" :key="meter.key" class="stat-bar" :class="{ 'is-ammo': meter.key === 'ammo' }">
      <span v-if="!compact" class="stat-bar-label">{{ meter.label }}</span>
      <span class="stat-bar-cells" role="img" :aria-label="`${meter.label} ${meter.slots} of ${METER_SLOTS}`">
        <span v-for="n in METER_SLOTS" :key="n" class="stat-bar-cell" :class="{ 'is-on': n <= meter.slots }" />
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * One difficulty's four slotted meters, drawn like a survivor's StatBars. The zombie rows are red
 * (more bars, worse); Ammo is green (more bars, more rounds). Compact is the thumbnail under a roster tile.
 */
import { computed } from 'vue';
import type { DifficultyDef } from '../../shared/difficulty.ts';
import { METER_SLOTS, difficultyMeters } from '../game/difficulty-meters.ts';

const { def, compact = false } = defineProps<{ def: DifficultyDef; compact?: boolean }>();
const meters = computed(() => difficultyMeters(def));
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
  background: var(--blood-bright);
}

.stat-bar.is-ammo .stat-bar-cell.is-on {
  background: var(--sick);
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
