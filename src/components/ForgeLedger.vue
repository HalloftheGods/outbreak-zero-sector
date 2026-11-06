<template>
  <div class="ledger">
    <ul class="ledger-rows">
      <li
        v-for="row in card.jewels"
        :key="row.size"
        class="ledger-row"
        :class="{ 'is-on': row.size === card.onForge }"
      >
        <span class="ledger-icon"><SpriteImg
          v-if="icons"
          :sprite="icons[row.icon]"
        /></span>
        <span class="ledger-text">
          <span class="ledger-label">{{ row.label }}</span>
          <span class="ledger-sub">{{ row.each }} silver each</span>
        </span>
        <strong class="ledger-value">{{ row.count }}</strong>
      </li>
      <li class="ledger-row">
        <span class="ledger-icon"><SpriteImg
          v-if="icons"
          :sprite="icons.silver"
        /></span>
        <span class="ledger-text">
          <span class="ledger-label">Silver</span>
          <span class="ledger-sub">When all are done</span>
        </span>
        <strong class="ledger-value">{{ card.yieldSilver }}</strong>
      </li>
      <li class="ledger-row">
        <span class="ledger-icon" />
        <span class="ledger-text">
          <span class="ledger-label">Time left</span>
          <span class="ledger-sub">At {{ SMELT_SECONDS }}s a jewel</span>
        </span>
        <strong class="ledger-value">{{ card.timeLeft }}</strong>
      </li>
    </ul>
    <div class="ledger-bar">
      <span class="ledger-label">Smelting</span>
      <span
        class="ledger-cells"
        role="img"
        :aria-label="`Smelting, ${card.filled} of ${FORGE_SLOTS}`"
      >
        <span
          v-for="n in FORGE_SLOTS"
          :key="n"
          class="ledger-cell"
          :class="{ 'is-on': n <= card.filled }"
        />
      </span>
    </div>
    <p class="ledger-status">
      {{ card.status }}
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * The column beside the forge's scene: the jewels waiting with their in-game icons and what each is worth,
 * the silver they come to, the time left, and a slotted bar for the jewel on the forge. Every value keeps a
 * fixed width, so the numbers ticking down while it smelts move nothing.
 */
import type { UiArt } from '../art/types.ts';
import { FORGE_SLOTS } from '../game/home/forge-card.ts';
import type { ForgeCard } from '../game/home/forge-card.ts';
import { SMELT_SECONDS } from '../game/home/forge.ts';
import SpriteImg from './SpriteImg.vue';

const { card, icons } = defineProps<{ card: ForgeCard; icons: UiArt['pickupIcons'] | null }>();
</script>

<style scoped>
.ledger {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 5);
  width: calc(var(--u) * 150);
}

.ledger-rows {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Icon, words, number: the icon's box is kept for a row with none, so the words line up. */
.ledger-row {
  --sprite-px: max(var(--dpx, 1px), round(nearest, var(--u), var(--dpx, 1px)));
  display: grid;
  grid-template-columns: calc(var(--sprite-px) * 15) minmax(0, 1fr) max-content;
  align-items: center;
  gap: calc(var(--u) * 4);
}

.ledger-icon {
  height: calc(var(--sprite-px) * 15);
}

.ledger-text {
  display: flex;
  flex-direction: column;
  gap: var(--u);
  min-width: 0;
}

.ledger-label {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 8);
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
}

.ledger-sub {
  overflow: hidden;
  color: var(--bone-dim);
  font-size: calc(var(--u) * 6);
  line-height: 1;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Five characters are kept and the digits are all one width, so a count ticking down never moves the row. */
.ledger-value {
  min-width: 5ch;
  color: var(--bone);
  font-size: calc(var(--u) * 11);
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: right;
}

.ledger-row.is-on .ledger-label,
.ledger-row.is-on .ledger-value {
  color: var(--amber);
}

.ledger-bar {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2);
}

/* The bar is the column's width; its cells are a stat bar's height. */
.ledger-cells {
  display: flex;
  gap: var(--u);
}

.ledger-cell {
  flex: 1 1 0;
  height: calc(var(--u) * 7);
  background: var(--ink-line);
}

.ledger-cell.is-on {
  background: var(--amber);
}

/* One line is always kept, so the screen holds still when the last jewel is done. */
.ledger-status {
  min-height: 1lh;
  margin: 0;
  color: var(--bone-dim);
  font-size: calc(var(--u) * 6);
}
</style>
