<template>
  <section class="px-screen px-title-scale px-page privacy" aria-label="Privacy" role="dialog" aria-modal="true">
    <div class="px-sheet px-frame is-wide">
      <h2 class="px-heading px-sheet-heading">{{ PRIVACY_TITLE }}</h2>
      <div class="px-sheet-body">
        <section v-for="section in PRIVACY_SECTIONS" :key="section.heading" class="privacy-section">
          <h3 class="px-label">{{ section.heading }}</h3>
          <p v-for="line in section.lines" :key="line" class="privacy-line">{{ line }}</p>
        </section>
      </div>
      <div class="px-sheet-foot">
        <MenuLink @press="closePrivacy()">Back</MenuLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { closePrivacy } from '../game/analytics/index.ts';
import { PRIVACY_SECTIONS, PRIVACY_TITLE } from '../game/analytics/privacy-text.ts';
import MenuLink from './MenuLink.vue';

/**
 * Listens first, before the page behind it: Escape closes only this page, and no key reaches the
 * title menu or Options underneath. The key keeps its default, so Tab and Enter on Back still work.
 */
function onKey(event: KeyboardEvent): void {
  const leaving = event.code === 'Escape' && !event.repeat;
  event.stopPropagation();
  if (leaving) closePrivacy();
}

onMounted(() => window.addEventListener('keydown', onKey, true));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true));
</script>

<style scoped>
.privacy {
  z-index: 3;
  background: rgba(7, 8, 12, 0.82);
}

.privacy-section {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2);
}

.privacy-line {
  margin: 0;
  color: var(--bone-dim);
}
</style>
