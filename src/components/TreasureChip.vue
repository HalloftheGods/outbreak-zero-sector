<template>
  <div class="treasure-chip" aria-label="Carried treasure">
    <span class="treasure-silver">{{ home.carried.silver }} silver</span>
    <span v-if="home.carried.jewels.small > 0" class="treasure-jewel">{{ home.carried.jewels.small }} small</span>
    <span v-if="home.carried.jewels.large > 0" class="treasure-jewel">{{ home.carried.jewels.large }} large</span>
  </div>
</template>

<script setup lang="ts">
import type { HomeUi } from '../game/home-hud.ts';

defineProps<{ home: HomeUi }>();
</script>

<style scoped>
.treasure-chip {
  display: flex;
  flex-direction: column;
  gap: var(--u);
  padding: calc(var(--u) * 2) calc(var(--u) * 4);
  background: rgba(11, 12, 16, 0.78);
  color: var(--amber);
  font-weight: 700;
}

.treasure-jewel {
  color: var(--bone-dim);
  font-weight: 400;
}
</style>
