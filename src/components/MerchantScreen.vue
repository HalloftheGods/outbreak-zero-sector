<template>
  <section class="px-screen">
    <div class="px-panel px-frame">
      <template v-if="home.shop">
        <SpriteImg :sprite="art.merchants[home.shop].portrait" />
        <h2 class="px-heading">{{ home.shop }}</h2>
      </template>
      <PixelButton @press="game.home.closeStation()">Close</PixelButton>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ArtBook } from '../art/types.ts';
import type { HomeUi } from '../game/home-hud.ts';
import PixelButton from './PixelButton.vue';
import SpriteImg from './SpriteImg.vue';
import { useGame } from './use-game.ts';

defineProps<{ home: HomeUi; art: ArtBook }>();
const game = useGame();
</script>
