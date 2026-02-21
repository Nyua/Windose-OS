<template>
  <div
    class="app-root"
    :class="[
      timeSlot,
      `ame-phase-${ameTransitionPhase}`,
      {
        'app-root--mobile': isMobileViewport,
        'ame-transition-active': ameTransitionActive,
      },
    ]"
  >
    <div class="overlay-effect overlay-effect-secondary" :class="medicineEffectClass" :style="medicineSecondaryStyle"></div>
    <div class="overlay-effect overlay-effect-primary" :class="medicineEffectClass" :style="medicinePrimaryStyle"></div>
    <div class="scene-stage">
    <div class="side-fill left" :class="{ flash: sidebarFlashKey > 0 }" :key="`side-left-${sidebarFlashKey}`"></div>
    <div class="viewport-slot" :style="{ width: `${viewportWidth * viewportScale}px`, height: `${viewportHeight * viewportScale}px` }">
      <div class="viewport" ref="viewportRef" :style="{ width: `${viewportWidth}px`, height: `${viewportHeight}px`, transform: `scale(${viewportScale})`, '--ui-scale': uiScale, '--viewport-softness': `${viewportSoftness}px` }" @pointerdown="onViewportPointerDown" @click="startOpen = false">
      <div class="desktop-shell">
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
        @open="openWindow"
        @launchAmeCorner="startAmeCornerTransition"
        @focus="focusWindow"
        @move="moveWindow"
        @dragStart="onWindowDragStart"
        @dragEnd="onWindowDragEnd"
        @resize="resizeWindow"
        @minimize="minimizeWindow"
        @close="closeWindow"
        @toggleFullscreen="toggleFullscreen"
        @closeHover="onCloseHover"
        @closeHoverEnd="onCloseHoverEnd"
        @updateSetting="updateSetting"
        @iconHover="onIconHover"
      />
      <StartMenu
        :open="startOpen"
        :taskbarHeight="(settings.taskbarHeight as number)"
        :controlPanelExplosionPulse="startMenuControlPanelExplosionPulse"
        @controlPanel="openFromStart('controlpanel')"
        @credits="openFromStart('credits')"
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
        <div class="jine-toast-icon" aria-hidden="true"></div>
        <div class="jine-toast-text">{{ toastPreview(jineToast) }}</div>
      </div>
      </div>
      </div>
    </div>
    <div class="side-fill right" :class="{ flash: sidebarFlashKey > 0 }" :key="`side-right-${sidebarFlashKey}`"></div>
    </div>
    <div
      v-if="ameIntroOverlayVisible"
      class="ame-intro-overlay"
      :class="ameIntroOverlayClass"
      :style="{ '--ame-shadow-fade-out-ms': `${AME_SHADOW_FADE_OUT_MS}ms` }"
      aria-hidden="true"
    >
      <img class="ame-intro-frame ame-intro-frame-00" :src="AME_INTRO_FRAME_00_SRC" alt="" draggable="false" />
      <img class="ame-intro-frame ame-intro-frame-0" :src="AME_INTRO_FRAME_0_SRC" alt="" draggable="false" />
      <img class="ame-intro-frame ame-intro-frame-impact" :src="AME_INTRO_IMPACT_FRAME_SRC" alt="" draggable="false" />
      <img class="ame-intro-frame ame-intro-frame-2" :src="AME_INTRO_FRAME_2_SRC" alt="" draggable="false" />
      <img class="ame-intro-shadow" :src="AME_INTRO_SHADOW_SRC" alt="" draggable="false" />
      <div class="ame-pink-flash" :class="{ 'ame-pink-flash--active': amePinkFlashActive }"></div>
    </div>
    <div class="ame-crt-poweroff" aria-hidden="true"></div>
    <BootSequence v-if="bootVisible" :mode="bootMode" :blackMs="bootBlackMs" :biosMs="bootBiosMs" :fadeMs="bootFadeMs" @complete="onBootComplete" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, type CSSProperties } from 'vue';
import { storeToRefs } from 'pinia';
import Desktop from './components/Desktop.vue';
import Taskbar from './components/Taskbar.vue';
import StartMenu from './components/StartMenu.vue';
import BootSequence from './components/BootSequence.vue';
import { useTimeStore } from './stores/time';
import { useJineStore } from './stores/jine';
import { useMedicineStore } from './stores/medicine';
import { useSecretsStore } from './stores/secrets';
import { useSettings } from './useSettings';
import { openExternalUrlWithFallback } from './externalLinks';
import type { WindowState, WindowAppType, SettingValue, IconHoverPayload, TimeSlot } from './types';
import type { JineMessage } from './stores/jine';

const { settings, saveError } = useSettings();
const DEFAULT_HANG_OUT_URL = 'https://discord.com/users/331350000154050560';
const startOpen = ref(false);
const startMenuControlPanelExplosionPulse = ref(0);
const START_MENU_PASSWORD_REVEAL_DELAY_MS = 500;
let startMenuPasswordRevealTimer: number | null = null;
const viewportRef = ref<HTMLElement | null>(null);
const bootVisible = ref(false);
const bootMode = ref<'startup' | 'restart' | 'shutdown'>('startup');

const sidebarFlashKey = ref(0);
type AmeTransitionPhase = 'idle' | 'stepback' | 'reflection' | 'rebound' | 'crtOff' | 'navigating';
type AmeIntroStage = 'waiting' | 'shadowFadeIn' | 'intro00' | 'pinkFlash' | 'intro0' | 'impact' | 'final';
// NOTE: Sequence timings are intentionally easy to tune. Rebalance all stage timings after art pass.
const AME_START_DELAY_MS = 2000;
const AME_SHADOW_FADE_IN_MS = 2000;
const AME_SHADOW_FADE_OUT_MS = 300;
const AME_STAGE_FRAME_COUNT = 5;
const AME_FINAL_HOLD_MS = 5000;
const AME_REBOUND_MS = 520;
const AME_CRT_POWER_OFF_MS = 430;
const AME_SHADOW_FADE_IN_START_MS = AME_START_DELAY_MS;
const AME_INTRO_00_START_MS = AME_SHADOW_FADE_IN_START_MS + AME_SHADOW_FADE_IN_MS;
const AME_DESTINATION_PATH = '/ames-corner.html';
const AME_INTRO_SHADOW_SRC = '/ame-corner/corner-intro-Ame.png';
const AME_INTRO_FRAME_00_SRC = '/ame-corner/corner-intro00.png.png';
const AME_INTRO_FRAME_0_SRC = '/ame-corner/corner-intro0.png';
const AME_INTRO_IMPACT_FRAME_SRC = '/ame-corner/kyouizon_bg_002_w.png';
const AME_INTRO_FRAME_2_SRC = '/ame-corner/corner-intro2.png';
const AME_INTRO_STAB_SFX_SRC = '/sounds/stab.wav';
const AME_INTRO_SHUTDOWN_SFX_SRC = '/sounds/shutdown.wav';

const ameTransitionPhase = ref<AmeTransitionPhase>('idle');
const ameIntroStage = ref<AmeIntroStage>('waiting');
const amePinkFlashActive = ref(false);
const ameTransitionActive = computed(() => ameTransitionPhase.value !== 'idle');
const ameIntroOverlayClass = computed(() => `ame-intro-overlay--${ameIntroStage.value}`);
const ameIntroOverlayVisible = computed(() => {
  if (!ameTransitionActive.value) return false;
  return ameTransitionPhase.value !== 'idle';
});
const ameTransitionTimers: number[] = [];
const ameTransitionRafIds: number[] = [];

const timeStore = useTimeStore();
const { dayOfYear, timeSlot } = storeToRefs(timeStore);
const jineStore = useJineStore();
const medicineStore = useMedicineStore();
const secretsStore = useSecretsStore();

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
  bgmBootReady.value = false;
  syncBgmPlaybackState();
  startOpen.value = false;
}

function onBootComplete() {
  if (bootMode.value == 'startup') {
    bootVisible.value = false;
    bgmBootReady.value = true;
    syncBgmPlaybackState();
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
const SFX_MASTER_GAIN = 0.5;

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

const sfxCache = new Map<string, HTMLAudioElement>();
const DRAG_SFX_FADE_OUT_MS = 180;
let dragSfxAudio: HTMLAudioElement | null = null;
let dragSfxSource = '';
let dragSfxFadeTimer: number | null = null;
let activeDragWindowId: string | null = null;
const BGM_SRC = '/music/bgm.wav';
const BGM_VOLUME_SCALE = 0.04704;
const BGM_DUCKED_VOLUME = 0;
const BGM_FADE_OUT_MS = 180;
const BGM_FADE_IN_MS = 1800;
const YOUTUBE_STATE_IDLE = 0;
const YOUTUBE_STATE_PLAYING = 1;
const YOUTUBE_STATE_PAUSED = 2;
const YOUTUBE_STATE_BUFFERING = 3;
const YOUTUBE_STATE_CUED = 5;

const bgmAudio = ref<HTMLAudioElement | null>(null);
const bgmBootReady = ref(false);
const bgmDuckReasons = ref({ musicTrack: false, videoEmbed: false });
const activeMusicTrackMedia = new Set<HTMLMediaElement>();
const trackedMusicMedia = new WeakSet<HTMLMediaElement>();
const activeYouTubePlayers = new Set<Window>();
const trackedYouTubeFrames = new WeakSet<HTMLIFrameElement>();
let bgmFadeFrame: number | null = null;
let bgmAutoplayPending = false;
let nativeAudioConstructor: typeof Audio | null = null;
let youtubeObserver: MutationObserver | null = null;
let mediaElementObserver: MutationObserver | null = null;
type MediaPlayFn = (this: HTMLMediaElement) => Promise<void>;
let nativeMediaPlay: MediaPlayFn | null = null;

const MEDICATION_REVERB_WET_MAX_GAIN = 0.72;
const MEDICATION_REVERB_DELAY_MIN = 0.05;
const MEDICATION_REVERB_DELAY_MAX = 0.2;
const MEDICATION_REVERB_FEEDBACK_MIN = 0.14;
const MEDICATION_REVERB_FEEDBACK_MAX = 0.66;

interface MedicationMediaFxChain {
  context: AudioContext;
  dryGain: GainNode;
  wetGain: GainNode;
  delay: DelayNode;
  feedbackGain: GainNode;
  dampingFilter: BiquadFilterNode;
}

const trackedMediaElements = new Set<HTMLMediaElement>();
const medicationFxChains = new WeakMap<HTMLMediaElement, MedicationMediaFxChain>();
const medicationFxUnsupportedMedia = new WeakSet<HTMLMediaElement>();
let medicationAudioContext: AudioContext | null = null;

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

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  const webkitCtor = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return window.AudioContext ?? webkitCtor ?? null;
}

function getMedicationAudioContext(): AudioContext | null {
  if (medicationAudioContext) return medicationAudioContext;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  medicationAudioContext = new Ctor();
  return medicationAudioContext;
}

function resumeMedicationAudioContext() {
  const context = getMedicationAudioContext();
  if (!context || context.state !== 'suspended') return;
  void context.resume().catch(() => {});
}

function setMediaPreservesPitch(media: HTMLMediaElement, enabled: boolean) {
  const withPitch = media as HTMLMediaElement & {
    preservesPitch?: boolean;
    webkitPreservesPitch?: boolean;
    mozPreservesPitch?: boolean;
  };
  if ('preservesPitch' in withPitch) withPitch.preservesPitch = enabled;
  if ('webkitPreservesPitch' in withPitch) withPitch.webkitPreservesPitch = enabled;
  if ('mozPreservesPitch' in withPitch) withPitch.mozPreservesPitch = enabled;
}

function clampMix(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function ensureMedicationFxChain(media: HTMLMediaElement): MedicationMediaFxChain | null {
  if (medicationFxUnsupportedMedia.has(media)) return null;
  const existing = medicationFxChains.get(media);
  if (existing) return existing;

  const context = getMedicationAudioContext();
  if (!context) {
    medicationFxUnsupportedMedia.add(media);
    return null;
  }

  try {
    const source = context.createMediaElementSource(media);
    const dryGain = context.createGain();
    const wetGain = context.createGain();
    const delay = context.createDelay(1);
    const feedbackGain = context.createGain();
    const dampingFilter = context.createBiquadFilter();
    dampingFilter.type = 'lowpass';
    dampingFilter.frequency.value = 1650;

    source.connect(dryGain);
    dryGain.connect(context.destination);

    source.connect(delay);
    delay.connect(dampingFilter);
    dampingFilter.connect(wetGain);
    wetGain.connect(context.destination);

    delay.connect(feedbackGain);
    feedbackGain.connect(delay);

    const chain: MedicationMediaFxChain = {
      context,
      dryGain,
      wetGain,
      delay,
      feedbackGain,
      dampingFilter,
    };
    medicationFxChains.set(media, chain);
    return chain;
  } catch {
    // Cross-origin or unsupported media nodes cannot be inserted in this graph.
    medicationFxUnsupportedMedia.add(media);
    return null;
  }
}

function updateMedicationFxChain(media: HTMLMediaElement) {
  const chain = ensureMedicationFxChain(media);
  if (!chain) return;

  const mix = clampMix(medicineStore.effectActive ? medicineStore.reverbMix : 0);
  const now = chain.context.currentTime;
  const wetGain = MEDICATION_REVERB_WET_MAX_GAIN * mix;
  const dryGain = 1 - Math.min(0.72, mix * 0.62);
  const delayTime = MEDICATION_REVERB_DELAY_MIN + ((MEDICATION_REVERB_DELAY_MAX - MEDICATION_REVERB_DELAY_MIN) * mix);
  const feedback = MEDICATION_REVERB_FEEDBACK_MIN + ((MEDICATION_REVERB_FEEDBACK_MAX - MEDICATION_REVERB_FEEDBACK_MIN) * mix);
  const cutoffHz = 2100 - (mix * 920);

  chain.wetGain.gain.cancelScheduledValues(now);
  chain.wetGain.gain.setTargetAtTime(wetGain, now, 0.035);
  chain.dryGain.gain.cancelScheduledValues(now);
  chain.dryGain.gain.setTargetAtTime(dryGain, now, 0.035);
  chain.delay.delayTime.cancelScheduledValues(now);
  chain.delay.delayTime.setTargetAtTime(delayTime, now, 0.035);
  chain.feedbackGain.gain.cancelScheduledValues(now);
  chain.feedbackGain.gain.setTargetAtTime(feedback, now, 0.05);
  chain.dampingFilter.frequency.cancelScheduledValues(now);
  chain.dampingFilter.frequency.setTargetAtTime(cutoffHz, now, 0.04);
}

function applyMedicationAudioTreatment(media: HTMLMediaElement) {
  if (!media || Number.isNaN(media.playbackRate)) return;
  const rate = medicineStore.effectActive ? medicineStore.audioRateMultiplier : 1;
  media.playbackRate = Math.max(0.55, Math.min(1.08, rate));
  setMediaPreservesPitch(media, false);
  updateMedicationFxChain(media);
}

function refreshMedicationAudioTreatment() {
  trackedMediaElements.forEach((media) => {
    applyMedicationAudioTreatment(media);
  });
}

function getBgmBaseVolume() {
  return clampSfxVolume(volume.value * BGM_VOLUME_SCALE);
}

function mediaPathname(media: HTMLMediaElement): string {
  const raw = media.currentSrc || media.src || media.getAttribute('src') || '';
  if (!raw) return '';
  try {
    return new URL(raw, window.location.origin).pathname.toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

function isNonBgmMusicMedia(media: HTMLMediaElement): boolean {
  const pathname = mediaPathname(media);
  if (!pathname || !pathname.includes('/music/')) return false;
  return !pathname.endsWith('/bgm.wav');
}

function isBgmDucked(): boolean {
  return bgmDuckReasons.value.musicTrack || bgmDuckReasons.value.videoEmbed;
}

function clearBgmFadeFrame() {
  if (bgmFadeFrame !== null) {
    window.cancelAnimationFrame(bgmFadeFrame);
    bgmFadeFrame = null;
  }
}

function ensureBgmAudio(): HTMLAudioElement {
  if (bgmAudio.value) return bgmAudio.value;
  const audio = new Audio(BGM_SRC);
  audio.loop = true;
  audio.preload = 'auto';
  audio.volume = 0;
  bgmAudio.value = audio;
  attachMusicTracking(audio);
  return audio;
}

function fadeBgmVolume(targetVolume: number, durationMs: number, pauseWhenComplete = false) {
  const audio = ensureBgmAudio();
  const target = clampSfxVolume(targetVolume);
  clearBgmFadeFrame();

  const startVolume = audio.volume;
  const delta = target - startVolume;
  if (Math.abs(delta) < 0.001 || durationMs <= 0) {
    audio.volume = target;
    if (pauseWhenComplete && target <= 0.001) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore playback failures
      }
    }
    return;
  }

  const startedAt = performance.now();
  const step = (now: number) => {
    const elapsed = now - startedAt;
    const progress = Math.min(1, elapsed / durationMs);
    audio.volume = clampSfxVolume(startVolume + (delta * progress));
    if (progress < 1) {
      bgmFadeFrame = window.requestAnimationFrame(step);
      return;
    }
    bgmFadeFrame = null;
    if (pauseWhenComplete && target <= 0.001) {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // ignore playback failures
      }
    }
  };
  bgmFadeFrame = window.requestAnimationFrame(step);
}

function setBgmDuckReason(reason: 'musicTrack' | 'videoEmbed', active: boolean) {
  if (bgmDuckReasons.value[reason] === active) return;
  bgmDuckReasons.value = { ...bgmDuckReasons.value, [reason]: active };
  syncBgmPlaybackState();
}

function refreshMusicTrackMediaState(media: HTMLMediaElement) {
  if (isNonBgmMusicMedia(media) && !media.paused && !media.ended) {
    activeMusicTrackMedia.add(media);
  } else {
    activeMusicTrackMedia.delete(media);
  }
  setBgmDuckReason('musicTrack', activeMusicTrackMedia.size > 0);
}

function attachMusicTracking(media: HTMLMediaElement) {
  if (trackedMusicMedia.has(media)) return;
  trackedMusicMedia.add(media);
  trackedMediaElements.add(media);
  const refresh = () => refreshMusicTrackMediaState(media);
  const applyTreatment = () => applyMedicationAudioTreatment(media);
  media.addEventListener('play', refresh);
  media.addEventListener('playing', refresh);
  media.addEventListener('pause', refresh);
  media.addEventListener('ended', refresh);
  media.addEventListener('abort', refresh);
  media.addEventListener('emptied', refresh);
  media.addEventListener('stalled', refresh);
  media.addEventListener('play', applyTreatment);
  media.addEventListener('loadedmetadata', applyTreatment);
  applyTreatment();
  refresh();
}

function installAudioConstructorPatch() {
  if (nativeAudioConstructor || typeof window === 'undefined') return;
  nativeAudioConstructor = window.Audio;

  const patchedAudio = function (src?: string) {
    const ctor = nativeAudioConstructor as typeof Audio;
    const audio = src === undefined ? new ctor() : new ctor(src);
    attachMusicTracking(audio);
    return audio;
  } as unknown as typeof Audio;

  patchedAudio.prototype = nativeAudioConstructor.prototype;
  Object.setPrototypeOf(patchedAudio, nativeAudioConstructor);
  (window as Window & { Audio: typeof Audio }).Audio = patchedAudio;

  if (!nativeMediaPlay) {
    nativeMediaPlay = HTMLMediaElement.prototype.play as MediaPlayFn;
    HTMLMediaElement.prototype.play = function patchedMediaPlay(this: HTMLMediaElement) {
      attachMusicTracking(this);
      return (nativeMediaPlay as MediaPlayFn).call(this);
    };
  }

  mediaElementObserver = new MutationObserver(() => {
    document.querySelectorAll('audio,video').forEach((node) => {
      attachMusicTracking(node as HTMLMediaElement);
    });
  });
  mediaElementObserver.observe(document.body, { childList: true, subtree: true });

  document.querySelectorAll('audio,video').forEach((node) => {
    attachMusicTracking(node as HTMLMediaElement);
  });
}

function uninstallAudioConstructorPatch() {
  if (!nativeAudioConstructor || typeof window === 'undefined') return;
  (window as Window & { Audio: typeof Audio }).Audio = nativeAudioConstructor;
  nativeAudioConstructor = null;
  if (nativeMediaPlay) {
    HTMLMediaElement.prototype.play = nativeMediaPlay;
    nativeMediaPlay = null;
  }
  if (mediaElementObserver) {
    mediaElementObserver.disconnect();
    mediaElementObserver = null;
  }
  trackedMediaElements.clear();
  if (medicationAudioContext) {
    void medicationAudioContext.close().catch(() => {});
    medicationAudioContext = null;
  }
}

function parseYouTubeMessagePayload(data: unknown): Record<string, unknown> | null {
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  if (data && typeof data === 'object') return data as Record<string, unknown>;
  return null;
}

function parseYouTubePlayerState(payload: Record<string, unknown>): number | null {
  const eventName = String(payload.event ?? '');
  if (eventName === 'onStateChange') {
    const raw = payload.info ?? payload.data;
    if (typeof raw === 'number') return raw;
    if (typeof raw === 'string' && /^-?\d+$/.test(raw)) return Number(raw);
    return null;
  }
  if (eventName !== 'infoDelivery') return null;
  const info = payload.info;
  if (!info || typeof info !== 'object') return null;
  const state = (info as Record<string, unknown>).playerState;
  if (typeof state === 'number') return state;
  if (typeof state === 'string' && /^-?\d+$/.test(state)) return Number(state);
  return null;
}

function isYouTubeEmbedIframe(frame: HTMLIFrameElement): boolean {
  const src = frame.getAttribute('src') ?? '';
  if (!src) return false;
  try {
    const url = new URL(src, window.location.origin);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const isYouTubeHost = host.includes('youtube.com') || host.includes('youtube-nocookie.com');
    return isYouTubeHost && path.includes('/embed/');
  } catch {
    const lower = src.toLowerCase();
    return lower.includes('youtube.com/embed/') || lower.includes('youtube-nocookie.com/embed/');
  }
}

function requestYouTubePlayerEvents(frame: HTMLIFrameElement) {
  const target = frame.contentWindow;
  if (!target) return;
  const messages = [
    { event: 'listening', id: 'bgm-duck-listener' },
    { event: 'command', func: 'addEventListener', args: ['onStateChange'] },
  ];
  messages.forEach((message) => {
    try {
      target.postMessage(JSON.stringify(message), '*');
    } catch {
      // ignore cross-origin messaging failures
    }
  });
}

function registerYouTubeIframe(frame: HTMLIFrameElement) {
  if (trackedYouTubeFrames.has(frame)) return;
  trackedYouTubeFrames.add(frame);
  frame.addEventListener('load', () => requestYouTubePlayerEvents(frame));
  requestYouTubePlayerEvents(frame);
}

function scanYouTubeIframes() {
  document.querySelectorAll('iframe').forEach((node) => {
    const frame = node as HTMLIFrameElement;
    if (!isYouTubeEmbedIframe(frame)) return;
    registerYouTubeIframe(frame);
  });
}

function hasAnyVisibleYouTubeEmbed(): boolean {
  return document.querySelector('iframe[src*="youtube.com/embed/"], iframe[src*="youtube-nocookie.com/embed/"]') !== null;
}

function isStreamVideoLikelyActive(): boolean {
  return windows.value.some((w) => w.appType === 'stream' && w.isOpen && !w.isMinimized && timeSlot.value === 'NIGHT');
}

function updateVideoEmbedDucking() {
  if (!hasAnyVisibleYouTubeEmbed()) {
    activeYouTubePlayers.clear();
  }
  const playingYouTube = activeYouTubePlayers.size > 0;
  const streamActive = isStreamVideoLikelyActive();
  setBgmDuckReason('videoEmbed', playingYouTube || streamActive);
}

function onYouTubeMessage(event: MessageEvent) {
  const origin = String(event.origin || '').toLowerCase();
  if (!origin.includes('youtube.com') && !origin.includes('youtube-nocookie.com')) return;
  const payload = parseYouTubeMessagePayload(event.data);
  if (!payload || !event.source) return;
  const state = parseYouTubePlayerState(payload);
  if (state === null) return;
  const source = event.source as Window;
  if (state === YOUTUBE_STATE_PLAYING) {
    activeYouTubePlayers.add(source);
  } else if (
    state === YOUTUBE_STATE_IDLE
    || state === YOUTUBE_STATE_PAUSED
    || state === YOUTUBE_STATE_BUFFERING
    || state === YOUTUBE_STATE_CUED
  ) {
    activeYouTubePlayers.delete(source);
  }
  updateVideoEmbedDucking();
}

function installYouTubeEmbedTracking() {
  window.addEventListener('message', onYouTubeMessage);
  scanYouTubeIframes();
  youtubeObserver = new MutationObserver(() => {
    scanYouTubeIframes();
    updateVideoEmbedDucking();
  });
  youtubeObserver.observe(document.body, { childList: true, subtree: true });
}

function uninstallYouTubeEmbedTracking() {
  window.removeEventListener('message', onYouTubeMessage);
  if (youtubeObserver) {
    youtubeObserver.disconnect();
    youtubeObserver = null;
  }
}

function syncBgmPlaybackState() {
  const audio = ensureBgmAudio();
  if (!bgmBootReady.value) {
    fadeBgmVolume(BGM_DUCKED_VOLUME, BGM_FADE_OUT_MS, true);
    return;
  }

  if (audio.paused) {
    try {
      audio.currentTime = 0;
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result
          .then(() => {
            bgmAutoplayPending = false;
          })
          .catch(() => {
            bgmAutoplayPending = true;
          });
      } else {
        bgmAutoplayPending = false;
      }
    } catch {
      bgmAutoplayPending = true;
    }
  }

  const ducked = isBgmDucked();
  fadeBgmVolume(ducked ? BGM_DUCKED_VOLUME : getBgmBaseVolume(), ducked ? BGM_FADE_OUT_MS : BGM_FADE_IN_MS);
}

function clearDragSfxFadeTimer() {
  if (dragSfxFadeTimer !== null) {
    window.clearTimeout(dragSfxFadeTimer);
    dragSfxFadeTimer = null;
  }
}

function stopWindowDragSfx(immediate = false) {
  if (!dragSfxAudio) return;
  clearDragSfxFadeTimer();

  if (immediate || !sfxEnabled.value) {
    try {
      dragSfxAudio.pause();
      dragSfxAudio.currentTime = 0;
    } catch {
      // ignore playback failures
    }
    return;
  }

  const audio = dragSfxAudio;
  const startVolume = audio.volume;
  const startedAt = performance.now();
  const fadeStep = () => {
    const elapsed = performance.now() - startedAt;
    const progress = Math.min(1, elapsed / DRAG_SFX_FADE_OUT_MS);
    audio.volume = startVolume * (1 - progress);
    if (progress < 1) {
      dragSfxFadeTimer = window.setTimeout(fadeStep, 16);
      return;
    }
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = startVolume;
    } catch {
      // ignore playback failures
    }
    dragSfxFadeTimer = null;
  };
  fadeStep();
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
  const baseVolume = clampSfxVolume(volume.value * SFX_MASTER_GAIN);
  audio.volume = baseVolume;

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

function startWindowDragSfx() {
  if (!sfxEnabled.value) return;
  const src = normalizeSfxPath(sfxWindowDragPath.value);
  if (!src) return;

  clearDragSfxFadeTimer();

  if (!dragSfxAudio || dragSfxSource !== src) {
    if (dragSfxAudio) {
      try {
        dragSfxAudio.pause();
      } catch {
        // ignore playback failures
      }
    }
    dragSfxAudio = new Audio(src);
    dragSfxAudio.preload = 'auto';
    dragSfxAudio.loop = true;
    dragSfxSource = src;
  }

  const audio = dragSfxAudio;
  const baseVolume = clampSfxVolume(volume.value * SFX_MASTER_GAIN);
  audio.volume = baseVolume;

  try {
    if (audio.paused) {
      audio.currentTime = 0;
      const result = audio.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    }
  } catch {
    // ignore playback failures
  }
}

function openExternalUrl(url: string, linkType: string) {
  return openExternalUrlWithFallback(url, linkType);
}

function queueAmeTransitionTimeout(callback: () => void, delayMs: number) {
  const timerId = window.setTimeout(() => {
    const index = ameTransitionTimers.indexOf(timerId);
    if (index >= 0) ameTransitionTimers.splice(index, 1);
    callback();
  }, delayMs);
  ameTransitionTimers.push(timerId);
}

function queueAmeTransitionRaf(callback: () => void) {
  const rafId = window.requestAnimationFrame(() => {
    const index = ameTransitionRafIds.indexOf(rafId);
    if (index >= 0) ameTransitionRafIds.splice(index, 1);
    callback();
  });
  ameTransitionRafIds.push(rafId);
}

function queueAmeTransitionAfterFrames(frameCount: number, callback: () => void) {
  let remaining = Math.max(1, Math.floor(frameCount));
  const step = () => {
    remaining -= 1;
    if (remaining <= 0) {
      callback();
      return;
    }
    queueAmeTransitionRaf(step);
  };
  queueAmeTransitionRaf(step);
}

function clearAmeTransitionTimers() {
  while (ameTransitionTimers.length > 0) {
    const timerId = ameTransitionTimers.pop();
    if (timerId !== undefined) window.clearTimeout(timerId);
  }
}

function clearAmeTransitionRafs() {
  while (ameTransitionRafIds.length > 0) {
    const rafId = ameTransitionRafIds.pop();
    if (rafId !== undefined) window.cancelAnimationFrame(rafId);
  }
}

function resetAmeTransitionVisuals() {
  ameIntroStage.value = 'waiting';
  amePinkFlashActive.value = false;
}

function startAmeCornerTransition() {
  if (ameTransitionActive.value) return;

  clearAmeTransitionTimers();
  clearAmeTransitionRafs();
  resetAmeTransitionVisuals();
  startOpen.value = false;
  ameTransitionPhase.value = 'stepback';
  ameIntroStage.value = 'waiting';

  queueAmeTransitionTimeout(() => {
    ameIntroStage.value = 'shadowFadeIn';
  }, AME_SHADOW_FADE_IN_START_MS);

  queueAmeTransitionTimeout(() => {
    ameIntroStage.value = 'intro00';
    playSfx(AME_INTRO_STAB_SFX_SRC);
    queueAmeTransitionAfterFrames(AME_STAGE_FRAME_COUNT, () => {
      ameIntroStage.value = 'pinkFlash';
      amePinkFlashActive.value = true;
      queueAmeTransitionAfterFrames(AME_STAGE_FRAME_COUNT, () => {
        amePinkFlashActive.value = false;
        ameIntroStage.value = 'intro0';
        queueAmeTransitionAfterFrames(AME_STAGE_FRAME_COUNT, () => {
          ameIntroStage.value = 'impact';
          queueAmeTransitionAfterFrames(AME_STAGE_FRAME_COUNT, () => {
            ameIntroStage.value = 'final';
            ameTransitionPhase.value = 'reflection';
            queueAmeTransitionTimeout(() => {
              ameTransitionPhase.value = 'rebound';
              queueAmeTransitionTimeout(() => {
                ameTransitionPhase.value = 'crtOff';
                playSfx(AME_INTRO_SHUTDOWN_SFX_SRC);
                queueAmeTransitionTimeout(() => {
                  ameTransitionPhase.value = 'navigating';
                  window.location.assign(AME_DESTINATION_PATH);
                }, AME_CRT_POWER_OFF_MS);
              }, AME_REBOUND_MS);
            }, AME_FINAL_HOLD_MS);
          });
        });
      });
    });
  }, AME_INTRO_00_START_MS);
}

function onViewportPointerDown() {
  if (ameTransitionActive.value) return;
  playSfx(sfxClickPath.value);
  resumeMedicationAudioContext();
  if (bgmAutoplayPending) {
    syncBgmPlaybackState();
  }
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

const jineUnreadCount = computed(() => jineStore.unreadCount);

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

const configuredViewportWidth = computed(() => Number(settings.value.viewportWidth ?? 800));
const configuredViewportHeight = computed(() => Number(settings.value.viewportHeight ?? 600));
const MOBILE_LAYOUT_MAX_WIDTH = 900;
const MOBILE_LAYOUT_MAX_HEIGHT = 720;

const isMobileViewport = computed(() => (
  windowSize.value.width <= MOBILE_LAYOUT_MAX_WIDTH || windowSize.value.height <= MOBILE_LAYOUT_MAX_HEIGHT
));

const viewportWidth = computed(() => {
  if (!isMobileViewport.value) return configuredViewportWidth.value;
  return Math.max(320, Math.round(windowSize.value.width));
});

const viewportHeight = computed(() => {
  if (!isMobileViewport.value) return configuredViewportHeight.value;
  return Math.max(320, Math.round(windowSize.value.height));
});

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
  if (jineStore.unreadCount <= 0) return null;
  const open = windows.value.some((w) => w.appType === 'jine' && w.isOpen && !w.isMinimized);
  if (open) return null;
  return [...jineStore.messages].reverse().find((m) => m.isUnread) ?? null;
});

function tickTime() {
  timeStore.updateTime();
  medicineStore.checkExpiry();
}

function updateWindowSize() {
  const vv = window.visualViewport;
  const width = vv?.width ?? window.innerWidth;
  const height = vv?.height ?? window.innerHeight;
  windowSize.value = {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  };
}

onMounted(() => {
  installAudioConstructorPatch();
  installYouTubeEmbedTracking();
  ensureBgmAudio();
  tickTime();
  setInterval(tickTime, 1000);
  updateWindowSize();
  window.addEventListener('resize', updateWindowSize);
  window.visualViewport?.addEventListener('resize', updateWindowSize);
  window.visualViewport?.addEventListener('scroll', updateWindowSize);
  if (!hasSeenBoot()) {
    startBoot('startup');
    markBootSeen();
  } else {
    bgmBootReady.value = true;
  }
  jineStore.seed();
  if (webcamEnabled.value) {
    ensureWebcamOpen();
  }
  updateVideoEmbedDucking();
  syncBgmPlaybackState();
});

onBeforeUnmount(() => {
  clearAmeTransitionTimers();
  clearAmeTransitionRafs();
  window.removeEventListener('resize', updateWindowSize);
  window.visualViewport?.removeEventListener('resize', updateWindowSize);
  window.visualViewport?.removeEventListener('scroll', updateWindowSize);
  uninstallYouTubeEmbedTracking();
  uninstallAudioConstructorPatch();
  if (startMenuPasswordRevealTimer !== null) {
    window.clearTimeout(startMenuPasswordRevealTimer);
    startMenuPasswordRevealTimer = null;
  }
  clearBgmFadeFrame();
  if (bgmAudio.value) {
    try {
      bgmAudio.value.pause();
      bgmAudio.value.currentTime = 0;
    } catch {
      // ignore playback failures
    }
  }
  activeDragWindowId = null;
  stopWindowDragSfx(true);
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
  windows,
  () => {
    updateVideoEmbedDucking();
  },
  { deep: true },
);

watch(timeSlot, () => {
  updateVideoEmbedDucking();
});

watch(volume, () => {
  syncBgmPlaybackState();
});

watch([viewportWidth, viewportHeight], () => {
  const fullscreenHeight = getUsableViewportHeight();
  windows.value = windows.value.map((w) => {
    if (!w.isOpen || w.isMinimized) return w;
    if (w.isFullscreen) {
      return {
        ...w,
        x: 0,
        y: 0,
        width: viewportWidth.value,
        height: fullscreenHeight,
      };
    }
    const clamped = clampWindowRect(w.x, w.y, w.width, w.height);
    return { ...w, ...clamped };
  });
});

watch(
  [() => medicineStore.effectActive, () => medicineStore.audioRateMultiplier, () => medicineStore.reverbMix],
  () => {
    refreshMedicationAudioTreatment();
  },
  { immediate: true },
);

watch(
  () => secretsStore.passwordsTxtRevealPulse,
  (next, prev) => {
    if (next <= 0 || next === prev) return;
    if (startMenuPasswordRevealTimer !== null) {
      window.clearTimeout(startMenuPasswordRevealTimer);
    }
    startMenuPasswordRevealTimer = window.setTimeout(() => {
      startOpen.value = true;
      startMenuControlPanelExplosionPulse.value += 1;
      startMenuPasswordRevealTimer = null;
    }, START_MENU_PASSWORD_REVEAL_DELAY_MS);
  },
);

watch([sfxEnabled, sfxWindowDragPath], ([enabled, path]) => {
  const normalized = normalizeSfxPath(String(path ?? ''));
  if (!enabled || !normalized) {
    activeDragWindowId = null;
    stopWindowDragSfx(true);
    return;
  }
  if (activeDragWindowId) {
    startWindowDragSfx();
  }
});

function toggleStart() {
  if (ameTransitionActive.value) return;
  startOpen.value = !startOpen.value;
}

function openFromStart(appType: WindowAppType) {
  if (ameTransitionActive.value) return;
  startOpen.value = false;
  openWindow(appType);
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
    const restored = clampWindowRect(
      w.lastNormal?.x ?? w.x,
      w.lastNormal?.y ?? w.y,
      w.lastNormal?.width ?? w.width,
      w.lastNormal?.height ?? w.height,
    );
    return {
      ...w,
      isMinimized: false,
      isFocused: true,
      zIndex: ++zCounter,
      ...restored,
    };
  });
}

const MEDICATION_WINDOW_TYPES: WindowAppType[] = [
  'medication_depaz',
  'medication_dyslem',
  'medication_embian',
  'medication_magic_smoke',
];
const MEDICATION_WINDOW_WIDTH = 460;
const MEDICATION_WINDOW_HEIGHT = 320;
const MEDICATION_WINDOW_OFFSETS = [
  { x: 0, y: 0 },
  { x: 96, y: 64 },
  { x: 28, y: 142 },
  { x: 124, y: 206 },
];
const DEFAULT_MEDICATION_WINDOW_OFFSET = { x: 0, y: 0 };
const MEDICATION_WINDOW_MAX_OFFSET_X = Math.max(...MEDICATION_WINDOW_OFFSETS.map((offset) => offset.x));
const MEDICATION_WINDOW_MAX_OFFSET_Y = Math.max(...MEDICATION_WINDOW_OFFSETS.map((offset) => offset.y));

function getMedicationWindowIndex(appType: WindowAppType): number {
  return Math.max(0, MEDICATION_WINDOW_TYPES.indexOf(appType));
}

function getUsableViewportHeight() {
  const taskbarHeight = Number(settings.value.taskbarHeight ?? 50);
  return Math.max(120, viewportHeight.value - taskbarHeight);
}

function clampWindowRect(x: number, y: number, width: number, height: number) {
  const usableWidth = Math.max(220, viewportWidth.value);
  const usableHeight = Math.max(120, getUsableViewportHeight());
  const clampedWidth = Math.min(Math.max(220, width), usableWidth);
  const clampedHeight = Math.min(Math.max(120, height), usableHeight);
  const maxX = Math.max(0, usableWidth - clampedWidth);
  const maxY = Math.max(0, usableHeight - clampedHeight);
  return {
    x: Math.min(maxX, Math.max(0, x)),
    y: Math.min(maxY, Math.max(0, y)),
    width: clampedWidth,
    height: clampedHeight,
  };
}

function getMedicationWindowDefaults(appType: WindowAppType) {
  const index = getMedicationWindowIndex(appType);
  const offset = MEDICATION_WINDOW_OFFSETS[index] ?? DEFAULT_MEDICATION_WINDOW_OFFSET;
  const taskbarHeight = Number(settings.value.taskbarHeight ?? 50);
  const viewportW = Math.max(0, viewportWidth.value);
  const viewportH = Math.max(0, viewportHeight.value - taskbarHeight);
  const maxX = Math.max(10, viewportW - MEDICATION_WINDOW_WIDTH - 10 - MEDICATION_WINDOW_MAX_OFFSET_X);
  const maxY = Math.max(12, viewportH - MEDICATION_WINDOW_HEIGHT - 12 - MEDICATION_WINDOW_MAX_OFFSET_Y);

  const webcam = getWebcamWindow();
  let baseX = Math.max(10, viewportW - MEDICATION_WINDOW_WIDTH - 68);
  let baseY = 76;

  if (webcam) {
    baseX = webcam.x + webcam.width + 24;
    baseY = webcam.y - 10;

    const rightmostNeeded = baseX + MEDICATION_WINDOW_WIDTH + MEDICATION_WINDOW_MAX_OFFSET_X;
    if (rightmostNeeded > viewportW - 10) {
      baseX = webcam.x + 20;
      baseY = webcam.y + webcam.height + 16;
      const bottomNeeded = baseY + MEDICATION_WINDOW_HEIGHT + MEDICATION_WINDOW_MAX_OFFSET_Y;
      if (bottomNeeded > viewportH - 12) {
        baseY = Math.max(12, webcam.y - MEDICATION_WINDOW_HEIGHT - 18);
      }
    }
  }

  baseX = Math.min(maxX, Math.max(10, baseX));
  baseY = Math.min(maxY, Math.max(12, baseY));

  const defaults = {
    x: baseX + offset.x,
    y: baseY + offset.y,
    width: MEDICATION_WINDOW_WIDTH,
    height: MEDICATION_WINDOW_HEIGHT,
  };
  return clampWindowRect(defaults.x, defaults.y, defaults.width, defaults.height);
}

function getWindowDefaults(appType: WindowAppType) {
  if (appType === 'webcam') {
    return clampWindowRect(130, 110, 540, 380);
  }
  if (appType === 'credits') {
    return clampWindowRect(140, 90, 640, 420);
  }
  if (appType === 'jine') {
    return clampWindowRect(120, 120, 500, 500);
  }
  if (appType === 'internet') {
    return clampWindowRect(100, 100, 510, 510);
  }
  if (appType === 'tweeter') {
    return clampWindowRect(96, 64, 905, 659);
  }
  if (appType === 'controlpanel') {
    return clampWindowRect(120, 120, 420, 388);
  }
  if (MEDICATION_WINDOW_TYPES.includes(appType)) {
    return getMedicationWindowDefaults(appType);
  }
  return clampWindowRect(120, 120, 420, 300);
}

function openMedicationWindows() {
  // Medication launcher is replaced by individual med windows.
  windows.value = windows.value.filter((w) => !(w.appType === 'medication' && w.isOpen));
  for (const medicationWindowType of MEDICATION_WINDOW_TYPES) {
    openWindow(medicationWindowType);
  }
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
  jineStore.markRead();
}

const medicineEffectClass = computed(() => {
  const effect = medicineStore.currentEffectType;
  return effect ? `overlay-${effect}` : 'overlay-none';
});

const MEDICINE_VISUAL_INTENSITY_MULTIPLIER = 10;

function amplifyMedicineStrength(strength: number): number {
  if (!Number.isFinite(strength) || strength <= 0) return 0;
  const shaped = Math.pow(Math.min(1, strength), 0.72);
  return Math.max(0, Math.min(MEDICINE_VISUAL_INTENSITY_MULTIPLIER, shaped * MEDICINE_VISUAL_INTENSITY_MULTIPLIER));
}

function getPrimaryMedicineOverlayStyle(effect: string, strength: number): CSSProperties {
  const amp = amplifyMedicineStrength(strength);
  if (effect === 'depaz') {
    const blurPx = (0.8 + (3.1 * amp)).toFixed(2);
    const saturate = (1.24 + (0.46 * amp)).toFixed(2);
    const contrast = (1.08 + (0.3 * amp)).toFixed(2);
    const brightness = (1.02 + (0.12 * amp)).toFixed(2);
    const hueRotateDeg = Math.round(6 + (13 * amp));
    const opacity = (0.2 + (0.08 * amp)).toFixed(2);
    return {
      opacity,
      filter: `blur(${blurPx}px) saturate(${saturate}) contrast(${contrast}) brightness(${brightness}) hue-rotate(${hueRotateDeg}deg)`,
      mixBlendMode: 'screen',
      background:
        'radial-gradient(circle at 18% 16%, rgba(205, 240, 255, 0.95) 0%, rgba(205, 240, 255, 0) 36%), radial-gradient(circle at 82% 78%, rgba(90, 165, 255, 0.9) 0%, rgba(90, 165, 255, 0) 43%), linear-gradient(160deg, rgba(94, 152, 238, 0.66), rgba(169, 229, 255, 0.28))',
    };
  }

  if (effect === 'dyslem') {
    const blurPx = (0.4 + (1.7 * amp)).toFixed(2);
    const saturate = (1.38 + (0.52 * amp)).toFixed(2);
    const contrast = (1.28 + (0.36 * amp)).toFixed(2);
    const brightness = (1.04 + (0.08 * amp)).toFixed(2);
    const hueRotateDeg = Math.round(-8 + (10 * amp));
    const opacity = (0.18 + (0.08 * amp)).toFixed(2);
    return {
      opacity,
      filter: `blur(${blurPx}px) saturate(${saturate}) contrast(${contrast}) brightness(${brightness}) hue-rotate(${hueRotateDeg}deg)`,
      mixBlendMode: 'hard-light',
      background:
        'linear-gradient(140deg, rgba(255, 216, 110, 0.78) 0%, rgba(255, 108, 88, 0.42) 42%, rgba(255, 56, 126, 0.72) 100%)',
    };
  }

  if (effect === 'embian') {
    const blurPx = (1.8 + (3.7 * amp)).toFixed(2);
    const saturate = (0.86 + (0.22 * amp)).toFixed(2);
    const contrast = (0.98 + (0.14 * amp)).toFixed(2);
    const brightness = (0.95 - (0.02 * amp)).toFixed(2);
    const hueRotateDeg = Math.round(4 + (9 * amp));
    const opacity = (0.28 + (0.07 * amp)).toFixed(2);
    return {
      opacity,
      filter: `blur(${blurPx}px) saturate(${saturate}) contrast(${contrast}) brightness(${brightness}) hue-rotate(${hueRotateDeg}deg)`,
      mixBlendMode: 'multiply',
      background:
        'radial-gradient(circle at 50% 14%, rgba(173, 142, 236, 0.65) 0%, rgba(173, 142, 236, 0) 36%), radial-gradient(circle at 50% 122%, rgba(26, 12, 72, 0.95) 8%, rgba(8, 5, 24, 0.98) 76%)',
    };
  }

  const blurPx = (1.2 + (2.8 * amp)).toFixed(2);
  const saturate = (1.28 + (0.7 * amp)).toFixed(2);
  const contrast = (1.1 + (0.28 * amp)).toFixed(2);
  const brightness = (1.03 + (0.08 * amp)).toFixed(2);
  const hueRotateDeg = Math.round(30 + (18 * amp));
  const opacity = (0.18 + (0.08 * amp)).toFixed(2);
  return {
    opacity,
    filter: `blur(${blurPx}px) saturate(${saturate}) contrast(${contrast}) brightness(${brightness}) hue-rotate(${hueRotateDeg}deg)`,
    mixBlendMode: 'screen',
    background:
      'conic-gradient(from 80deg at 50% 50%, rgba(255, 105, 157, 0.68), rgba(255, 188, 92, 0.6), rgba(136, 255, 192, 0.62), rgba(123, 222, 255, 0.6), rgba(171, 138, 255, 0.72), rgba(255, 105, 157, 0.68))',
  };
}

function getSecondaryMedicineOverlayStyle(effect: string, strength: number): CSSProperties {
  const amp = amplifyMedicineStrength(strength);
  if (effect === 'depaz') {
    const opacity = (0.14 + (0.06 * amp)).toFixed(2);
    const blurPx = (0.8 + (2.4 * amp)).toFixed(2);
    const hueRotateDeg = Math.round(8 + (14 * amp));
    return {
      opacity,
      filter: `blur(${blurPx}px) hue-rotate(${hueRotateDeg}deg)`,
      mixBlendMode: 'soft-light',
      background:
        'repeating-linear-gradient(132deg, rgba(233, 248, 255, 0.7) 0px, rgba(233, 248, 255, 0.7) 12px, rgba(233, 248, 255, 0) 12px, rgba(233, 248, 255, 0) 30px)',
    };
  }

  if (effect === 'dyslem') {
    const opacity = (0.18 + (0.07 * amp)).toFixed(2);
    const blurPx = (0.5 + (1.6 * amp)).toFixed(2);
    const hueRotateDeg = Math.round(-6 + (8 * amp));
    return {
      opacity,
      filter: `blur(${blurPx}px) hue-rotate(${hueRotateDeg}deg)`,
      mixBlendMode: 'overlay',
      background:
        'repeating-linear-gradient(0deg, rgba(255, 244, 205, 0.62) 0px, rgba(255, 244, 205, 0.62) 3px, rgba(255, 52, 52, 0.55) 3px, rgba(255, 52, 52, 0.55) 6px, rgba(255, 244, 205, 0) 6px, rgba(255, 244, 205, 0) 9px)',
    };
  }

  if (effect === 'embian') {
    const opacity = (0.14 + (0.06 * amp)).toFixed(2);
    const blurPx = (2 + (4.2 * amp)).toFixed(2);
    const hueRotateDeg = Math.round(3 + (11 * amp));
    return {
      opacity,
      filter: `blur(${blurPx}px) hue-rotate(${hueRotateDeg}deg)`,
      mixBlendMode: 'screen',
      background:
        'radial-gradient(circle at 16% 26%, rgba(219, 198, 255, 0.54) 0%, rgba(219, 198, 255, 0) 4%), radial-gradient(circle at 74% 18%, rgba(210, 189, 255, 0.52) 0%, rgba(210, 189, 255, 0) 4%), radial-gradient(circle at 56% 68%, rgba(193, 174, 255, 0.48) 0%, rgba(193, 174, 255, 0) 3.6%)',
    };
  }

  const opacity = (0.16 + (0.08 * amp)).toFixed(2);
  const blurPx = (1.8 + (3.2 * amp)).toFixed(2);
  const hueRotateDeg = Math.round(42 + (18 * amp));
  return {
    opacity,
    filter: `blur(${blurPx}px) hue-rotate(${hueRotateDeg}deg)`,
    mixBlendMode: 'color-dodge',
    background:
      'radial-gradient(circle at 28% 24%, rgba(255, 223, 137, 0.58) 0%, rgba(255, 223, 137, 0) 36%), radial-gradient(circle at 78% 72%, rgba(138, 255, 209, 0.56) 0%, rgba(138, 255, 209, 0) 44%), linear-gradient(118deg, rgba(255, 124, 173, 0.5), rgba(124, 163, 255, 0.42))',
  };
}

const medicinePrimaryStyle = computed<CSSProperties>(() => {
  if (!medicineStore.effectActive) return {};
  const effect = medicineStore.currentEffectType;
  if (!effect) return {};
  return getPrimaryMedicineOverlayStyle(effect, medicineStore.effectStrength);
});

const medicineSecondaryStyle = computed<CSSProperties>(() => {
  if (!medicineStore.effectActive) return {};
  const effect = medicineStore.currentEffectType;
  if (!effect) return {};
  return getSecondaryMedicineOverlayStyle(effect, medicineStore.effectStrength);
});
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
  if (ameTransitionActive.value) return;

  if (appType === 'medication') {
    openMedicationWindows();
    return;
  }

  if (appType === 'hangout') {
    const configuredHangOutUrl = String(settings.value.hangOutUrl ?? '').trim();
    const usesLegacyPlaceholder = /placeholder/i.test(configuredHangOutUrl);
    const hangOutUrl = configuredHangOutUrl && !usesLegacyPlaceholder
      ? configuredHangOutUrl
      : DEFAULT_HANG_OUT_URL;
    if (hangOutUrl !== configuredHangOutUrl) {
      settings.value.hangOutUrl = hangOutUrl;
    }
    if (!hangOutUrl) {
      window.alert('Hang Out URL is not configured in Control Panel.');
      return;
    }
    openExternalUrl(hangOutUrl, 'Hang Out link');
    return;
  }

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
    hangout: 'Hang Out',
    goout: 'Go Out',
    internet: 'Internet',
    controlpanel: 'Control Panel',
    credits: 'Credits',
    secret: 'Secret.txt',
    task: 'Task Manager',
    medication: 'Medication',
    medication_depaz: 'Depaz',
    medication_dyslem: 'Dyslem',
    medication_embian: 'Embian',
    medication_magic_smoke: 'Magic Smoke',
    sleep: 'Sleep',
    trash: 'Trash Bin',
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

function onWindowDragStart(id: string) {
  activeDragWindowId = id;
}

function onWindowDragEnd(id: string) {
  if (activeDragWindowId !== null && activeDragWindowId !== id) return;
  activeDragWindowId = null;
  stopWindowDragSfx();
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
  windows.value = windows.value.map((w) => {
    if (w.id !== id || w.isFullscreen) return w;
    const clamped = clampWindowRect(x, y, w.width, w.height);
    return { ...w, ...clamped };
  });
  if (activeDragWindowId === null) {
    activeDragWindowId = id;
  }
  if (activeDragWindowId === id) {
    startWindowDragSfx();
  }
}

function resizeWindow(id: string, x: number, y: number, width: number, height: number) {
  windows.value = windows.value.map((w) => {
    if (w.id !== id || w.isFullscreen) return w;
    const clamped = clampWindowRect(x, y, width, height);
    return { ...w, ...clamped };
  });
}

function minimizeWindow(id: string) {
  const win = windows.value.find((w) => w.id === id);
  if (!win) return;
  if (activeDragWindowId === id) {
    activeDragWindowId = null;
    stopWindowDragSfx();
  }
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
  if (activeDragWindowId === id) {
    activeDragWindowId = null;
    stopWindowDragSfx();
  }
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
  if (activeDragWindowId === id) {
    activeDragWindowId = null;
    stopWindowDragSfx();
  }
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
  if (ameTransitionActive.value) return;
  openWindow('jine');
}

function onTabClick(id: string) {
  if (ameTransitionActive.value) return;
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
  if (ameTransitionActive.value) return;
  startBoot('restart');
}

function shutdown() {
  if (ameTransitionActive.value) return;
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
  position: relative;
  width: 100vw;
  height: 100vh;
  background: #000;
  overflow: hidden;
}
.scene-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
}
.app-root.app-root--mobile .scene-stage {
  grid-template-columns: 1fr;
}
.app-root.ame-transition-active .scene-stage {
  pointer-events: none;
}
.viewport-slot {
  margin: auto;
  transform-origin: 76% 82%;
}
.app-root.ame-phase-rebound .viewport-slot {
  animation: ame-viewport-left-rebound var(--ame-rebound-ms, 520ms) cubic-bezier(0.22, 0.82, 0.2, 1) forwards;
}
.app-root.ame-phase-crtOff .viewport-slot,
.app-root.ame-phase-navigating .viewport-slot {
  transform: rotate(-2.9deg) translate3d(-14px, 6px, 0);
}
.app-root.app-root--mobile .viewport-slot {
  margin: 0 auto;
}
.viewport {
  position: relative;
  background: #1d1d1d;
  overflow: hidden;
  transform-origin: top left;
  filter: blur(var(--viewport-softness, 0px));
}
.app-root.app-root--mobile .viewport {
  filter: blur(0px);
}
.app-root.app-root--mobile .side-fill {
  display: none;
}
.desktop-shell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
  width: 186px;
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(180deg, #efe2ff 0%, #dcc5f7 100%);
  border: none;
  box-shadow:
    inset 1px 1px 0 #ffffff,
    inset -1px -1px 0 #7d67ad,
    inset 0 0 0 1px #d3b8f1,
    1px 1px 0 rgba(0, 0, 0, 0.25);
  padding: 5px 7px;
  font-family: var(--font-ui);
  font-size: 11px;
  line-height: 1;
  color: #3c2d62;
  cursor: pointer;
  z-index: 9999;
}
.jine-toast-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  background-image: url('/quickmenu/button_jine.png');
  background-repeat: no-repeat;
  background-position: left center;
  background-size: auto 16px;
  image-rendering: pixelated;
  box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.45), inset -1px -1px 0 rgba(82, 64, 122, 0.55);
}
.jine-toast-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.overlay-effect {
  position: fixed;
  inset: -16%;
  pointer-events: none;
  opacity: 0;
  z-index: 99997;
  transition: opacity 120ms linear, filter 120ms linear, background 180ms linear;
  will-change: transform, opacity, filter;
}
.overlay-effect-primary {
  z-index: 99998;
}
.overlay-effect-secondary {
  z-index: 99997;
}
.overlay-effect.overlay-none {
  opacity: 0;
  animation: none;
}
.overlay-effect-primary.overlay-depaz {
  animation: med-depaz-float 2.4s ease-in-out infinite;
}
.overlay-effect-secondary.overlay-depaz {
  animation: med-depaz-wave 1.6s ease-in-out infinite;
}
.overlay-effect-primary.overlay-dyslem {
  animation: med-dyslem-pulse 180ms steps(2, end) infinite;
}
.overlay-effect-secondary.overlay-dyslem {
  animation: med-dyslem-jitter 72ms steps(2, end) infinite;
}
.overlay-effect-primary.overlay-embian {
  animation: med-embian-breathe 2.8s ease-in-out infinite;
}
.overlay-effect-secondary.overlay-embian {
  animation: med-embian-drift 2.1s ease-in-out infinite;
}
.overlay-effect-primary.overlay-magic_smoke {
  animation: med-smoke-swirl 2.2s linear infinite;
}
.overlay-effect-secondary.overlay-magic_smoke {
  animation: med-smoke-haze 1.2s ease-in-out infinite;
}
.jine-toast:hover {
  filter: brightness(0.98);
}
.jine-toast:active {
  transform: translateY(1px);
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
.ame-intro-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100001;
  --ame-shadow-top: 8%;
  --ame-shadow-right: 6%;
  --ame-shadow-width: 42%;
}
.ame-crt-poweroff {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100002;
  opacity: 0;
}
.ame-crt-poweroff::before,
.ame-crt-poweroff::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
.ame-crt-poweroff::before {
  height: 100%;
  background: #000;
  opacity: 0;
  clip-path: inset(0 0 0 0);
}
.ame-crt-poweroff::after {
  height: 2px;
  background: rgba(255, 255, 255, 0.95);
  opacity: 0;
  transform: translateY(-50%) scaleX(0.16);
  filter: blur(0.35px);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.46);
}
.app-root.ame-phase-crtOff .ame-crt-poweroff,
.app-root.ame-phase-navigating .ame-crt-poweroff {
  opacity: 1;
}
.app-root.ame-phase-crtOff .ame-crt-poweroff::after,
.app-root.ame-phase-navigating .ame-crt-poweroff::after {
  animation: ame-crt-poweroff-line var(--ame-crt-off-ms, 430ms) cubic-bezier(0.18, 0.82, 0.22, 1) forwards;
}
.app-root.ame-phase-crtOff .ame-crt-poweroff::before,
.app-root.ame-phase-navigating .ame-crt-poweroff::before {
  animation: ame-crt-poweroff-mask var(--ame-crt-off-ms, 430ms) cubic-bezier(0.24, 0.8, 0.24, 1) forwards;
}
.ame-intro-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
}
.ame-intro-frame-00,
.ame-intro-frame-0,
.ame-intro-frame-impact,
.ame-intro-frame-2 {
  opacity: 0;
  mix-blend-mode: normal;
}
.ame-intro-frame-2 {
  opacity: 0;
  mix-blend-mode: normal;
  filter: contrast(1.08) saturate(0.9);
}
.ame-intro-shadow {
  position: absolute;
  top: var(--ame-shadow-top);
  right: var(--ame-shadow-right);
  width: var(--ame-shadow-width);
  height: auto;
  max-width: 52%;
  image-rendering: pixelated;
  opacity: 0;
  mix-blend-mode: screen;
  --ame-shadow-transition-ms: 2000ms;
  transition: opacity var(--ame-shadow-transition-ms) ease-out;
}
.ame-pink-flash {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: rgba(255, 136, 206, 0.68);
  mix-blend-mode: screen;
}
.ame-pink-flash.ame-pink-flash--active {
  opacity: 0.75;
}
.ame-intro-overlay--shadowFadeIn .ame-intro-shadow,
.ame-intro-overlay--intro00 .ame-intro-shadow,
.ame-intro-overlay--pinkFlash .ame-intro-shadow,
.ame-intro-overlay--intro0 .ame-intro-shadow,
.ame-intro-overlay--impact .ame-intro-shadow {
  opacity: 0.75;
}
.ame-intro-overlay--final .ame-intro-shadow {
  opacity: 0;
  --ame-shadow-transition-ms: var(--ame-shadow-fade-out-ms, 300ms);
}
.ame-intro-overlay--intro00 .ame-intro-frame-00 {
  opacity: 1;
}
.ame-intro-overlay--intro0 .ame-intro-frame-0 {
  opacity: 1;
}
.ame-intro-overlay--impact .ame-intro-frame-impact {
  opacity: 1;
}
.ame-intro-overlay--final .ame-intro-frame-2 {
  opacity: 1;
}
@keyframes sidebar-flash {
  0% { opacity: 0; }
  37.5% { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes ame-viewport-left-rebound {
  0% {
    transform: rotate(0deg) translate3d(0, 0, 0);
  }
  62% {
    transform: rotate(-3.3deg) translate3d(-16px, 8px, 0);
  }
  82% {
    transform: rotate(-2.05deg) translate3d(-8px, 3px, 0);
  }
  100% {
    transform: rotate(-2.9deg) translate3d(-14px, 6px, 0);
  }
}
@keyframes ame-crt-poweroff-line {
  0% {
    opacity: 0;
    transform: translateY(-50%) scaleX(0.22);
  }
  24% {
    opacity: 1;
    transform: translateY(-50%) scaleX(1);
  }
  64% {
    opacity: 0.95;
    transform: translateY(-50%) scaleX(0.08);
  }
  100% {
    opacity: 0;
    transform: translateY(-50%) scaleX(0);
  }
}
@keyframes ame-crt-poweroff-mask {
  0% {
    opacity: 0;
    clip-path: inset(0 0 0 0);
  }
  46% {
    opacity: 0.42;
    clip-path: inset(46% 0 46% 0);
  }
  72% {
    opacity: 0.78;
    clip-path: inset(49% 0 49% 0);
  }
  100% {
    opacity: 1;
    clip-path: inset(0 0 0 0);
  }
}

@keyframes med-depaz-float {
  0%, 100% { transform: translate3d(-10%, -6%, 0) scale(1.04); }
  50% { transform: translate3d(12%, 9%, 0) scale(1.18); }
}

@keyframes med-depaz-wave {
  0%, 100% { transform: translate3d(6%, -6%, 0) rotate(-2deg); }
  50% { transform: translate3d(-8%, 8%, 0) rotate(5deg); }
}

@keyframes med-dyslem-pulse {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, 0, 0) scale(1.3); }
}

@keyframes med-dyslem-jitter {
  0% { transform: translate3d(0, 0, 0); }
  25% { transform: translate3d(-8%, 5%, 0) rotate(-3deg); }
  50% { transform: translate3d(7%, -6%, 0) rotate(3deg); }
  75% { transform: translate3d(-5%, 7%, 0) rotate(-2deg); }
  100% { transform: translate3d(0, 0, 0); }
}

@keyframes med-embian-breathe {
  0%, 100% { transform: scale(1.03); }
  50% { transform: scale(1.28); }
}

@keyframes med-embian-drift {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -14%, 0) rotate(1.5deg); }
}

@keyframes med-smoke-swirl {
  0% { transform: rotate(0deg) scale(1.14); }
  100% { transform: rotate(360deg) scale(1.42); }
}

@keyframes med-smoke-haze {
  0%, 100% { transform: translate3d(-10%, 8%, 0) scale(1.06); }
  50% { transform: translate3d(12%, -9%, 0) scale(1.28); }
}

</style>








