import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type MedicineType = 'depaz' | 'dyslem' | 'embian' | 'magic_smoke';
export type MedicineEffectPhase = 'intro' | 'sustain' | 'fade' | 'idle';

interface MedicineAudioTuning {
  rateDropMax: number;
  reverbMixMax: number;
  flutterHz: number;
  flutterDepth: number;
}

const INTRO_MS = 12000;
const SUSTAIN_MS = 36000;
const FADE_MS = 12000;
const TOTAL_EFFECT_MS = INTRO_MS + SUSTAIN_MS + FADE_MS;

const MEDICINE_AUDIO_TUNING: Record<MedicineType, MedicineAudioTuning> = {
  // "Manageable" and "floaty": softer slow-down and light drift in pitch.
  depaz: { rateDropMax: 0.18, reverbMixMax: 0.42, flutterHz: 0.4, flutterDepth: 0.02 },
  // "Voice lifeline" with unstable side effects: sharper modulation and noisy wobble.
  dyslem: { rateDropMax: 0.1, reverbMixMax: 0.28, flutterHz: 4.5, flutterDepth: 0.08 },
  // "Conk out" and "brain funny": deepest slowdown and heaviest reverb.
  embian: { rateDropMax: 0.3, reverbMixMax: 0.58, flutterHz: 0.22, flutterDepth: 0.015 },
  // "Super relaxed"/"bury pain": smooth dreamy drift with colorful tail.
  magic_smoke: { rateDropMax: 0.15, reverbMixMax: 0.5, flutterHz: 1.1, flutterDepth: 0.035 },
};

export const useMedicineStore = defineStore('medicine', () => {
  const effectActive = ref(false);
  const effectId = ref<MedicineType | null>(null);
  const phase = ref<MedicineEffectPhase>('idle');
  const startedAt = ref<number | null>(null);
  const endsAt = ref<number | null>(null);
  const consumptionHistory = ref<MedicineType[]>([]);
  const now = ref(Date.now());

  let tickerId: number | null = null;

  function resetEffectState() {
    effectActive.value = false;
    effectId.value = null;
    phase.value = 'idle';
    startedAt.value = null;
    endsAt.value = null;
  }

  function updatePhaseFromClock() {
    if (!effectActive.value || startedAt.value === null || endsAt.value === null) {
      phase.value = 'idle';
      return;
    }

    const elapsed = Math.max(0, now.value - startedAt.value);
    if (elapsed >= TOTAL_EFFECT_MS) {
      resetEffectState();
      return;
    }

    if (elapsed < INTRO_MS) {
      phase.value = 'intro';
      return;
    }
    if (elapsed < INTRO_MS + SUSTAIN_MS) {
      phase.value = 'sustain';
      return;
    }
    phase.value = 'fade';
  }

  function startTicker() {
    if (tickerId !== null || typeof window === 'undefined') return;
    tickerId = window.setInterval(() => {
      now.value = Date.now();
      updatePhaseFromClock();
    }, 120);
  }

  startTicker();

  function takeMedicine(type: MedicineType): boolean {
    if (effectActive.value) return false;

    const start = Date.now();
    effectActive.value = true;
    effectId.value = type;
    phase.value = 'intro';
    startedAt.value = start;
    endsAt.value = start + TOTAL_EFFECT_MS;
    consumptionHistory.value.push(type);
    now.value = start;
    updatePhaseFromClock();
    return true;
  }

  function clearEffect() {
    resetEffectState();
  }

  function checkExpiry() {
    now.value = Date.now();
    updatePhaseFromClock();
  }

  const elapsedMs = computed(() => {
    if (!effectActive.value || startedAt.value === null) return 0;
    return Math.min(TOTAL_EFFECT_MS, Math.max(0, now.value - startedAt.value));
  });

  const phaseElapsedMs = computed(() => {
    if (!effectActive.value) return 0;
    if (phase.value === 'intro') return elapsedMs.value;
    if (phase.value === 'sustain') return Math.max(0, elapsedMs.value - INTRO_MS);
    if (phase.value === 'fade') return Math.max(0, elapsedMs.value - INTRO_MS - SUSTAIN_MS);
    return 0;
  });

  const timeRemainingMs = computed(() => {
    if (!effectActive.value || endsAt.value === null) return 0;
    return Math.max(0, endsAt.value - now.value);
  });

  const effectStrength = computed(() => {
    if (!effectActive.value) return 0;
    if (phase.value === 'intro') return Math.min(1, phaseElapsedMs.value / INTRO_MS);
    if (phase.value === 'sustain') return 1;
    if (phase.value === 'fade') return Math.max(0, 1 - phaseElapsedMs.value / FADE_MS);
    return 0;
  });

  const isHigh = computed(() => effectActive.value);
  const currentEffectType = computed(() => effectId.value);
  const currentAudioTuning = computed<MedicineAudioTuning | null>(() => {
    if (!effectId.value) return null;
    return MEDICINE_AUDIO_TUNING[effectId.value];
  });

  // Global audio treatment used by App/JINE SFX while an effect is active.
  const audioRateMultiplier = computed(() => {
    if (!effectActive.value) return 1;
    const tuning = currentAudioTuning.value;
    if (!tuning) return 1;

    const strength = effectStrength.value;
    const baseRate = 1 - (tuning.rateDropMax * strength);
    const wobble = Math.sin((now.value / 1000) * Math.PI * 2 * tuning.flutterHz) * tuning.flutterDepth * strength;
    const next = baseRate + wobble;
    return Math.max(0.55, Math.min(1.08, next));
  });

  const reverbMix = computed(() => {
    if (!effectActive.value) return 0;
    const tuning = currentAudioTuning.value;
    if (!tuning) return 0;
    return tuning.reverbMixMax * effectStrength.value;
  });

  return {
    effectActive,
    effectId,
    phase,
    startedAt,
    endsAt,
    consumptionHistory,
    introDurationMs: INTRO_MS,
    sustainDurationMs: SUSTAIN_MS,
    fadeDurationMs: FADE_MS,
    totalDurationMs: TOTAL_EFFECT_MS,
    elapsedMs,
    phaseElapsedMs,
    timeRemainingMs,
    effectStrength,
    isHigh,
    currentEffectType,
    audioRateMultiplier,
    reverbMix,
    takeMedicine,
    clearEffect,
    checkExpiry,
  };
});
