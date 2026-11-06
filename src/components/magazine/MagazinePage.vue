<template>
  <article
    ref="pageRef"
    class="mag-page"
    :class="[`mag-color-${page.color}`, `mag-layout-${page.layout}`, `is-${page.side}`]"
    :style="backdropStyle"
  >
    <header v-if="page.folio" class="mag-running-head">
      <span>{{ MAGAZINE_TITLE }}</span>
      <span>{{ page.runningHead }}</span>
    </header>
    <div class="mag-flow">
      <MagBlock v-for="(block, index) in page.blocks" :key="index" :block :class="{ 'mag-extra': block.extra }" />
    </div>
    <footer v-if="page.folio" class="mag-folio">{{ page.folio }}</footer>
  </article>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { spriteDataUrl } from '../../engine/sprite-cache.ts';
import { usePageFit } from '../../game/magazine-fit.ts';
import { MAGAZINE_TITLE } from '../../game/magazine-pages.ts';
import type { MagazinePage } from '../../game/magazine-types.ts';
import MagBlock from './MagBlock.vue';

const props = defineProps<{ page: MagazinePage }>();

const pageRef = useTemplateRef<HTMLElement>('pageRef');
usePageFit(pageRef);

const backdropStyle = computed(() => {
  const { backdrop } = props.page;
  return backdrop ? { '--backdrop': `url(${spriteDataUrl(backdrop)})` } : undefined;
});
</script>
