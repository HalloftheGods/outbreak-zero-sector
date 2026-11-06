<template>
  <div class="guide-scrim" @click.self="emit('close')">
    <section class="guide mag-color-mustard" role="dialog" aria-modal="true" :aria-labelledby="headingId">
      <p class="guide-kicker">{{ guide.kicker }}</p>
      <h2 :id="headingId" class="guide-heading">{{ guide.heading }}</h2>
      <ol class="guide-steps">
        <li v-for="(step, index) in guide.steps" :key="step.icon" class="guide-step">
          <span class="guide-number">{{ index + 1 }}</span>
          <img class="guide-icon" :src="guideIconSrc(step.icon)" alt="" />
          <span class="guide-words">
            <span class="guide-title">{{ step.title }}</span>
            <span class="guide-line">{{ step.line }}</span>
          </span>
        </li>
      </ol>
      <button ref="done" class="guide-done" type="button" @click="emit('close')">Got it</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue';
import { guideIconSrc } from '../art/cartridge.ts';
import type { GuideKind } from '../game/pwa/install-offer.ts';
import { guideFor } from '../game/pwa/ios-guide.ts';
import './paper-palette.css';

const props = defineProps<{ kind: GuideKind }>();
const emit = defineEmits<{ close: [] }>();

const headingId = useId();
const guide = computed(() => guideFor(props.kind));
const done = useTemplateRef<HTMLButtonElement>('done');

/** Caught on the way down, so Enter and the arrows never reach the title menu behind the card. */
function onKey(event: KeyboardEvent): void {
  const leaving = event.code === 'Escape' && !event.repeat;
  if (leaving) emit('close');
  const tabbing = event.code === 'Tab';
  if (!tabbing) event.stopPropagation();
}

onMounted(() => {
  window.addEventListener('keydown', onKey, true);
  done.value?.focus();
});
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true));
</script>

<style scoped>
.guide-scrim {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: calc(var(--u) * 6);
  background: rgba(7, 8, 12, 0.72);
}

.guide {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: min(calc(var(--u) * 190), 100%);
  max-height: 100%;
  overflow-y: auto;
  padding: calc(var(--u) * 6);
  border-top: calc(var(--u) * 5) solid var(--band);
  background: var(--paper);
  color: var(--print);
  box-shadow: 0 0 0 calc(var(--u) * 1) var(--print), calc(var(--u) * 3) calc(var(--u) * 3) 0 rgba(0, 0, 0, 0.6);
  transform: rotate(-0.6deg);
}

.guide-kicker {
  margin: 0;
  font-size: calc(var(--u) * 4);
  text-transform: uppercase;
  color: var(--print-soft);
}

.guide-heading {
  margin: 0;
  font-size: calc(var(--u) * 8);
  line-height: 1.1;
  text-transform: uppercase;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.guide-step {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 4);
}

.guide-number {
  flex: none;
  display: grid;
  place-items: center;
  width: calc(var(--u) * 9);
  height: calc(var(--u) * 9);
  background: var(--band);
  color: var(--on-band);
  font-size: calc(var(--u) * 5);
  font-weight: 700;
}

.guide-icon {
  flex: none;
  width: calc(var(--u) * 14);
  height: calc(var(--u) * 14);
  image-rendering: pixelated;
}

.guide-words {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 1);
}

.guide-title {
  font-size: calc(var(--u) * 5);
  font-weight: 700;
  text-transform: uppercase;
}

.guide-line {
  font-family: Georgia, 'DejaVu Serif', 'Noto Serif', serif;
  font-size: calc(var(--u) * 5);
  line-height: 1.25;
  color: var(--print-soft);
}

.guide-done {
  align-self: flex-end;
  min-width: 44px;
  min-height: 44px;
  padding: calc(var(--u) * 2) calc(var(--u) * 6);
  border: 0;
  background: var(--print);
  color: var(--paper);
  font: inherit;
  font-size: calc(var(--u) * 5);
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
}

.guide-done:focus-visible {
  outline: calc(var(--u) * 1) solid var(--marker);
  outline-offset: calc(var(--u) * 1);
}
</style>
