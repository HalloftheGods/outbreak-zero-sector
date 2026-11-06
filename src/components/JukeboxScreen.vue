<template>
  <section class="px-screen">
    <div class="px-panel px-frame jukebox">
      <h2 class="px-heading">Jukebox</h2>
      <p class="px-note" role="status" aria-live="polite">{{ status }}</p>
      <p class="px-note">{{ findsLine }}</p>

      <ul class="jukebox-list" @keydown="onListKey">
        <li v-for="entry in tracks" :key="entry.id">
          <button
            class="jukebox-item px-frame"
            :class="{ 'is-playing': entry.id === playing?.id }"
            type="button"
            :aria-pressed="entry.id === playing?.id"
            @click="toggle(entry)"
          >
            <span class="jukebox-name">{{ entry.name }}</span>
            <span class="jukebox-where">{{ entry.id === playing?.id ? 'PLAYING' : entry.where }}</span>
          </button>
        </li>
      </ul>

      <PixelButton :disabled="playing === null" @press="stop">Stop</PixelButton>
      <PixelButton @press="game.home.closeStation()">Close</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { loadLevelProgress } from '../game/level-progress.ts';
import { findCount, jukeboxEntries, musicEntries, playEntry } from '../game/sound-test.ts';
import type { MusicEntry } from '../game/sound-test.ts';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

const game = useGame();
const progress = loadLevelProgress();
const tracks = jukeboxEntries(progress);
const finds = findCount(musicEntries(progress));
const findsLine = `Radio finds: ${finds.found} of ${finds.total}. Radios out in the towns give up the rest.`;
const playing = ref<MusicEntry | null>(null);
const status = computed(() => (playing.value ? `Playing: ${playing.value.name}` : 'Choose a track. Choose it again to stop.'));
let isOpen = true;

function stop(): void {
  game.audio.stopPreview();
  playing.value = null;
}

async function toggle(entry: MusicEntry): Promise<void> {
  const stopping = playing.value?.id === entry.id;
  if (stopping) return stop();
  await game.audio.unlock();
  const started = isOpen && playEntry(entry, game.audio, () => {
    const stillThis = playing.value?.id === entry.id;
    if (stillThis) playing.value = null;
  });
  playing.value = started ? entry : null;
}

/** Arrows walk the list, so a keyboard gets through thirty tracks without thirty Tabs. */
function onListKey(event: KeyboardEvent): void {
  const forward = event.code === 'ArrowDown' || event.code === 'ArrowRight';
  const back = event.code === 'ArrowUp' || event.code === 'ArrowLeft';
  const notAnArrow = !forward && !back;
  if (notAnArrow) return;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>('.jukebox-item')];
  const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const onAnItem = at >= 0;
  if (!onAnItem) return;
  event.preventDefault();
  buttons[(at + (forward ? 1 : -1) + buttons.length) % buttons.length]?.focus();
}

/** The bunker's own music goes quiet while the jukebox is open, and comes back when it closes. */
onMounted(async () => {
  await game.audio.unlock();
  if (isOpen) game.audio.enterPreview();
});

onBeforeUnmount(() => {
  isOpen = false;
  game.audio.leavePreview();
});
</script>

<style scoped>
.jukebox {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 200);
  max-width: 100%;
  max-height: 100%;
}

.jukebox-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--u) * 84), 1fr));
  gap: calc(var(--u) * 2);
  margin: 0;
  padding: calc(var(--u) * 2);
  overflow-y: auto;
  list-style: none;
}

.jukebox-item {
  --edge: var(--ink-line);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--u);
  width: 100%;
  min-height: 44px;
  border: 0;
  padding: calc(var(--u) * 2) calc(var(--u) * 4);
  background: rgba(23, 24, 31, 0.72);
  color: var(--bone);
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.jukebox-item:hover,
.jukebox-item:focus-visible,
.jukebox-item.is-playing {
  --edge: var(--amber);
  outline: none;
}

.jukebox-item.is-playing,
.jukebox-item.is-playing .jukebox-where {
  color: var(--amber);
}

.jukebox-where {
  color: var(--bone-dim);
  font-size: 0.75em;
}
</style>
