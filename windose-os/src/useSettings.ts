import { ref, watch } from 'vue';
import { SETTINGS_STORAGE_KEY, defaultSettings } from './settings';
import type { SettingsSchema } from './types';

export function loadSettings(): SettingsSchema {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as SettingsSchema;
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

const settings = ref<SettingsSchema>(loadSettings());
const saveError = ref<string | null>(null);
let watchBound = false;

export function useSettings() {
  if (!watchBound) {
    watch(
      settings,
      (val) => {
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(val));
          saveError.value = null;
        } catch {
          saveError.value = 'Settings could not be saved.';
        }
      },
      { deep: true }
    );
    watchBound = true;
  }

  return { settings, saveError };
}
