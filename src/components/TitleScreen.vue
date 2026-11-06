<template>
  <section v-if="page === null" class="px-screen px-title-scale title">
    <SpriteImg v-if="ui.art" class="title-logo" :sprite="ui.art.ui.logo" />
    <h1 v-else class="px-heading">UNDEAD OF NIGHT: LAST ROUND</h1>

    <TitleMenu v-model="selected" @open="page = $event" />
    <InstallCartridge />

    <footer class="title-foot">
      <p class="title-credit">
        <img class="title-omega" :src="BRAND_MARK" alt="" />
        {{ STUDIO_LINE }}
      </p>
      <MenuLink v-if="!privacyOpen" class="title-privacy" @press="openPrivacy()">Privacy</MenuLink>
    </footer>
    <p class="title-version">v{{ APP_VERSION }}</p>
  </section>

  <PlaySetup v-else-if="page === 'play'" :ui :join="invited" :level="startLevel" @close="closePlay" />
  <LevelsPage v-else-if="page === 'levels'" @start="startFromLevel" @close="close" />
  <HowToPlay v-else-if="page === 'howto'" @close="close" />
  <RecordsPage v-else-if="page === 'records'" :ui @close="close" />
  <SoundTestPage v-else-if="page === 'sound'" @close="close" />
  <OptionsPage v-else :ui @close="close" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { openPrivacy, privacyOpen } from '../game/analytics/index.ts';
import type { UiState } from '../game/hud-state.ts';
import { parseJoinParam, withoutJoinParam } from '../game/invite-link.ts';
import { BRAND_MARK, STUDIO_LINE } from '../game/studio-splash.ts';
import type { TitlePage } from '../game/title-menu.ts';
import HowToPlay from './HowToPlay.vue';
import InstallCartridge from './InstallCartridge.vue';
import LevelsPage from './LevelsPage.vue';
import MenuLink from './MenuLink.vue';
import OptionsPage from './OptionsPage.vue';
import PlaySetup from './PlaySetup.vue';
import RecordsPage from './RecordsPage.vue';
import SoundTestPage from './SoundTestPage.vue';
import SpriteImg from './SpriteImg.vue';
import TitleMenu from './TitleMenu.vue';
import { useGame } from './use-game.ts';

declare const __APP_VERSION__: string;
const APP_VERSION = __APP_VERSION__;

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

/** Set when a level was picked on the Levels page, so Play setup starts there and Back returns to the Levels page. */
const startLevel = ref<number | null>(null);

function close(): void {
  page.value = null;
}

function startFromLevel(level: number): void {
  startLevel.value = level;
  page.value = 'play';
}

function closePlay(): void {
  const cameFromLevels = startLevel.value !== null;
  startLevel.value = null;
  page.value = cameFromLevels ? 'levels' : null;
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

.title-foot {
  position: absolute;
  bottom: calc(var(--u) * 2);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  column-gap: calc(var(--u) * 4);
  max-width: 100%;
  color: var(--bone-dim);
}

.title-version {
  position: absolute;
  bottom: calc(var(--u) * 2);
  left: calc(var(--u) * 3);
  margin: 0;
  color: var(--bone-dim);
}

.title-credit {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 2);
  margin: 0;
}

.title-privacy {
  min-width: 44px;
  min-height: 44px;
  padding-inline: calc(var(--u) * 2);
  color: var(--bone-dim);
}

.title-omega {
  width: calc(var(--u) * 7);
  height: auto;
}
</style>
