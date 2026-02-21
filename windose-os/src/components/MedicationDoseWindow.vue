<template>
  <div class="med-dose-window">
    <div class="header">
      <img src="/icons/medication.png" class="icon" alt="" />
      <div class="title">{{ medication.name }}</div>
    </div>

    <div class="status" :class="{ active: effectActive }">
      <span v-if="effectActive">Effect: {{ effectLabel }} - {{ phaseLabel }} ({{ secondsRemaining }}s)</span>
      <span v-else>Effect: idle</span>
    </div>

    <div class="details">
      <div class="label">Effects</div>
      <div class="value">{{ medication.effects }}</div>

      <div class="label">Side Effects</div>
      <div class="value">{{ medication.sideEffects }}</div>

      <div class="label">Ame's Notes</div>
      <div class="value note">"{{ medication.note }}"</div>
    </div>

    <div class="actions">
      <button class="btn take" @click="take()" :disabled="taking">
        {{ taking ? 'Taking...' : `Take ${medication.shortName}` }}
      </button>
      <div v-if="taking" class="take-progress">
        <div class="fill" :style="{ width: `${Math.round(takeProgress * 100)}%` }"></div>
      </div>
      <div v-if="blockedMessage" class="blocked">{{ blockedMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useMedicineStore, type MedicineType } from '../stores/medicine';

interface MedicationDescriptor {
  shortName: string;
  name: string;
  effects: string;
  sideEffects: string;
  note: string;
}

const MEDICATION_DETAILS: Record<MedicineType, MedicationDescriptor> = {
  depaz: {
    shortName: 'Depaz',
    name: 'Depaz (1mg)',
    effects: 'Calms the user down.',
    sideEffects: 'Makes the user kinda floppy.',
    note: 'Everything just feels more manageable when I take some. Makes me feel kinda floaty if I take too many though.',
  },
  dyslem: {
    shortName: 'Dyslem',
    name: 'Dyslem Pills',
    effects: 'Stops coughs.',
    sideEffects: 'Makes you feel all sorts of things.',
    note: "A streamer's voice is their lifeline! But don't take too many or bad shit will happem.",
  },
  embian: {
    shortName: 'Embian',
    name: 'Embian',
    effects: 'Helps you conk out.',
    sideEffects: 'Your brain goes all funny.',
    note: 'Good for when I just want to forget everything and sleep. I go bonkers if I take too many.',
  },
  magic_smoke: {
    shortName: 'Magic Smoke',
    name: 'Magic Smoke',
    effects: 'Makes you feel super relaxed.',
    sideEffects: 'Fun :3',
    note: 'For when I want to bury everything that hurts me and makes me sad deep down.',
  },
};

const props = defineProps<{
  medicationType: MedicineType;
}>();

const store = useMedicineStore();
const medication = computed(() => MEDICATION_DETAILS[props.medicationType]);
const effectActive = computed(() => store.effectActive);
const secondsRemaining = computed(() => Math.ceil(store.timeRemainingMs / 1000));
const phaseLabel = computed(() => {
  if (store.phase === 'idle') return 'idle';
  if (store.phase === 'intro') return 'intro';
  if (store.phase === 'sustain') return 'sustain';
  return 'fade';
});
const effectLabel = computed(() => {
  const current = store.currentEffectType;
  if (!current) return 'idle';
  return MEDICATION_DETAILS[current].shortName;
});

const TAKE_SEQUENCE_MS = 1800;
const EFFECT_TRIGGER_LEAD_MS = 120;
const taking = ref(false);
const takeProgress = ref(0);
const blockedMessage = ref('');

let progressTimerId: number | null = null;
let effectTriggerTimerId: number | null = null;
let takeCompleteTimerId: number | null = null;
let blockedMessageTimerId: number | null = null;

function clearTakeTimers() {
  if (progressTimerId !== null) {
    window.clearInterval(progressTimerId);
    progressTimerId = null;
  }
  if (effectTriggerTimerId !== null) {
    window.clearTimeout(effectTriggerTimerId);
    effectTriggerTimerId = null;
  }
  if (takeCompleteTimerId !== null) {
    window.clearTimeout(takeCompleteTimerId);
    takeCompleteTimerId = null;
  }
}

function showBlocked(message: string) {
  blockedMessage.value = message;
  if (blockedMessageTimerId !== null) {
    window.clearTimeout(blockedMessageTimerId);
  }
  blockedMessageTimerId = window.setTimeout(() => {
    blockedMessage.value = '';
    blockedMessageTimerId = null;
  }, 2200);
}

function take() {
  if (taking.value) {
    showBlocked('A dose is already being consumed.');
    return;
  }
  if (store.effectActive) {
    showBlocked('Effect already active. Wait for fade out.');
    return;
  }

  taking.value = true;
  takeProgress.value = 0;
  const takeStartedAt = Date.now();
  const triggerDelay = Math.max(0, TAKE_SEQUENCE_MS - EFFECT_TRIGGER_LEAD_MS);

  progressTimerId = window.setInterval(() => {
    takeProgress.value = Math.min(1, (Date.now() - takeStartedAt) / TAKE_SEQUENCE_MS);
  }, 40);

  effectTriggerTimerId = window.setTimeout(() => {
    const started = store.takeMedicine(props.medicationType);
    if (!started) {
      showBlocked('Effect already active. Dose ignored.');
    }
  }, triggerDelay);

  takeCompleteTimerId = window.setTimeout(() => {
    taking.value = false;
    takeProgress.value = 0;
    clearTakeTimers();
  }, TAKE_SEQUENCE_MS);
}

onBeforeUnmount(() => {
  clearTakeTimers();
  if (blockedMessageTimerId !== null) {
    window.clearTimeout(blockedMessageTimerId);
    blockedMessageTimerId = null;
  }
});
</script>

<style scoped>
.med-dose-window {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  gap: 8px;
  background: #f0f0f0;
  font-family: var(--font-ui);
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #b0b0b0;
}

.icon {
  width: 24px;
  height: 24px;
  image-rendering: pixelated;
}

.title {
  font-size: 14px;
  font-weight: bold;
  color: #2a2a2a;
}

.status {
  font-size: 11px;
  padding: 4px 6px;
  border: 1px solid #aaa;
  background: #ececec;
}

.status.active {
  border-color: #864;
  background: #ffe5c6;
}

.details {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 6px 10px;
  font-size: 11px;
  padding: 8px;
  border: 1px solid #b7b7b7;
  background: #ffffff;
}

.label {
  font-weight: bold;
  color: #8b2f2f;
}

.value {
  color: #2f2f2f;
}

.note {
  color: #4f4030;
  white-space: pre-wrap;
}

.actions {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn {
  border: 1px solid #666;
  background: #e0e0e0;
  cursor: pointer;
  padding: 4px 8px;
  font-family: var(--font-ui);
  font-size: 11px;
}

.btn:hover:not(:disabled) {
  background: #fff;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.take {
  font-weight: bold;
}

.take-progress {
  width: 100%;
  height: 6px;
  border: 1px solid #999;
  background: #ececec;
}

.take-progress .fill {
  height: 100%;
  background: linear-gradient(90deg, #a259ff, #f06a9f);
}

.blocked {
  font-size: 11px;
  color: #8a1d1d;
}
</style>
