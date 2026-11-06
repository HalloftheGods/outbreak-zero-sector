<template>
  <section class="px-screen">
    <div class="px-panel px-frame jukebox" :style="{ '--card-w': CARD_W }">
      <SceneCard :sprite="art?.ui.stations.jukebox ?? null" :name="plate.name" :line="plate.line">
        <JukeboxFacts :status :rows :hint="findsLine" :radio />
      </SceneCard>
      <JukeboxTracks ref="strip" :tracks :cursor :playing-id="playing?.id ?? null" :radio @toggle="toggle" @cursor="cursor = $event" />
      <footer class="jukebox-foot">
        <template v-if="pages > 1">
          <PixelButton class="jukebox-turn" aria-label="Previous page" @press="turn(-1)">&lt;</PixelButton>
          <span class="jukebox-page">{{ page + 1 }}/{{ pages }}</span>
          <PixelButton class="jukebox-turn" aria-label="Next page" @press="turn(1)">&gt;</PixelButton>
        </template>
        <PixelButton class="jukebox-stop" :disabled="playing === null" @press="stop">Stop</PixelButton>
        <PixelButton class="jukebox-close" @press="game.home.closeStation()">Close</PixelButton>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * The bunker's jukebox, laid out like the survivor select: its framed scene with what plays on the plate, the
 * facts beside it, over a page of track tiles. A tile plays its track, or stops it if it is the one playing.
 */
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { CARD_W } from '../art/difficulty-card.ts';
import type { ArtBook } from '../art/types.ts';
import { jukeboxFacts, jukeboxPlate, JUKEBOX_PAGE, pageCount, pageOf } from '../game/home/jukebox-view.ts';
import { loadFurthestProgress } from '../game/level-progress.ts';
import { findCount, jukeboxEntries, musicEntries, playEntry } from '../game/sound-test.ts';
import type { MusicEntry } from '../game/sound-test.ts';
import JukeboxFacts from './JukeboxFacts.vue';
import JukeboxTracks from './JukeboxTracks.vue';
import PixelButton from './PixelButton.vue';
import SceneCard from './SceneCard.vue';
import { useGame } from './use-game.ts';

const { art = null } = defineProps<{ art?: ArtBook | null }>();
const game = useGame();
const strip = useTemplateRef<InstanceType<typeof JukeboxTracks>>('strip');
const progress = loadFurthestProgress();
const every = musicEntries(progress, 'campaign');
const tracks = jukeboxEntries(progress);
const finds = findCount(every);
const counts = { unlocked: tracks.length, total: every.length, found: finds.found, finds: finds.total };
const findsLine = `Radio finds: ${finds.found} of ${finds.total}. Radios out in the towns give up the rest.`;
const playing = ref<MusicEntry | null>(null);
const status = computed(() => (playing.value ? `Playing: ${playing.value.name}` : 'Choose a track. Choose it again to stop.'));
const plate = computed(() => jukeboxPlate(playing.value));
const rows = computed(() => jukeboxFacts(counts, playing.value));
const radio = computed(() => art?.ui.pickupIcons.radio ?? null);
let isOpen = true;

const cursor = ref(0);
const page = computed(() => pageOf(cursor.value));
const pages = pageCount(tracks.length);

/** Turns the strip a page, wrapping, and puts the keyboard's tile on the new page's first track. */
function turn(step: number): void {
  cursor.value = ((page.value + step + pages) % pages) * JUKEBOX_PAGE;
}

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

/** The bunker's own music goes quiet while the jukebox is open, and comes back when it closes. */
onMounted(async () => {
  void strip.value?.focus();
  await game.audio.unlock();
  if (isOpen) game.audio.enterPreview();
});

onBeforeUnmount(() => {
  isOpen = false;
  game.audio.leavePreview();
});
</script>

<style scoped>
/* As wide as the scene (rounded as SpriteImg rounds it), the column, the gaps and its own padding; a phone gets the window. */
.jukebox {
  --scene-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 4), var(--dpx, 1px)));
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  box-sizing: border-box;
  width: calc(var(--scene-px) * var(--card-w) + var(--u) * 222);
  max-width: 100%;
  container: select / inline-size;
}

/* A long track name keeps to one line, so the plate never grows over the scene. */
.jukebox :deep(.select-name) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.jukebox-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: calc(var(--u) * 4);
}

.jukebox-foot .px-button {
  width: auto;
  padding-inline: calc(var(--u) * 10);
}

.jukebox-foot .jukebox-turn {
  padding-inline: calc(var(--u) * 6);
}

.jukebox-page {
  min-width: 5ch;
  color: var(--bone-dim);
  font-size: calc(var(--u) * 7);
  text-align: center;
}

.jukebox-stop {
  margin-left: auto;
}
</style>
