<template>
  <article class="px-frame bench-gun">
    <header class="bench-gun-head">
      <SpriteImg :sprite="art.ui.weaponIcons[weapon]" />
      <strong>{{ WEAPONS[weapon].label }}</strong>
      <span class="bench-gun-slots">{{ slotsUsed(fit) }}/{{ GUN_SLOTS[weapon] }}</span>
    </header>
    <p v-if="quirk" class="bench-gun-quirk">{{ quirk.label }}: {{ quirk.note }}</p>
    <ul class="bench-gun-stats">
      <li v-for="line in stats" :key="line">{{ line }}</li>
    </ul>
    <ul class="bench-rows">
      <li v-for="row in rows" :key="row.upgrade" class="bench-row">
        <span class="bench-row-name">{{ row.label }}</span>
        <span class="bench-row-rank">{{ row.rank }}/{{ row.maxRank }}</span>
        <PixelButton class="bench-fit" :disabled="!row.fittable" @press="install(row.upgrade)">
          <SpriteImg v-for="part in row.cost" :key="part" :sprite="art.ui.pickupIcons[part]" />
        </PixelButton>
        <PixelButton v-for="target in row.moves" :key="target" class="bench-move" @press="move(row.upgrade, target)">
          Move to {{ WEAPONS[target].label }}
        </PixelButton>
      </li>
    </ul>
    <WorkbenchEffect :weapon :owned :gear :art />
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { WEAPONS } from '../../shared/constants.ts';
import { GUN_QUIRKS, GUN_SLOTS } from '../../shared/gun-upgrade-data.ts';
import type { GunUpgrade } from '../../shared/gun-upgrade-data.ts';
import { slotsUsed } from '../../shared/gun-upgrades.ts';
import type { PlayerGear } from '../../shared/gun-upgrades.ts';
import type { WeaponId } from '../../shared/protocol.ts';
import type { ArtBook } from '../art/types.ts';
import { benchRows, statLines } from '../game/bench-view.ts';
import PixelButton from './PixelButton.vue';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';
import WorkbenchEffect from './WorkbenchEffect.vue';

interface GunCardProps {
  weapon: WeaponId;
  owned: readonly WeaponId[];
  gear: PlayerGear;
  art: ArtBook;
}

const { weapon, owned, gear } = defineProps<GunCardProps>();
const game = useGame();

const fit = computed(() => gear.fits[weapon]);
const quirk = computed(() => (fit.value?.quirk ? GUN_QUIRKS[fit.value.quirk] : null));
const rows = computed(() => benchRows(weapon, owned, gear));
const stats = computed(() => statLines(weapon, fit.value));

function install(upgrade: GunUpgrade): void {
  game.bench.send({ kind: 'fit', weapon, upgrade });
}

function move(upgrade: GunUpgrade, to: WeaponId): void {
  game.bench.send({ kind: 'move', upgrade, from: weapon, to });
}
</script>

<style scoped>
.bench-gun {
  --edge: var(--ink-line);
  flex: 1 1 calc(var(--u) * 170);
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 3);
  padding: calc(var(--u) * 4);
  background: var(--ink-raised);
}

.bench-gun-head {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 3);
}

.bench-gun-slots {
  margin-left: auto;
  color: var(--amber);
}

.bench-gun-quirk {
  color: var(--sick);
}

.bench-gun-stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--u) calc(var(--u) * 4);
  list-style: none;
  color: var(--bone-dim);
}

.bench-rows {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2);
  list-style: none;
}

.bench-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--u) calc(var(--u) * 3);
}

.bench-row-rank {
  color: var(--bone-dim);
}

.bench-fit {
  display: flex;
  justify-content: center;
  gap: var(--u);
  width: calc(var(--u) * 40);
  padding: var(--u);
}

.bench-move {
  grid-column: 1 / -1;
  padding: var(--u) calc(var(--u) * 3);
}
</style>
