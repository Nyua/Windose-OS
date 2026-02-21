<template>
  <transition name="startmenu-slide">
    <div class="start-menu" v-show="open" :style="{ bottom: `${taskbarHeight}px`, left: `0px` }" @click.stop>
      <div class="menu-rail" aria-hidden="true">WINDOSE</div>
      <div class="menu-items">
        <button :class="['menu-item', 'menu-item-control', { 'menu-item-faint-flash': lockDestroyed }]" @click="$emit('controlPanel')">
          <span class="control-panel-label">
            <span v-if="!lockDestroyed" class="control-panel-lock-wrap">
              <img class="control-panel-lock" :src="lockSprite" alt="" aria-hidden="true" />
              <div
                v-if="showControlPanelExplosion"
                :key="`control-panel-lock-explosion-${controlPanelExplosionPulse}`"
                class="lock-explosion"
                aria-hidden="true"
              >
                <div class="lock-explosion-flash"></div>
                <img class="lock-explosion-sprite" :src="explosionSprite" alt="" />
              </div>
            </span>
            <span>Control Panel</span>
          </span>
        </button>
        <button class="menu-item" @click="$emit('credits')">Credits</button>
        <button class="menu-item" @click="$emit('restart')">Restart</button>
        <button class="menu-item" @click="$emit('shutdown')">Shut Down</button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, toRefs, watch } from 'vue';
import explosionSprite from '../assets/emoji/emoji_explosion.png';
import lockSprite from '../assets/emoji/emoji_lock.png';

const props = withDefaults(defineProps<{
  open: boolean;
  taskbarHeight: number;
  controlPanelExplosionPulse?: number;
}>(), {
  controlPanelExplosionPulse: 0,
});

const { open, taskbarHeight, controlPanelExplosionPulse } = toRefs(props);
const showControlPanelExplosion = ref(false);
const lockDestroyed = ref(false);
const CONTROL_PANEL_EXPLOSION_MS = 340;
let controlPanelExplosionTimer: number | null = null;

defineEmits<{
  (e: 'controlPanel'): void;
  (e: 'credits'): void;
  (e: 'restart'): void;
  (e: 'shutdown'): void;
}>();

watch(controlPanelExplosionPulse, (next, prev) => {
  if (next <= 0 || next === prev) return;
  showControlPanelExplosion.value = true;
  if (controlPanelExplosionTimer !== null) {
    window.clearTimeout(controlPanelExplosionTimer);
  }
  controlPanelExplosionTimer = window.setTimeout(() => {
    showControlPanelExplosion.value = false;
    lockDestroyed.value = true;
    controlPanelExplosionTimer = null;
  }, CONTROL_PANEL_EXPLOSION_MS);
});

onBeforeUnmount(() => {
  if (controlPanelExplosionTimer !== null) {
    window.clearTimeout(controlPanelExplosionTimer);
    controlPanelExplosionTimer = null;
  }
});
</script>

<style scoped>
.start-menu {
  position: absolute;
  bottom: 60px;
  left: 0;
  width: 196px;
  background: #f0f0f0;
  border: 1px solid #9a9a9a;
  box-shadow:
    inset 1px 1px 0 #ffffff,
    inset -1px -1px 0 #6a6a6a;
  display: flex;
  align-items: stretch;
  z-index: 9999;
}
.menu-rail {
  width: 10px;
  background: #00008b;
  color: #ffffff;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  text-align: center;
  letter-spacing: 0.3px;
  font-family: var(--font-ui);
  font-size: 10px;
  line-height: 0.9;
  padding: 4px 0;
  user-select: none;
}
.menu-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
}
.menu-item {
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1;
  min-height: 30px;
  background: #f0f0f0;
  border: none;
  border-top: 1px solid #8585ff;
  text-align: center;
  padding: 8px 10px;
  color: #1d2496;
  cursor: pointer;
}
.menu-item-control {
  overflow: visible;
}
.menu-item-faint-flash {
  animation: control-panel-faint-flash 1.8s ease-in-out infinite;
}
.menu-item-faint-flash:hover {
  animation: none;
}
@keyframes control-panel-faint-flash {
  0%, 100% {
    filter: none;
  }
  50% {
    filter: brightness(1.06) saturate(1.02);
  }
}
.control-panel-label {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.control-panel-lock-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
}
.control-panel-lock {
  width: 11px;
  height: 11px;
  display: block;
  object-fit: contain;
  image-rendering: pixelated;
}
.lock-explosion {
  position: absolute;
  inset: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 2;
}
.lock-explosion-flash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgba(255, 219, 132, 0.88) 0, rgba(255, 115, 60, 0.65) 42%, rgba(255, 74, 74, 0) 80%),
    repeating-linear-gradient(45deg, rgba(255, 242, 158, 0.3) 0 4px, rgba(255, 104, 84, 0.3) 4px 8px);
  mix-blend-mode: screen;
  animation: lock-explosion-flash 340ms steps(5, end) both;
}
.lock-explosion-sprite {
  position: relative;
  width: 34px;
  height: 34px;
  object-fit: contain;
  image-rendering: pixelated;
  filter: saturate(1.25) contrast(1.1);
  animation: lock-explosion-pop 340ms steps(6, end) both;
}
@keyframes lock-explosion-pop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  22% {
    opacity: 1;
    transform: scale(1.08);
  }
  62% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.22);
  }
}
@keyframes lock-explosion-flash {
  0% {
    opacity: 0;
  }
  24% {
    opacity: 0.95;
  }
  65% {
    opacity: 0.55;
  }
  100% {
    opacity: 0;
  }
}
.menu-item:first-child {
  border-top: none;
}
.menu-item:hover {
  background: #000080;
  color: #ffffff;
}
.menu-item:focus-visible {
  outline: 1px dotted #ffffff;
  outline-offset: -4px;
}

.startmenu-slide-enter-active,
.startmenu-slide-leave-active {
  transition: transform 180ms ease-out, opacity 180ms ease-out;
}
.startmenu-slide-enter-from,
.startmenu-slide-leave-to {
  transform: translateY(12px);
  opacity: 0;
}
.startmenu-slide-enter-to,
.startmenu-slide-leave-from {
  transform: translateY(0);
  opacity: 1;
}

</style>
