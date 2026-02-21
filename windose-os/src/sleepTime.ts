import type { TimeSlot } from './types';

const UTC_PLUS_10_TIME_ZONE = 'Etc/GMT-10';

const utcPlus10Formatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: UTC_PLUS_10_TIME_ZONE,
});

const utcPlus10HourFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  hourCycle: 'h23',
  timeZone: UTC_PLUS_10_TIME_ZONE,
});

export function formatUtcPlus10Time(date: Date): string {
  return utcPlus10Formatter.format(date);
}

function toUtcPlus10Hour(date: Date): number {
  const parsed = Number.parseInt(utcPlus10HourFormatter.format(date), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(23, Math.max(0, parsed));
}

export function getUtcPlus10TimeSlot(date: Date): TimeSlot {
  const hour = toUtcPlus10Hour(date);
  if (hour >= 6 && hour <= 16) return 'NOON';
  if (hour >= 17 && hour <= 19) return 'DUSK';
  return 'NIGHT';
}
