<template>
  <nav class="mag-contents" :class="{ 'is-dense': dense }" aria-label="Chapters">
    <h3 class="mag-contents-title">In this issue</h3>
    <ol class="mag-contents-list">
      <li v-for="chapter in block.chapters" :key="chapter.id">
        <button class="mag-contents-link" :class="`mag-color-${chapter.color}`" type="button" @click="links?.goToPage(chapter.pageIndex)">
          <span class="mag-contents-number">{{ chapter.number }}</span>
          <span class="mag-contents-words">
            <strong>{{ chapter.title }}</strong>
            <small>{{ chapter.kicker }}</small>
          </span>
          <span class="mag-contents-page">{{ chapter.page }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { MAGAZINE_LINKS } from '../../game/magazine-controller.ts';
import type { MagazineBlock } from '../../game/magazine-types.ts';

/** Past this many chapters a page cannot hold two lines for each, so the italic kicker under each title is left off. */
const DENSE_FROM = 14;

const { block } = defineProps<{ block: Extract<MagazineBlock, { kind: 'contents' }> }>();
const dense = block.chapters.length > DENSE_FROM;
const links = inject(MAGAZINE_LINKS);
</script>
