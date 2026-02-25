<template>
  <div class="desktop">
    <WindowFrame
      v-for="win in windows"
      :key="win.id"
      v-bind="win"
      :resizable="windowResizable"
      :transitionMs="minimizeMs"
      :transitionEasing="transitionEasing"
      :taskbarHeight="taskbarHeight"
      :viewportScale="props.viewportScale"
      @focus="focusWindow"
      @drag="moveWindow"
      @dragStart="onWindowDragStart"
      @dragEnd="onWindowDragEnd"
      @resize="resizeWindow"
      @minimize="minimizeWindow"
      @close="closeWindow"
      @toggleFullscreen="toggleFullscreen"
      @closeHover="closeHover"
      @closeHoverEnd="closeHoverEnd"
    >
      <ControlPanel
        v-if="win.appType === 'controlpanel'"
        :settings="settings"
        :saveError="saveError"
        @update="updateSetting"
        @launchAmeCorner="launchAmeCorner"
      />
      <Credits v-else-if="win.appType === 'credits'" />
      <Webcam
        v-else-if="win.appType === 'webcam'"
        :seed="webcamSeed"
        :madPhase="props.webcamMadPhase"
        :windowWidth="win.width"
        :windowHeight="win.height"
      />
      <Jine
        v-else-if="win.appType === 'jine'"
      />
      <Stream v-else-if="win.appType === 'stream'" :src="streamVideoUrl" :isMinimized="win.isMinimized" :isFocused="win.isFocused" :isOpen="win.isOpen" :locked="streamLocked" />
      <InternetApp v-else-if="win.appType === 'tweeter'" initial-site-id="twitter" />
      <TaskManager v-else-if="win.appType === 'task'" :windows="windows" />
      <InternetApp v-else-if="win.appType === 'internet'" />
      <MedicineApp v-else-if="win.appType === 'medication'" @open-medication-window="openMedicationWindow" />
      <MedicationDoseWindow v-else-if="win.appType === 'medication_depaz'" medicationType="depaz" />
      <MedicationDoseWindow v-else-if="win.appType === 'medication_dyslem'" medicationType="dyslem" />
      <MedicationDoseWindow v-else-if="win.appType === 'medication_embian'" medicationType="embian" />
      <MedicationDoseWindow v-else-if="win.appType === 'medication_magic_smoke'" medicationType="magic_smoke" />
      <SleepApp v-else-if="win.appType === 'sleep'" />
      <TrashBin v-else-if="win.appType === 'trash'" />
      <div v-else-if="win.appType === 'secret'" class="secret-image-app">
        <img class="secret-image" src="/webcam/Secret.jpg" alt="Secret image" draggable="false" />
      </div>
      <div v-else-if="win.appType === 'goout'" class="goout">GO OUTSIDE</div>
      <div v-else class="placeholder">{{ win.title }}</div>
    </WindowFrame>

    <DesktopIcon
      v-for="(app, idx) in desktopApps"
      :key="app.id"
      :id="app.id"
      :title="app.title"
      :icon="app.icon"
      :defaultX="app.defaultX ?? iconDefaultX"
      :defaultY="app.defaultY ?? (iconDefaultYStep * idx + iconDefaultX)"
      :size="iconSize"
      :gridX="iconGridX"
      :gridY="iconGridY"
      :gridOffset="iconGridOffset"
      :snapEnabled="iconSnapEnabled"
      :clampEnabled="iconClampEnabled"
      :clampLeft="iconClampLeft"
      :clampTop="iconClampTop"
      :clampRightOffset="iconClampRightOffset"
      :clampBottomOffset="iconClampBottomOffset"
      :taskbarHeight="iconTaskbarHeight"
      :doubleClickMs="iconDoubleClickMs"
      :notifications="false"
      :hinting="app.id === 'trash' && props.trashHintVisible"
      :viewportWidth="props.viewportWidth"
      :viewportHeight="props.viewportHeight"
      :viewportScale="props.viewportScale"
      @activate="openApp"
      @hover="onIconHover"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import WindowFrame from './WindowFrame.vue';
import DesktopIcon from './DesktopIcon.vue';
import ControlPanel from './ControlPanel.vue';
import Credits from './Credits.vue';
import Webcam from './Webcam.vue';
import Jine from './Jine.vue';
import Stream from './Stream.vue';
import TaskManager from './TaskManager.vue';
import InternetApp from './InternetApp.vue';
import MedicineApp from './MedicineApp.vue';
import MedicationDoseWindow from './MedicationDoseWindow.vue';
import SleepApp from './SleepApp.vue';
import TrashBin from './TrashBin.vue';
import type { MedicineType } from '../stores/medicine';
import type { WindowState, WindowAppType, SettingsSchema, SettingValue, TimeSlot } from '../types';


const props = defineProps<{ windows: WindowState[]; settings: SettingsSchema; saveError: string | null; webcamSeed: number; webcamMadPhase: 'idle' | 'hover' | 'release'; viewportWidth: number; viewportHeight: number; viewportScale: number; timeSlot: TimeSlot; trashHintVisible?: boolean; }>();
const emit = defineEmits<{
  (e: 'open', app: WindowAppType): void;
  (e: 'launchAmeCorner'): void;
  (e: 'focus', id: string): void;
  (e: 'move', id: string, x: number, y: number): void;
  (e: 'dragStart', id: string): void;
  (e: 'dragEnd', id: string): void;
  (e: 'resize', id: string, x: number, y: number, w: number, h: number): void;
  (e: 'minimize', id: string): void;
  (e: 'close', id: string): void;
  (e: 'toggleFullscreen', id: string): void;
  (e: 'updateSetting', key: string, value: SettingValue): void;
  (e: 'closeHover', id: string): void;
  (e: 'closeHoverEnd', id: string): void;
  (e: 'iconHover', payload: { id: string; hovering: boolean; x: number; y: number; width: number; height: number }): void;
}>();

const windowResizable = computed(() => Boolean(props.settings.windowResizable));
const minimizeMs = computed(() => Number(props.settings.minimizeAnimationMs ?? 180));
const transitionEasing = computed(() => String(props.settings.windowTransitionEasing ?? 'ease-out'));
const taskbarHeight = computed(() => Number(props.settings.taskbarHeight ?? 50));
const streamVideoUrl = computed(() => String(props.settings.streamVideoUrl ?? ''));
const streamLocked = computed(() => props.timeSlot !== 'NIGHT');

const iconSnapEnabled = computed(() => Boolean(props.settings.iconSnapEnabled));
const iconGridX = computed(() => Number(props.settings.iconGridX ?? 112));
const iconGridY = computed(() => Number(props.settings.iconGridY ?? 100));
const iconGridOffset = computed(() => Number(props.settings.iconGridOffset ?? 10));
const iconDefaultX = computed(() => Number(props.settings.iconDefaultX ?? 10));
const iconDefaultYStep = computed(() => Number(props.settings.iconDefaultYStep ?? 100));
const iconSize = computed(() => Number(props.settings.iconWidth ?? 80));
const iconTaskbarHeight = computed(() => Number(props.settings.iconTaskbarHeight ?? 50));
const iconClampEnabled = computed(() => Boolean(props.settings.iconClampEnabled));
const iconClampLeft = computed(() => Number(props.settings.iconClampLeft ?? 0));
const iconClampTop = computed(() => Number(props.settings.iconClampTop ?? 0));
const iconClampRightOffset = computed(() => Number(props.settings.iconClampRightOffset ?? 0));
const iconClampBottomOffset = computed(() => Number(props.settings.iconClampBottomOffset ?? 0));
const iconDoubleClickMs = computed(() => Number(props.settings.iconDoubleClickMs ?? 300));
const iconFootprintWidth = computed(() => Math.max(iconSize.value * 1.2, iconSize.value) + 24);
const iconFootprintHeight = computed(() => iconSize.value + 32);
const trashDefaultX = computed(() =>
  Math.max(
    iconClampLeft.value,
    props.viewportWidth - iconFootprintWidth.value - iconClampRightOffset.value,
  ),
);
const trashDefaultY = computed(() =>
  Math.max(
    iconClampTop.value,
    props.viewportHeight - iconTaskbarHeight.value - iconFootprintHeight.value - iconClampBottomOffset.value,
  ),
);

const desktopApps = computed(() => [
  { id: 'stream', title: 'Stream', icon: '/icons/stream.png' },
  { id: 'hangout', title: 'Hang Out', icon: '/icons/hangout.png' },
  { id: 'sleep', title: 'Sleep', icon: '/icons/sleep.png' },
  { id: 'medication', title: 'Medication', icon: '/icons/medication.png' },
  { id: 'internet', title: 'Internet', icon: '/icons/internet.png' },
  { id: 'goout', title: 'Go Out', icon: '/icons/goout.png' },
  { id: 'trash', title: 'Trash Bin', icon: '/icons/trash.png', defaultX: trashDefaultX.value, defaultY: trashDefaultY.value },
  { id: 'secret', title: 'Secret.txt', icon: '/icons/secret.png', defaultX: 320, defaultY: 240 },
]);

function openApp(id: string) {
  if (id === 'secret') emit('open', 'secret');
  if (id === 'internet') emit('open', 'internet');
  if (id === 'hangout') emit('open', 'hangout');
  if (id === 'goout') emit('open', 'goout');
  if (id === 'stream') emit('open', 'stream');
  if (id === 'tweeter') emit('open', 'tweeter');
  if (id === 'jine') emit('open', 'jine');
  if (id === 'webcam') emit('open', 'webcam');
  if (id === 'medication') emit('open', 'medication');
  if (id === 'sleep') emit('open', 'sleep');
  if (id === 'trash') emit('open', 'trash');
}

function focusWindow(id: string) { emit('focus', id); }
function onWindowDragStart(id: string) { emit('dragStart', id); }
function onWindowDragEnd(id: string) { emit('dragEnd', id); }
function moveWindow(id: string, x: number, y: number) { emit('move', id, x, y); }
function resizeWindow(id: string, x: number, y: number, w: number, h: number) { emit('resize', id, x, y, w, h); }
function minimizeWindow(id: string) { emit('minimize', id); }
function closeWindow(id: string) { emit('close', id); }
function toggleFullscreen(id: string) { emit('toggleFullscreen', id); }
function closeHover(id: string) { emit('closeHover', id); }
function closeHoverEnd(id: string) { emit('closeHoverEnd', id); }
function updateSetting(key: string, value: SettingValue) { emit('updateSetting', key, value); }
function launchAmeCorner() { emit('launchAmeCorner'); }
function onIconHover(payload: { id: string; hovering: boolean; x: number; y: number; width: number; height: number }) { emit('iconHover', payload); }
function openMedicationWindow(medicationType: MedicineType) {
  const appTypeByMedication: Record<MedicineType, WindowAppType> = {
    depaz: 'medication_depaz',
    dyslem: 'medication_dyslem',
    embian: 'medication_embian',
    magic_smoke: 'medication_magic_smoke',
  };
  emit('open', appTypeByMedication[medicationType]);
}
</script>

<style scoped>
.desktop {
  position: relative;
  width: 100%;
  height: 100%;
  background: url('/background/bg.png') no-repeat center / cover;
  overflow: hidden;
}
.placeholder {
  font-family: var(--font-ui);
  font-size: 14px;
}
.goout {
  font-family: var(--font-ui);
  font-size: 64px;
  text-align: center;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.secret-image-app {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  box-sizing: border-box;
  background: #0b0b0b;
}

.secret-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  user-select: none;
}
</style>

