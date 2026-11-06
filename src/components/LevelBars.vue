<template>
  <ul class="stat-bars">
    <li v-for="meter in meters" :key="meter.key" class="stat-bar">
      <span class="stat-bar-label">{{ meter.label }}</span>
      <span class="stat-bar-cells" role="img" :aria-label="`${meter.label} ${meter.slots} of ${LEVEL_METER_SLOTS}`">
        <span v-for="n in LEVEL_METER_SLOTS" :key="n" class="stat-bar-cell" :class="{ 'is-on': n <= meter.slots }" />
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * One level's four slotted meters beside its big card on the Levels page, drawn like DifficultyBars:
 * every row is red, since more of any of them is worse.
 */
import { computed } from 'vue';
import type { LevelDef } from '../../shared/levels.ts';
import { LEVEL_METER_SLOTS, levelMeters } from '../game/level-meters.ts';

const { def } = defineProps<{ def: LevelDef }>();
const meters = computed(() => levelMeters(def));
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
</style>
