<template>
  <section class="px-screen">
    <div class="px-panel px-frame bench">
      <h2 class="px-heading">Workbench</h2>
      <p class="px-note">Town {{ bench.level }} is behind you. Next: {{ bench.nextTitle }}</p>

      <template v-if="hud.status === 'alive'">
        <ul class="bench-parts">
          <li v-for="part in PART_ORDER" :key="part" class="bench-part" :class="{ 'is-none': gear.parts[part] === 0 }">
            <SpriteImg :sprite="art.ui.pickupIcons[part]" />
            <span>{{ PART_LABELS[part] }}</span>
            <strong>{{ gear.parts[part] }}</strong>
          </li>
        </ul>
        <div class="bench-guns">
          <WorkbenchGun v-for="weapon in hud.owned" :key="weapon" :weapon :owned="hud.owned" :gear :art />
        </div>
        <PixelButton :primary="!bench.youReady" @press="toggleReady">{{ bench.youReady ? 'Not ready yet' : 'Ready' }}</PixelButton>
      </template>
      <p v-else class="px-note">Left behind. You rejoin in the next town with a pistol.</p>

      <p v-if="waiting" class="px-note">{{ waiting }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PART_LABELS, PART_ORDER } from '../../shared/gun-upgrade-data.ts';
import type { ArtBook } from '../art/types.ts';
import { NO_GEAR } from '../game/bench-view.ts';
import type { BenchHud } from '../game/bench-view.ts';
import type { HudState } from '../game/hud-state.ts';
import PixelButton from './PixelButton.vue';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';
import WorkbenchGun from './WorkbenchGun.vue';

const { hud, bench } = defineProps<{ hud: HudState; bench: BenchHud; art: ArtBook }>();
const game = useGame();

const gear = computed(() => hud.gear ?? NO_GEAR);
const waiting = computed(() => {
  const timer = bench.secondsLeft === null ? '' : `The van leaves in ${bench.secondsLeft}s. `;
  const others = bench.youReady && bench.waitingFor > 0 ? `Waiting for ${bench.waitingFor}.` : '';
  return `${timer}${others}`.trim();
});

function toggleReady(): void {
  game.bench.send({ kind: 'ready', ready: !bench.youReady });
}
</script>

<style scoped>
.bench {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--u) * 560);
  max-width: 100%;
}

.bench .px-note {
  align-self: center;
  max-width: none;
}

.bench-parts {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: calc(var(--u) * 2) calc(var(--u) * 6);
  list-style: none;
}

.bench-part {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 2);
}

.bench-part strong {
  color: var(--amber);
}

.bench-part.is-none {
  opacity: 0.4;
}

.bench-guns {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--u) * 4);
}
</style>
