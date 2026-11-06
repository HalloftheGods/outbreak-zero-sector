<template>
  <section class="px-screen">
    <div class="px-panel px-frame bench" :style="{ '--card-w': CARD_W }">
      <SceneCard :sprite="art.ui.stations.bench" name="Workbench" :line="benchNote(bench)">
        <WorkbenchStats v-if="alive && shown" :weapon="shown" :gear :icons="art.ui" />
        <p v-else-if="!alive" class="px-note bench-left">Left behind. You rejoin in the next town with a pistol.</p>
      </SceneCard>
      <template v-if="alive && focused">
        <div class="bench-strip">
          <WorkbenchGuns ref="guns" :owned="hud.owned" :chosen :gear :icons="art.ui.weaponIcons" @choose="choose" @preview="preview" />
          <WorkbenchParts :parts="gear.parts" :icons="art.ui.pickupIcons" />
        </div>
        <WorkbenchGun :weapon="focused" :owned="hud.owned" :gear :art />
        <WorkbenchEffect :key="focused" :weapon="focused" :owned="hud.owned" :gear :art />
      </template>
      <footer class="bench-foot">
        <p class="px-note bench-wait">{{ waiting }}</p>
        <template v-if="alive">
          <PixelButton v-if="bench.walkUp" class="bench-act" primary @press="game.home.closeStation()">Close</PixelButton>
          <PixelButton v-else class="bench-act" :primary="!bench.youReady" @press="toggleReady">{{ bench.youReady ? 'Not ready yet' : 'Ready' }}</PixelButton>
        </template>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * The workbench, laid out like the survivor select: the bench's framed scene and the gun in focus beside it
 * (its bars, slots and rounds), over the guns in hand to pick from, the parts carried, and the upgrade and
 * kit tiles that work on the picked gun. Pointing at a gun previews it; the tiles always work the picked one.
 */
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import type { WeaponId } from '../../shared/protocol.ts';
import { CARD_W } from '../art/difficulty-card.ts';
import type { ArtBook } from '../art/types.ts';
import { benchNote, NO_GEAR } from '../game/bench-view.ts';
import type { BenchHud } from '../game/bench-view.ts';
import type { HudState } from '../game/hud-state.ts';
import PixelButton from './PixelButton.vue';
import SceneCard from './SceneCard.vue';
import { useGame } from './use-game.ts';
import WorkbenchEffect from './WorkbenchEffect.vue';
import WorkbenchGun from './WorkbenchGun.vue';
import WorkbenchGuns from './WorkbenchGuns.vue';
import WorkbenchParts from './WorkbenchParts.vue';
import WorkbenchStats from './WorkbenchStats.vue';

const { hud, bench, art } = defineProps<{ hud: HudState; bench: BenchHud; art: ArtBook }>();
const game = useGame();
const guns = useTemplateRef<InstanceType<typeof WorkbenchGuns>>('guns');

const gear = computed(() => hud.gear ?? NO_GEAR);
const alive = computed(() => hud.status === 'alive');
const waiting = computed(() => {
  const timer = bench.secondsLeft === null ? '' : `The van leaves in ${bench.secondsLeft}s. `;
  const others = bench.youReady && bench.waitingFor > 0 ? `Waiting for ${bench.waitingFor}.` : '';
  return `${timer}${others}`.trim();
});

const picked = ref<WeaponId | null>(null);
const previewed = ref<number | null>(null);
/** The pick stays on its gun while the snapshot changes; a gun no longer in hand falls back to the first. */
const chosen = computed(() => Math.max(0, hud.owned.indexOf(picked.value ?? hud.owned[0])));
const focused = computed<WeaponId | null>(() => hud.owned[chosen.value] ?? null);
const shown = computed<WeaponId | null>(() => hud.owned[previewed.value ?? chosen.value] ?? focused.value);

function choose(index: number): void {
  game.playUi('click');
  picked.value = hud.owned[index] ?? null;
}

function preview(index: number | null): void {
  const pointing = index !== null;
  if (pointing) game.playUi('hover');
  previewed.value = index;
}

function toggleReady(): void {
  game.bench.send({ kind: 'ready', ready: !bench.youReady });
}

onMounted(() => guns.value?.focus());
</script>

<style scoped>
/* As wide as the scene (rounded as SpriteImg rounds it), the column and the gaps; a phone gets the window. */
.bench {
  --scene-px: max(var(--dpx, 1px), round(nearest, calc(var(--u) * 4), var(--dpx, 1px)));
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 4);
  width: calc(var(--scene-px) * var(--card-w) + var(--u) * 220);
  max-width: 100%;
  container: select / inline-size;
}

.bench-left {
  width: calc(var(--u) * 180);
}

.bench-strip {
  display: flex;
  gap: calc(var(--u) * 3);
}

.bench-strip .parts {
  flex: 1;
}

.bench-foot {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 4);
}

/* One line is always kept, so the van's clock coming and going never moves the screen. */
.bench-wait {
  flex: 1;
  min-height: 1lh;
  max-width: none;
  margin: 0;
  font-size: calc(var(--u) * 6);
}

.bench-act {
  width: auto;
  padding-inline: calc(var(--u) * 10);
}

/* A phone has no room beside the guns: the parts go under them. */
@container select (max-width: 420px) {
  .bench-strip {
    flex-direction: column;
  }
}
</style>
