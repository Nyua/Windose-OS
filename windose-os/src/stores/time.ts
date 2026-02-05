import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/**
 * TimeSlot enum per Implementation-Spec Section 2.1
 * Boundaries (local time, 24-hour):
 * - NOON: 06:00-16:59
 * - DUSK: 17:00-19:59
 * - NIGHT: 20:00-05:59
 */
export type TimeSlot = 'NOON' | 'DUSK' | 'NIGHT';

/**
 * Derives TimeSlot from hour (0-23)
 */
function getTimeSlotFromHour(hour: number): TimeSlot {
  if (hour >= 6 && hour <= 16) return 'NOON';
  if (hour >= 17 && hour <= 19) return 'DUSK';
  return 'NIGHT'; // 20-23 or 0-5
}

/**
 * Gets day of year (1-365 or 1-366 for leap years)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export const useTimeStore = defineStore('time', () => {
  // Override settings (for debug via Control Panel)
  const timeSlotOverrideEnabled = ref(false);
  const timeSlotOverride = ref<TimeSlot>('NOON');

  // Reactive current time (updated by interval)
  const currentDate = ref(new Date());

  /**
   * dayOfYear: Integer 1-365 (or 1-366 on leap years)
   * Derived from local system date
   */
  const dayOfYear = computed(() => getDayOfYear(currentDate.value));

  /**
   * timeSlot: NOON | DUSK | NIGHT
   * Derived from local system clock, unless override is enabled
   */
  const timeSlot = computed<TimeSlot>(() => {
    if (timeSlotOverrideEnabled.value) {
      return timeSlotOverride.value;
    }
    return getTimeSlotFromHour(currentDate.value.getHours());
  });

  /**
   * Updates current time (call periodically or on visibility change)
   */
  function updateTime() {
    currentDate.value = new Date();
  }

  /**
   * Enable/disable TimeSlot override (Control Panel debug feature)
   */
  function setTimeSlotOverride(enabled: boolean, slot?: TimeSlot) {
    timeSlotOverrideEnabled.value = enabled;
    if (slot) {
      timeSlotOverride.value = slot;
    }
  }

  return {
    // State
    dayOfYear,
    timeSlot,
    timeSlotOverrideEnabled,
    timeSlotOverride,

    // Actions
    updateTime,
    setTimeSlotOverride,
  };
});
