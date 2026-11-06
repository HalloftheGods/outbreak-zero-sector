<template>
  <header class="mag-head">
    <p class="mag-head-kicker">
      <span class="mag-head-number">{{ block.number }}</span>
      {{ block.kicker }}
    </p>
    <h3 class="mag-head-title">{{ block.title }}</h3>
    <p class="mag-head-deck">{{ block.deck }}</p>
  </header>
</template>

<script setup lang="ts">
import type { MagazineBlock } from '../../game/magazine-types.ts';

defineProps<{ block: Extract<MagazineBlock, { kind: 'head' }> }>();
</script>
