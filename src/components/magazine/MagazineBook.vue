<template>
  <div class="mag-book" :class="`is-${mode}`">
    <div class="mag-open" :class="{ 'is-solo': shown.solo !== null }">
      <MagazinePage v-if="shown.solo" :key="shown.solo.id" :page="shown.solo" />
      <template v-else>
        <MagazinePage v-if="shown.left" :key="shown.left.id" :page="shown.left" />
        <MagazinePage v-if="shown.right" :key="shown.right.id" :page="shown.right" />
      </template>
    </div>

    <div v-if="turn" :key="turnKey" class="mag-leaf" :class="[`is-${turn.leaf}`, `is-${turn.direction}`]" aria-hidden="true">
      <div class="mag-leaf-face">
        <MagazinePage :page="turn.front" />
      </div>
      <div v-if="turn.back" class="mag-leaf-face is-back">
        <MagazinePage :page="turn.back" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OpenBook, PageTurn, ReadingMode } from '../../game/magazine-pages.ts';
import MagazinePage from './MagazinePage.vue';

const props = defineProps<{ book: OpenBook; turn: PageTurn | null; mode: ReadingMode }>();

const shown = computed(() => props.turn?.under ?? props.book);
const turnKey = computed(() => `${props.turn?.front.id}-${props.turn?.back?.id}-${props.turn?.direction}`);
</script>
