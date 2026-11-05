<template>
  <section class="px-screen px-title-scale px-page" :aria-label="heading">
    <div class="px-sheet px-frame" :class="{ 'is-wide': size === 'wide', 'is-extra-wide': size === 'extra-wide' }">
      <h2 class="px-heading px-sheet-heading">{{ heading }}</h2>
      <div class="px-sheet-body">
        <slot />
      </div>
      <div class="px-sheet-foot">
        <MenuLink @press="emit('close')">Back</MenuLink>
        <div class="px-sheet-actions">
          <slot name="actions" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { isConfirmKey } from '../game/title-menu.ts';
import MenuLink from './MenuLink.vue';

withDefaults(
  defineProps<{
    heading: string;
    size?: 'normal' | 'wide' | 'extra-wide';
  }>(),
  { size: 'normal' }
);
const emit = defineEmits<{ close: [] }>();

function onKey(event: KeyboardEvent): void {
  // An Enter held down must not ride focus into the button that starts a run.
  const heldEnter = isConfirmKey(event.code) && event.repeat;
  const leaving = event.code === 'Escape' && !event.repeat;
  if (heldEnter) event.preventDefault();
  if (leaving) emit('close');
}

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>
