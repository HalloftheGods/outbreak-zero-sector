<template>
  <TitlePage heading="Records" @close="emit('close')">
    <section v-for="section in sections" :key="section.style" class="records-section" :aria-label="section.heading">
      <h2 class="px-label records-heading">{{ section.heading }}</h2>
      <dl class="records-stats">
        <div v-for="stat in section.stats" :key="stat.tag" class="records-stat">
          <dt class="px-label">{{ stat.tag }}</dt>
          <dd class="records-value">{{ stat.value }}</dd>
        </div>
      </dl>
    </section>

    <div>
      <p class="px-label">Leaderboard</p>
      <ol v-if="rows.length > 0" class="px-rows">
        <li v-for="row in rows" :key="row.key" class="px-row">
          <span class="records-rank">{{ row.rank }}</span>
          <span class="records-name">{{ row.name }}<span class="records-style"> {{ row.label }}</span></span>
          <span class="records-score">{{ row.score }}</span>
        </li>
      </ol>
      <p v-else class="records-empty">No runs logged yet.</p>
    </div>
  </TitlePage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { UiState } from '../game/hud-state.ts';
import { recordRows, recordSections } from '../game/title-menu.ts';
import TitlePage from './TitlePage.vue';

const { ui } = defineProps<{ ui: UiState }>();
const emit = defineEmits<{ close: [] }>();

const sections = computed(() => recordSections(ui.best, ui.bestTrip));
const rows = computed(() => recordRows(ui.leaderboard));
</script>

<style scoped>
.records-section {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 3);
}

.records-heading {
  margin: 0;
  color: var(--amber);
}

.records-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(var(--u) * 40), 1fr));
  gap: calc(var(--u) * 4);
  margin: 0;
}

.records-stat .px-label {
  margin-bottom: var(--u);
}

.records-value {
  margin: 0;
  font-size: calc(var(--u) * 12);
  font-weight: 700;
  line-height: 1;
  color: var(--bone);
}

.records-rank {
  min-width: calc(var(--u) * 12);
  color: var(--amber);
}

.records-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* A margin, since the compiler drops the space a template leaves at the start of the span. */
.records-style {
  margin-left: calc(var(--u) * 4);
  color: var(--bone-dim);
}

.records-score {
  color: var(--amber);
}

.records-empty {
  margin: 0;
  color: var(--bone-dim);
}
</style>
