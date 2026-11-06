<template>
  <figure class="mag-keyboard">
    <div v-for="(row, index) in KEYBOARD_ROWS" :key="index" class="mag-key-row">
      <kbd v-for="key in row" :key="key" class="mag-key">{{ key }}</kbd>
    </div>
    <figcaption class="mag-caption">{{ block.caption }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import type { MagazineBlock } from '../../game/magazine-types.ts';

defineProps<{ block: Extract<MagazineBlock, { kind: 'keyboard' }> }>();

/** Only the keys the game uses. CONTROLS in title-menu.ts has the same set. */
const KEYBOARD_ROWS: readonly (readonly string[])[] = [
  ['Esc', '1', '2', '3'],
  ['Tab', 'Q', 'W', 'E', 'R'],
  ['A', 'S', 'D', 'F', 'H'],
  ['N', 'M'],
];
</script>
