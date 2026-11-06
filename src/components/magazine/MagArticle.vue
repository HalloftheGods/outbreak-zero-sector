<template>
  <section class="mag-article" :class="`is-${block.style}`">
    <h4 v-if="block.heading" class="mag-article-heading">{{ block.heading }}</h4>
    <component :is="tag">
      <li v-for="line in lines" :key="line.text">
        <kbd v-if="line.lead" class="mag-lead">{{ line.lead }}</kbd>{{ line.rest }}
      </li>
    </component>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { splitLead } from '../../game/magazine-pages.ts';
import type { MagazineBlock } from '../../game/magazine-types.ts';

const props = defineProps<{ block: Extract<MagazineBlock, { kind: 'article' }> }>();

const tag = computed(() => (props.block.style === 'numbered' ? 'ol' : 'ul'));
const lines = computed(() =>
  props.block.points.map((text) => {
    const keyed = props.block.style === 'keys';
    return keyed ? { text, ...splitLead(text) } : { text, lead: '', rest: text };
  }),
);
</script>
