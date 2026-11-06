<template>
  <section class="mag-itinerary">
    <h4 class="mag-itinerary-title">{{ block.title }}</h4>
    <ol class="mag-stops">
      <li v-for="stop in block.stops" :key="stop.level" class="mag-stop">
        <SpriteImg class="mag-stop-img" :sprite="stop.sprite" />
        <span class="mag-stop-number">{{ stop.level }}</span>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
import type { MagazineBlock } from '../../game/magazine-types.ts';
import SpriteImg from '../SpriteImg.vue';

defineProps<{ block: Extract<MagazineBlock, { kind: 'itinerary' }> }>();
</script>
