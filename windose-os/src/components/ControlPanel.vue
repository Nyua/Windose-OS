<template>
  <div class="panel">
    <div v-if="!authed" class="auth">
      <div class="title">Control Panel</div>
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="checkPassword">Unlock</button>
      <div v-if="authError" class="error">Incorrect password.</div>
    </div>
    <div v-else class="settings">
      <div class="title">Settings</div>
      <div class="actions">
        <button class="action-btn" @click="clearLocalStorage">Clear Local Storage</button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { settingsFields } from '../settings';
import type { SettingsSchema, SettingValue } from '../types';

const props = defineProps<{ settings: SettingsSchema; saveError: string | null }>();
const emit = defineEmits<{ (e: 'update', key: string, value: SettingValue): void }>();

const hiddenKeys = new Set(['timeSlotOverrideEnabled', 'timeSlotOverride']);
const fields = settingsFields.filter((field) => !hiddenKeys.has(field.key));
const password = ref('');
const authed = ref(false);
const authError = ref(false);

const timeSlotMode = computed(() => {
  const enabled = Boolean(props.settings.timeSlotOverrideEnabled ?? false);
  if (!enabled) return 'DEFAULT';
  const raw = String(props.settings.timeSlotOverride ?? '').toUpperCase().trim();
  if (raw === 'NOON' || raw === 'DUSK' || raw === 'NIGHT') return raw;
  return 'DEFAULT';
});

type TimeSlotMode = 'DEFAULT' | 'NOON' | 'DUSK' | 'NIGHT';

function setTimeSlotMode(mode: TimeSlotMode) {
  if (mode === 'DEFAULT') {
    emit('update', 'timeSlotOverrideEnabled', false);
  } else {
    emit('update', 'timeSlotOverrideEnabled', true);
    emit('update', 'timeSlotOverride', mode);
  }
}

function checkPassword() {
  if (password.value === 'angelkawaii2') {
    authed.value = true;
    authError.value = false;
  } else {
    authError.value = true;
  }
}

function update(key: string, value: SettingValue) {
  emit('update', key, value);
}

function clearLocalStorage() {
  const ok = window.confirm('Clear local storage and reload?');
  if (!ok) return;
  try {
    localStorage.clear();
  } catch {
    // ignore storage failures
  }
  window.location.reload();
}
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
.auth input { margin-right: 6px; }
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
.row { display: contents; }
label { align-self: center; }
.error { color: #b00020; margin-top: 8px; }
</style>
