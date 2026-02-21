<template>
  <div class="webcam" @pointerleave="onHeadHoverEnd">
    <img class="background" :style="backgroundStyle" :src="background" alt="" aria-hidden="true" />
    <img class="sprite" :style="spriteStyle" :src="displaySprite" alt="Ame-chan webcam" />
    <button
      type="button"
      class="pet-hitbox"
      aria-label="Pet Ame"
      :style="petHitboxStyle"
      @pointerenter="onHeadHoverStart"
      @pointerleave="onHeadHoverEnd"
      @click="triggerPet"
    ></button>
    <div v-if="showPetPrompt" class="pet-prompt" :style="petPromptStyle">Pet</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useMedicineStore, type MedicineType } from '../stores/medicine';

const props = defineProps<{
  seed: number;
  madPhase?: 'idle' | 'hover' | 'release';
  windowWidth?: number;
  windowHeight?: number;
}>();

const BASE_WINDOW_WIDTH = 540;
const BASE_WINDOW_HEIGHT = 380;
const ZOOM_STEP_TRIGGER = 0.05;
const MAX_ZOOM_STEPS = 18;
const HEIGHT_OVERSIZE_WEIGHT = 2.4;
const SPRITE_STEP_AMOUNT = 0.045;
const BACKGROUND_STEP_AMOUNT = 0.036;
const MAX_BG_SPRITE_SCALE_DELTA = 0.08;
const SPRITE_MAX_SCALE = 1.64;
const TOP_SAFE_SHIFT_START_SCALE = 1.28;
const TOP_SAFE_SHIFT_FACTOR = 0.2;
const PET_EVENT_DURATION_MS = 1150;
const PET_EVENT_SPRITE = '/webcam/webcam-headpat/webcam-headpat.gif';
const FALLBACK_SPRITE = '/webcam/webcam_AmeSleepy.webp';
const ALL_MEDICATIONS: MedicineType[] = ['depaz', 'dyslem', 'embian', 'magic_smoke'];
const ALL_MEDICATIONS_TRIED_SPRITE = '/webcam/webcam-drugs/webcam_amechantripping.webp';
const MEDICATION_ANIM_DURATION_MS: Record<MedicineType, number> = {
  depaz: 5200,
  dyslem: 5400,
  embian: 6200,
  magic_smoke: 3080,
};
const MEDICATION_LAST_FRAME_OUTRO_MS: Record<MedicineType, number> = {
  depaz: 200,
  dyslem: 200,
  embian: 200,
  magic_smoke: 110,
};
const MEDICATION_ANIM_SPRITE: Record<MedicineType, string> = {
  depaz: '/webcam/webcam-drugs/webcam-depaz.gif',
  dyslem: '/webcam/webcam-drugs/webcam-dyslem.gif',
  embian: '/webcam/webcam-drugs/webcam-embian.gif',
  magic_smoke: '/webcam/webcam-drugs/webcam-magicsmoke.webp',
};
const MEDICATION_SECOND_LAST_SPRITE: Record<MedicineType, string> = {
  depaz: '/webcam/webcam-drugs/webcam-depaz-second-last.png',
  dyslem: '/webcam/webcam-drugs/webcam-dyslem-second-last.png',
  embian: '/webcam/webcam-drugs/webcam-embian-second-last.png',
  magic_smoke: '/webcam/webcam-drugs/webcam-magicsmoke-second-last.png',
};
const MEDICATION_LAST_SPRITE: Record<MedicineType, string> = {
  depaz: '/webcam/webcam-drugs/webcam-depaz-final.png',
  dyslem: '/webcam/webcam-drugs/webcam-dyslem-final.png',
  embian: '/webcam/webcam-drugs/webcam-embian-final.png',
  magic_smoke: '/webcam/webcam-drugs/webcam-magicsmoke-final.png',
};

const background = '/webcam-background/webcam-background.webp';
const madHoldSprite = '/webcam/webcam_mad_hold.png';
const madReleaseSprite = '/webcam/webcam_mad_release.png';

const sprites = [
  '/webcam/webcam_Ame-chan-crying.webp',
  '/webcam/webcam_Amechancrazysmoke.webp',
  '/webcam/webcam_Amechanfidgetspinner.webp',
  '/webcam/webcam_Amechanreading.webp',
  '/webcam/webcam_Amechansmokingisbadforyourlungs.webp',
  '/webcam/webcam_amechantripping.webp',
  '/webcam/webcam_Amechanvomiting.webp',
  '/webcam/webcam_Amechanwatchingtv.webp',
  '/webcam/webcam_Amechanyanderu.webp',
  '/webcam/webcam_AmeHeadphones.webp',
  '/webcam/webcam_AmeNailPolish.webp',
  '/webcam/webcam_AmeSleepy.webp',
  '/webcam/webcam_AmeTakingSelfie.webp',
  '/webcam/webcam_AmeTextsleepy.webp',
  '/webcam/webcam_AmeVoiceTraining.webp',
  '/webcam/webcam_Celestialudenbergisthatyou.webp',
  '/webcam/webcam_Crazyame.webp',
  '/webcam/webcam_Longhairamechan.webp',
  '/webcam/webcam_Ponytailamechan.webp',
  '/webcam/webcam_Sidehairamechan.webp',
  '/webcam/webcam_Texthappi.webp',
];

const currentSprite = ref<string>(sprites[0] ?? FALLBACK_SPRITE);
const isHeadHovered = ref(false);
const petActive = ref(false);
const spriteBeforePet = ref<string | null>(null);
let petTimer: number | null = null;
const medicineStore = useMedicineStore();
type MedicationSpritePhase = 'idle' | 'anim' | 'hold_second_last' | 'outro_last';
const medicationSpritePhase = ref<MedicationSpritePhase>('idle');
const medicationEffectForSprite = ref<MedicineType | null>(null);
const spriteBeforeMedication = ref<string | null>(null);
const sessionTriedMedications = ref<Set<MedicineType>>(new Set());
const allMedicationsTriedSessionLatch = ref(false);
let medicationPhaseTimer: number | null = null;
let medicationInstanceKey = '';

const emit = defineEmits<{
  (e: 'pet'): void;
}>();

const baseDisplaySprite = computed(() => {
  if (props.madPhase === 'hover') return madHoldSprite;
  if (props.madPhase === 'release') return madReleaseSprite;
  return currentSprite.value;
});

const displaySprite = computed(() => {
  if (allMedicationsTriedSessionLatch.value) return ALL_MEDICATIONS_TRIED_SPRITE;
  if (petActive.value) return PET_EVENT_SPRITE;
  const effectForSprite = medicineStore.currentEffectType ?? medicationEffectForSprite.value;
  if (effectForSprite && medicationSpritePhase.value !== 'idle') {
    if (medicationSpritePhase.value === 'anim') {
      return MEDICATION_ANIM_SPRITE[effectForSprite];
    }
    if (medicationSpritePhase.value === 'hold_second_last') {
      return MEDICATION_SECOND_LAST_SPRITE[effectForSprite];
    }
    if (medicationSpritePhase.value === 'outro_last') {
      return MEDICATION_LAST_SPRITE[effectForSprite];
    }
  }
  return baseDisplaySprite.value;
});

const showPetPrompt = computed(() => isHeadHovered.value && !petActive.value);

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const zoomSteps = computed(() => {
  const width = Math.max(props.windowWidth ?? BASE_WINDOW_WIDTH, 1);
  const height = Math.max(props.windowHeight ?? BASE_WINDOW_HEIGHT, 1);
  const widthOversize = Math.max(0, width / BASE_WINDOW_WIDTH - 1);
  const heightOversize = Math.max(0, height / BASE_WINDOW_HEIGHT - 1) * HEIGHT_OVERSIZE_WEIGHT;
  const effectiveOversize = Math.max(widthOversize, heightOversize);
  if (effectiveOversize <= 0) return 0;
  return Math.min(MAX_ZOOM_STEPS, Math.floor(effectiveOversize / ZOOM_STEP_TRIGGER));
});

const spriteScale = computed(() => {
  const rawScale = 1 + zoomSteps.value * SPRITE_STEP_AMOUNT;
  return Math.min(rawScale, SPRITE_MAX_SCALE);
});

const backgroundScale = computed(() => {
  const rawScale = 1 + zoomSteps.value * BACKGROUND_STEP_AMOUNT;
  return clamp(
    rawScale,
    Math.max(1, spriteScale.value - MAX_BG_SPRITE_SCALE_DELTA),
    spriteScale.value + MAX_BG_SPRITE_SCALE_DELTA,
  );
});

const spriteTranslateYPx = computed(() => {
  const windowHeight = Math.max(props.windowHeight ?? BASE_WINDOW_HEIGHT, BASE_WINDOW_HEIGHT);
  const overflowScale = Math.max(0, spriteScale.value - TOP_SAFE_SHIFT_START_SCALE);
  return Math.round(overflowScale * windowHeight * TOP_SAFE_SHIFT_FACTOR);
});

const petHitboxShiftPx = computed(() => Math.round(spriteTranslateYPx.value * 0.45));

const petHitboxStyle = computed(() => ({
  transform: `translateY(${petHitboxShiftPx.value}px)`,
}));

const petPromptStyle = computed(() => ({
  transform: `translate(-50%, calc(-100% + ${petHitboxShiftPx.value}px))`,
}));

const backgroundStyle = computed(() => ({
  transform: `scale(${backgroundScale.value})`,
}));

const spriteStyle = computed(() => ({
  transform: `translateY(${spriteTranslateYPx.value}px) scale(${spriteScale.value})`,
}));

function pickSprite() {
  const idx = Math.floor(Math.random() * sprites.length);
  currentSprite.value = sprites[idx] ?? currentSprite.value;
}

function clearPetTimer() {
  if (petTimer === null) return;
  window.clearTimeout(petTimer);
  petTimer = null;
}

function clearMedicationPhaseTimer() {
  if (medicationPhaseTimer === null) return;
  window.clearTimeout(medicationPhaseTimer);
  medicationPhaseTimer = null;
}

function onHeadHoverStart() {
  isHeadHovered.value = true;
}

function onHeadHoverEnd() {
  isHeadHovered.value = false;
}

function endPetEvent() {
  petActive.value = false;
  if (spriteBeforePet.value) {
    currentSprite.value = spriteBeforePet.value;
  }
  spriteBeforePet.value = null;
}

function triggerPet() {
  emit('pet');
  spriteBeforePet.value = currentSprite.value;
  petActive.value = true;
  clearPetTimer();
  petTimer = window.setTimeout(() => {
    endPetEvent();
    petTimer = null;
  }, PET_EVENT_DURATION_MS);
}

watch(
  () => props.seed,
  () => pickSprite(),
  { immediate: true }
);

onBeforeUnmount(() => {
  clearPetTimer();
  clearMedicationPhaseTimer();
});

watch(
  () => [medicineStore.effectActive, medicineStore.currentEffectType, medicineStore.startedAt] as const,
  ([active, effectType, startedAt], previous) => {
    const [prevActive, prevEffectType, prevStartedAt] = previous ?? [false, null, null];
    const isNewConsumption =
      active
      && !!effectType
      && startedAt !== null
      && (!prevActive || prevEffectType !== effectType || prevStartedAt !== startedAt);

    if (isNewConsumption && effectType) {
      const nextTried = new Set(sessionTriedMedications.value);
      nextTried.add(effectType);
      sessionTriedMedications.value = nextTried;
      if (ALL_MEDICATIONS.every((med) => nextTried.has(med))) {
        allMedicationsTriedSessionLatch.value = true;
      }

      spriteBeforeMedication.value = baseDisplaySprite.value;
      medicationEffectForSprite.value = effectType;
      medicationSpritePhase.value = 'anim';

      clearMedicationPhaseTimer();
      const nextKey = `${effectType}:${startedAt}`;
      medicationInstanceKey = nextKey;
      medicationPhaseTimer = window.setTimeout(() => {
        if (medicationInstanceKey !== nextKey) return;
        medicationSpritePhase.value = 'hold_second_last';
        medicationPhaseTimer = null;
      }, MEDICATION_ANIM_DURATION_MS[effectType]);
      return;
    }

    if (active && effectType && startedAt !== null) {
      medicationEffectForSprite.value = effectType;
      return;
    }

    clearMedicationPhaseTimer();
    medicationInstanceKey = '';

    if (prevActive && prevEffectType && !allMedicationsTriedSessionLatch.value) {
      medicationEffectForSprite.value = prevEffectType;
      medicationSpritePhase.value = 'outro_last';
      const outroMs = MEDICATION_LAST_FRAME_OUTRO_MS[prevEffectType];
      medicationPhaseTimer = window.setTimeout(() => {
        medicationSpritePhase.value = 'idle';
        medicationEffectForSprite.value = null;
        if (spriteBeforeMedication.value) {
          currentSprite.value = spriteBeforeMedication.value;
        }
        spriteBeforeMedication.value = null;
        medicationPhaseTimer = null;
      }, outroMs);
      return;
    }

    medicationSpritePhase.value = 'idle';
    medicationEffectForSprite.value = null;
    spriteBeforeMedication.value = null;
  },
  { immediate: true },
);
</script>

<style scoped>
.webcam {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}
.background {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center bottom;
  transform-origin: center bottom;
  image-rendering: pixelated;
  pointer-events: none;
  transition: transform 90ms steps(1, end);
}
.sprite {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center bottom;
  transform-origin: center bottom;
  image-rendering: pixelated;
  pointer-events: none;
  transition: transform 90ms steps(1, end);
}

.pet-hitbox {
  position: absolute;
  z-index: 3;
  left: 34%;
  top: 8%;
  width: 32%;
  height: 34%;
  border: 0;
  margin: 0;
  padding: 0;
  background: transparent;
  appearance: none;
  cursor: pointer;
}

.pet-hitbox:focus-visible {
  outline: 1px solid rgba(98, 52, 205, 0.85);
  outline-offset: 1px;
}

.pet-prompt {
  position: absolute;
  z-index: 4;
  left: 50%;
  top: 8%;
  padding: 2px 6px;
  border: 1px solid rgba(98, 52, 205, 0.75);
  background: rgba(239, 207, 239, 0.92);
  color: #6234cd;
  font-family: var(--font-sys);
  font-size: 11px;
  line-height: 1;
  text-transform: uppercase;
  pointer-events: none;
}
</style>
