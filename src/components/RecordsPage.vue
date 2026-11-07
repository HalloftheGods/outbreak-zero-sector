<template>
  <section class="px-title-scale mag-screen" aria-label="Records" @pointerdown="beginSwipe" @pointerup="finishSwipe">
    <div class="mag-book" :class="`is-${mode}`">
      <div :key="shownKey" class="mag-open rb-open" :class="{ 'is-solo': mode === 'single' }">
        <RecordLeaf
          v-for="(leaf, index) in shown"
          :key="leaf.id"
          :leaf
          :side="mode === 'single' || index === 0 ? 'left' : 'right'"
          :folio="RECORD_LEAVES.indexOf(leaf) + 1"
          :book
        />
      </div>
    </div>

    <nav class="mag-nav" aria-label="Record book pages">
      <MenuLink class="mag-nav-link" @press="emit('close')">Back</MenuLink>
      <span class="mag-nav-page" aria-live="polite">{{ leafLabel(at, mode) }}</span>
      <MenuLink class="mag-nav-link" silent :disabled="atStart" @press="turn(-1)">Prev</MenuLink>
      <MenuLink class="mag-nav-link is-next" silent :disabled="atEnd" @press="turn(1)">Next</MenuLink>
    </nav>
  </section>
</template>

<script setup lang="ts">
/** Records as a printed record book: personal bests, the ledger, the Daily Night and the last seven nights. */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { trackTitlePage } from '../game/analytics/index.ts';
import { loadDailyLog } from '../game/daily-night.ts';
import type { UiState } from '../game/hud-state.ts';
import { swipeStep, turnKeyStep } from '../game/magazine-controller.ts';
import { dailySummary, leafLabel, openLeaves, RECORD_LEAVES, turnLeaves, weekLines } from '../game/record-book.ts';
import type { BookMode } from '../game/record-book.ts';
import { recordRows, recordSections } from '../game/title-menu.ts';
import MenuLink from './MenuLink.vue';
import RecordLeaf from './records/RecordLeaf.vue';
import type { RecordBookData } from './records/RecordLeaf.vue';
import './magazine/magazine.css';
import './magazine/magazine-blocks.css';
import './records/record-book.css';
import { useGame } from './use-game.ts';

const { ui } = defineProps<{ ui: UiState }>();
const emit = defineEmits<{ close: [] }>();
const game = useGame();

const log = loadDailyLog();
const book = computed<RecordBookData>(() => ({
  sections: recordSections(ui.best, ui.bestTrip),
  rows: recordRows(ui.leaderboard),
  daily: dailySummary(log),
  week: weekLines(log),
}));

/** The same test as How to Play: a window taller than it is wide reads one page at a time. */
const tall = window.matchMedia('(max-aspect-ratio: 1/1)');
const mode = ref<BookMode>(tall.matches ? 'single' : 'spread');
const at = ref(0);
const shown = computed(() => openLeaves(at.value, mode.value));
const shownKey = computed(() => shown.value.map((leaf) => leaf.id).join('-'));
const atStart = computed(() => turnLeaves(at.value, -1, mode.value) === at.value);
const atEnd = computed(() => turnLeaves(at.value, 1, mode.value) === at.value);

function turn(by: number): void {
  const next = turnLeaves(at.value, by, mode.value);
  const stays = next === at.value;
  if (stays) return;
  at.value = next;
  game.playUi('click');
}

function onKey(event: KeyboardEvent): void {
  const leaving = event.code === 'Escape' && !event.repeat;
  const by = turnKeyStep(event.code);
  const turning = by !== 0;
  if (leaving) emit('close');
  if (turning) turn(by);
}

let swipeFrom: { readonly x: number; readonly y: number } | null = null;
function beginSwipe(event: PointerEvent): void {
  const touching = event.pointerType !== 'mouse';
  swipeFrom = touching ? { x: event.clientX, y: event.clientY } : null;
}
function finishSwipe(event: PointerEvent): void {
  const from = swipeFrom;
  swipeFrom = null;
  const by = from ? swipeStep(event.clientX - from.x, event.clientY - from.y) : 0;
  const turning = by !== 0;
  if (turning) turn(by);
}

function matchWindow(): void {
  mode.value = tall.matches ? 'single' : 'spread';
}

onMounted(() => {
  trackTitlePage('records');
  window.addEventListener('keydown', onKey);
  tall.addEventListener('change', matchWindow);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  tall.removeEventListener('change', matchWindow);
});
</script>
