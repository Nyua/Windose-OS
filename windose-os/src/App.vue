<template>
  <div class="app-root" :class="timeSlot">
    <div class="side-fill left"></div>
    <div class="viewport-slot" :style="{ width: `${viewportWidth * viewportScale}px`, height: `${viewportHeight * viewportScale}px` }">
      <div class="viewport" :style="{ width: `${viewportWidth}px`, height: `${viewportHeight}px`, transform: `scale(${viewportScale})` }" @click="startOpen = false">
      <Desktop
        :windows="windows"
        :settings="settings"
        :saveError="saveError"
        :webcamSeed="webcamSeed"
        :viewportWidth="viewportWidth"
        :viewportHeight="viewportHeight"
        :viewportScale="viewportScale"
        :jineMessages="jineState.messages"
        @open="openWindow"
        @focus="focusWindow"
        @move="moveWindow"
        @resize="resizeWindow"
        @minimize="minimizeWindow"
        @close="closeWindow"
        @toggleFullscreen="toggleFullscreen"
        @updateSetting="updateSetting"
        @iconHover="onIconHover"
        @jineSend="sendJineMessage"
        @jineSticker="sendJineSticker"
        @jineRead="markJineRead"
      />
      <StartMenu
        :open="startOpen"
        @controlPanel="openWindow('controlpanel')"
        @restart="restart"
        @shutdown="shutdown"
      />
      <Taskbar
        :windows="taskbarWindows"
        :dayOfYear="dayOfYear"
        :timeSlot="timeSlot"
        :taskbarHeight="(settings.taskbarHeight as number)"
        :startOpen="startOpen"
        :volume="volume"
        :jineUnreadCount="jineUnreadCount"
        @toggleStart="toggleStart"
        @tabClick="onTabClick"
        @open="openWindow"
        @volumeChange="setVolume"
      />
      <div v-if="jineToast" class="jine-toast" @click="openJineFromToast">
        <div class="title">JINE</div>
        <div class="body">{{ toastPreview(jineToast) }}</div>
      </div>
      </div>
    </div>
    <div class="side-fill right"></div>
    <div v-if="crtEnabled" class="crt" :style="{ opacity: crtIntensity }"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Desktop from './components/Desktop.vue';
import Taskbar from './components/Taskbar.vue';
import StartMenu from './components/StartMenu.vue';
import { getDayOfYear, getTimeSlot } from './time';
import { useSettings } from './useSettings';
import { loadJineState, saveJineState, seedJineState } from './jine';
import type { WindowState, WindowAppType, SettingValue, IconHoverPayload } from './types';
import type { JineMessage, JineState } from './jine';

const { settings, saveError } = useSettings();
const startOpen = ref(false);
const jineState = ref<JineState>(loadJineState());

const dayOfYear = ref(getDayOfYear());
const timeSlot = ref(getTimeSlot());
const volume = ref((settings.value.sfxVolumeDefault as number) || 0.5);

const webcamSeed = ref(Date.now());

const WEBCAM_REOPEN_DELAY_MS = 300;

const windows = ref<WindowState[]>([]);
let zCounter = 100;

const taskbarWindows = computed(() => windows.value.filter((w) => w.isOpen));

const jineUnreadCount = computed(() => jineState.value.unreadCount);

const webcamEnabled = computed(() => Boolean(settings.value.webcamEnabled ?? true));

const viewportWidth = computed(() => Number(settings.value.viewportWidth ?? 800));
const viewportHeight = computed(() => Number(settings.value.viewportHeight ?? 600));

const viewportScaleAuto = computed(() => Boolean(settings.value.viewportScaleAuto ?? true));
const viewportScaleManual = computed(() => Number(settings.value.viewportScale ?? 1));
const viewportScaleIntegerOnly = computed(() => Boolean(settings.value.viewportScaleIntegerOnly ?? false));
const windowSize = ref({ width: window.innerWidth, height: window.innerHeight });

const viewportScale = computed(() => {
  const baseW = Math.max(1, viewportWidth.value);
  const baseH = Math.max(1, viewportHeight.value);
  if (!viewportScaleAuto.value) {
    const manual = viewportScaleManual.value;
    let scale = Number.isFinite(manual) && manual > 0 ? manual : 1;
    if (viewportScaleIntegerOnly.value) {
      scale = Math.max(1, Math.round(scale));
    }
    return scale;
  }
  const scaleW = windowSize.value.width / baseW;
  const scaleH = windowSize.value.height / baseH;
  let scale = Math.min(scaleW, scaleH);
  if (viewportScaleIntegerOnly.value) {
    scale = Math.max(1, Math.floor(scale));
  }
  return Number.isFinite(scale) && scale > 0 ? scale : 1;
});

const jineToast = computed(() => {
  if (jineState.value.unreadCount <= 0) return null;
  const open = windows.value.some((w) => w.appType === 'jine' && w.isOpen && !w.isMinimized);
  if (open) return null;
  return [...jineState.value.messages].reverse().find((m) => m.isUnread) ?? null;
});

const crtEnabled = computed(() => (settings.value.crtEnabled as boolean));
const crtIntensity = computed(() => (settings.value.crtIntensity as number));

function tickTime() {
  const now = new Date();
  dayOfYear.value = getDayOfYear(now);
  timeSlot.value = getTimeSlot(now);
}

function updateWindowSize() {
  windowSize.value = { width: window.innerWidth, height: window.innerHeight };
}

onMounted(() => {
  setInterval(tickTime, 60000);
  updateWindowSize();
  window.addEventListener('resize', updateWindowSize);
  if (jineState.value.messages.length === 0) {
    jineState.value = seedJineState();
  }
  if (webcamEnabled.value) {
    ensureWebcamOpen('boot');
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWindowSize);
});

watch(webcamEnabled, (enabled) => {
  if (enabled) {
    ensureWebcamOpen('settings');
  } else {
    closeWebcamWindows();
  }
});

watch(
  jineState,
  (val) => {
    saveJineState(val);
  },
  { deep: true }
);

function toggleStart() {
  startOpen.value = !startOpen.value;
}

function randomizeWebcam() {
  webcamSeed.value = Date.now();
}

function getWebcamWindow() {
  return windows.value.find((w) => w.appType === 'webcam' && w.isOpen);
}

function closeWebcamWindows() {
  const webcamIds = windows.value.filter((w) => w.appType === 'webcam').map((w) => w.id);
  if (webcamIds.length === 0) return;
  webcamIds.forEach((id) => closeWindow(id));
}

function restoreWindow(id: string) {
  windows.value = windows.value.map((w) => {
    if (w.id !== id) return w;
    return {
      ...w,
      isMinimized: false,
      isFocused: true,
      zIndex: ++zCounter,
      x: w.lastNormal?.x ?? w.x,
      y: w.lastNormal?.y ?? w.y,
      width: w.lastNormal?.width ?? w.width,
      height: w.lastNormal?.height ?? w.height,
    };
  });
}

function getWindowDefaults(appType: WindowAppType) {
  if (appType === 'webcam') {
    return { x: 130, y: 110, width: 540, height: 380 };
  }
  return { x: 120, y: 120, width: 420, height: 300 };
}

function ensureWebcamOpen(reason: 'boot' | 'minimize' | 'close' | 'secret' | 'settings') {
  if (!webcamEnabled.value) return;
  const existing = getWebcamWindow();
  if (!existing) {
    openWindow('webcam');
    return;
  }
  if (existing.isMinimized) {
    restoreWindow(existing.id);
  } else {
    focusWindow(existing.id);
  }
  randomizeWebcam();
}

function markJineRead() {
  const messages = jineState.value.messages.map((m) => ({ ...m, isUnread: false }));
  jineState.value = {
    ...jineState.value,
    messages,
    lastReadAt: Date.now(),
    unreadCount: 0,
  };
}

function addJineMessage(author: string, body: string, kind: 'text' | 'sticker', isUnread: boolean) {
  const msg: JineMessage = {
    id: `${author}-${Date.now()}`,
    author,
    body,
    timestamp: Date.now(),
    isUnread,
    kind,
  };
  jineState.value = {
    ...jineState.value,
    messages: [...jineState.value.messages, msg],
    unreadCount: jineState.value.unreadCount + (isUnread ? 1 : 0),
  };
}

function sendJineMessage(body: string) {
  addJineMessage('You', body, 'text', false);
}

function sendJineSticker(label: string) {
  addJineMessage('You', label, 'sticker', false);
}
function scheduleWebcamReopen(reason: 'minimize' | 'close') {
  window.setTimeout(() => {
    if (!webcamEnabled.value) return;
    ensureWebcamOpen(reason);
  }, WEBCAM_REOPEN_DELAY_MS);
}

function onIconHover(payload: IconHoverPayload) {
  if (payload.id !== 'secret' || !payload.hovering || !webcamEnabled.value) return;
  ensureWebcamOpen('secret');
  const webcam = getWebcamWindow();
  if (!webcam) return;
  const targetX = payload.x - Math.round((webcam.width - payload.width) / 2);
  const targetY = payload.y - Math.round((webcam.height - payload.height) / 2);
  windows.value = windows.value.map((w) => {
    if (w.id !== webcam.id) return w;
    return {
      ...w,
      x: targetX,
      y: targetY,
      isMinimized: false,
      isFocused: true,
      zIndex: ++zCounter,
    };
  });
}

function openWindow(appType: WindowAppType) {
  if (appType === 'secret' && webcamEnabled.value) {
    ensureWebcamOpen('secret');
    return;
  }
  const existing = windows.value.find((w) => w.appType === appType && w.isOpen);
  if (existing) {
    if (existing.isMinimized) {
      restoreWindow(existing.id);
    } else {
      focusWindow(existing.id);
    }
    if (existing.appType === 'jine') {
      markJineRead();
    }
    return;
  }

  const id = `${appType}-${Date.now()}`;
  const defaults = getWindowDefaults(appType);
  const titleMap: Record<WindowAppType, string> = {
    webcam: 'Webcam',
    jine: 'JINE',
    stream: 'Metube',
    tweeter: 'Tweeter',
    goout: 'Go Out',
    internet: 'Internet',
    controlpanel: 'Control Panel',
    secret: 'Secret.txt',
    task: 'Task Manager',
  };

  windows.value.push({
    id,
    appType,
    title: titleMap[appType],
    x: defaults.x,
    y: defaults.y,
    width: defaults.width,
    height: defaults.height,
    zIndex: ++zCounter,
    isMinimized: false,
    isFocused: true,
    isOpen: true,
    isFullscreen: false,
  });
  focusWindow(id);
  if (appType === 'webcam') {
    randomizeWebcam();
  }
  if (appType === 'jine') {
    markJineRead();
  }
}

function focusWindow(id: string) {
  const win = windows.value.find((w) => w.id === id);
  windows.value = windows.value.map((w) => ({
    ...w,
    isFocused: w.id === id,
    zIndex: w.id === id ? ++zCounter : w.zIndex,
  }));
  if (win?.appType === 'jine') {
    markJineRead();
  }
}

function moveWindow(id: string, x: number, y: number) {
  windows.value = windows.value.map((w) => (w.id === id ? { ...w, x, y } : w));
}

function resizeWindow(id: string, x: number, y: number, width: number, height: number) {
  windows.value = windows.value.map((w) => (w.id === id ? { ...w, x, y, width, height } : w));
}

function minimizeWindow(id: string) {
  const win = windows.value.find((w) => w.id === id);
  const tb = settings.value.taskbarHeight as number;
  const height = viewportHeight.value;
  windows.value = windows.value.map((w) => {
    if (w.id !== id) return w;
    return {
      ...w,
      isMinimized: true,
      lastNormal: { x: w.x, y: w.y, width: w.width, height: w.height },
      x: 10,
      y: height - tb - 20,
    };
  });
  if (win?.appType === 'webcam' && webcamEnabled.value) {
    scheduleWebcamReopen('minimize');
  }
}

function closeWindow(id: string) {
  const win = windows.value.find((w) => w.id === id);
  if (win?.appType === 'webcam' && webcamEnabled.value) {
    windows.value = windows.value.filter((w) => w.id !== id);
    scheduleWebcamReopen('close');
    return;
  }
  const remaining = windows.value.filter((w) => w.id !== id);
  if (remaining.length === 0) {
    windows.value = remaining;
    return;
  }
  const focusCandidates = remaining.filter((w) => !w.isMinimized);
  if (focusCandidates.length === 0) {
    windows.value = remaining.map((w) => ({ ...w, isFocused: false }));
    return;
  }
  const top = focusCandidates.reduce((acc, w) => (w.zIndex > acc.zIndex ? w : acc));
  windows.value = remaining.map((w) => ({ ...w, isFocused: w.id === top.id }));
}

function toggleFullscreen(id: string) {
  windows.value = windows.value.map((w) => {
    if (w.id !== id) return w;
    if (!w.isFullscreen) {
      return {
        ...w,
        isFullscreen: true,
        lastNormal: { x: w.x, y: w.y, width: w.width, height: w.height },
        x: 0,
        y: 0,
        width: viewportWidth.value,
        height: viewportHeight.value - (settings.value.taskbarHeight as number),
      };
    }
    return {
      ...w,
      isFullscreen: false,
      x: w.lastNormal?.x ?? w.x,
      y: w.lastNormal?.y ?? w.y,
      width: w.lastNormal?.width ?? w.width,
      height: w.lastNormal?.height ?? w.height,
    };
  });
}

function toastPreview(msg: JineMessage | null) {
  if (!msg) return '';
  const body = msg.kind === 'sticker' ? `[Sticker] ${msg.body}` : msg.body;
  return body.length > 60 ? `${body.slice(0, 57)}...` : body;
}

function openJineFromToast() {
  openWindow('jine');
}

function onTabClick(id: string) {
  const win = windows.value.find((w) => w.id === id);
  if (!win) return;
  if (win.isMinimized) {
    restoreWindow(id);
    if (win.appType === 'jine') {
      markJineRead();
    }
    return;
  }
  if (win.isFocused) {
    minimizeWindow(id);
  } else {
    focusWindow(id);
  }
}

function restart() {
  window.location.reload();
}

function shutdown() {
  window.close();
  alert('Goodbye!');
}

function setVolume(v: number) {
  volume.value = v;
}

function updateSetting(key: string, value: SettingValue) {
  settings.value[key] = value;
}
</script>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  background: #000;
}
.viewport-slot {
  margin: auto;
}
.viewport {
  position: relative;
  background: #1d1d1d;
  overflow: hidden;
  transform-origin: top left;
}
.jine-toast {
  position: absolute;
  right: 12px;
  bottom: 64px;
  width: 220px;
  background: #ffffff;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
  padding: 6px 8px;
  font-family: var(--font-ui);
  font-size: 12px;
  cursor: pointer;
  z-index: 9999;
}
.jine-toast .title {
  font-weight: bold;
  margin-bottom: 4px;
}
.jine-toast .body {
  color: #333;
}
.side-fill {
  background: url('/sidebars/sidebar.png') no-repeat center / contain;
}
.side-fill.right {
  transform: scaleX(-1);
}
.crt {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.02),
    rgba(255, 255, 255, 0.02) 1px,
    rgba(0, 0, 0, 0) 2px,
    rgba(0, 0, 0, 0) 4px
  );
}
</style>



