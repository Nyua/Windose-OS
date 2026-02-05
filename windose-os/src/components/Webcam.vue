<template>
  <div class="webcam">
    <img class="background" :src="background" alt="" aria-hidden="true" />
    <img class="sprite" :src="displaySprite" alt="Ame-chan webcam" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{ seed: number; madPhase?: 'idle' | 'hover' | 'release' }>();

const background = '/webcam-background/webcam-background.webp';
const madHoldSprite = '/webcam/webcam_mad_hold.png';
const madReleaseSprite = '/webcam/webcam_mad_release.png';

const sprites = [
  '/webcam/webcam_Ame-chan-crying.webp',
  '/webcam/webcam_Amechancrazysmoke.webp',
  '/webcam/webcam_Amechanfidgetspinner.webp',
  '/webcam/webcam_Amechanreading.webp',
  '/webcam/webcam_Amechansmokingisbadforyourlungs.webp',
  '/webcam/webcam_amechantripping.webp',
  '/webcam/webcam_Amechanvomiting.webp',
  '/webcam/webcam_Amechanwatchingtv.webp',
  '/webcam/webcam_Amechanyanderu.webp',
  '/webcam/webcam_AmeHeadphones.webp',
  '/webcam/webcam_AmeNailPolish.webp',
  '/webcam/webcam_AmeSleepy.webp',
  '/webcam/webcam_AmeTakingSelfie.webp',
  '/webcam/webcam_AmeTextsleepy.webp',
  '/webcam/webcam_AmeVoiceTraining.webp',
  '/webcam/webcam_Celestialudenbergisthatyou.webp',
  '/webcam/webcam_Crazyame.webp',
  '/webcam/webcam_Longhairamechan.webp',
  '/webcam/webcam_Ponytailamechan.webp',
  '/webcam/webcam_Sidehairamechan.webp',
  '/webcam/webcam_Texthappi.webp',
];

const currentSprite = ref(sprites[0]);

const displaySprite = computed(() => {
  if (props.madPhase === 'hover') return madHoldSprite;
  if (props.madPhase === 'release') return madReleaseSprite;
  return currentSprite.value;
});

function pickSprite() {
  const idx = Math.floor(Math.random() * sprites.length);
  currentSprite.value = sprites[idx];
}

watch(
  () => props.seed,
  () => pickSprite(),
  { immediate: true }
);
</script>

<style scoped>
.webcam {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}
.background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  pointer-events: none;
}
.sprite {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  pointer-events: none;
}
</style>
