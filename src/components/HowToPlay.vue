<template>
  <TitlePage heading="How to Play" @close="emit('close')">
    <nav class="how-tabs" aria-label="Sections">
      <button
        v-for="(each, index) in HOW_TO_SECTIONS"
        :key="each.id"
        class="how-tab"
        :class="{ 'is-on': index === current }"
        type="button"
        :aria-current="index === current"
        @click="current = index"
      >
        {{ each.tab }}
      </button>
    </nav>

    <div class="how-body">
      <p class="px-label">{{ section.title }}</p>
      <ul class="how-points">
        <li v-for="line in section.points" :key="line">{{ line }}</li>
      </ul>
    </div>

    <template #actions>
      <MenuLink :disabled="current === 0" @press="step(-1)">Prev</MenuLink>
      <MenuLink :disabled="current === last" @press="step(1)">Next</MenuLink>
    </template>
  </TitlePage>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { HOW_TO_SECTIONS } from '../game/how-to-play.ts';
import MenuLink from './MenuLink.vue';
import TitlePage from './TitlePage.vue';

const emit = defineEmits<{ close: [] }>();
const current = ref(0);
const last = HOW_TO_SECTIONS.length - 1;
const section = computed(() => HOW_TO_SECTIONS[current.value]);

function step(by: number): void {
  current.value = Math.min(last, Math.max(0, current.value + by));
}
</script>

<style scoped>
.how-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--u) * 2);
}

.how-tab {
  border: 0;
  padding: calc(var(--u) * 2) calc(var(--u) * 4);
  background: rgba(23, 24, 31, 0.72);
  color: var(--bone-dim);
  font: inherit;
  cursor: pointer;
}

.how-tab:hover,
.how-tab:focus-visible {
  color: var(--bone);
}

.how-tab.is-on {
  background: var(--amber);
  color: var(--ink);
}

.how-body {
  min-height: calc(var(--u) * 80);
}

.how-points {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 3);
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--bone);
}

.how-points li::before {
  content: '> ';
  color: var(--amber);
}
</style>
