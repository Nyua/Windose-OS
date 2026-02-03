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
import { ref } from 'vue';
import { settingsFields } from '../settings';
import type { SettingsSchema, SettingValue } from '../types';

const props = defineProps<{ settings: SettingsSchema; saveError: string | null }>();
const emit = defineEmits<{ (e: 'update', key: string, value: SettingValue): void }>();

const fields = settingsFields;
const password = ref('');
const authed = ref(false);
const authError = ref(false);

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
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; }
.row { display: contents; }
label { align-self: center; }
.error { color: #b00020; margin-top: 8px; }
</style>
