<template>
  <ul class="item-bars" :style="{ '--rows': ITEM_ROWS }">
    <li v-for="row in rows" :key="row.label" class="item-bar">
      <span class="item-bar-label">{{ row.label }}</span>
      <span v-if="row.filled !== null" class="item-bar-cells" role="img" :aria-label="`${row.label} ${row.filled} of ${ITEM_SLOTS}`">
        <span v-for="n in ITEM_SLOTS" :key="n" class="item-bar-cell" :class="{ 'is-on': n <= row.filled }" />
      </span>
      <span class="item-bar-value" :class="{ 'is-wide': row.filled === null }">{{ row.value }}</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * The focused item's facts stacked like a survivor's stat bars, label on the left. A gun's rows are slotted bars
 * against the other guns with the number beside them; anything else gives its number in words. The list keeps
 * room for ITEM_ROWS rows, so a short list never moves what is under it.
 */
import type { ItemFact } from '../game/home/shop-item-facts.ts';
import { ITEM_ROWS, ITEM_SLOTS } from '../game/home/shop-item-facts.ts';

defineProps<{ rows: readonly ItemFact[] }>();
</script>

<style scoped>
.item-bars {
  --row-h: calc(var(--u) * 10);
  display: grid;
  grid-template-columns: max-content max-content 1fr;
  grid-auto-rows: var(--row-h);
  align-content: start;
  gap: calc(var(--u) * 3) calc(var(--u) * 5);
  height: calc(var(--row-h) * var(--rows) + var(--u) * 3 * (var(--rows) - 1));
  margin: 0;
  padding: 0;
  list-style: none;
}

.item-bar {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
}

.item-bar-label {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 8);
  text-transform: uppercase;
}

.item-bar-cells {
  display: flex;
  gap: var(--u);
}

.item-bar-cell {
  width: calc(var(--u) * 10);
  height: calc(var(--u) * 7);
  background: var(--ink-line);
}

.item-bar-cell.is-on {
  background: var(--sick);
}

.item-bar-value {
  overflow: hidden;
  color: var(--bone);
  font-size: calc(var(--u) * 7);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* With no bar, the words take the bar's place too. */
.item-bar-value.is-wide {
  grid-column: 2 / -1;
}
</style>
