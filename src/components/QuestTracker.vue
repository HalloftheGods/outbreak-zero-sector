<template>
  <section v-if="tracker.lines.length" class="quest-tracker" aria-label="Work">
    <p class="quest-summary">{{ tracker.summary }}</p>
    <ul class="quest-lines">
      <li v-for="line in tracker.lines" :key="line.merchant" class="quest-line" :class="{ 'is-ready': line.ready, 'is-risk': line.atRisk }">
        <span class="quest-title">{{ line.title }}</span>
        <span class="quest-cells" role="img" :aria-label="`${line.bar.value}`">
          <span v-for="n in line.bar.slots" :key="n" class="quest-cell" :class="{ 'is-on': n <= line.bar.filled }" />
        </span>
        <span class="quest-value">{{ line.ready ? 'Ready' : line.bar.value }}</span>
      </li>
    </ul>
    <p v-if="tracker.warning" class="quest-warning">{{ tracker.warning }}</p>
  </section>
</template>

<script setup lang="ts">
/** The open jobs under the treasure chip: a line each, live trip tallies in town, one "Work: N of M ready" line on a phone, with a single "Lost if you die" under the lines. */
import { computed } from 'vue';
import type { HomeUi } from '../game/home-hud.ts';
import { questTracker } from '../game/home/quest-view.ts';

const { home } = defineProps<{ home: HomeUi }>();

const tracker = computed(() => questTracker(home));
</script>

<style scoped>
.quest-tracker {
  display: flex;
  flex-direction: column;
  gap: var(--u);
  padding: calc(var(--u) * 2) calc(var(--u) * 4);
  background: rgba(11, 12, 16, 0.78);
  color: var(--bone);
}

.quest-lines {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.quest-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--u) calc(var(--u) * 3);
}

.quest-title {
  color: var(--bone-dim);
}

.quest-cells {
  display: flex;
  gap: var(--u);
}

.quest-cell {
  width: calc(var(--u) * 5);
  height: calc(var(--u) * 4);
  background: var(--ink-line);
}

.quest-cell.is-on {
  background: var(--sick);
}

.quest-line.is-ready .quest-title,
.quest-line.is-ready .quest-value {
  color: var(--amber);
}

.quest-line.is-risk .quest-value {
  color: var(--blood-bright);
}

/* One line for the whole list, however many counts are only this trip's. */
.quest-warning {
  margin: 0;
  color: var(--blood-bright);
}

.quest-summary {
  display: none;
  margin: 0;
  color: var(--bone-dim);
}

@media (max-width: 640px) {
  .quest-summary {
    display: block;
  }

  .quest-lines,
  .quest-warning {
    display: none;
  }
}
</style>
