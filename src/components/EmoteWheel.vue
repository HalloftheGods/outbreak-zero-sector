<template>
  <section v-if="isOpen" class="emote-wheel" aria-label="Emotes" @mousedown.stop @contextmenu.prevent>
    <button
      v-for="(id, index) in EMOTE_IDS"
      :key="id"
      class="emote-slice"
      :class="{ 'is-hovered': hovered === id }"
      :style="{ '--angle': `${index * 60 - 90}deg` }"
      type="button"
      :aria-label="LABELS[id]"
      @pointerenter="hovered = id"
      @pointerleave="hovered = null"
      @click="pick(id)"
    >
      <SpriteImg :sprite="art.ui.emotes[id]" :scale="2" />
    </button>
  </section>
  <button
    v-if="enabled"
    class="emote-open"
    :class="{ 'is-held': isOpen }"
    type="button"
    aria-label="Emotes"
    @click="toggle"
    @mousedown.stop
  >
    <SpriteImg :sprite="art.ui.emotes.nice" :scale="2" />
  </button>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { EMOTE_IDS } from '../../shared/emotes.ts';
import type { EmoteId } from '../../shared/emotes.ts';
import type { ArtBook } from '../art/types.ts';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';

/** Hold this to open the wheel. No weapon, move or action uses V. */
const EMOTE_CODE = 'KeyV';

/** For screen readers only: the icons carry no text. */
const LABELS: Readonly<Record<EmoteId, string>> = {
  help: 'Help',
  go: 'Go',
  thanks: 'Thanks',
  wait: 'Wait',
  danger: 'Danger',
  nice: 'Nice',
};

const props = defineProps<{ art: ArtBook; enabled: boolean }>();
const game = useGame();
const isOpen = ref(false);
const hovered = ref<EmoteId | null>(null);

function close(): void {
  isOpen.value = false;
  hovered.value = null;
}

function toggle(): void {
  isOpen.value = !isOpen.value;
  hovered.value = null;
}

function pick(id: EmoteId): void {
  game.sendEmote(id);
  close();
}

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function onKeyDown(event: KeyboardEvent): void {
  const wanted = event.code === EMOTE_CODE && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey;
  const canOpen = wanted && props.enabled && !isTyping(event.target);
  isOpen.value ||= canOpen;
}

/** Letting go of the key sends whichever icon the pointer is on. */
function onKeyUp(event: KeyboardEvent): void {
  const released = event.code === EMOTE_CODE;
  const chosen = released && isOpen.value ? hovered.value : null;
  if (chosen) game.sendEmote(chosen);
  if (released) close();
}

watch(() => props.enabled, (enabled) => enabled || close());

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', close);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', close);
});
</script>

<style scoped>
.emote-wheel {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  z-index: 20;
}

.emote-slice,
.emote-open {
  place-items: center;
  border: 0;
  padding: 0;
  background: rgba(23, 24, 31, 0.82);
  cursor: pointer;
}

.emote-slice {
  display: grid;
  position: absolute;
  width: calc(var(--u) * 22);
  height: calc(var(--u) * 22);
  margin: calc(var(--u) * -11);
  transform: rotate(var(--angle)) translateX(calc(var(--u) * 42)) rotate(calc(var(--angle) * -1));
}

.emote-slice.is-hovered,
.emote-open.is-held {
  background: var(--amber);
}

/* The touch button sits on the left edge, clear of the pad on the right and the bottom. Fingers only. */
.emote-open {
  display: none;
}

.is-touch .emote-open {
  display: grid;
  position: absolute;
  top: 50%;
  left: calc(var(--safe-left, 0px) + var(--u) * 3);
  z-index: 20;
  width: var(--tap, 44px);
  height: var(--tap, 44px);
  transform: translateY(-50%);
}
</style>
