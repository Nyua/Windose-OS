<template>
  <div class="panel">
    <div v-if="!authed" class="auth">
      <div class="auth-card">
        <div class="title">Control Panel</div>
        <p class="auth-copy">Developer access required</p>

        <div class="lock-wrap">
          <button
            class="lock-button"
            :class="{ jiggle: isJiggling, unlocked: lockState === 'unlocked' }"
            type="button"
            aria-label="Unlock control panel"
            @click="checkPassword"
          >
            <svg
              v-if="lockState !== 'unlocked'"
              class="lock-glyph"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
              shape-rendering="crispEdges"
              aria-hidden="true"
            >
              <rect x="7" y="13" width="18" height="14" fill="#f2cf5c" />
              <rect x="6" y="12" width="20" height="16" fill="none" stroke="#6c5118" stroke-width="2" />
              <path d="M11 13V9a5 5 0 0 1 10 0v4" fill="none" stroke="#6c5118" stroke-width="2" />
              <rect x="15" y="18" width="2" height="5" fill="#3e2c10" />
            </svg>
            <svg
              v-else
              class="lock-glyph"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
              shape-rendering="crispEdges"
              aria-hidden="true"
            >
              <rect x="7" y="13" width="18" height="14" fill="#d0f2a8" />
              <rect x="6" y="12" width="20" height="16" fill="none" stroke="#3f6f24" stroke-width="2" />
              <path d="M11 13V10a5 5 0 0 1 10 0" fill="none" stroke="#3f6f24" stroke-width="2" />
              <path d="M21 10V6" fill="none" stroke="#3f6f24" stroke-width="2" />
              <rect x="15" y="18" width="2" height="5" fill="#2a4c17" />
            </svg>
          </button>

          <div v-if="showParticles" class="particle-burst" aria-hidden="true">
            <span
              v-for="(particle, index) in particleSeeds"
              :key="index"
              class="particle"
              :style="{
                '--dx': `${particle.x}px`,
                '--dy': `${particle.y}px`,
                '--delay': `${particle.delay}ms`,
                '--particle-color': particle.color,
              }"
            />
          </div>
        </div>

        <label class="password-label" for="control-panel-password">Password</label>
        <input
          id="control-panel-password"
          v-model="password"
          class="password-input"
          type="password"
          placeholder="Enter developer password"
          autocomplete="current-password"
          @input="onPasswordInput"
          @keydown.enter="checkPassword"
        />
        <button class="unlock-button" type="button" @click="checkPassword">Unlock</button>
        <div class="auth-hint">Tip: press Enter or click the lock icon.</div>
        <div v-if="authError" class="error">Incorrect password.</div>
      </div>
    </div>
    <div v-else class="content-wrapper">
      <div class="tabs">
        <button class="tab-btn" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">Settings</button>
        <button
          v-if="canShowAmeTab"
          class="tab-btn"
          :class="{ active: activeTab === 'ame' }"
          @click="activeTab = 'ame'"
        >
          Ame's Corner
        </button>
      </div>
      
      <div v-if="activeTab === 'settings'" class="settings-panel">
        <div class="title">Settings</div>
        <div class="critical-debug">
          <div class="subtitle">Webcam Debug Control</div>
          <button
            class="webcam-toggle-btn"
            :class="{ disabled: !webcamDebugEnabled }"
            type="button"
            @click="toggleWebcamDebug"
          >
            {{ webcamDebugEnabled ? 'Disable Webcam (Debug)' : 'Enable Webcam (Debug)' }}
          </button>
          <div class="hint">
            Priority toggle for desktop behavior testing.
            Current state: <strong>{{ webcamDebugEnabled ? 'Enabled' : 'Disabled' }}</strong>.
          </div>
        </div>
        <div class="debug">
          <div class="subtitle">TimeSlot Debug</div>
          <div class="time-slot-toggles">
            <button :class="{ active: timeSlotMode === 'DEFAULT' }" @click="setTimeSlotMode('DEFAULT')">Default</button>
            <button :class="{ active: timeSlotMode === 'NOON' }" @click="setTimeSlotMode('NOON')">Noon</button>
            <button :class="{ active: timeSlotMode === 'DUSK' }" @click="setTimeSlotMode('DUSK')">Dusk</button>
            <button :class="{ active: timeSlotMode === 'NIGHT' }" @click="setTimeSlotMode('NIGHT')">Night</button>
          </div>
          <div class="hint">Overrides time-based states for testing. Default uses system time.</div>
        </div>
        <div class="debug">
          <div class="subtitle">Sleep TimeSlot Debug</div>
          <div class="time-slot-toggles">
            <button :class="{ active: sleepTimeSlotMode === 'DEFAULT' }" @click="setSleepTimeSlotMode('DEFAULT')">Default</button>
            <button :class="{ active: sleepTimeSlotMode === 'NOON' }" @click="setSleepTimeSlotMode('NOON')">Noon</button>
            <button :class="{ active: sleepTimeSlotMode === 'DUSK' }" @click="setSleepTimeSlotMode('DUSK')">Dusk</button>
            <button :class="{ active: sleepTimeSlotMode === 'NIGHT' }" @click="setSleepTimeSlotMode('NIGHT')">Night</button>
          </div>
          <div class="hint">Overrides only the Sleep app theme. Default uses Ame&apos;s UTC+10 time.</div>
        </div>
        <template v-if="showAdvancedSettings">
          <div class="actions">
            <button class="action-btn" @click="clearLocalStorage">Clear Local Storage</button>
          </div>
          <div class="grid">
            <div v-for="field in fields" :key="field.key" class="row">
              <label>{{ field.label }}</label>
              <input
                v-if="field.type === 'string'"
                type="text"
                :value="settings[field.key] as string"
                @input="update(field.key, ($event.target as HTMLInputElement).value)"
              />
              <input
                v-else-if="field.type === 'number'"
                type="number"
                :min="field.min"
                :max="field.max"
                :step="field.step || 1"
                :value="settings[field.key] as number"
                @input="update(field.key, Number(($event.target as HTMLInputElement).value))"
              />
              <input
                v-else
                type="checkbox"
                :checked="settings[field.key] as boolean"
                @change="update(field.key, ($event.target as HTMLInputElement).checked)"
              />
            </div>
          </div>
          <div v-if="saveError" class="error">{{ saveError }}</div>
        </template>
        <div v-else class="hint prod-debug-lock">Production build: advanced debug controls are disabled.</div>
      </div>

      <div v-else-if="canShowAmeTab && activeTab === 'ame'" class="ame-panel">
        <div class="ame-corner">
          <button
            class="ame-icon"
            type="button"
            aria-label="Launch Ame's Corner"
            @click="launchAmeCorner"
          >
            <img src="/avatars/avatar_1.png" alt="Ame" />
          </button>
          <div>Open Ame's Corner</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { settingsFields } from '../settings';
import { useSecretsStore } from '../stores/secrets';
import type { SettingsSchema, SettingValue } from '../types';

const props = defineProps<{ settings: SettingsSchema; saveError: string | null }>();
const emit = defineEmits<{
  (e: 'update', key: string, value: SettingValue): void;
  (e: 'launchAmeCorner'): void;
}>();

const CONTROL_PANEL_PASSWORD = 'angelkawaii2';
const isProductionBuild = import.meta.env.PROD;
const allowedProductionDebugKeys = new Set([
  'webcamEnabled',
  'timeSlotOverrideEnabled',
  'timeSlotOverride',
  'sleepTimeSlotOverrideEnabled',
  'sleepTimeSlotOverride',
]);
const hiddenKeys = new Set([
  'timeSlotOverrideEnabled',
  'timeSlotOverride',
  'sleepTimeSlotOverrideEnabled',
  'sleepTimeSlotOverride',
  'webcamEnabled',
  'creditsBackgroundImage',
  'ameCornerUrl',
]);
const showAdvancedSettings = computed(() => !isProductionBuild);
const fields = computed(() => {
  if (!showAdvancedSettings.value) return [];
  return settingsFields.filter((field) => !hiddenKeys.has(field.key));
});
const password = ref('');
const authed = ref(false);
const authError = ref(false);
const isJiggling = ref(false);
const showParticles = ref(false);
const lockState = ref<'locked' | 'unlocked'>('locked');
const activeTab = ref<'settings' | 'ame'>('settings');
const secretsStore = useSecretsStore();
const { amesCornerUnlocked } = storeToRefs(secretsStore);
const canShowAmeTab = computed(() => Boolean(amesCornerUnlocked.value));
const particleSeeds = [
  { x: -54, y: -40, color: '#f86464', delay: 0 },
  { x: -40, y: -58, color: '#ffc857', delay: 35 },
  { x: -24, y: -44, color: '#6de27d', delay: 70 },
  { x: 0, y: -62, color: '#53cbff', delay: 105 },
  { x: 25, y: -48, color: '#b68cff', delay: 140 },
  { x: 42, y: -56, color: '#ff8ed1', delay: 175 },
  { x: 56, y: -28, color: '#f86464', delay: 210 },
  { x: 48, y: 0, color: '#ffc857', delay: 245 },
  { x: 58, y: 22, color: '#6de27d', delay: 280 },
  { x: 36, y: 44, color: '#53cbff', delay: 315 },
  { x: 10, y: 56, color: '#b68cff', delay: 350 },
  { x: -14, y: 50, color: '#ff8ed1', delay: 385 },
  { x: -34, y: 38, color: '#f86464', delay: 420 },
  { x: -52, y: 18, color: '#ffc857', delay: 455 },
] as const;
let jiggleTimer: number | null = null;
let unlockTimer: number | null = null;
let particleTimer: number | null = null;

const timeSlotMode = computed(() => {
  const enabled = Boolean(props.settings.timeSlotOverrideEnabled ?? false);
  if (!enabled) return 'DEFAULT';
  const raw = String(props.settings.timeSlotOverride ?? '').toUpperCase().trim();
  if (raw === 'NOON' || raw === 'DUSK' || raw === 'NIGHT') return raw;
  return 'DEFAULT';
});

const sleepTimeSlotMode = computed(() => {
  const enabled = Boolean(props.settings.sleepTimeSlotOverrideEnabled ?? false);
  if (!enabled) return 'DEFAULT';
  const raw = String(props.settings.sleepTimeSlotOverride ?? '').toUpperCase().trim();
  if (raw === 'NOON' || raw === 'DUSK' || raw === 'NIGHT') return raw;
  return 'DEFAULT';
});
const webcamDebugEnabled = computed(() => Boolean(props.settings.webcamEnabled ?? true));

type TimeSlotMode = 'DEFAULT' | 'NOON' | 'DUSK' | 'NIGHT';

watch(canShowAmeTab, (enabled) => {
  if (!enabled && activeTab.value === 'ame') {
    activeTab.value = 'settings';
  }
}, { immediate: true });

function setTimeSlotMode(mode: TimeSlotMode) {
  if (mode === 'DEFAULT') {
    emit('update', 'timeSlotOverrideEnabled', false);
  } else {
    emit('update', 'timeSlotOverrideEnabled', true);
    emit('update', 'timeSlotOverride', mode);
  }
}

function setSleepTimeSlotMode(mode: TimeSlotMode) {
  if (mode === 'DEFAULT') {
    emit('update', 'sleepTimeSlotOverrideEnabled', false);
  } else {
    emit('update', 'sleepTimeSlotOverrideEnabled', true);
    emit('update', 'sleepTimeSlotOverride', mode);
  }
}

function toggleWebcamDebug() {
  emit('update', 'webcamEnabled', !webcamDebugEnabled.value);
}

function checkPassword() {
  if (password.value !== CONTROL_PANEL_PASSWORD) {
    authError.value = true;
    lockState.value = 'locked';
    showParticles.value = false;
    if (unlockTimer !== null) {
      window.clearTimeout(unlockTimer);
      unlockTimer = null;
    }
    return;
  }

  authError.value = false;
  lockState.value = 'unlocked';
  showParticles.value = true;

  if (particleTimer !== null) {
    window.clearTimeout(particleTimer);
  }
  particleTimer = window.setTimeout(() => {
    showParticles.value = false;
    particleTimer = null;
  }, 900);

  if (unlockTimer !== null) {
    window.clearTimeout(unlockTimer);
  }
  unlockTimer = window.setTimeout(() => {
    authed.value = true;
    unlockTimer = null;
  }, 550);
}

function onPasswordInput() {
  authError.value = false;
  lockState.value = 'locked';
  showParticles.value = false;
  isJiggling.value = false;
  window.requestAnimationFrame(() => {
    isJiggling.value = true;
  });
  if (jiggleTimer !== null) {
    window.clearTimeout(jiggleTimer);
  }
  jiggleTimer = window.setTimeout(() => {
    isJiggling.value = false;
    jiggleTimer = null;
  }, 260);
}

function update(key: string, value: SettingValue) {
  if (isProductionBuild && !allowedProductionDebugKeys.has(key)) return;
  emit('update', key, value);
}

function clearLocalStorage() {
  if (isProductionBuild) return;
  const ok = window.confirm('Clear local storage and reload?');
  if (!ok) return;
  try {
    localStorage.clear();
  } catch {
    // ignore storage failures
  }
  window.location.reload();
}

function launchAmeCorner() {
  if (!canShowAmeTab.value) return;
  emit('launchAmeCorner');
}

onBeforeUnmount(() => {
  if (jiggleTimer !== null) window.clearTimeout(jiggleTimer);
  if (unlockTimer !== null) window.clearTimeout(unlockTimer);
  if (particleTimer !== null) window.clearTimeout(particleTimer);
});
</script>

<style scoped>
.panel {
  font-family: var(--font-ui);
  font-size: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.title { font-size: 14px; margin-bottom: 6px; }
.auth {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 12px;
}
.auth-card {
  width: min(340px, 100%);
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
  background: #e6e6e6;
  padding: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.auth-card .title {
  margin: 0 0 6px;
  font-size: 20px;
  text-align: center;
}
.auth-copy {
  margin: 0 0 10px;
  color: #3f3f3f;
}
.lock-wrap {
  position: relative;
  width: 96px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.lock-button {
  width: 80px;
  height: 80px;
  border: 2px solid #666;
  box-shadow: inset 0 0 0 2px #fff, 0 3px 0 #8a8a8a;
  background: linear-gradient(#f6f6f6, #d3d3d3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.lock-button:active {
  transform: translateY(2px);
  box-shadow: inset 0 0 0 2px #fff, 0 1px 0 #8a8a8a;
}
.lock-button.jiggle {
  animation: lock-jiggle 0.22s steps(2, end);
}
.lock-button.unlocked {
  background: linear-gradient(#f3fff0, #cae9b3);
  border-color: #4a7a30;
}
.lock-glyph {
  width: 46px;
  height: 46px;
  image-rendering: pixelated;
}
.password-label {
  width: 100%;
  margin: 0 0 4px;
  text-align: center;
}
.password-input {
  width: 100%;
  font-family: var(--font-ui);
  font-size: 14px;
  padding: 8px 10px;
  border: 2px solid #777;
  box-shadow: inset 0 0 0 1px #fff;
  margin-bottom: 8px;
}
.unlock-button {
  width: 100%;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 700;
  padding: 8px 10px;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: #f0f0f0;
  cursor: pointer;
}
.unlock-button:active {
  filter: brightness(0.92);
}
.auth-hint {
  margin-top: 8px;
  font-size: 11px;
  color: #505050;
}
.particle-burst {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.particle {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%);
  background: var(--particle-color);
  box-shadow: inset 0 0 0 1px #fff;
  animation: particle-burst 0.72s steps(4, end) forwards;
  animation-delay: var(--delay);
}
.settings {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 6px;
}
.actions {
  margin-bottom: 10px;
}
.action-btn {
  font-family: var(--font-ui);
  font-size: 12px;
  padding: 2px 8px;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: #e6e6e6;
  cursor: pointer;
}
.action-btn:active { filter: brightness(0.9); }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
.critical-debug {
  margin-bottom: 10px;
  padding: 8px;
  border: 2px solid #7a1e1e;
  box-shadow: inset 0 0 0 2px #f7c3c3;
  background: linear-gradient(180deg, #ffe3e3 0%, #f7cccc 100%);
}
.webcam-toggle-btn {
  width: 100%;
  min-height: 42px;
  margin-bottom: 6px;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 0.1px;
  border: 2px solid #6e1f1f;
  box-shadow: inset 0 0 0 2px #ffd6d6;
  background: linear-gradient(180deg, #ff7d7d 0%, #d83d3d 100%);
  color: #fff;
  cursor: pointer;
}
.webcam-toggle-btn.disabled {
  border-color: #1f5f27;
  box-shadow: inset 0 0 0 2px #d7ffd9;
  background: linear-gradient(180deg, #7fe38a 0%, #2f9952 100%);
}
.webcam-toggle-btn:active {
  filter: brightness(0.92);
}
.debug {
  margin-bottom: 10px;
  padding: 6px;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
  background: #f0f0f0;
}
.subtitle { font-size: 12px; margin-bottom: 6px; }
.time-slot-toggles { display: flex; gap: 6px; flex-wrap: wrap; }
.time-slot-toggles button {
  font-family: var(--font-ui);
  font-size: 12px;
  padding: 2px 8px;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: #e6e6e6;
  cursor: pointer;
}
.time-slot-toggles button.active { background: var(--title-active); color: #fff; }
.hint { margin-top: 4px; font-size: 11px; color: #4b4b4b; }
.prod-debug-lock { margin-bottom: 10px; }
.row { display: contents; }
label { align-self: center; }
.error { color: #b00020; margin-top: 8px; }

.content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.tabs {
  display: flex;
  gap: 2px;
  border-bottom: 2px solid var(--bevel-shadow);
  margin-bottom: 6px;
  padding-bottom: 2px;
}
.tab-btn {
  font-family: var(--font-ui);
  font-size: 12px;
  padding: 2px 8px;
  border: 1px solid var(--bevel-shadow);
  border-bottom: none;
  background: #d4d0c8;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
}
.tab-btn.active {
  background: #fff;
  font-weight: bold;
  height: 24px;
  margin-top: -2px;
  z-index: 1;
}
.settings-panel {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 6px;
}
.ame-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}
.ame-corner {
  text-align: center;
  color: #fff;
  font-family: var(--font-ui);
}
.ame-icon {
  width: 64px;
  height: 64px;
  padding: 0;
  appearance: none;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #fff;
  background: transparent;
  cursor: pointer;
  transition: transform 0.2s;
  margin-bottom: 8px;
}
.ame-icon:hover {
  transform: scale(1.1);
}
.ame-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@keyframes lock-jiggle {
  0% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(-4px) rotate(-2deg); }
  50% { transform: translateX(4px) rotate(2deg); }
  75% { transform: translateX(-2px) rotate(-1deg); }
  100% { transform: translateX(0) rotate(0deg); }
}

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  80% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.7);
  }
}
</style>
