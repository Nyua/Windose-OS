<template>
  <div class="boot-sequence" @click="handleClick">
    <div class="frame">
      <div v-if="phase === 'black'" class="screen black"></div>
      <div v-else-if="phase === 'bios'" class="screen bios">
        <div class="bios-image"></div>
        <img class="bios-logo" src="/bootscreen/bios_logo.png" alt="BIOS Logo" />
      </div>
      <div v-else-if="phase === 'bootscreen'" class="screen bootscreen">
        <div class="bootscreen-image" :style="bootscreenStyle"></div>
        <div v-if="skipHintVisible" class="boot-skip-hint">Click anywhere to skip</div>
      </div>
      <div v-else-if="phase === 'setup'" class="screen setup">
        <div class="setup-textbox">
          <div class="prompt">please Fullscreen your window to continue.</div>
          <div class="prompt secondary">
            mobile devices are not fully supported yet. the site is semi-usable on mobile right now, but not very intuitive. i'm working on it.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

type BootMode = 'startup' | 'restart' | 'shutdown';
type BootPhase = 'black' | 'bios' | 'bootscreen' | 'setup';
const BOOT_SFX_GAIN = 0.5;

const props = defineProps<{ mode: BootMode; blackMs?: number; biosMs?: number; fadeMs?: number }>();
const emit = defineEmits<{ (e: 'complete'): void }>();

const phase = ref<BootPhase>('black');
const bootscreenVisible = ref(false);
const completed = ref(false);
const skipHintVisible = ref(false);
let timers: number[] = [];

let biosStartAudio: HTMLAudioElement | null = null;
let biosLoopAudio: HTMLAudioElement | null = null;
let bootAudio: HTMLAudioElement | null = null;
let bootCautionAudio: HTMLAudioElement | null = null;

function initAudio() {
  if (typeof Audio === 'undefined') return;
  if (!biosStartAudio) biosStartAudio = new Audio('/sounds/bios_start.mp3');
  if (!biosLoopAudio) {
    biosLoopAudio = new Audio('/sounds/bios_sfx.mp3');
    biosLoopAudio.loop = true;
  }
  if (!bootAudio) bootAudio = new Audio('/sounds/Audio_boot.wav');
  if (!bootCautionAudio) bootCautionAudio = new Audio('/sounds/Audio_Boot_Caution.wav');
}

function stopAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

function playAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.volume = BOOT_SFX_GAIN;
  audio.currentTime = 0;
  const playPromise = audio.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => undefined);
  }
}

function stopAllAudio() {
  stopAudio(biosStartAudio);
  stopAudio(biosLoopAudio);
  stopAudio(bootAudio);
  stopAudio(bootCautionAudio);
}

function sanitizeMs(value: number | undefined, fallback: number) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : fallback;
}

const blackMs = computed(() => sanitizeMs(props.blackMs, 2000));
const biosMs = computed(() => sanitizeMs(props.biosMs, 5000));
const fadeMs = computed(() => sanitizeMs(props.fadeMs, 2000));

const bootscreenStyle = computed(() => ({
  opacity: bootscreenVisible.value ? 1 : 0,
  transitionDuration: `${fadeMs.value}ms`,
}));

function clearTimers() {
  timers.forEach((timer) => window.clearTimeout(timer));
  timers = [];
}

function startSequence() {
  clearTimers();
  initAudio();
  stopAllAudio();
  phase.value = 'black';
  bootscreenVisible.value = false;
  completed.value = false;
  skipHintVisible.value = false;
  const blackDelay = blackMs.value;
  const biosDelay = biosMs.value;
  timers.push(window.setTimeout(() => {
    phase.value = 'bios';
  }, blackDelay));
  timers.push(window.setTimeout(() => {
    phase.value = 'bootscreen';
    bootscreenVisible.value = false;
    window.requestAnimationFrame(() => {
      bootscreenVisible.value = true;
    });
  }, blackDelay + biosDelay));
  timers.push(window.setTimeout(() => {
    if (phase.value === 'bootscreen' || phase.value === 'bios') {
      skipHintVisible.value = true;
    }
  }, 10000));
}

function handleClick() {
  if (phase.value === 'bootscreen') {
    stopAudio(bootAudio);
    playAudio(bootCautionAudio);
    skipHintVisible.value = false;
    phase.value = 'setup';
  }
}

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
    (window.innerWidth <= 900 && 'ontouchstart' in window);
}

function isFullscreen() {
  if (typeof document !== 'undefined' && document.fullscreenElement) return true;
  const widthOk = Math.abs(window.innerWidth - screen.width) <= 2;
  const heightOk = Math.abs(window.innerHeight - screen.height) <= 2;
  return widthOk && heightOk;
}

function checkFullscreen() {
  if (phase.value !== 'setup') return;
  if (completed.value) return;
  // Skip fullscreen requirement on mobile - browsers have limited support
  if (isMobileDevice() || isFullscreen()) {
    completed.value = true;
    emit('complete');
  }
}

watch(
  () => props.mode,
  () => {
    startSequence();
  },
  { immediate: true }
);

watch(phase, (next) => {
  checkFullscreen();
  if (next === 'bios') {
    stopAllAudio();
    playAudio(biosStartAudio);
    playAudio(biosLoopAudio);
  }
  if (next === 'bootscreen') {
    stopAudio(biosStartAudio);
    stopAudio(biosLoopAudio);
    playAudio(bootAudio);
  }
});

onMounted(() => {
  initAudio();
  checkFullscreen();
  window.addEventListener('resize', checkFullscreen);
  document.addEventListener('fullscreenchange', checkFullscreen);
});

onBeforeUnmount(() => {
  clearTimers();
  stopAllAudio();
  window.removeEventListener('resize', checkFullscreen);
  document.removeEventListener('fullscreenchange', checkFullscreen);
});
</script>

<style scoped>
.boot-sequence {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  color: #e6e6e6;
  font-family: var(--font-sys);
}
.frame {
  position: relative;
  width: min(100vw, 133.333vh);
  height: min(100vh, 75vw);
  aspect-ratio: 4 / 3;
  background: #000;
  overflow: hidden;
}
.screen {
  position: absolute;
  inset: 0;
}
.screen.black {
  background: #000;
}
.screen.bios {
  background: #000;
}
.bios-image {
  position: absolute;
  inset: 12px;
  background: url('/bootscreen/boot_bios.png') no-repeat center / cover;
}
.bios-logo {
  position: absolute;
  top: 24px;
  right: 29px;
  width: 190px;
  height: auto;
}
.screen.bootscreen {
  cursor: pointer;
  background: #000;
}
.bootscreen-image {
  width: 100%;
  height: 100%;
  background: url('/bootscreen/bootscreen_4_3.png') no-repeat center / cover;
  opacity: 0;
  transition-property: opacity;
  transition-timing-function: ease-out;
}
.screen.setup {
  background: url('/bootscreen/setup.png') no-repeat center / cover;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.setup-textbox {
  margin-bottom: 60px;
  padding: 12px 18px;
  border: 2px solid #e6e6e6;
  box-shadow: inset 0 0 0 2px #000;
  background: rgba(0, 0, 0, 0.6);
  color: #e6e6e6;
  font-size: 14px;
}
.prompt {
  text-transform: none;
}
.prompt.secondary {
  margin-top: 8px;
  opacity: 0.9;
}
.boot-skip-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  animation: skip-hint-fade-in 0.5s ease-out;
  pointer-events: none;
}
@keyframes skip-hint-fade-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
