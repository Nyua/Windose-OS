<template>
  <div class="jine">
    <div ref="logRef" class="log">
      <div v-for="msg in messages" :key="msg.id" class="message" :class="{ me: msg.author === 'You' }">
        <div class="meta">{{ msg.author }} ? {{ formatTime(msg.timestamp) }}</div>
        <div class="body" :class="{ sticker: msg.kind === 'sticker' }">
          {{ msg.kind === 'sticker' ? `[Sticker] ${msg.body}` : msg.body }}
        </div>
      </div>
    </div>

    <div class="composer">
      <input
        v-model="draft"
        type="text"
        placeholder="Type a reply..."
        @keydown.enter.prevent="sendText"
      />
      <button @click="sendText">Send</button>
    </div>

    <div class="stickers">
      <div class="sticker-title">Stickers</div>
      <div class="sticker-grid">
        <button v-for="sticker in stickers" :key="sticker" @click="sendSticker(sticker)">
          {{ sticker }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import type { JineMessage } from '../jine';

const props = defineProps<{ messages: JineMessage[] }>();
const emit = defineEmits<{
  (e: 'send', body: string): void;
  (e: 'sticker', label: string): void;
  (e: 'markRead'): void;
}>();

const draft = ref('');
const logRef = ref<HTMLDivElement | null>(null);

const stickers = [
  'Praise',
  'Love',
  'Scold',
  'Hype',
  'Concern',
  'LOL',
  'Support',
  'Shock',
  'Thank',
];

function formatTime(ts: number) {
  const date = new Date(ts);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function scrollToBottom() {
  nextTick(() => {
    if (!logRef.value) return;
    logRef.value.scrollTop = logRef.value.scrollHeight;
  });
}

function sendText() {
  const value = draft.value.trim();
  if (!value) return;
  emit('send', value);
  draft.value = '';
  scrollToBottom();
}

function sendSticker(label: string) {
  emit('sticker', label);
  scrollToBottom();
}

onMounted(() => {
  emit('markRead');
  scrollToBottom();
});

watch(
  () => props.messages.length,
  () => {
    scrollToBottom();
  }
);
</script>

<style scoped>
.jine {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  font-family: var(--font-ui);
}
.log {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
  padding: 6px;
}
.message {
  margin-bottom: 8px;
}
.message.me .body {
  background: #f3e8ff;
}
.meta {
  font-size: 11px;
  color: #555;
  margin-bottom: 2px;
}
.body {
  background: #f7f7f7;
  border: 1px solid #ccc;
  padding: 4px 6px;
}
.body.sticker {
  font-weight: bold;
}
.composer {
  display: flex;
  gap: 6px;
}
.composer input {
  flex: 1;
  font-family: var(--font-ui);
  padding: 4px;
}
.composer button {
  font-family: var(--font-ui);
  padding: 4px 8px;
}
.stickers {
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
  background: #ffffff;
  padding: 6px;
}
.sticker-title {
  font-size: 11px;
  margin-bottom: 4px;
  color: #555;
}
.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.sticker-grid button {
  font-family: var(--font-ui);
  font-size: 11px;
  padding: 4px;
}
</style>
