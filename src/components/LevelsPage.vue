<template>
  <TitlePage heading="Levels" size="wide" @close="emit('close')">
    <div class="levels-grid">
      <div
        v-for="row in rows"
        :key="row.number"
        class="level-card px-frame"
        :class="{ 'is-locked': !row.unlocked, 'is-cleared': row.cleared }"
      >
        <div class="level-thumb-frame">
          <SpriteImg :sprite="row.thumbnail" :scale="1.5" class="level-thumb-img" />
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
              <span class="stat-label">DIFFICULTY:</span>
              <span class="stat-val">x{{ row.difficulty.toFixed(2) }}</span>
            </span>
          </div>

          <div v-if="!row.unlocked" class="level-lock-hint">
            SURVIVE LEVEL {{ row.number - 1 }} TO UNLOCK
          </div>
        </div>
      </div>
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

const emit = defineEmits<{ close: [] }>();
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
      thumbnail: buildLevelThumbnail(level.number, unlocked),
      cleared: progress.finished && level.number === FINAL_LEVEL,
    };
  })
);
</script>

<style scoped>
.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--u) * 190), 1fr));
  gap: calc(var(--u) * 4);
}

.level-card {
  display: flex;
  gap: calc(var(--u) * 4);
  align-items: center;
  padding: calc(var(--u) * 3);
  background: rgba(23, 24, 31, 0.78);
  border: calc(var(--u) * 0.5) solid var(--ink-line);
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
  bottom: calc(var(--u) * 1);
  right: calc(var(--u) * 1);
  background: rgba(11, 12, 16, 0.92);
  color: var(--bone-dim);
  font-size: calc(var(--u) * 4.5);
  padding: calc(var(--u) * 0.5) calc(var(--u) * 1.5);
  border: calc(var(--u) * 0.5) solid var(--ink-line);
}

.level-clear-tag {
  position: absolute;
  bottom: calc(var(--u) * 1);
  right: calc(var(--u) * 1);
  background: rgba(11, 12, 16, 0.92);
  color: var(--amber);
  font-size: calc(var(--u) * 4.5);
  padding: calc(var(--u) * 0.5) calc(var(--u) * 1.5);
  border: calc(var(--u) * 0.5) solid var(--amber);
}

.level-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 1.5);
  min-width: 0;
}

.level-meta-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: calc(var(--u) * 2);
}

.level-num {
  color: var(--amber);
  font-weight: 700;
  font-size: calc(var(--u) * 5.5);
  letter-spacing: calc(var(--u) * 0.5);
}

.level-theme-badge {
  font-size: calc(var(--u) * 4.5);
  color: var(--bone-dim);
  background: rgba(11, 12, 16, 0.85);
  padding: calc(var(--u) * 0.5) calc(var(--u) * 2);
  border-left: calc(var(--u) * 1.5) solid var(--swatch);
  text-transform: uppercase;
}

.level-name {
  margin: 0;
  font-size: calc(var(--u) * 6.5);
  color: var(--bone);
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.level-stats {
  display: flex;
  gap: calc(var(--u) * 3);
  font-size: calc(var(--u) * 5);
}

.level-stat-item {
  display: flex;
  gap: calc(var(--u) * 1);
}

.stat-label {
  color: var(--bone-dim);
}

.stat-val {
  color: var(--bone);
}

.level-lock-hint {
  font-size: calc(var(--u) * 4);
  color: var(--blood-bright);
  text-transform: uppercase;
}
</style>
