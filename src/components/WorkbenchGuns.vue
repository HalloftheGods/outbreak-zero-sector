<template>
  <div class="guns" role="radiogroup" aria-label="Gun to work on" @keydown="onKey">
    <button
      v-for="(weapon, index) in owned"
      :key="weapon"
      :ref="(el) => setTile(index, el)"
      class="guns-tile px-frame"
      :class="{ 'is-chosen': index === chosen }"
      type="button"
      role="radio"
      :aria-checked="index === chosen"
      :aria-label="`${WEAPONS[weapon].label}, ${slotsUsed(gear.fits[weapon])} of ${GUN_SLOTS[weapon]} slots used`"
      :tabindex="index === chosen ? 0 : -1"
      @mouseenter="emit('preview', index)"
      @mouseleave="emit('preview', null)"
      @blur="emit('preview', null)"
      @click="emit('choose', index)"
    >
      <span class="guns-art">
        <SpriteImg :sprite="icons[weapon]" />
      </span>
      <span class="guns-name">{{ WEAPONS[weapon].label }}</span>
      <span class="guns-used">{{ slotsUsed(gear.fits[weapon]) }}/{{ GUN_SLOTS[weapon] }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * The guns in hand, one framed tile each with its HUD icon and slots used, to pick which one the bench works
 * on. Pointing at one previews it in the column; arrows move the pick and the focus together, wrapping, as
 * on the survivor roster.
 */
import { WEAPONS } from '../../shared/constants.ts';
import { GUN_SLOTS } from '../../shared/gun-upgrade-data.ts';
import { slotsUsed } from '../../shared/gun-upgrades.ts';
import type { PlayerGear } from '../../shared/gun-upgrades.ts';
import type { WeaponId } from '../../shared/protocol.ts';
import type { UiArt } from '../art/types.ts';
import { rosterStep } from '../game/character-select-view.ts';
import SpriteImg from './SpriteImg.vue';

interface GunsProps {
  owned: readonly WeaponId[];
  chosen: number;
  gear: PlayerGear;
  icons: UiArt['weaponIcons'];
}

const { owned, chosen, gear, icons } = defineProps<GunsProps>();
const emit = defineEmits<{ choose: [index: number]; preview: [index: number | null] }>();

const tiles = new Map<number, HTMLElement>();

function setTile(index: number, el: unknown): void {
  const isTile = el instanceof HTMLElement;
  if (isTile) tiles.set(index, el);
}

/** Arrows stay on the guns rather than walking the survivor away from the bench. */
function onKey(event: KeyboardEvent): void {
  const next = rosterStep(chosen, event.key, owned.length);
  const moves = next !== null;
  if (!moves) return;
  event.preventDefault();
  event.stopPropagation();
  emit('choose', next);
  tiles.get(next)?.focus();
}

/** Puts the keyboard on the chosen gun, as a radio group lands on its checked option. */
defineExpose({ focus: () => tiles.get(chosen)?.focus() });
</script>

<style scoped>
.guns {
  display: flex;
  gap: calc(var(--u) * 3);
  padding: var(--u);
}

.guns-tile {
  --edge: var(--ink-line);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--u);
  width: calc(var(--u) * 72);
  min-width: 0;
  border: 0;
  padding: calc(var(--u) * 3) 0 calc(var(--u) * 2);
  background: var(--ink-raised);
  color: var(--bone-dim);
  font: inherit;
  cursor: pointer;
  outline: none;
}

.guns-tile:hover,
.guns-tile:focus-visible {
  --edge: var(--bone-dim);
  color: var(--bone);
}

.guns-tile.is-chosen {
  --edge: var(--amber);
  background: rgba(232, 163, 61, 0.14);
  color: var(--amber);
}

/* The HUD icon at whole device pixels per art pixel, the box fixed so every gun sits at one height. */
.guns-art {
  --sprite-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 1.5), var(--dpx, 1px)));
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(var(--sprite-px) * 14);
}

.guns-art img {
  flex: none;
}

.guns-name {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(var(--u) * 7);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.guns-used {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 5);
}
</style>
