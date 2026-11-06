<template>
  <section v-if="nav.page === null" class="px-screen px-title-scale title">
    <SpriteImg v-if="ui.art" class="title-logo" :sprite="ui.art.ui.logo" />
    <h1 v-else class="px-heading">UNDEAD OF NIGHT: LAST ROUND</h1>

    <TitleMenu v-model="selected" :entries="TITLE_MENU" @open="nav = openPage(nav, $event)" />
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

  <PlaySetup v-else-if="nav.page === 'play'" :ui :join="nav.invited" :level="nav.startLevel" @close="nav = closePlay(nav)" />
  <LevelsPage v-else-if="nav.page === 'levels'" :art="ui.art" @start="nav = pickLevel(nav, $event)" @close="close" />
  <HowToPlay v-else-if="nav.page === 'howto'" @close="close" />
  <RecordsPage v-else-if="nav.page === 'records'" :ui @close="close" />
  <SoundTestPage v-else-if="nav.page === 'sound'" @close="close" />
  <OptionsPage v-else :ui @close="close" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { openPrivacy, privacyOpen } from '../game/analytics/index.ts';
import type { UiState } from '../game/hud-state.ts';
import { parseJoinParam, withoutJoinParam } from '../game/invite-link.ts';
import { BRAND_MARK, STUDIO_LINE } from '../game/studio-splash.ts';
import { TITLE_MENU } from '../game/title-menu.ts';
import { closePage, closePlay, INVITE_LANDING, openPage, pickLevel, TITLE_HOME } from '../game/title-nav.ts';
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

const { ui } = defineProps<{ ui: UiState }>();

const game = useGame();
const nav = ref(TITLE_HOME);

/** An invite link (?join=host:port) fills in the server address and opens co-op setup. */
const joinAddress = parseJoinParam(window.location.search);
if (joinAddress) {
  game.setServerAddress(joinAddress);
  nav.value = INVITE_LANDING;
  window.history.replaceState(null, '', withoutJoinParam(window.location.href));
}
/** Lives here, so Back returns to the item the player left from. */
const selected = ref(0);

function close(): void {
  nav.value = closePage(nav.value);
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
