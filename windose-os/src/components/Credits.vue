<template>
  <div class="credits-root">
    <div
      class="image-slot"
      :style="backgroundStyle"
      aria-label="Credits background image"
    >
      <div class="legal-overlay">
        <p class="line">
          This site is a fan page and is not affiliated with, endorsed by, or sponsored by the creators of
          Needy Streamer Overload, WSS Playground (Why So Serious), or their partners.
        </p>
        <p class="line">
          Ownership/Publishing: <strong>Needy Streamer Overload is owned and published by WSS Playground (Why So Serious).</strong>
        </p>
        <p class="line">All original game assets are the property of the official studio and rights holders.</p>
        <p class="line">
          Credits: Ohisashiburi (Character Design), Nyalra (Scenario/Planning), KOTOKO (Vocalist), Aiobahn (Composer).
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const CREDITS_BACKGROUND_SRC = '/credits/NeedyStreamerOverload_credits.jpg';

const backgroundStyle = computed(() => {
  return {
    backgroundImage: `url('${CREDITS_BACKGROUND_SRC}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };
});
</script>

<style scoped>
.credits-root {
  width: 100%;
  height: 100%;
  padding: 10px;
  box-sizing: border-box;
  background: #f0f0f0;
}

.image-slot {
  position: relative;
  width: 100%;
  height: 100%;
  border: 2px solid #808080;
  box-shadow: inset 0 0 0 2px #d9d9d9;
  overflow: hidden;
}

.legal-overlay {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 14px;
  background: rgba(18, 18, 18, 0.8);
  color: #f8f8f8;
  border: 2px solid #ffffff;
  box-shadow: inset 0 0 0 2px #707070;
  padding: 10px 12px;
}

.line {
  margin: 0 0 8px;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.35;
}

.line:last-child {
  margin-bottom: 0;
}
</style>
