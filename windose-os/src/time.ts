import type { TimeSlot } from './types';

export function getDayOfYear(date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

export function getTimeSlot(date = new Date()): TimeSlot {
  const hour = date.getHours();
  if (hour >= 6 && hour <= 16) return 'NOON';
  if (hour >= 17 && hour <= 19) return 'DUSK';
  return 'NIGHT';
}
