<template>
  <TitlePage heading="Levels" @close="emit('close')">
    <ol class="px-rows">
      <li v-for="row in rows" :key="row.number" class="px-row" :class="{ 'is-locked': !row.unlocked }">
        <span class="levels-number">{{ row.number }}</span>
        <span v-if="row.unlocked" class="levels-swatch" :style="{ '--swatch': row.swatch }" aria-hidden="true" />
        <span v-else class="levels-swatch is-unknown" aria-hidden="true">?</span>
        <span class="levels-title">{{ row.unlocked ? row.title : '???' }}</span>
        <span v-if="row.cleared" class="levels-mark">GAME CLEARED</span>
      </li>
    </ol>
  </TitlePage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FINAL_LEVEL, LEVELS } from '../../shared/levels.ts';
import { isLevelUnlocked, loadLevelProgress } from '../game/level-progress.ts';
import { LEVEL_SWATCH } from '../game/level-swatches.ts';
import TitlePage from './TitlePage.vue';

const emit = defineEmits<{ close: [] }>();
const progress = loadLevelProgress();

const rows = computed(() =>
  LEVELS.map((level) => ({
    number: level.number,
    title: level.title,
    swatch: LEVEL_SWATCH[level.theme],
    unlocked: isLevelUnlocked(level.number, progress),
    cleared: progress.finished && level.number === FINAL_LEVEL,
  }))
);
</script>

<style scoped>
.px-row.is-locked {
  color: var(--bone-dim);
}

.levels-number {
  min-width: calc(var(--u) * 12);
  color: var(--amber);
}

.levels-swatch {
  flex: none;
  display: grid;
  place-items: center;
  width: calc(var(--u) * 8);
  height: calc(var(--u) * 8);
  background: var(--swatch);
  outline: calc(var(--u) * 0.5) solid var(--bone-dim);
}

.levels-swatch.is-unknown {
  background: var(--ink);
  color: var(--bone-dim);
}

.levels-title {
  flex: 1;
  text-transform: uppercase;
}

.levels-mark {
  color: var(--amber);
}
</style>
