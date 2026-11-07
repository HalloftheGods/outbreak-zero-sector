<template>
  <div v-if="panels.length > 0" class="work-shelf" role="radiogroup" aria-label="Work" @keydown="onKey">
    <button
      v-for="(panel, index) in panels"
      :key="panel.id"
      :ref="(el) => setTile(index, el)"
      class="work-tile px-frame"
      :class="{ 'is-chosen': index === chosen, 'is-ready': panel.state === 'ready', 'is-busy': panel.state === 'busy' }"
      type="button"
      role="radio"
      :aria-checked="index === chosen"
      :aria-label="`${panel.title}, ${stateWord(panel)}`"
      :tabindex="index === chosen ? 0 : -1"
      @click="emit('choose', index)"
    >
      <span class="work-state">{{ stateWord(panel) }}</span>
      <span class="work-name">{{ panel.title }}</span>
    </button>
  </div>
  <p v-else class="work-shelf work-empty px-note">No work today.</p>
</template>

<script setup lang="ts">
/**
 * The merchant's work list: a row of framed tiles, one per job, as the shelf has for items. The open job comes
 * first. Arrows move the pick and the focus together, wrapping; accepting is the panel's job, never a tile's.
 */
import { rosterStep } from '../game/character-select-view.ts';
import { stateWord } from '../game/home/quest-screen.ts';
import type { QuestPanel } from '../game/home/quest-view.ts';

const { panels, chosen } = defineProps<{ panels: readonly QuestPanel[]; chosen: number }>();
const emit = defineEmits<{ choose: [index: number] }>();

const tiles = new Map<number, HTMLElement>();

function setTile(index: number, el: unknown): void {
  const isTile = el instanceof HTMLElement;
  if (isTile) tiles.set(index, el);
}

function onKey(event: KeyboardEvent): void {
  const next = rosterStep(chosen, event.key, panels.length);
  const moves = next !== null;
  if (!moves) return;
  event.preventDefault();
  event.stopPropagation();
  emit('choose', next);
  tiles.get(next)?.focus();
}

/** Puts the keyboard on the chosen tile, as a radio group lands on its checked option. */
defineExpose({ focus: () => tiles.get(chosen)?.focus() });
</script>

<style scoped>
.work-shelf {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: calc(var(--u) * 3);
  min-height: calc(var(--u) * 50);
  margin: 0;
  padding: var(--u);
}

.work-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: none;
}

.work-tile {
  --edge: var(--ink-line);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u) * 2);
  min-width: 0;
  border: 0;
  padding: calc(var(--u) * 3);
  background: var(--ink-raised);
  color: var(--bone-dim);
  font: inherit;
  text-align: center;
  cursor: pointer;
  outline: none;
}

.work-tile:hover,
.work-tile:focus-visible {
  --edge: var(--bone-dim);
  color: var(--bone);
}

.work-tile.is-chosen {
  --edge: var(--amber);
  background: rgba(232, 163, 61, 0.14);
  color: var(--amber);
}

.work-tile.is-busy {
  opacity: 0.6;
}

.work-state {
  font-size: calc(var(--u) * 5);
  text-transform: uppercase;
}

.work-tile.is-ready .work-state {
  color: var(--sick);
  font-weight: 700;
}

.work-name {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(var(--u) * 6);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
