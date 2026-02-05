<template>
  <div class="tweeter">
    <iframe
      v-if="src"
      class="iframe"
      :src="src"
      title="Tweeter"
      frameborder="0"
      @load="onLoad"
    ></iframe>
    <div v-else class="placeholder">Tweeter URL not set</div>
    <div v-if="loadState === 'loading'" class="overlay">Loading...</div>
    <div v-else-if="loadState === 'error'" class="overlay error">
      <div class="title">Content blocked by browser.</div>
      <a v-if="src" :href="src" target="_blank" rel="noopener">Open externally</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps<{ src: string }>();

const src = computed(() => (props.src || '').trim());
const loadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
let loadTimer: number | null = null;

function clearTimer() {
  if (loadTimer !== null) {
    window.clearTimeout(loadTimer);
    loadTimer = null;
  }
}

function startTimer() {
  clearTimer();
  loadState.value = 'loading';
  loadTimer = window.setTimeout(() => {
    if (loadState.value === 'loading') {
      loadState.value = 'error';
    }
  }, 4000);
}

function onLoad() {
  clearTimer();
  loadState.value = 'ready';
}

watch(
  () => src.value,
  (value) => {
    if (!value) {
      clearTimer();
      loadState.value = 'idle';
      return;
    }
    startTimer();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style scoped>
.tweeter {
  position: relative;
  width: 100%;
  height: 100%;
  background: #ffffff;
}
.iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #ffffff;
}
.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 12px;
  color: #666;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-ui);
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  padding: 10px;
}
.overlay.error {
  color: #444;
}
.overlay a {
  color: #5a4bb7;
  text-decoration: none;
}
</style>
