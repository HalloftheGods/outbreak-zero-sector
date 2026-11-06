<template>
  <span v-if="fit" class="fit-pips">
    <i v-for="pip in ranks" :key="pip" class="fit-pip" />
    <i v-if="suppressed" class="fit-pip is-suppressed" />
    <i v-if="fit.quirk" class="fit-pip is-quirk" />
    <i v-if="fit.effect" class="fit-pip is-effect" :class="`is-${fit.effect}`" />
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { rankOf, slotsUsed } from '../../shared/gun-upgrades.ts';
import type { GunFit } from '../../shared/gun-upgrades.ts';

const { fit } = defineProps<{ fit: GunFit | undefined }>();

const suppressed = computed(() => rankOf(fit, 'suppressor') > 0);
const ranks = computed(() => slotsUsed(fit) - rankOf(fit, 'suppressor'));
</script>

<style scoped>
.fit-pips {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 0.5);
}

.fit-pip {
  display: block;
  width: calc(var(--u) * 2);
  height: calc(var(--u) * 2);
  background: var(--amber);
}

.fit-pip.is-suppressed {
  background: var(--bone);
}

.fit-pip.is-quirk {
  background: var(--sick);
}

.fit-pip.is-effect {
  background: var(--blood-bright);
  outline: calc(var(--u) * 0.5) solid var(--ink-line);
}

.fit-pip.is-acid {
  background: var(--sick);
}

.fit-pip.is-piercing {
  background: var(--bone);
}

.fit-pip.is-tranq {
  background: var(--bone-dim);
}
</style>
