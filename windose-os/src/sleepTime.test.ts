import { describe, expect, it } from 'vitest';
import { formatUtcPlus10Time, getUtcPlus10TimeSlot } from './sleepTime';

describe('formatUtcPlus10Time', () => {
  it('formats a UTC date in UTC+10', () => {
    const value = formatUtcPlus10Time(new Date('2026-02-08T00:00:00.000Z'));
    expect(value).toBe('10:00:00 AM');
  });

  it('handles next-day rollover in UTC+10', () => {
    const value = formatUtcPlus10Time(new Date('2026-02-08T20:30:00.000Z'));
    expect(value).toBe('06:30:00 AM');
  });
});

describe('getUtcPlus10TimeSlot', () => {
  it('returns NOON for UTC+10 daytime', () => {
    const value = getUtcPlus10TimeSlot(new Date('2026-02-08T00:00:00.000Z'));
    expect(value).toBe('NOON');
  });

  it('returns DUSK for UTC+10 evening', () => {
    const value = getUtcPlus10TimeSlot(new Date('2026-02-08T07:00:00.000Z'));
    expect(value).toBe('DUSK');
  });

  it('returns NIGHT for UTC+10 night hours', () => {
    const value = getUtcPlus10TimeSlot(new Date('2026-02-08T10:00:00.000Z'));
    expect(value).toBe('NIGHT');
  });
});
