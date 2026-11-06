<template>
  <MagHead v-if="block.kind === 'head'" :block />
  <MagArticle v-else-if="block.kind === 'article'" :block />
  <MagPhoto v-else-if="block.kind === 'photo'" :block />
  <MagGallery v-else-if="block.kind === 'gallery'" :block />
  <MagKeyboard v-else-if="block.kind === 'keyboard'" :block />
  <MagDiagram v-else-if="block.kind === 'diagram'" :block />
  <MagItinerary v-else-if="block.kind === 'itinerary'" :block />
  <MagContents v-else-if="block.kind === 'contents'" :block />
  <MagCover v-else-if="block.kind === 'cover'" :block />

  <aside v-else-if="block.kind === 'sticky'" class="mag-sticky" :style="{ '--tilt': `${block.tilt}deg` }">{{ block.text }}</aside>

  <aside v-else-if="block.kind === 'tip'" class="mag-tip">
    <strong class="mag-tip-label">Survivor Tip</strong>
    <p>{{ block.text }}</p>
  </aside>

  <span v-else-if="block.kind === 'stamp'" class="mag-stamp" :style="{ '--tilt': `${block.tilt}deg` }">{{ block.text }}</span>

  <aside v-else-if="block.kind === 'sidebar'" class="mag-sidebar">
    <h4 class="mag-sidebar-title">{{ block.title }}</h4>
    <dl>
      <template v-for="[term, meaning] in block.lines" :key="term">
        <dt>{{ term }}</dt>
        <dd>{{ meaning }}</dd>
      </template>
    </dl>
  </aside>

  <div v-else-if="block.kind === 'hero'" class="mag-hero">
    <SpriteImg class="mag-hero-sprite" :sprite="block.sprite" :scale="26" />
    <span class="mag-burst">{{ block.burst }}</span>
    <p class="mag-hero-caption">{{ block.caption }}</p>
  </div>

  <blockquote v-else-if="block.kind === 'review'" class="mag-review">
    <span class="mag-review-stars" :aria-label="`${block.stars} stars`">{{ '★'.repeat(block.stars) }}</span>
    <p>{{ block.quote }}</p>
  </blockquote>

  <div v-else-if="block.kind === 'letter'" class="mag-letter">
    <h3 class="mag-letter-title">{{ block.title }}</h3>
    <p v-for="paragraph in block.paragraphs" :key="paragraph">{{ paragraph }}</p>
    <p class="mag-letter-signed">{{ block.signed }}</p>
  </div>
</template>

<script setup lang="ts">
import type { MagazineBlock } from '../../game/magazine-types.ts';
import SpriteImg from '../SpriteImg.vue';
import MagArticle from './MagArticle.vue';
import MagContents from './MagContents.vue';
import MagCover from './MagCover.vue';
import MagDiagram from './MagDiagram.vue';
import MagGallery from './MagGallery.vue';
import MagHead from './MagHead.vue';
import MagItinerary from './MagItinerary.vue';
import MagKeyboard from './MagKeyboard.vue';
import MagPhoto from './MagPhoto.vue';

defineProps<{ block: MagazineBlock }>();
</script>
