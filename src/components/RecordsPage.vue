<template>
  <TitlePage heading="Records" @close="emit('close')">
    <dl class="records-stats">
      <div v-for="stat in stats" :key="stat.tag" class="records-stat">
        <dt class="px-label">{{ stat.tag }}</dt>
        <dd class="records-value">{{ stat.value }}</dd>
      </div>
    </dl>

    <div>
      <p class="px-label">Leaderboard</p>
      <ol v-if="rows.length > 0" class="px-rows">
        <li v-for="row in rows" :key="row.key" class="px-row">
          <span class="records-rank">{{ row.rank }}</span>
          <span class="records-name">{{ row.name }}</span>
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
import { recordRows, recordStats } from '../game/title-menu.ts';
import TitlePage from './TitlePage.vue';

const { ui } = defineProps<{ ui: UiState }>();
const emit = defineEmits<{ close: [] }>();

const stats = computed(() => recordStats(ui.best));
const rows = computed(() => recordRows(ui.leaderboard));
</script>

<style scoped>
.records-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

.records-score {
  color: var(--amber);
}

.records-empty {
  margin: 0;
  color: var(--bone-dim);
}
</style>
