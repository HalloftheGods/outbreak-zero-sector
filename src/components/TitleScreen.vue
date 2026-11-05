<template>
  <section v-if="page === null" class="px-screen px-title-scale title">
    <SpriteImg v-if="ui.art" class="title-logo" :sprite="ui.art.ui.logo" />
    <h1 v-else class="px-heading">UNDEAD OF NIGHT: LAST ROUND</h1>

    <TitleMenu v-model="selected" @open="page = $event" />

    <p class="title-credit">
      <img class="title-omega" :src="BRAND_MARK" alt="" />
      Hall of the Gods, Inc.
    </p>
  </section>

  <PlaySetup v-else-if="page === 'play'" :ui :join="invited" @close="close" />
  <LevelsPage v-else-if="page === 'levels'" @close="close" />
  <HowToPlay v-else-if="page === 'howto'" @close="close" />
  <RecordsPage v-else-if="page === 'records'" :ui @close="close" />
  <OptionsPage v-else :ui @close="close" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { UiState } from '../game/hud-state.ts';
import { parseJoinParam, withoutJoinParam } from '../game/invite-link.ts';
import { BRAND_MARK } from '../game/studio-splash.ts';
import type { TitlePage } from '../game/title-menu.ts';
import HowToPlay from './HowToPlay.vue';
import LevelsPage from './LevelsPage.vue';
import OptionsPage from './OptionsPage.vue';
import PlaySetup from './PlaySetup.vue';
import RecordsPage from './RecordsPage.vue';
import SpriteImg from './SpriteImg.vue';
import TitleMenu from './TitleMenu.vue';
import { useGame } from './use-game.ts';

defineProps<{ ui: UiState }>();

const game = useGame();
const page = ref<TitlePage | null>(null);
const invited = ref(false);

/** An invite link (?join=host:port) fills in the server address and opens co-op setup. */
const joinAddress = parseJoinParam(window.location.search);
if (joinAddress) {
  game.setServerAddress(joinAddress);
  invited.value = true;
  page.value = 'play';
  window.history.replaceState(null, '', withoutJoinParam(window.location.href));
}
/** Lives here, so Back returns to the item the player left from. */
const selected = ref(0);

function close(): void {
  page.value = null;
}
</script>

<style scoped>
.title {
  justify-content: safe center;
  gap: calc(var(--u) * 10);
  padding-bottom: calc(var(--u) * 20);
  background: radial-gradient(ellipse at center, rgba(7, 8, 12, 0.5), rgba(7, 8, 12, 0.08));
}

.title-logo {
  flex: none;
  max-width: 100%;
  object-fit: contain;
}

.title-credit {
  position: absolute;
  bottom: calc(var(--u) * 6);
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 2);
  margin: 0;
  color: var(--bone-dim);
}

.title-omega {
  width: calc(var(--u) * 7);
  height: auto;
}
</style>
