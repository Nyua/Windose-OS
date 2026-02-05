<template>
  <div class="app-root" :class="timeSlot">
    <div class="side-fill left" :class="{ flash: sidebarFlashKey > 0 }" :key="`side-left-${sidebarFlashKey}`"></div>
    <div class="viewport-slot" :style="{ width: `${viewportWidth * viewportScale}px`, height: `${viewportHeight * viewportScale}px` }">
      <div class="viewport" ref="viewportRef" :style="{ width: `${viewportWidth}px`, height: `${viewportHeight}px`, transform: `scale(${viewportScale})`, '--ui-scale': uiScale, '--viewport-softness': `${viewportSoftness}px` }" @pointerdown="onViewportPointerDown" @click="startOpen = false">
      <Desktop
        :windows="windows"
        :settings="settings"
        :saveError="saveError"
        :webcamSeed="webcamSeed"
        :webcamMadPhase="webcamMadPhase"
        :viewportWidth="viewportWidth"
        :viewportHeight="viewportHeight"
        :viewportScale="viewportScale"
        :timeSlot="timeSlot"
        :jineMessages="jineState.messages"
        @open="openWindow"
        @focus="focusWindow"
        @move="moveWindow"
        @dragStart="onWindowDragStart"
        @resize="resizeWindow"
        @minimize="minimizeWindow"
        @close="closeWindow"
        @toggleFullscreen="toggleFullscreen"
        @closeHover="onCloseHover"
        @closeHoverEnd="onCloseHoverEnd"
        @updateSetting="updateSetting"
        @iconHover="onIconHover"
        @jineSend="sendJineMessage"
        @jineSticker="sendJineSticker"
        @jineRead="markJineRead"
      />
      <StartMenu
        :open="startOpen"
        :taskbarHeight="(settings.taskbarHeight as number)"
        @controlPanel="openWindow('controlpanel')"
        @restart="restart"
        @shutdown="shutdown"
      />
      <Taskbar
        :windows="taskbarWindows"
        :dayOfYear="dayOfYear"
        :timeSlot="timeSlot"
        :taskbarHeight="(settings.taskbarHeight as number)"
        :taskbarOpacity="taskbarOpacity"
        :taskbarBodyVisible="taskbarBodyVisible"
        :quickMenuGap="quickMenuGap"
        :quickMenuOffsetX="quickMenuOffsetX"
        :tabOffsetX="tabOffsetX"
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
    <div class="side-fill right" :class="{ flash: sidebarFlashKey > 0 }" :key="`side-right-${sidebarFlashKey}`"></div>
    <div v-if="crtEnabled" class="crt" :style="{ opacity: crtIntensity }"></div>
    <BootSequence v-if="bootVisible" :mode="bootMode" :blackMs="bootBlackMs" :biosMs="bootBiosMs" :fadeMs="bootFadeMs" @complete="onBootComplete" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import Desktop from './components/Desktop.vue';
import Taskbar from './components/Taskbar.vue';
import StartMenu from './components/StartMenu.vue';
import BootSequence from './components/BootSequence.vue';
import { useTimeStore } from './stores/time';
import { useSettings } from './useSettings';
import { loadJineState, saveJineState, seedJineState } from './jine';
import type { WindowState, WindowAppType, SettingValue, IconHoverPayload, TimeSlot } from './types';
import type { JineMessage, JineState } from './jine';

const { settings, saveError } = useSettings();
const startOpen = ref(false);
const jineState = ref<JineState>(loadJineState());
const viewportRef = ref<HTMLElement | null>(null);
const bootVisible = ref(false);
const bootMode = ref<'startup' | 'restart' | 'shutdown'>('startup');

const sidebarFlashKey = ref(0);

const timeStore = useTimeStore();
const { dayOfYear, timeSlot } = storeToRefs(timeStore);

const timeSlotOverrideEnabled = computed(() => Boolean(settings.value.timeSlotOverrideEnabled ?? false));
const timeSlotOverrideValue = computed(() => String(settings.value.timeSlotOverride ?? '').toUpperCase().trim());

function applyTimeOverride() {
  if (!timeSlotOverrideEnabled.value) {
    timeStore.setTimeSlotOverride(false);
    return;
  }
  const raw = timeSlotOverrideValue.value;
  if (raw === 'NOON' || raw === 'DUSK' || raw === 'NIGHT') {
    timeStore.setTimeSlotOverride(true, raw as TimeSlot);
  } else {
    timeStore.setTimeSlotOverride(false);
  }
}

const bootSeenKey = 'windose_boot_seen_v2';

const bootBlackMs = computed(() => Number(settings.value.bootBlackMs ?? 2000));
const bootBiosMs = computed(() => Number(settings.value.bootBiosMs ?? 5000));
const bootFadeMs = computed(() => Number(settings.value.bootFadeMs ?? 1200));

function hasSeenBoot() {
  try {
    return localStorage.getItem(bootSeenKey) == '1';
  } catch {
    return false;
  }
}

function markBootSeen() {
  try {
    localStorage.setItem(bootSeenKey, '1');
  } catch {
    // ignore storage failures
  }
}

function startBoot(mode: 'startup' | 'restart' | 'shutdown') {
  bootMode.value = mode;
  bootVisible.value = true;
  startOpen.value = false;
}

function onBootComplete() {
  if (bootMode.value == 'startup') {
    bootVisible.value = false;
    return;
  }
  if (bootMode.value == 'restart') {
    bootVisible.value = false;
    window.location.reload();
    return;
  }
  if (bootMode.value == 'shutdown') {
    try {
      window.close();
    } catch {
      // ignore close failures
    }
    bootVisible.value = false;
  }
}

const volume = ref((settings.value.sfxVolumeDefault as number) || 0.5);

const sfxEnabled = computed(() => Boolean(settings.value.sfxEnabled ?? true));
const sfxVolumeMin = computed(() => Number(settings.value.sfxVolumeMin ?? 0));
const sfxVolumeMax = computed(() => Number(settings.value.sfxVolumeMax ?? 1));
const sfxClickPath = computed(() => String(settings.value.sfxClickPath ?? ''));
const sfxNotifyPath = computed(() => String(settings.value.sfxNotifyPath ?? ''));
const sfxWindowOpenPath = computed(() => String(settings.value.sfxWindowOpenPath ?? ''));
const sfxWindowClosePath = computed(() => String(settings.value.sfxWindowClosePath ?? ''));
const sfxWindowMinimizePath = computed(() => String(settings.value.sfxWindowMinimizePath ?? ''));
const sfxWindowRestorePath = computed(() => String(settings.value.sfxWindowRestorePath ?? ''));
const sfxWindowFullscreenPath = computed(() => String(settings.value.sfxWindowFullscreenPath ?? ''));
const sfxWindowDragPath = computed(() => String(settings.value.sfxWindowDragPath ?? ''));
const sfxJineSendPath = computed(() => String(settings.value.sfxJineSendPath ?? ''));

const sfxCache = new Map<string, HTMLAudioElement>();

function normalizeSfxPath(path: string) {
  if (!path) return '';
  return path.startsWith('/') ? path : `/${path}`;
}

function clampSfxVolume(value: number) {
  const min = sfxVolumeMin.value;
  const max = sfxVolumeMax.value;
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function playSfx(path: string) {
  if (!sfxEnabled.value) return;
  const src = normalizeSfxPath(path);
  if (!src) return;
  let audio = sfxCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.preload = 'auto';
    sfxCache.set(src, audio);
  }
  audio.volume = clampSfxVolume(volume.value);
  try {
    audio.currentTime = 0;
    const result = audio.play();
    if (result && typeof result.catch === 'function') {
      result.catch(() => {});
    }
  } catch {
    // ignore playback failures
  }
}

function onViewportPointerDown() {
  playSfx(sfxClickPath.value);
}

const webcamSeed = ref(Date.now());
const webcamMadPhase = ref<'idle' | 'hover' | 'release'>('idle');
let webcamMadTimer: number | null = null;

function clearWebcamMadTimer() {
  if (webcamMadTimer) {
    window.clearTimeout(webcamMadTimer);
    webcamMadTimer = null;
  }
}

function triggerWebcamMadRelease() {
  clearWebcamMadTimer();
  webcamMadPhase.value = 'release';
  webcamMadTimer = window.setTimeout(() => {
    webcamMadPhase.value = 'idle';
    webcamMadTimer = null;
  }, 1000);
}

function startWebcamMadHover() {
  clearWebcamMadTimer();
  webcamMadPhase.value = 'hover';
}

function endWebcamMadHover() {
  if (webcamMadPhase.value === 'hover') {
    triggerWebcamMadRelease();
  }
}

const WEBCAM_REOPEN_DELAY_MS = 300;

const windows = ref<WindowState[]>([]);
let zCounter = 100;

const taskbarOpacity = computed(() => Number(settings.value.taskbarOpacity ?? 1));
const taskbarBodyVisible = computed(() => Boolean(settings.value.taskbarBodyVisible ?? true));
const quickMenuGap = computed(() => Number(settings.value.quickMenuGap ?? 8));
const quickMenuOffsetX = computed(() => Number(settings.value.quickMenuOffsetX ?? 0));
const tabOffsetX = computed(() => Number(settings.value.tabOffsetX ?? 0));

const taskbarWindows = computed(() => windows.value.filter((w) => w.isOpen));

const jineUnreadCount = computed(() => jineState.value.unreadCount);

const lastUnreadCount = ref(jineUnreadCount.value);
watch(jineUnreadCount, (val) => {
  if (val > lastUnreadCount.value) {
    const jineOpen = windows.value.some((w) => w.appType === 'jine' && w.isOpen && !w.isMinimized);
    if (!jineOpen) {
      playSfx(sfxNotifyPath.value);
    }
  }
  lastUnreadCount.value = val;
});

const webcamEnabled = computed(() => Boolean(settings.value.webcamEnabled ?? true));

const viewportWidth = computed(() => Number(settings.value.viewportWidth ?? 800));
const viewportHeight = computed(() => Number(settings.value.viewportHeight ?? 600));

const viewportScaleAuto = computed(() => Boolean(settings.value.viewportScaleAuto ?? true));
const viewportScaleManual = computed(() => Number(settings.value.viewportScale ?? 1));
const viewportScaleIntegerOnly = computed(() => Boolean(settings.value.viewportScaleIntegerOnly ?? false));
const uiScaleAuto = computed(() => Boolean(settings.value.uiScaleAuto ?? true));
const uiScaleManual = computed(() => Number(settings.value.uiScale ?? 1));
const viewportSoftness = computed(() => Number(settings.value.viewportSoftness ?? 0.25));
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

const uiScale = computed(() => {
  const base = viewportScale.value || 1;
  const raw = uiScaleAuto.value ? (1 / base) : uiScaleManual.value;
  const safe = Number.isFinite(raw) && raw > 0 ? raw : 1;
  return Math.min(1.5, Math.max(1, safe));
});

function getTabTarget(id: string) {
  if (typeof document === 'undefined') return null;
  const viewportEl = viewportRef.value;
  if (!viewportEl) return null;
  const tabEl = document.querySelector(`[data-window-id="${id}"]`) as HTMLElement | null;
  if (!tabEl) return null;
  const viewportRect = viewportEl.getBoundingClientRect();
  const tabRect = tabEl.getBoundingClientRect();
  const scale = viewportScale.value || 1;
  const centerX = tabRect.left + tabRect.width / 2;
  const centerY = tabRect.top + tabRect.height / 2;
  return {
    x: (centerX - viewportRect.left) / scale,
    y: (centerY - viewportRect.top) / scale,
  };
}

const jineToast = computed(() => {
  if (jineState.value.unreadCount <= 0) return null;
  const open = windows.value.some((w) => w.appType === 'jine' && w.isOpen && !w.isMinimized);
  if (open) return null;
  return [...jineState.value.messages].reverse().find((m) => m.isUnread) ?? null;
});

const crtEnabled = computed(() => (settings.value.crtEnabled as boolean));
const crtIntensity = computed(() => (settings.value.crtIntensity as number));

function tickTime() {
  timeStore.updateTime();
}

function updateWindowSize() {
  windowSize.value = { width: window.innerWidth, height: window.innerHeight };
}

onMounted(() => {
  tickTime();
  setInterval(tickTime, 60000);
  updateWindowSize();
  window.addEventListener('resize', updateWindowSize);
  if (!hasSeenBoot()) {
    startBoot('startup');
    markBootSeen();
  }
  if (jineState.value.messages.length === 0) {
    jineState.value = seedJineState();
  }
  if (webcamEnabled.value) {
    ensureWebcamOpen();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWindowSize);
});

watch([timeSlotOverrideEnabled, timeSlotOverrideValue], () => {
  applyTimeOverride();
  tickTime();
}, { immediate: true });

watch(timeSlot, (next, prev) => {
  if (!prev || next === prev) return;
  sidebarFlashKey.value += 1;
});

watch(webcamEnabled, (enabled) => {
  if (enabled) {
    ensureWebcamOpen();
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
  playSfx(sfxWindowRestorePath.value);
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
  if (appType === 'jine') {
    return { x: 120, y: 120, width: 500, height: 500 };
  }
  return { x: 120, y: 120, width: 420, height: 300 };
}

function ensureWebcamOpen() {
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
  playSfx(sfxJineSendPath.value);
  addJineMessage('You', body, 'text', false);
}

function sendJineSticker(label: string) {
  playSfx(sfxJineSendPath.value);
  addJineMessage('You', label, 'sticker', false);
}
function scheduleWebcamReopen() {
  window.setTimeout(() => {
    if (!webcamEnabled.value) return;
    ensureWebcamOpen();
  }, WEBCAM_REOPEN_DELAY_MS);
}

function onIconHover(payload: IconHoverPayload) {
  if (payload.id !== 'secret' || !payload.hovering || !webcamEnabled.value) return;
  ensureWebcamOpen();
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
    ensureWebcamOpen();
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
  playSfx(sfxWindowOpenPath.value);
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

function onWindowDragStart() {
  playSfx(sfxWindowDragPath.value);
}

function onCloseHover(id: string) {
  const win = windows.value.find((w) => w.id === id);
  if (win?.appType === 'webcam') {
    startWebcamMadHover();
  }
}

function onCloseHoverEnd(id: string) {
  const win = windows.value.find((w) => w.id === id);
  if (win?.appType === 'webcam') {
    endWebcamMadHover();
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
  if (!win) return;
  const tb = settings.value.taskbarHeight as number;
  const height = viewportHeight.value;
  const target = getTabTarget(id);
  const targetX = target ? target.x - win.width / 2 : 10;
  const targetY = target ? target.y - win.height / 2 : height - tb - 20;
  windows.value = windows.value.map((w) => {
    if (w.id !== id) return w;
    return {
      ...w,
      isMinimized: true,
      lastNormal: { x: w.x, y: w.y, width: w.width, height: w.height },
      x: targetX,
      y: targetY,
    };
  });
  if (win.appType === 'webcam' && webcamEnabled.value) {
    triggerWebcamMadRelease();
    scheduleWebcamReopen();
  }
  playSfx(sfxWindowMinimizePath.value);
}

function closeWindow(id: string) {
  const win = windows.value.find((w) => w.id === id);
  playSfx(sfxWindowClosePath.value);
  if (win?.appType === 'webcam' && webcamEnabled.value) {
    triggerWebcamMadRelease();
    windows.value = windows.value.filter((w) => w.id !== id);
    scheduleWebcamReopen();
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
  const win = windows.value.find((w) => w.id === id);
  if (!win) return;
  if (!win.isFullscreen) {
    playSfx(sfxWindowFullscreenPath.value);
  } else {
    playSfx(sfxWindowRestorePath.value);
  }
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
  startBoot('restart');
}

function shutdown() {
  startBoot('shutdown');
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
  filter: blur(var(--viewport-softness, 0px));
}
.viewport::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: multiply;
  background: transparent;
  opacity: 0;
  z-index: 9998;
}
.app-root.DUSK .viewport::after {
  background: #f0b46f;
  opacity: 0.35;
}
.app-root.NIGHT .viewport::after {
  background: #6b5a8d;
  opacity: 0.5;
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
  position: relative;
  overflow: hidden;
  background: url('/sidebars/sidebar_noon.png') no-repeat center / contain;
}
.side-fill.flash::before,
.side-fill.flash::after {
  content: '';
  position: absolute;
  inset: -10%;
  opacity: 0;
  pointer-events: none;
  animation: sidebar-flash 4000ms ease-out;
}
.side-fill.flash::before {
  background-image: inherit;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  mix-blend-mode: screen;
  filter: brightness(2.2) saturate(1.6) blur(6px);
}
.side-fill.flash::after {
  background: rgba(255, 255, 255, 0.35);
  mix-blend-mode: screen;
  filter: blur(14px);
}
.app-root.DUSK .side-fill {
  background-image: url('/sidebars/sidebar_dusk.png');
}
.app-root.NOON .side-fill {
  background-image: url('/sidebars/sidebar_noon.png');
}
.app-root.NIGHT .side-fill {
  background-image: url('/sidebars/sidebar_night.png');
}
.side-fill.right {
  transform: scaleX(-1);
}
@keyframes sidebar-flash {
  0% { opacity: 0; }
  37.5% { opacity: 1; }
  100% { opacity: 0; }
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







