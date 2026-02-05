<template>
  <div class="jine">
    <div class="chat-stack">
      <div ref="logRef" class="log">
        <div class="day-pill">Noon</div>
        <div v-for="msg in messages" :key="msg.id" class="message" :class="{ me: msg.author === 'You', sticker: msg.kind === 'sticker' }">
          <div class="avatar" aria-hidden="true"></div>
          <template v-if="msg.kind === 'sticker'">
            <div class="sticker-only">
              <img v-if="stickerMap[msg.body]" class="sticker-img" :src="stickerMap[msg.body]" :alt="msg.body" />
              <div v-else class="text">{{ msg.body }}</div>
            </div>
          </template>
          <div v-else class="bubble">
            <div class="text">{{ msg.body }}</div>
          </div>
        </div>
      </div>

      <div class="stickers" :class="{ open: stickerOpen }" :aria-hidden="!stickerOpen">
        <div class="sticker-grid">
          <button
            v-for="sticker in stickers"
            :key="sticker.label"
            class="sticker-btn"
            :title="sticker.label"
            :aria-label="sticker.label"
            @click="sendSticker(sticker.label)"
          >
            <img :src="sticker.src" :alt="sticker.label" />
          </button>
        </div>
      </div>
    </div>

    <button class="sticker-toggle" type="button" @click="toggleStickers" :aria-expanded="stickerOpen">
      <span class="sticker-arrow" :class="{ open: stickerOpen }" aria-hidden="true"></span>
    </button>

    <div class="composer">
      <textarea
        ref="inputRef"
        v-model="draft"
        class="input"
        placeholder="Type a reply..."
        @keydown="onKeydown"
        @input="resizeInput"
      ></textarea>
      <div class="composer-rail">
        <button class="send" @click="sendText" aria-label="Send">
          &gt;
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
const inputRef = ref<HTMLTextAreaElement | null>(null);
const stickerOpen = ref(false);

function toggleStickers() {
  stickerOpen.value = !stickerOpen.value;
}

function resizeInput() {
  if (!inputRef.value) return;
  const style = window.getComputedStyle(inputRef.value);
  const minHeight = Number.parseFloat(style.minHeight) || 18;
  inputRef.value.style.height = `${minHeight}px`;
  inputRef.value.style.height = `${inputRef.value.scrollHeight}px`;
}


const stickers = [
  { label: 'OK', src: '/stickers/sticker_ok.png' },
  { label: 'OMG', src: '/stickers/sticker_omg.png' },
  { label: 'SAD', src: '/stickers/sticker_panic.png' },
  { label: 'IDC', src: '/stickers/sticker_idc.png' },
  { label: 'SORRY', src: '/stickers/sticker_deflate.png' },
  { label: 'LOVE', src: '/stickers/sticker_love.png' },
  { label: 'THIS', src: '/stickers/sticker_this.png' },
  { label: 'HI', src: '/stickers/sticker_amechan.png' },
  { label: 'ZZZ', src: '/stickers/sticker_zzz.png' },
];

const stickerMap: Record<string, string> = stickers.reduce((acc, item) => {
  acc[item.label] = item.src;
  return acc;
}, {} as Record<string, string>);

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
  resizeInput();
  scrollToBottom();
}

function sendSticker(label: string) {
  emit('sticker', label);
  scrollToBottom();
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendText();
  }
}

onMounted(() => {
  emit('markRead');
  scrollToBottom();
  resizeInput();
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
  --jine-font-scale: 2;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  font-family: var(--font-chat);
  background: url('/jine/JINE_background.png') repeat;
  padding: 6px;
}
.chat-stack {
  position: relative;
  flex: 1;
  min-height: 0;
}
.log {
  position: relative;
  height: 100%;
  overflow-y: auto;
  padding: 12px 10px 8px;
  background: rgba(255, 255, 255, 0.25);
  border: none;
  box-shadow: none;
  display: flex;
  flex-direction: column;
}
.log {
  scrollbar-width: thin;
  scrollbar-color: #f2a3d4 #7ea3ff;
}
.log::-webkit-scrollbar {
  width: calc(14px * var(--ui-scale, 1));
}
.log::-webkit-scrollbar-track {
  background: #7ea3ff;
}
.log::-webkit-scrollbar-thumb {
  background: #f2a3d4;
  border: calc(2px * var(--ui-scale, 1)) solid #7ea3ff;
}
.log::-webkit-scrollbar-button {
  width: 0;
  height: 0;
  display: none;
}
.day-pill {
  width: 120px;
  margin: 0 auto 12px;
  text-align: center;
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  color: #4a66b5;
  background: #dce7ff;
  border: none;
  box-shadow: none;
  border-radius: 999px;
  padding: 2px 0;
}
.message {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: flex-start;
  width: 100%;
}
.message.me {
  justify-content: flex-end;
  text-align: right;
}
.message.me .avatar {
  display: none;
}
.message.sticker {
  width: 100%;
  justify-content: flex-start;
}
.message.sticker.me {
  justify-content: flex-end;
}
.message.sticker .avatar {
  display: none;
}
.sticker-only {
  display: flex;
  justify-content: flex-start;
  width: auto;
}
.message.sticker.me .sticker-only {
  justify-content: flex-end;
}
.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffe3f5, #c77cdf);
  border: none;
  box-shadow: none;
  flex-shrink: 0;
}
.bubble {
  max-width: 35ch;
  width: fit-content;
  background: #cfe8ff;
  color: #2f3d6e;
  padding: calc(6px * var(--ui-scale, 1)) calc(12px * var(--ui-scale, 1));
  border-radius: 10px;
  border: none;
  box-shadow: none;
  display: inline-flex;
  align-items: center;
}
.message.me .bubble {
  background: #6fdc5b;
  color: #1f3a1b;
  border: none;
  box-shadow: none;
}
.text {
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: 1.2;
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.read-receipt {
  margin-top: 2px;
  font-size: calc(10px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  color: #ffffff;
  opacity: 0.85;
}
.message.me .read-receipt {
  align-self: flex-end;
}
.sticker-img {
  width: 190px;
  height: 110px;
  object-fit: contain;
  image-rendering: pixelated;
}
.composer {
  display: grid;
  grid-template-columns: 1fr calc(28px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  border: none;
  box-shadow: none;
  background: transparent;
  height: auto;
  min-height: 22px;
}
.input {
  border: 2px solid #8a5ec6;
  resize: none;
  padding: calc(2px * var(--ui-scale, 1)) calc(4px * var(--ui-scale, 1)) 0 calc(4px * var(--ui-scale, 1));
  font-family: var(--font-chat);
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  color: #2b2b2b;
  background: #ffffff;
  outline: none;
  height: calc(18px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  min-height: calc(18px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  overflow: hidden;
}
.composer-rail {
  background: #f0d0f2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.send {
  width: calc(18px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  height: calc(18px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  border: 2px solid #8a5ec6;
  background: #d0b2f0;
  color: #4f2c7a;
  font-family: var(--font-ui);
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  cursor: pointer;
}
.sticker-toggle {
  height: 16px;
  border: none;
  box-shadow: none;
  background: #d7a6ef;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.sticker-arrow {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid #5b3b7d;
  transition: transform 180ms ease-out;
}
.sticker-arrow.open {
  transform: rotate(180deg);
}
.stickers {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  border: none;
  box-shadow: none;
  background: rgba(200, 141, 226, 0.75);
  padding: 6px;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: max-height 200ms ease-out, opacity 200ms ease-out;
}
.stickers.open {
  max-height: 190px;
  opacity: 1;
  pointer-events: auto;
  overflow-y: auto;
}
.sticker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}
.sticker-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}
.sticker-btn img {
  width: 100%;
  height: 102px;
  object-fit: contain;
  image-rendering: pixelated;
}

.stickers.open::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.stickers.open {
  scrollbar-width: none;
}
</style>
