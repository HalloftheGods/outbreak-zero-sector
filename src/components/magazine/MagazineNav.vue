<template>
  <nav class="mag-nav" aria-label="Magazine pages">
    <MenuLink class="mag-nav-link" @press="emit('back')">Back</MenuLink>
    <MenuLink class="mag-nav-link" silent @press="emit('contents')">Contents</MenuLink>
    <span class="mag-nav-page" aria-live="polite">{{ label }}</span>
    <MenuLink class="mag-nav-link" silent :disabled="atStart" @press="emit('prev')">Prev</MenuLink>
    <MenuLink class="mag-nav-link is-next" silent :disabled="atEnd" @press="emit('next')">Next</MenuLink>
  </nav>
</template>

<script setup lang="ts">
import MenuLink from '../MenuLink.vue';

interface NavEvents {
  back: [];
  contents: [];
  prev: [];
  next: [];
}

defineProps<{ label: string; atStart: boolean; atEnd: boolean }>();
const emit = defineEmits<NavEvents>();
</script>
