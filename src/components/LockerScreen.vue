<template>
  <section class="px-screen">
    <div class="px-panel px-frame locker">
      <h2 class="px-heading">Locker</h2>
      <p v-if="!draft" class="px-note">Opening the locker...</p>
      <template v-else>
        <div class="locker-sides">
          <div class="locker-side">
            <h3 class="px-label">In the locker</h3>
            <ul class="px-rows">
              <li v-for="row in view.locker" :key="row.key" class="px-row">
                <span class="locker-name">{{ row.label }}</span>
                <strong>{{ row.count }}</strong>
                <PixelButton @press="take(row.key)">Take</PixelButton>
              </li>
              <li v-if="view.locker.length === 0" class="locker-empty">Empty</li>
            </ul>
          </div>
          <div class="locker-side">
            <h3 class="px-label">In hand</h3>
            <ul class="px-rows">
              <li v-for="row in view.hands" :key="row.key" class="px-row">
                <span class="locker-name">{{ row.label }}</span>
                <strong>{{ row.count }}</strong>
                <PixelButton @press="stow(row.key)">Stow</PixelButton>
              </li>
              <li v-if="view.hands.length === 0" class="locker-empty">Empty</li>
            </ul>
          </div>
        </div>
        <p v-if="home.saveError" class="px-error" role="alert">{{ home.saveError }}</p>
      </template>
      <PixelButton primary silent :disabled="!draft" @press="close">Close</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { HomeUi } from '../game/home-hud.ts';
import { closeLocker, loadoutRows, moveToHands, moveToLocker } from '../game/home-screens.ts';
import type { LockerDraft } from '../game/home-screens.ts';
import PixelButton from './PixelButton.vue';
import { useGame } from './use-game.ts';

const { home } = defineProps<{ home: HomeUi }>();
const game = useGame();

/** What the player is arranging. The save is only read when the locker opens, so a save landing mid-edit cannot undo a move. */
const draft = ref<LockerDraft | null>(home.save ? { locker: home.save.locker, hands: home.save.hands } : null);
const view = computed(() => ({
  locker: draft.value ? loadoutRows(draft.value.locker) : [],
  hands: draft.value ? loadoutRows(draft.value.hands) : [],
}));

function take(key: string): void {
  if (draft.value) draft.value = moveToHands(draft.value, key);
}

function stow(key: string): void {
  if (draft.value) draft.value = moveToLocker(draft.value, key);
}

/** The save can still be loading when the locker opens. */
watch(
  () => home.save,
  (save) => {
    if (save && !draft.value) draft.value = { locker: save.locker, hands: save.hands };
  }
);

function close(): void {
  if (draft.value) closeLocker(draft.value, game.home);
}
</script>

<style scoped>
.locker {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 400);
  max-width: 100%;
  max-height: 100%;
  overflow-y: auto;
}

.locker-sides {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--u) * 4);
}

.locker-name {
  flex: 1;
  min-width: 0;
}

.locker-empty {
  color: var(--bone-dim);
}
</style>
