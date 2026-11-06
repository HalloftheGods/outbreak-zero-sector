<template>
  <button v-if="offered" class="cartridge" type="button" @click="installController.press()">
    <img class="cartridge-body" :src="CARTRIDGE_SRC" alt="" draggable="false" />
    <span class="cartridge-label mag-color-tomato">
      <span class="cartridge-tape" aria-hidden="true" />
      <span class="cartridge-band">Install</span>
      <span class="cartridge-name">Game</span>
    </span>
  </button>
  <IosInstallCard v-if="installController.guideOpen.value" :kind="installController.guideKind.value" @close="installController.closeGuide()" />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { cartridgeSrc } from '../art/cartridge.ts';
import { installController, setTitleShowing } from '../game/pwa/index.ts';
import IosInstallCard from './IosInstallCard.vue';
import './paper-palette.css';

const CARTRIDGE_SRC = cartridgeSrc();
const offered = computed(() => installController.path.value !== 'none');

// A waiting new version takes over while the title is up, never during a run.
onMounted(() => setTitleShowing(true));
onBeforeUnmount(() => setTitleShowing(false));
</script>

<style scoped>
.cartridge {
  --pixel: calc(var(--u) * 2.5);
  position: absolute;
  top: 0;
  bottom: 0;
  right: max(calc(var(--u) * 12), env(safe-area-inset-right));
  width: calc(var(--pixel) * 24);
  height: calc(var(--pixel) * 28);
  min-width: 44px;
  min-height: 44px;
  margin: auto 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  filter: drop-shadow(0 calc(var(--u) * 2) 0 rgba(0, 0, 0, 0.5));
  transition: transform 120ms steps(3);
}

.cartridge:hover,
.cartridge:focus-visible {
  transform: translateY(calc(var(--u) * -2));
}

.cartridge:focus-visible {
  outline: calc(var(--u) * 1) solid var(--note);
  outline-offset: calc(var(--u) * 2);
}

.cartridge-body {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

/* The label is cut to the cartridge's recess: 4,8 and 16 by 11 of its 24 by 28 pixels. */
.cartridge-label {
  position: absolute;
  left: 16.6667%;
  top: 28.5714%;
  width: 66.6667%;
  height: 39.2857%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--paper);
  color: var(--print);
  transform: rotate(-2deg);
  box-shadow: 0 0 0 calc(var(--u) * 0.5) var(--print-soft);
}

.cartridge-band {
  flex: none;
  padding: calc(var(--u) * 1) 0;
  background: var(--band);
  color: var(--on-band);
  font-size: calc(var(--u) * 4);
  font-weight: 700;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
}

.cartridge-name {
  flex: 1;
  display: grid;
  place-items: center;
  font-size: calc(var(--u) * 5.5);
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  border-bottom: calc(var(--u) * 1) solid var(--marker);
}

/* A scrap of tape holding the label down. */
.cartridge-tape {
  position: absolute;
  z-index: 1;
  top: calc(var(--u) * -1.5);
  right: calc(var(--u) * -2);
  width: calc(var(--u) * 7);
  height: calc(var(--u) * 3);
  background: rgba(255, 228, 92, 0.78);
  transform: rotate(38deg);
}

/*
 * Portrait: small, centred above the credit line. It never sits in the flow, so the menu does not jump
 * when the install prompt arrives. A screen too short to hold it clear of the menu and the credit line goes without.
 */
@media (orientation: portrait) {
  .cartridge {
    --pixel: calc(var(--u) * 2);
    top: auto;
    bottom: calc(var(--u) * 26);
    left: 0;
    right: 0;
    margin: 0 auto;
  }
}

/* On a very narrow screen the credit line and the Privacy link wrap to two rows, so it sits higher. */
@media (orientation: portrait) and (max-width: 340px) {
  .cartridge {
    bottom: calc(var(--u) * 44);
  }
}

@media (orientation: portrait) and (max-height: 600px), (orientation: portrait) and (max-width: 340px) and (max-height: 680px) {
  .cartridge {
    display: none;
  }
}

@media (orientation: landscape) and (max-height: 520px) {
  .cartridge {
    --pixel: calc(var(--u) * 2);
  }
}

@media (orientation: landscape) and (max-height: 340px) {
  .cartridge {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .cartridge {
    transition: none;
  }

  .cartridge:hover,
  .cartridge:focus-visible {
    transform: none;
  }
}
</style>
