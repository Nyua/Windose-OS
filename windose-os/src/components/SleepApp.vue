<template>
  <div class="sleep-app" :class="timeSlot">
    <div class="sky-layer" aria-hidden="true"></div>
    <div class="godrays" aria-hidden="true"></div>
    <div class="sun" aria-hidden="true"></div>
    <div class="horizon" aria-hidden="true"></div>
    <div class="clock-display">
      <div class="time">{{ timeString }}</div>
      <div class="label">Ame's Time (UTC+10)</div>
      <div class="cities">Canberra, Melbourne, Sydney</div>
    </div>
    <div v-if="timeSlot === 'NIGHT'" class="zzz-container">
      <div v-for="z in zzzs" :key="z.id" class="zzz" :style="z.style">Z</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { formatUtcPlus10Time, getUtcPlus10TimeSlot } from '../sleepTime';
import type { TimeSlot } from '../types';
import { useSettings } from '../useSettings';

const timeString = ref('');
let timer: number | null = null;
const utcPlus10TimeSlot = ref<TimeSlot>('NIGHT');
const { settings } = useSettings();

const timeSlot = computed<TimeSlot>(() => {
  const overrideEnabled = Boolean(settings.value.sleepTimeSlotOverrideEnabled ?? false);
  if (!overrideEnabled) return utcPlus10TimeSlot.value;

  const raw = String(settings.value.sleepTimeSlotOverride ?? '').toUpperCase().trim();
  if (raw === 'NOON' || raw === 'DUSK' || raw === 'NIGHT') return raw;
  return utcPlus10TimeSlot.value;
});

interface Zzz {
  id: number;
  style: Record<string, string>;
}
const zzzs = ref<Zzz[]>([]);

function updateTime() {
  const now = new Date();
  timeString.value = formatUtcPlus10Time(now);
  utcPlus10TimeSlot.value = getUtcPlus10TimeSlot(now);
}

function spawnZzz() {
  const id = Date.now() + Math.random();
  const left = 10 + Math.random() * 80;
  const size = 12 + Math.random() * 24;
  zzzs.value.push({
    id,
    style: {
      left: `${left}%`,
      bottom: '10%',
      fontSize: `${size}px`,
      animationDuration: `${2 + Math.random() * 3}s`
    }
  });

  if (zzzs.value.length > 10) {
    zzzs.value.shift();
  }
}

onMounted(() => {
  updateTime();
  timer = window.setInterval(() => {
    updateTime();
    if (timeSlot.value === 'NIGHT') {
      if (Math.random() > 0.7) spawnZzz();
      return;
    }
    if (zzzs.value.length > 0) {
      zzzs.value = [];
    }
  }, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.sleep-app {
  --sleep-text: #f6f8ff;
  --sleep-shadow: #7a80b5;
  --sleep-label: rgba(255, 255, 255, 0.76);
  --sleep-zzz: #aebcfc;
  height: 100%;
  color: var(--sleep-text);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  font-family: var(--font-ui);
  isolation: isolate;
}

.sky-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(180deg, #171238 0%, #0d0033 70%, #08001f 100%);
}

.godrays {
  position: absolute;
  inset: -20%;
  opacity: 0;
  z-index: 1;
  pointer-events: none;
  background:
    repeating-linear-gradient(
      116deg,
      rgba(255, 252, 215, 0.38) 0px,
      rgba(255, 252, 215, 0.38) 26px,
      rgba(255, 252, 215, 0) 26px,
      rgba(255, 252, 215, 0) 58px
    );
  mix-blend-mode: screen;
}

.sun {
  position: absolute;
  left: 50%;
  width: 224px;
  height: 224px;
  transform: translateX(-50%);
  z-index: 1;
  opacity: 0;
  pointer-events: none;
  background: center / 100% 100% no-repeat url('/sleep/sun-pixel.svg');
  image-rendering: pixelated;
}

.horizon {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38%;
  z-index: 2;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(24, 16, 58, 0) 0%, rgba(8, 3, 28, 0.85) 100%);
}

.sleep-app.NOON {
  --sleep-text: #19304f;
  --sleep-shadow: rgba(232, 243, 255, 0.96);
  --sleep-label: rgba(25, 48, 79, 0.74);
  --sleep-zzz: rgba(56, 124, 184, 0.58);
}

.sleep-app.NOON .sky-layer {
  background:
    radial-gradient(circle at 28% 16%, rgba(255, 246, 196, 0.92) 0%, rgba(255, 246, 196, 0) 28%),
    linear-gradient(180deg, #79c8ff 0%, #bee9ff 60%, #fff0c2 100%);
}

.sleep-app.NOON .godrays {
  opacity: 0.42;
  animation: noon-rays-drift 14s linear infinite;
}

.sleep-app.NOON .sun {
  opacity: 1;
  top: -38px;
  filter: drop-shadow(0 0 26px rgba(255, 230, 140, 0.58));
}

.sleep-app.NOON .horizon {
  background: linear-gradient(180deg, rgba(248, 233, 189, 0) 0%, rgba(255, 236, 182, 0.68) 100%);
}

.sleep-app.DUSK {
  --sleep-text: #fff8f2;
  --sleep-shadow: rgba(126, 70, 117, 0.88);
  --sleep-label: rgba(255, 244, 236, 0.74);
  --sleep-zzz: rgba(246, 214, 250, 0.62);
}

.sleep-app.DUSK .sky-layer {
  background:
    radial-gradient(circle at 60% 25%, rgba(255, 171, 121, 0.4) 0%, rgba(255, 171, 121, 0) 34%),
    linear-gradient(180deg, #4f3b77 0%, #c27a6e 58%, #f3b174 100%);
}

.sleep-app.DUSK .sun {
  opacity: 1;
  bottom: -114px;
  filter: hue-rotate(-18deg) saturate(1.1) brightness(0.95) drop-shadow(0 0 20px rgba(255, 176, 117, 0.45));
}

.sleep-app.DUSK .horizon {
  height: 41%;
  background:
    linear-gradient(180deg, rgba(100, 58, 83, 0) 0%, rgba(74, 31, 58, 0.88) 100%);
  box-shadow: inset 0 18px 30px rgba(255, 178, 128, 0.18);
}

.sleep-app.NIGHT .sun,
.sleep-app.NIGHT .godrays {
  opacity: 0;
}

.clock-display {
  z-index: 3;
  text-align: center;
}
.time {
  font-size: 42px;
  font-family: var(--font-ui);
  font-weight: 700;
  letter-spacing: 0.3px;
  text-shadow: 0 0 10px var(--sleep-shadow);
}
.label {
  font-size: 12px;
  color: var(--sleep-label);
  margin-top: 4px;
}
.cities {
  margin-top: 3px;
  font-size: 11px;
  color: var(--sleep-label);
  letter-spacing: 0.2px;
}
.zzz-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}
.zzz {
  position: absolute;
  color: var(--sleep-zzz);
  opacity: 0;
  animation: floatAndFade linear forwards;
}

@keyframes noon-rays-drift {
  0% {
    transform: translateX(-4%) rotate(-2deg);
  }
  50% {
    transform: translateX(3%) rotate(1deg);
  }
  100% {
    transform: translateX(-4%) rotate(-2deg);
  }
}

@keyframes floatAndFade {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 0; }
  20% { opacity: 0.8; }
  100% { transform: translate(10px, -100px) rotate(20deg); opacity: 0; }
}
</style>
