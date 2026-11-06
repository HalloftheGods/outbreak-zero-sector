<template>
  <div class="mag-cover">
    <header class="mag-cover-top">
      <p class="mag-cover-issue">
        <span>{{ MAGAZINE_ISSUE }}</span>
        <span>{{ MAGAZINE_PRICE }}</span>
      </p>
      <h2 class="mag-masthead">{{ MAGAZINE_TITLE }}</h2>
      <p class="mag-cover-strap">{{ MAGAZINE_STRAP }}</p>
    </header>

    <div class="mag-cover-middle">
      <figure class="mag-cover-photo">
        <div class="mag-photo-frame">
          <div class="mag-print" :style="printStyle">
            <SpriteImg class="mag-print-img" :sprite="block.art" />
          </div>
        </div>
      </figure>
      <span class="mag-burst mag-cover-burst">10 towns! 0 gift shops!</span>
      <ul class="mag-cover-lines">
        <li v-for="line in block.lines" :key="line.id">
          <button class="mag-cover-line" :class="`mag-color-${line.color}`" type="button" @click="links?.goToPage(line.pageIndex)">
            <small>Page {{ line.page }}</small>
            {{ line.line }}
          </button>
        </li>
      </ul>
    </div>

    <footer class="mag-cover-foot">
      <SpriteImg class="mag-cover-logo" :sprite="block.logo" />
      <span class="mag-barcode" aria-hidden="true"></span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { MAGAZINE_LINKS } from '../../game/magazine-controller.ts';
import { MAGAZINE_ISSUE, MAGAZINE_PRICE, MAGAZINE_STRAP, MAGAZINE_TITLE } from '../../game/magazine-pages.ts';
import type { MagazineBlock } from '../../game/magazine-types.ts';
import SpriteImg from '../SpriteImg.vue';

const props = defineProps<{ block: Extract<MagazineBlock, { kind: 'cover' }> }>();
const links = inject(MAGAZINE_LINKS);

const printStyle = computed(() => ({
  '--ratio': `${props.block.art.w / props.block.art.h}`,
  '--tilt': '-2deg',
}));
</script>
