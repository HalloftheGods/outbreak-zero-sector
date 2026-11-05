<template>
  <fieldset class="character">
    <legend class="px-label">Survivor</legend>
    <div class="character-roster" role="radiogroup" aria-label="Survivor">
      <button
        v-for="(each, index) in CHARACTERS"
        :key="each.id"
        class="character-option"
        :class="{ 'is-chosen': index === chosen }"
        type="button"
        role="radio"
        :aria-checked="index === chosen"
        :aria-label="`${each.name}: ${each.trait}`"
        @mouseenter="game.playUi('hover')"
        @click="choose(index)"
      >
        <SpriteImg v-if="art" :sprite="art.survivors[index].portrait" />
      </button>
    </div>
    <p class="character-name">{{ picked.name }}</p>
    <p class="character-trait">{{ picked.trait }}</p>
  </fieldset>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { characterOf, CHARACTERS } from '../../shared/characters.ts';
import type { ArtBook } from '../art/types.ts';
import { loadCharacter, saveCharacter } from '../game/character-pref.ts';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';

const { art } = defineProps<{ art: ArtBook | null }>();
const game = useGame();

const chosen = ref(loadCharacter());
const picked = computed(() => characterOf(chosen.value));

function choose(index: number): void {
  game.playUi('click');
  chosen.value = index;
  saveCharacter(index);
}
</script>

<style scoped>
.character {
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.character-roster {
  display: flex;
  justify-content: space-between;
  gap: var(--u);
}

.character-option {
  flex: 1 1 0;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  min-width: 0;
  min-height: calc(var(--u) * 29);
  padding: 0;
  overflow: hidden;
  background: var(--ink-raised);
  border: 1px solid var(--ink-line);
  cursor: pointer;
}

.character-option img {
  flex: none;
}

.character-option:hover,
.character-option:focus-visible {
  border-color: var(--bone-dim);
}

.character-option.is-chosen {
  border-color: var(--amber);
  background: rgba(232, 163, 61, 0.14);
}

.character-name {
  margin: calc(var(--u) * 3) 0 0;
  color: var(--amber);
}

.character-trait {
  margin: var(--u) 0 0;
  color: var(--bone-dim);
}
</style>
