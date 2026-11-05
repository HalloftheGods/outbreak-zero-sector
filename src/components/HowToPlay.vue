<template>
  <TitlePage heading="How to Play" size="extra-wide" @close="emit('close')">
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
      <div class="how-header">
        <h3 class="how-title">{{ section.title }}</h3>
        <span class="how-page-indicator">{{ current + 1 }} / {{ HOW_TO_SECTIONS.length }}</span>
      </div>

      <!-- In-game pixel art sprite recognition cards -->
      <div v-if="visualCards.length > 0" class="how-visuals">
        <div v-for="card in visualCards" :key="card.id" class="how-card px-frame">
          <div class="how-card-art">
            <SpriteImg :sprite="card.sprite" :scale="card.scale ?? 2" class="how-sprite" />
            <span v-if="card.badge" class="how-card-badge">{{ card.badge }}</span>
          </div>
          <div class="how-card-info">
            <span class="how-card-title">{{ card.title }}</span>
            <span v-if="card.subtitle" class="how-card-sub">{{ card.subtitle }}</span>
          </div>
        </div>
      </div>

      <!-- Tactical instructions and tips -->
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
import { buildArtBook } from '../art/index.ts';
import { HOW_TO_SECTIONS } from '../game/how-to-play.ts';
import { getSectionVisuals } from '../game/how-to-play-visuals.ts';
import MenuLink from './MenuLink.vue';
import SpriteImg from './SpriteImg.vue';
import TitlePage from './TitlePage.vue';

const emit = defineEmits<{ close: [] }>();
const current = ref(0);
const last = HOW_TO_SECTIONS.length - 1;
const section = computed(() => HOW_TO_SECTIONS[current.value]);

const art = buildArtBook();
const visualCards = computed(() => getSectionVisuals(section.value.id, art));

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
  padding: calc(var(--u) * 2) calc(var(--u) * 3);
  background: rgba(23, 24, 31, 0.72);
  color: var(--bone-dim);
  font: inherit;
  font-size: calc(var(--u) * 5.5);
  cursor: pointer;
}

.how-tab:hover,
.how-tab:focus-visible {
  color: var(--bone);
}

.how-tab.is-on {
  background: var(--amber);
  color: var(--ink);
  font-weight: 700;
}

.how-body {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  min-height: calc(var(--u) * 90);
}

.how-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: calc(var(--u) * 0.5) solid var(--ink-line);
  padding-bottom: calc(var(--u) * 2);
}

.how-title {
  margin: 0;
  font-size: calc(var(--u) * 8);
  color: var(--bone);
  text-transform: uppercase;
}

.how-page-indicator {
  font-size: calc(var(--u) * 5);
  color: var(--bone-dim);
}

.how-visuals {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--u) * 110), 1fr));
  gap: calc(var(--u) * 3);
}

.how-card {
  display: flex;
  gap: calc(var(--u) * 3);
  align-items: center;
  padding: calc(var(--u) * 3);
  background: rgba(23, 24, 31, 0.78);
  border: calc(var(--u) * 0.5) solid var(--ink-line);
}

.how-card-art {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: calc(var(--u) * 32);
  height: calc(var(--u) * 32);
  background: var(--ink);
  border: calc(var(--u) * 0.5) solid var(--ink-line);
  line-height: 0;
  overflow: hidden;
}

.how-sprite {
  image-rendering: pixelated;
}

.how-card-badge {
  position: absolute;
  top: calc(var(--u) * 0.5);
  right: calc(var(--u) * 0.5);
  background: rgba(11, 12, 16, 0.9);
  color: var(--amber);
  font-size: calc(var(--u) * 3.5);
  padding: 0 calc(var(--u) * 1);
  border: calc(var(--u) * 0.5) solid var(--amber);
}

.how-card-info {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 1);
  min-width: 0;
}

.how-card-title {
  color: var(--bone);
  font-weight: 700;
  font-size: calc(var(--u) * 5.5);
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.how-card-sub {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 4.5);
  line-height: 1.2;
}

.how-points {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2.5);
  margin: 0;
  padding: calc(var(--u) * 2) 0 0 0;
  list-style: none;
  color: var(--bone);
  font-size: calc(var(--u) * 6);
}

.how-points li::before {
  content: '> ';
  color: var(--amber);
}
</style>
