<template>
  <div class="medicine-app">
    <div class="header">
      <img src="/icons/medication.png" class="icon" alt="Medication" />
      <div class="title">My Meds</div>
      <div class="status" :class="{ active: effectActive }">
        <span v-if="effectActive">Effect: {{ effectLabel }} - {{ phaseLabel }} ({{ secondsRemaining }}s)</span>
        <span v-else>Effect: idle</span>
      </div>
    </div>

    <div class="med-table-wrap">
      <div class="med-table head">
        <div>Name</div>
        <div>Effects</div>
        <div>Side Effects</div>
        <div>Ame's Notes</div>
        <div>Window</div>
      </div>

      <div v-for="med in medications" :key="med.id" class="med-table row">
        <div class="name">{{ med.name }}</div>
        <div>{{ med.effects }}</div>
        <div>{{ med.sideEffects }}</div>
        <div class="note">"{{ med.note }}"</div>
        <div class="action">
          <button class="btn open" @click="openMedicationWindow(med.id)">
            Open Window
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMedicineStore, type MedicineType } from '../stores/medicine';

const store = useMedicineStore();
const emit = defineEmits<{
  (e: 'openMedicationWindow', medicationType: MedicineType): void;
}>();
const effectActive = computed(() => store.effectActive);
const secondsRemaining = computed(() => Math.ceil(store.timeRemainingMs / 1000));
const phaseLabel = computed(() => {
  if (store.phase === 'idle') return 'idle';
  if (store.phase === 'intro') return 'intro';
  if (store.phase === 'sustain') return 'sustain';
  return 'fade';
});

interface MedItem {
  id: MedicineType;
  name: string;
  effects: string;
  sideEffects: string;
  note: string;
}

const medications: MedItem[] = [
  {
    id: 'depaz',
    name: 'Depaz (1mg)',
    effects: 'Calms the user down.',
    sideEffects: 'Makes the user kinda floppy.',
    note: 'Everything just feels more manageable when I take some. Makes me feel kinda floaty if I take too many though.',
  },
  {
    id: 'dyslem',
    name: 'Dyslem Pills',
    effects: 'Stops coughs.',
    sideEffects: 'Makes you feel all sorts of things.',
    note: "A streamer's voice is their lifeline! But don't take too many or bad shit will happem.",
  },
  {
    id: 'embian',
    name: 'Embian',
    effects: 'Helps you conk out.',
    sideEffects: 'Your brain goes all funny.',
    note: 'Good for when I just want to forget everything and sleep. I go bonkers if I take too many.',
  },
  {
    id: 'magic_smoke',
    name: 'Magic Smoke',
    effects: 'Makes you feel super relaxed.',
    sideEffects: 'Fun :3',
    note: 'For when I want to bury everything that hurts me and makes me sad deep down.',
  },
];

const effectLabel = computed(() => {
  if (!store.currentEffectType) return 'idle';
  const active = medications.find((med) => med.id === store.currentEffectType);
  return active?.name ?? 'idle';
});

function openMedicationWindow(medicationType: MedicineType) {
  emit('openMedicationWindow', medicationType);
}
</script>

<style scoped>
.medicine-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f0f0;
  font-family: var(--font-ui);
  padding: 8px;
  gap: 10px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 2px solid #ccc;
}

.icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}

.title {
  margin-right: auto;
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.status {
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #aaa;
  background: #ececec;
}

.status.active {
  border-color: #864;
  background: #ffe5c6;
}

.med-table-wrap {
  flex: 1;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 4px;
  overflow-y: auto;
}

.med-table {
  display: grid;
  grid-template-columns: 1.1fr 1.1fr 1.1fr 1.6fr 0.9fr;
  gap: 8px;
  align-items: start;
  font-size: 11px;
}

.med-table > div {
  min-width: 0;
}

.med-table.head {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #d9d9d9;
  border: 1px solid #a2a2a2;
  padding: 6px;
  font-weight: bold;
}

.med-table.row {
  background: #fff;
  border: 1px solid #999;
  padding: 6px;
}

.name {
  font-weight: bold;
  color: #b93434;
}

.note {
  color: #4f4030;
  white-space: pre-wrap;
}

.action {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn {
  border: 1px solid #666;
  background: #e0e0e0;
  cursor: pointer;
  padding: 2px 8px;
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
.btn.open {
  font-weight: bold;
}

@media (max-width: 980px) {
  .med-table {
    grid-template-columns: 1fr 1fr;
  }

  .med-table.head {
    display: none;
  }
}
</style>
