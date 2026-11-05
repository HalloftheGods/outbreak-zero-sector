<template>
  <nav class="px-menu" aria-label="Main menu">
    <button
      v-for="(item, index) in TITLE_MENU"
      :key="item.page"
      ref="items"
      class="px-menu-item"
      :class="{ 'is-selected': index === selected }"
      type="button"
      :aria-current="index === selected"
      @mousemove="moveTo(index)"
      @focus="select(index)"
      @click="open(index)"
    >
      {{ item.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { isConfirmKey, menuStep, steppedIndex, TITLE_MENU } from '../game/title-menu.ts';
import type { TitlePage } from '../game/title-menu.ts';
import { useGame } from './use-game.ts';

const selected = defineModel<number>({ required: true });
const emit = defineEmits<{ open: [page: TitlePage] }>();
const game = useGame();
const items = useTemplateRef<HTMLButtonElement[]>('items');

function select(index: number): void {
  const alreadyThere = index === selected.value;
  if (alreadyThere) return;
  selected.value = index;
  game.playUi('hover');
}

/**
 * Focus follows the marker, so Space and a screen reader land on the item it shows.
 * The mouse drives this by moving, not by entering: Back must not lose the player's
 * place to whichever item comes back under a resting cursor.
 */
function moveTo(index: number): void {
  select(index);
  items.value?.[index]?.focus({ preventScroll: true });
}

function open(index: number): void {
  game.playUi('click');
  emit('open', TITLE_MENU[index].page);
}

/**
 * Listens as the page bubbles, not in capture: the studio splash stops a key on its way
 * down, so the key that skips the splash never opens a page behind it.
 */
function onKey(event: KeyboardEvent): void {
  const browserShortcut = event.ctrlKey || event.metaKey || event.altKey;
  const step = browserShortcut ? 0 : menuStep(event.code);
  const confirming = !browserShortcut && isConfirmKey(event.code);
  // The marker decides, so a focused button must not answer Enter as well.
  if (step !== 0 || confirming) event.preventDefault();
  if (step !== 0) moveTo(steppedIndex(selected.value, step));
  const opening = confirming && !event.repeat;
  if (opening) open(selected.value);
}

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>
