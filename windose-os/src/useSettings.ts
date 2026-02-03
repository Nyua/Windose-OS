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

export function useSettings() {
  const settings = ref<SettingsSchema>(loadSettings());
  const saveError = ref<string | null>(null);

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

  return { settings, saveError };
}
