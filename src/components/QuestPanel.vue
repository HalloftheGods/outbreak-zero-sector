<template>
  <div class="quest-panel">
    <p class="quest-silver">
      <SpriteImg :sprite="icons.silverIcon" />
      <span class="quest-silver-label">Silver</span>
      <strong class="quest-silver-count">{{ silver }}</strong>
    </p>
    <template v-if="panel">
      <p class="quest-title">{{ panel.title }}</p>
      <p class="quest-brief">{{ panel.brief }}</p>
      <ShopItemBars :rows="barRows(panel.bars)" />
      <ul class="quest-rewards" aria-label="Reward">
        <li v-for="reward in panel.rewards" :key="reward.label" class="quest-reward" :class="`is-${reward.kind}`">
          {{ reward.label }}<span v-if="reward.note" class="quest-reward-note">{{ reward.note }}</span>
        </li>
      </ul>
      <div class="quest-actions">
        <PixelButton v-if="label" class="quest-go" :disabled="!panel.canAct" @press="pressPrimary(panel, merchant, game.home)">{{ label }}</PixelButton>
        <PixelButton
          v-if="panel.canAbandon"
          class="quest-drop"
          :class="{ 'is-armed': armed }"
          silent
          @press="armed = pressAbandon(panel, merchant, game.home, armed)"
          @focusout="armed = false"
        >{{ abandonLabel(armed) }}</PixelButton>
      </div>
      <p class="quest-refusal">{{ panel.refusal ?? (panel.lostIfDie ? 'Lost if you die' : '') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * The column beside the merchant on the Work tab: the silver to spend, then the picked job with its goal bars,
 * its pay and Accept, Turn in or Abandon. Its size is fixed, so moving along the list moves nothing.
 */
import { computed, ref, watch } from 'vue';
import type { MerchantId } from '../../shared/home-protocol.ts';
import type { UiArt } from '../art/types.ts';
import { abandonLabel, barRows, pressAbandon, pressPrimary, primaryLabel } from '../game/home/quest-screen.ts';
import type { QuestPanel } from '../game/home/quest-view.ts';
import PixelButton from './PixelButton.vue';
import ShopItemBars from './ShopItemBars.vue';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';

interface QuestPanelProps {
  panel: QuestPanel | null;
  merchant: MerchantId;
  icons: Pick<UiArt, 'silverIcon'>;
  silver: number;
}

const { panel, merchant } = defineProps<QuestPanelProps>();
const game = useGame();
const label = computed(() => (panel ? primaryLabel(panel) : null));
/** Abandon has been pressed once and waits for a second press. */
const armed = ref(false);

watch(() => panel?.id, () => {
  armed.value = false;
});
</script>

<style scoped>
.quest-panel {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 3);
  width: calc(var(--u) * 180);
  height: 100%;
  /* As tall as the item column, so switching tabs on a phone, where the card stacks, moves nothing. */
  min-height: calc(var(--u) * 172.5);
}

.quest-panel p,
.quest-panel ul {
  margin: 0;
}

.quest-silver {
  --sprite-px: max(var(--dpx, 1px), round(nearest, var(--u), var(--dpx, 1px)));
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 3);
  padding: calc(var(--u) * 2) calc(var(--u) * 3);
  background: rgba(11, 12, 16, 0.78);
}

.quest-silver-label {
  color: var(--bone-dim);
  font-size: calc(var(--u) * 7);
  text-transform: uppercase;
}

.quest-silver-count {
  margin-left: auto;
  color: var(--amber);
  font-size: calc(var(--u) * 9);
}

.quest-title {
  color: var(--amber);
  font-size: calc(var(--u) * 10);
  font-weight: 700;
  text-transform: uppercase;
}

/* Two lines are kept for the brief, so a short one never moves what is under it. */
.quest-brief {
  min-height: 2lh;
  color: var(--bone-dim);
  font-size: calc(var(--u) * 7);
}

.quest-rewards {
  flex: 1;
  align-content: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--u) * 2);
  padding: 0;
  list-style: none;
}

.quest-reward {
  padding: 0 calc(var(--u) * 3);
  background: rgba(11, 12, 16, 0.78);
  color: var(--bone);
  font-size: calc(var(--u) * 7);
}

.quest-reward-note {
  margin-left: calc(var(--u) * 3);
  color: var(--bone-dim);
}

.quest-actions {
  display: flex;
  gap: calc(var(--u) * 3);
  min-height: calc(var(--u) * 16);
}

.quest-go,
.quest-drop {
  width: auto;
  padding-inline: calc(var(--u) * 8);
}

/* Confirm is as wide as Abandon, so arming the button moves nothing. */
.quest-drop {
  min-width: calc(var(--u) * 72);
}

.quest-drop.is-armed {
  color: var(--blood-bright);
}

.quest-refusal {
  min-height: 1lh;
  color: var(--blood-bright);
  font-size: calc(var(--u) * 6);
}
</style>
