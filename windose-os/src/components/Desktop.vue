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
      :viewportScale="viewportScale"
      @focus="focusWindow"
      @drag="moveWindow"
      @resize="resizeWindow"
      @minimize="minimizeWindow"
      @close="closeWindow"
      @toggleFullscreen="toggleFullscreen"
    >
      <ControlPanel
        v-if="win.appType === 'controlpanel'"
        :settings="settings"
        :saveError="saveError"
        @update="updateSetting"
      />
      <Webcam v-else-if="win.appType === 'webcam'" :seed="webcamSeed" />
      <Jine
        v-else-if="win.appType === 'jine'"
        :messages="props.jineMessages"
        @send="sendJine"
        @sticker="sendJineSticker"
        @markRead="markJineRead"
      />
      <Stream v-else-if="win.appType === 'stream'" :src="streamVideoUrl" :isMinimized="win.isMinimized" :isFocused="win.isFocused" :isOpen="win.isOpen" />
      <div v-else-if="win.appType === 'tweeter'" class="placeholder">
        <iframe class="iframe" src="https://x.com/ProbablyLaced"></iframe>
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
import Webcam from './Webcam.vue';
import Jine from './Jine.vue';
import Stream from './Stream.vue';
import type { WindowState, WindowAppType, SettingsSchema, SettingValue } from '../types';
import type { JineMessage } from '../jine';

const props = defineProps<{ windows: WindowState[]; settings: SettingsSchema; saveError: string | null; webcamSeed: number; viewportWidth: number; viewportHeight: number; viewportScale: number; jineMessages: JineMessage[] }>();
const emit = defineEmits<{
  (e: 'open', app: WindowAppType): void;
  (e: 'focus', id: string): void;
  (e: 'move', id: string, x: number, y: number): void;
  (e: 'resize', id: string, x: number, y: number, w: number, h: number): void;
  (e: 'minimize', id: string): void;
  (e: 'close', id: string): void;
  (e: 'toggleFullscreen', id: string): void;
  (e: 'updateSetting', key: string, value: SettingValue): void;
  (e: 'iconHover', payload: { id: string; hovering: boolean; x: number; y: number; width: number; height: number }): void;
  (e: 'jineSend', body: string): void;
  (e: 'jineSticker', label: string): void;
  (e: 'jineRead'): void;
}>();

const windowResizable = computed(() => Boolean(props.settings.windowResizable));
const minimizeMs = computed(() => Number(props.settings.minimizeAnimationMs ?? 180));
const transitionEasing = computed(() => String(props.settings.windowTransitionEasing ?? 'ease-out'));
const taskbarHeight = computed(() => Number(props.settings.taskbarHeight ?? 50));
const streamVideoUrl = computed(() => String(props.settings.streamVideoUrl ?? ''));

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

const desktopApps = computed(() => [
  { id: 'stream', title: 'Stream', icon: '/icons/stream.png' },
  { id: 'hangout', title: 'Hang Out', icon: '/icons/hangout.png' },
  { id: 'sleep', title: 'Sleep', icon: '/icons/sleep.png' },
  { id: 'medication', title: 'Medication', icon: '/icons/medication.png' },
  { id: 'internet', title: 'Internet', icon: '/icons/internet.png' },
  { id: 'goout', title: 'Go Out', icon: '/icons/goout.png' },
  { id: 'trash', title: 'Trash Bin', icon: '/icons/trash.png' },
  { id: 'secret', title: 'Secret.txt', icon: '/icons/secret.png', defaultX: 320, defaultY: 240 },
]);

function openApp(id: string) {
  if (id === 'secret') emit('open', 'secret');
  if (id === 'internet') emit('open', 'internet');
  if (id === 'goout') emit('open', 'goout');
  if (id === 'stream') emit('open', 'stream');
  if (id === 'tweeter') emit('open', 'tweeter');
  if (id === 'jine') emit('open', 'jine');
  if (id === 'webcam') emit('open', 'webcam');
}

function focusWindow(id: string) { emit('focus', id); }
function moveWindow(id: string, x: number, y: number) { emit('move', id, x, y); }
function resizeWindow(id: string, x: number, y: number, w: number, h: number) { emit('resize', id, x, y, w, h); }
function minimizeWindow(id: string) { emit('minimize', id); }
function closeWindow(id: string) { emit('close', id); }
function toggleFullscreen(id: string) { emit('toggleFullscreen', id); }
function updateSetting(key: string, value: SettingValue) { emit('updateSetting', key, value); }
function onIconHover(payload: { id: string; hovering: boolean; x: number; y: number; width: number; height: number }) { emit('iconHover', payload); }
function sendJine(body: string) { emit('jineSend', body); }
function sendJineSticker(label: string) { emit('jineSticker', label); }
function markJineRead() { emit('jineRead'); }
</script>

<style scoped>
.desktop {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.placeholder {
  font-family: var(--font-ui);
  font-size: 14px;
}
.iframe {
  width: 100%;
  height: 100%;
  border: none;
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
</style>
