<template>
  <section class="bench-effect" :aria-label="`Rounds for ${WEAPONS[weapon].label}`">
    <p class="bench-effect-now" :class="{ 'is-none': !view.current }">
      <strong>{{ view.current ? view.current.label : 'Plain rounds' }}</strong>
      <span v-if="view.current">{{ view.current.note }}</span>
    </p>
    <ul class="bench-effect-kits">
      <li v-for="option in view.options" :key="option.effect" class="bench-effect-kit">
        <SpriteImg :sprite="art.ui.pickupIcons[GUN_EFFECTS[option.effect].kit]" />
        <span class="bench-effect-name">{{ option.label }}</span>
        <strong class="bench-effect-count" :class="{ 'is-none': option.count === 0 }">{{ option.count }}</strong>
        <PixelButton :disabled="!option.fittable" @press="ask(option)">{{ view.current ? 'Replace' : 'Fit' }}</PixelButton>
      </li>
    </ul>
    <div v-if="pending" class="bench-effect-confirm" role="alertdialog" aria-live="assertive">
      <p>{{ replaceQuestion(pending) }}</p>
      <PixelButton primary @press="confirm">Replace</PixelButton>
      <PixelButton @press="pending = null">Keep {{ pending.replaces }}</PixelButton>
    </div>
    <PixelButton v-for="target in view.moves" :key="target" class="bench-effect-move" @press="move(target)">
      Move {{ view.current?.label }} to {{ WEAPONS[target].label }}
    </PixelButton>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { WEAPONS } from '../../shared/constants.ts';
import type { PlayerGear } from '../../shared/gun-upgrades.ts';
import type { WeaponId } from '../../shared/protocol.ts';
import { GUN_EFFECTS } from '../../shared/round-effect-data.ts';
import type { ArtBook } from '../art/types.ts';
import { effectView, needsConfirm, replaceQuestion } from '../game/bench-effects.ts';
import type { EffectOption } from '../game/bench-effects.ts';
import PixelButton from './PixelButton.vue';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';

interface EffectProps {
  weapon: WeaponId;
  owned: readonly WeaponId[];
  gear: PlayerGear;
  art: ArtBook;
}

const { weapon, owned, gear } = defineProps<EffectProps>();
const game = useGame();

const view = computed(() => effectView(weapon, owned, gear));
const pending = ref<EffectOption | null>(null);

// A snapshot that changes the gun's effect, or the kits, under an open question closes it.
watch(view, (next) => {
  const stale = pending.value !== null && !next.options.some((o) => o.effect === pending.value?.effect && o.fittable && o.replaces === pending.value?.replaces);
  if (stale) pending.value = null;
});

function fit(option: EffectOption): void {
  game.bench.send({ kind: 'fit_effect', weapon, effect: option.effect });
}

function ask(option: EffectOption): void {
  if (needsConfirm(option)) pending.value = option;
  else fit(option);
}

function confirm(): void {
  if (pending.value) fit(pending.value);
  pending.value = null;
}

function move(to: WeaponId): void {
  game.bench.send({ kind: 'move_effect', from: weapon, to });
}
</script>

<style scoped>
.bench-effect {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2);
  padding-top: calc(var(--u) * 2);
  border-top: var(--u) solid var(--ink-line);
}

.bench-effect-now {
  display: flex;
  flex-direction: column;
  gap: var(--u);
  color: var(--bone-dim);
}

.bench-effect-now strong {
  color: var(--amber);
}

.bench-effect-now.is-none strong {
  color: var(--bone-dim);
}

.bench-effect-kits {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2);
  list-style: none;
}

.bench-effect-kit {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  gap: calc(var(--u) * 2);
}

.bench-effect-count {
  color: var(--amber);
}

.bench-effect-count.is-none {
  opacity: 0.4;
}

.bench-effect-confirm {
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 2);
  padding: calc(var(--u) * 3);
  border: var(--u) solid var(--sick);
  color: var(--sick);
}

.bench-effect-move {
  padding: var(--u) calc(var(--u) * 3);
}
</style>
