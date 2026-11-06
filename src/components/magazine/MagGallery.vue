<template>
  <section class="mag-gallery" :class="`is-${block.style}`">
    <h4 v-if="block.title" class="mag-gallery-title">{{ block.title }}</h4>
    <ul class="mag-cards">
      <li v-for="card in block.cards" :key="card.id" class="mag-card">
        <span v-if="card.tag" class="mag-card-tag">{{ card.tag }}</span>
        <span class="mag-card-picture"><SpriteImg :sprite="card.sprite" :scale="card.scale" /></span>
        <span class="mag-card-words">
          <strong class="mag-card-title">{{ card.title }}</strong>
          <span v-if="card.point" class="mag-card-point">{{ card.point }}</span>
          <span v-if="card.caption" class="mag-card-caption">{{ card.caption }}</span>
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { MagazineBlock } from '../../game/magazine-types.ts';
import SpriteImg from '../SpriteImg.vue';

defineProps<{ block: Extract<MagazineBlock, { kind: 'gallery' }> }>();
</script>
