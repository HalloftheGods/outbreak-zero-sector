<template>
  <fieldset class="difficulty">
    <legend class="px-label">Difficulty</legend>
    <div class="difficulty-options">
      <PixelButton
        v-for="each in DIFFICULTIES"
        :key="each.id"
        class="difficulty-option"
        :class="{ 'is-chosen': each.id === chosen }"
        silent
        @press="choose(each.id)"
      >
        {{ each.label }}
      </PixelButton>
    </div>
    <p class="difficulty-blurb">{{ blurb }}</p>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DIFFICULTIES, difficultyDef } from '../../shared/difficulty.ts';
import type { DifficultyId } from '../../shared/difficulty.ts';
import { loadDifficulty, saveDifficulty } from '../game/difficulty-pref.ts';
import PixelButton from './PixelButton.vue';

const chosen = ref<DifficultyId>(loadDifficulty());
const blurb = computed(() => difficultyDef(chosen.value).blurb);

function choose(id: DifficultyId): void {
  chosen.value = id;
  saveDifficulty(id);
}
</script>

<style scoped>
.difficulty {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.difficulty-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--u) * 2);
}

.difficulty-blurb {
  margin: calc(var(--u) * 3) 0 0;
  color: var(--bone-dim);
}
</style>
