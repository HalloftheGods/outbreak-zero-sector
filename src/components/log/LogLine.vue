<template>
  <li class="log-line" :class="`is-${entry.tone}`">
    <span class="log-at">{{ entry.at }}</span>
    <span class="log-words">
      <strong class="log-text">{{ entry.text }}<span v-if="entry.count > 1" class="log-count"> ×{{ entry.count }}</span></strong>
      <span v-if="detail && entry.detail" class="log-detail">{{ entry.detail }}</span>
    </span>
  </li>
</template>

<script setup lang="ts">
import type { LogEntry } from '../../game/event-log.ts';

defineProps<{ entry: LogEntry; detail?: boolean }>();
</script>

<style scoped>
.log-line {
  display: flex;
  gap: calc(var(--u) * 3);
  align-items: baseline;
  text-transform: uppercase;
}

.log-at {
  flex: none;
  color: var(--bone-dim);
  font-variant-numeric: tabular-nums;
}

.log-words {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.log-text {
  color: var(--bone);
  font-weight: 400;
}

.log-detail {
  color: var(--bone-dim);
}

.log-count {
  color: var(--amber);
}

.is-danger .log-text,
.is-close .log-text {
  color: var(--blood-bright);
}

.is-hope .log-text,
.is-chain .log-text {
  color: var(--amber);
}

.is-quiet .log-text {
  color: var(--bone-dim);
}

.is-stamp .log-text {
  color: var(--sick);
}
</style>
