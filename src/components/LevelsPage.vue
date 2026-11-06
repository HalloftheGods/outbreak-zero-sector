<template>
  <TitlePage heading="Levels" size="wide" class="levels-screen" @close="emit('close')">
    <div class="levels-grid">
      <component
        :is="row.tag"
        v-for="row in rows"
        :key="row.number"
        class="level-card px-frame"
        :class="{ 'is-locked': !row.unlocked, 'is-cleared': row.cleared, 'is-startable': row.unlocked }"
        :type="row.unlocked ? 'button' : undefined"
        :aria-label="row.startLabel"
        @click="choose(row.number)"
      >
        <div class="level-thumb-frame">
          <SpriteImg :sprite="row.thumbnail" :scale="1" class="level-thumb-img" />
          <span v-if="!row.unlocked" class="level-lock-tag">LOCKED</span>
          <span v-else-if="row.cleared" class="level-clear-tag">CLEARED</span>
        </div>

        <div class="level-info">
          <div class="level-meta-top">
            <span class="level-num">LEVEL {{ row.number < 10 ? `0${row.number}` : row.number }}</span>
            <span class="level-theme-badge" :style="{ '--swatch': row.swatch }">{{ row.themeLabel }}</span>
          </div>

          <h3 class="level-name">{{ row.unlocked ? row.title : 'CLASSIFIED SECTOR' }}</h3>

          <div class="level-stats">
            <span class="level-stat-item">
              <span class="stat-label">HORDES:</span>
              <span class="stat-val">{{ row.hordes }}</span>
            </span>
            <span class="level-stat-item">
              <span class="stat-label">DIFF:</span>
              <span class="stat-val">x{{ row.difficulty.toFixed(2) }}</span>
            </span>
          </div>

          <div v-if="!row.unlocked" class="level-lock-hint">
            SURVIVE LEVEL {{ row.number - 1 }} TO UNLOCK
          </div>
          <div v-else class="level-start-hint">START &#9654;</div>
        </div>
      </component>
    </div>
  </TitlePage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { FINAL_LEVEL, LEVELS } from '../../shared/levels.ts';
import { buildLevelThumbnail } from '../art/level-thumbnails.ts';
import { isLevelUnlocked, loadLevelProgress } from '../game/level-progress.ts';
import { LEVEL_SWATCH } from '../game/level-swatches.ts';
import SpriteImg from './SpriteImg.vue';
import TitlePage from './TitlePage.vue';

const emit = defineEmits<{ close: []; start: [level: number] }>();
const progress = loadLevelProgress();

const THEME_NAMES: Readonly<Record<string, string>> = {
  night: 'Night',
  'industrial-dusk': 'Dusk',
  flooded: 'Flooded',
  contaminated: 'Toxic',
  blackout: 'Blackout',
  emergency: 'Emergency',
  snow: 'Blizzard',
  infested: 'Infested',
  burning: 'Inferno',
};

/** Only an unlocked card is a button, so a locked one cannot be pressed even by a stale click. */
function choose(level: number): void {
  if (isLevelUnlocked(level, progress)) emit('start', level);
}

const rows = computed(() =>
  LEVELS.map((level) => {
    const unlocked = isLevelUnlocked(level.number, progress);
    return {
      number: level.number,
      title: level.title,
      theme: level.theme,
      themeLabel: THEME_NAMES[level.theme] ?? level.theme,
      swatch: LEVEL_SWATCH[level.theme],
      hordes: level.hordes,
      difficulty: level.difficulty,
      unlocked,
      tag: unlocked ? 'button' : 'div',
      startLabel: unlocked ? `Start at level ${level.number}: ${level.title}` : undefined,
      thumbnail: buildLevelThumbnail(level.number, unlocked),
      cleared: progress.finished && level.number === FINAL_LEVEL,
    };
  })
);
</script>

<style scoped>
:deep(.px-sheet-body) {
  overflow-y: hidden;
  gap: calc(var(--u) * 2);
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: calc(var(--u) * 1.5);
}

.level-card {
  display: flex;
  gap: calc(var(--u) * 2.5);
  align-items: center;
  padding: calc(var(--u) * 1.25) calc(var(--u) * 2);
  background: rgba(23, 24, 31, 0.78);
  border: calc(var(--u) * 0.5) solid var(--ink-line);
}

.level-card.is-startable {
  width: 100%;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.level-card.is-startable:hover,
.level-card.is-startable:focus-visible {
  border-color: var(--amber);
  outline: none;
}

.level-start-hint {
  color: var(--amber);
  font-size: calc(var(--u) * 3.5);
  letter-spacing: calc(var(--u) * 0.5);
}

.level-card.is-locked {
  opacity: 0.7;
}

.level-card.is-cleared {
  border-color: var(--amber);
}

.level-thumb-frame {
  position: relative;
  flex: none;
  border: calc(var(--u) * 0.5) solid var(--ink-line);
  background: var(--ink);
  line-height: 0;
  overflow: hidden;
}

.level-thumb-img {
  display: block;
}

.level-lock-tag {
  position: absolute;
  bottom: calc(var(--u) * 0.5);
  right: calc(var(--u) * 0.5);
  background: rgba(11, 12, 16, 0.92);
  color: var(--bone-dim);
  font-size: calc(var(--u) * 3.5);
  padding: 0 calc(var(--u) * 1);
  border: calc(var(--u) * 0.5) solid var(--ink-line);
}

.level-clear-tag {
  position: absolute;
  bottom: calc(var(--u) * 0.5);
  right: calc(var(--u) * 0.5);
  background: rgba(11, 12, 16, 0.92);
  color: var(--amber);
  font-size: calc(var(--u) * 3.5);
  padding: 0 calc(var(--u) * 1);
  border: calc(var(--u) * 0.5) solid var(--amber);
}

.level-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 0.75);
  min-width: 0;
}

.level-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: calc(var(--u) * 1.5);
}

.level-num {
  color: var(--amber);
  font-weight: 700;
  font-size: calc(var(--u) * 4.5);
  letter-spacing: calc(var(--u) * 0.5);
}

.level-theme-badge {
  font-size: calc(var(--u) * 3.5);
  color: var(--bone-dim);
  background: rgba(11, 12, 16, 0.85);
  padding: 0 calc(var(--u) * 1);
  border-left: calc(var(--u) * 1) solid var(--swatch);
  text-transform: uppercase;
}

.level-name {
  margin: 0;
  font-size: calc(var(--u) * 5.5);
  color: var(--bone);
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-stats {
  display: flex;
  gap: calc(var(--u) * 2.5);
  font-size: calc(var(--u) * 4);
}

.level-stat-item {
  display: flex;
  gap: calc(var(--u) * 0.75);
}

.stat-label {
  color: var(--bone-dim);
}

.stat-val {
  color: var(--bone);
}

.level-lock-hint {
  font-size: calc(var(--u) * 3.5);
  color: var(--blood-bright);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
