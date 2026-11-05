<template>
  <section class="downed" role="status">
    <template v-if="hud.status === 'downed'">
      <strong class="downed-title">You are down</strong>
      <div class="px-meter downed-meter" :style="bleedoutFill"><span /></div>
      <span v-if="hud.revive > 0" class="downed-sub is-good">Being revived</span>
      <span v-else-if="mode === 'solo'" class="downed-sub">Nobody is coming</span>
      <span v-else class="downed-sub">Bleeding out: {{ Math.ceil(hud.bleedout) }}s. Hold on for a teammate.</span>
    </template>
    <template v-else>
      <strong class="downed-title">You died</strong>
      <span v-if="hud.spectating" class="downed-sub">Spectating {{ hud.spectating }}</span>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BLEEDOUT_SEC } from '../../shared/constants.ts';
import type { HudState } from '../game/hud-state.ts';
import type { TransportKind } from '../network/transport.ts';

const { hud } = defineProps<{ hud: HudState; mode: TransportKind }>();

const bleedoutFill = computed(() => ({ '--fill': `${Math.min(100, (hud.bleedout / BLEEDOUT_SEC) * 100)}%` }));
</script>

<style scoped>
.downed {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 24%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--u) * 3);
  pointer-events: none;
}

.downed-title {
  font-size: calc(var(--u) * 14);
  line-height: 1;
  color: var(--blood-bright);
  animation: px-blink 1.2s steps(2) infinite;
}

.downed-meter {
  width: calc(var(--u) * 90);
}

.downed-meter > span {
  background: var(--blood-bright);
}

.downed-sub {
  padding: var(--u) calc(var(--u) * 3);
  background: rgba(11, 12, 16, 0.78);
  color: var(--bone);
}

.is-good {
  color: var(--sick);
}
</style>
