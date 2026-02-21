import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMedicineStore } from './medicine';

describe('medicine store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-08T00:00:00.000Z'));
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('transitions intro -> sustain -> fade -> idle on schedule', () => {
    const store = useMedicineStore();
    expect(store.takeMedicine('depaz')).toBe(true);
    expect(store.phase).toBe('intro');

    vi.setSystemTime(Date.now() + store.introDurationMs + 1);
    store.checkExpiry();
    expect(store.phase).toBe('sustain');

    vi.setSystemTime(Date.now() + store.sustainDurationMs + 1);
    store.checkExpiry();
    expect(store.phase).toBe('fade');

    vi.setSystemTime(Date.now() + store.fadeDurationMs + 1);
    store.checkExpiry();
    expect(store.phase).toBe('idle');
    expect(store.effectActive).toBe(false);
  });

  it('blocks overlapping medicine triggers while an effect is active', () => {
    const store = useMedicineStore();
    expect(store.takeMedicine('depaz')).toBe(true);
    expect(store.takeMedicine('dyslem')).toBe(false);
    expect(store.currentEffectType).toBe('depaz');
  });

  it('applies distinct audio tuning per medicine type', () => {
    const store = useMedicineStore();
    const base = new Date('2026-02-08T00:00:00.000Z').getTime();

    const sample = (type: 'depaz' | 'dyslem' | 'embian' | 'magic_smoke', offsetMs: number) => {
      vi.setSystemTime(base + offsetMs);
      expect(store.takeMedicine(type)).toBe(true);
      vi.setSystemTime(base + offsetMs + store.introDurationMs + 2000);
      store.checkExpiry();
      const result = {
        rate: store.audioRateMultiplier,
        reverb: store.reverbMix,
      };
      store.clearEffect();
      return result;
    };

    const depaz = sample('depaz', 0);
    const dyslem = sample('dyslem', 90_000);
    const embian = sample('embian', 180_000);
    const magicSmoke = sample('magic_smoke', 270_000);

    expect(depaz.reverb).toBeGreaterThan(dyslem.reverb);
    expect(embian.reverb).toBeGreaterThan(depaz.reverb);
    expect(magicSmoke.reverb).toBeGreaterThan(dyslem.reverb);

    expect(embian.rate).toBeLessThan(depaz.rate);
    expect(depaz.rate).toBeLessThan(dyslem.rate);
  });
});
