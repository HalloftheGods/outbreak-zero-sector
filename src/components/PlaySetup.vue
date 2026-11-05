<template>
  <TitlePage :heading @close="back">
    <template v-if="flow.step === 'who'">
      <div class="setup-field">
        <label class="px-label" for="callsign">Callsign</label>
        <input
          id="callsign"
          ref="callsign"
          class="px-input px-frame"
          :value="ui.callsign"
          maxlength="12"
          placeholder="SURVIVOR"
          autocomplete="off"
          spellcheck="false"
          @input="game.setCallsign(textOf($event))"
          @keydown.enter.prevent="next"
        />
      </div>

      <CharacterPicker :art="ui.art" />
    </template>

    <template v-else>
      <div class="setup-modes" role="radiogroup" aria-label="Mode">
        <PixelButton
          :class="{ 'is-chosen': flow.mode === 'solo' }"
          role="radio"
          :aria-checked="flow.mode === 'solo'"
          @press="pick('solo')"
        >
          Solo
        </PixelButton>
        <PixelButton
          :class="{ 'is-chosen': flow.mode === 'multi' }"
          role="radio"
          :aria-checked="flow.mode === 'multi'"
          @press="pick('multi')"
        >
          Multiplayer
        </PixelButton>
      </div>

      <div v-if="multi" class="setup-field">
        <label class="px-label" :for="SERVER_FIELD_ID">Server address</label>
        <input
          :id="SERVER_FIELD_ID"
          class="px-input px-frame"
          :value="ui.serverAddress"
          :placeholder="defaultServer"
          autocomplete="off"
          spellcheck="false"
          @input="game.setServerAddress(textOf($event))"
          @keydown.enter.prevent="next"
        />
        <PixelButton class="setup-invite" :disabled="!inviteLink" @press="copyInvite">
          {{ copied === 'done' ? 'Link copied' : copied === 'failed' ? 'Copy failed' : 'Copy invite link' }}
        </PixelButton>
      </div>

      <DifficultyPicker />
      <p v-if="failure" class="px-error" role="alert">{{ failure }}</p>
    </template>

    <template #actions>
      <MenuLink v-if="flow.step === 'who'" @press="next">Next</MenuLink>
      <template v-else>
        <PixelButton primary silent :disabled="!ready" @press="start">{{ actionLabel }}</PixelButton>
        <PixelButton v-if="resumeAt !== null && !multi" :disabled="!ready" @press="game.continueSolo()">
          Continue from level {{ resumeAt }}
        </PixelButton>
      </template>
    </template>
  </TitlePage>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue';
import { DEFAULT_SERVER_PORT } from '../../shared/constants.ts';
import { SERVER_FIELD_ID } from '../game/hud-state.ts';
import type { UiState } from '../game/hud-state.ts';
import { buildInviteLink } from '../game/invite-link.ts';
import { continueLevel, loadLevelProgress } from '../game/level-progress.ts';
import { advance, chooseMode, PLAY_JOIN, PLAY_START, playHeading, retreat, showsServer } from '../game/play-flow.ts';
import type { PlayMode } from '../game/play-flow.ts';
import { setupActionLabel } from '../game/title-menu.ts';
import CharacterPicker from './CharacterPicker.vue';
import DifficultyPicker from './DifficultyPicker.vue';
import MenuLink from './MenuLink.vue';
import PixelButton from './PixelButton.vue';
import TitlePage from './TitlePage.vue';
import { useGame } from './use-game.ts';

const { ui, join = false } = defineProps<{ ui: UiState; join?: boolean }>();
const emit = defineEmits<{ close: [] }>();
const game = useGame();
const callsign = useTemplateRef<HTMLInputElement>('callsign');
const flow = ref(join ? PLAY_JOIN : PLAY_START);
const copied = ref<'idle' | 'done' | 'failed'>('idle');

/** Read when the page opens: a run cannot be under way while the setup is showing. */
const resumeAt = continueLevel(loadLevelProgress());
const heading = computed(() => playHeading(flow.value));
const multi = computed(() => showsServer(flow.value));
const ready = computed(() => ui.art !== null && !ui.connecting);
const actionLabel = computed(() => setupActionLabel(multi.value, ui.art !== null, ui.connecting));
const failure = computed(() => (multi.value ? ui.error : null));
const defaultServer = `${window.location.hostname}:${DEFAULT_SERVER_PORT}`;
/** The address friends need: what is typed, or this host's default when the field is blank. */
const inviteLink = computed(() => buildInviteLink(window.location.href, ui.serverAddress.trim() || defaultServer));

function textOf(event: Event): string {
  return (event.target as HTMLInputElement).value;
}

async function copyInvite(): Promise<void> {
  const link = inviteLink.value;
  if (!link) return;
  try {
    await navigator.clipboard.writeText(link);
    copied.value = 'done';
  } catch {
    copied.value = 'failed';
  }
  setTimeout(() => (copied.value = 'idle'), 2000);
}

function pick(mode: PlayMode): void {
  flow.value = chooseMode(flow.value, mode);
}

function start(): void {
  if (multi.value) game.startCoop();
  else game.startSolo();
}

/** Enter in a field only moves to the next step; the run starts from the button on step 2. */
function next(event?: Event): void {
  if (event instanceof KeyboardEvent && event.repeat) return;
  flow.value = advance(flow.value);
}

/** Back and Esc step back first; a connection still being tried would otherwise pull the player into a room from the menu. */
function back(): void {
  const earlier = retreat(flow.value);
  if (earlier) {
    flow.value = earlier;
    void nextTick(() => callsign.value?.focus());
    return;
  }
  if (ui.connecting) game.toMenu();
  emit('close');
}

onMounted(() => callsign.value?.focus());
</script>

<style scoped>
.setup-field {
  display: flex;
  flex-direction: column;
}

.setup-invite {
  align-self: flex-start;
  margin-top: calc(var(--u) * 2);
}

.setup-modes {
  display: flex;
  gap: calc(var(--u) * 3);
}

.setup-modes > * {
  flex: 1 1 0;
  min-width: 0;
}
</style>
