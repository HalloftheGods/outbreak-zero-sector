<template>
  <section class="px-screen">
    <div class="px-panel px-frame garage">
      <h2 class="px-heading">Level map</h2>
      <p class="px-note">Pick where the van goes. The room can go as far as its best player has.</p>
      <LevelGrid :rows @choose="game.home.pickLevel($event)" />
      <PixelButton @press="game.home.closeStation()">Close</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { LEVELS } from '../../shared/levels.ts';
import { buildLevelThumbnail } from '../art/level-thumbnails.ts';
import type { HomeUi } from '../game/home-hud.ts';
import { garageLevels } from '../game/home-screens.ts';
import { THEME_NAMES } from '../game/level-select.ts';
import { LEVEL_SWATCH } from '../game/level-swatches.ts';
import LevelGrid from './LevelGrid.vue';
import type { LevelGridRow } from './LevelGrid.vue';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

const { home } = defineProps<{ home: HomeUi }>();
const game = useGame();

const rows = computed<readonly LevelGridRow[]>(() =>
  garageLevels(home).map((level) => {
    const def = LEVELS[level.number - 1];
    return {
      number: level.number,
      title: level.title,
      themeLabel: THEME_NAMES[def.theme] ?? def.theme,
      swatch: LEVEL_SWATCH[def.theme],
      hordes: def.hordes,
      difficulty: def.difficulty,
      unlocked: level.selectable,
      tag: level.selectable ? 'button' : 'div',
      startLabel: level.selectable ? `Drive to level ${level.number}: ${level.title}` : undefined,
      thumbnail: buildLevelThumbnail(level.number, level.selectable),
      cleared: false,
      picked: level.picked,
      badge: level.state === 'replay' ? 'REPLAY' : undefined,
      lockHint: 'NOT REACHED YET',
      actionHint: level.picked ? 'PICKED' : 'GO',
    };
  })
);
</script>

<style scoped>
.garage {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 560);
  max-width: 100%;
  max-height: 100%;
  overflow-y: auto;
}
</style>
