<template>
  <ul class="parts" aria-label="Parts carried">
    <li
      v-for="part in PART_ORDER"
      :key="part"
      class="parts-chip px-frame"
      :class="{ 'is-none': parts[part] === 0 }"
      :aria-label="`${PART_LABELS[part]}: ${parts[part]}`"
    >
      <span class="parts-art">
        <SpriteImg :sprite="icons[part]" />
        <strong class="parts-count">x{{ parts[part] }}</strong>
      </span>
      <span class="parts-name">{{ PART_LABELS[part] }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * The parts the player carries, one chip each with the pickup's icon and the count. A toolkit fits nothing:
 * it is spent carrying an upgrade or a round effect from one gun to another.
 */
import { PART_LABELS, PART_ORDER } from '../../shared/gun-upgrade-data.ts';
import type { PartCounts } from '../../shared/gun-upgrade-data.ts';
import type { UiArt } from '../art/types.ts';
import SpriteImg from './SpriteImg.vue';

const { parts, icons } = defineProps<{ parts: Readonly<PartCounts>; icons: UiArt['pickupIcons'] }>();
</script>

<style scoped>
.parts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: calc(var(--u) * 3);
  margin: 0;
  padding: var(--u);
  list-style: none;
}

.parts-chip {
  --edge: var(--ink-line);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--u);
  min-width: 0;
  padding: calc(var(--u) * 2) 0;
  background: var(--ink-raised);
  color: var(--bone-dim);
}

.parts-chip.is-none {
  opacity: 0.4;
}

.parts-art {
  --sprite-px: max(var(--dpx, 1px), round(nearest, var(--u), var(--dpx, 1px)));
  display: flex;
  align-items: flex-end;
  gap: var(--u);
}

.parts-count {
  color: var(--amber);
  font-size: calc(var(--u) * 8);
  line-height: 1;
}

.parts-name {
  max-width: 100%;
  overflow: hidden;
  font-size: calc(var(--u) * 5);
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
