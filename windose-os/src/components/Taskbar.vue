<template>
  <div class="taskbar" :style="{ height: `${taskbarHeight}px` }">
    <button
      class="start"
      :class="{ pressed: startOpen }"
      @click.stop="$emit('toggleStart')"
      aria-label="Start"
    >
      Start
    </button>
    <div class="quick">
      <button class="quick-btn" @click="openApp('tweeter')">Tweeter</button>
      <button class="quick-btn" :class="{ notify: jineUnreadCount > 0 }" @click="openApp('jine')">JINE</button>
      <button class="quick-btn" @click="openApp('task')">Task</button>
    </div>
    <div class="tabs">
      <button
        v-for="win in windows"
        :key="win.id"
        class="tab"
        :class="{ focused: win.isFocused, notify: win.appType === 'jine' && jineUnreadCount > 0 }"
        @click="$emit('tabClick', win.id)"
      >
        {{ win.title }}
      </button>
    </div>
    <div class="tray">
      <div class="volume">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          @input="$emit('volumeChange', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <div class="day">DAY {{ dayOfYear }}</div>
      <div class="slot-icon" :class="timeSlot.toLowerCase()" aria-hidden="true"></div>
      <div class="slot">{{ timeSlot }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimeSlot, WindowState, WindowAppType } from '../types';

defineProps<{ windows: WindowState[]; dayOfYear: number; timeSlot: TimeSlot; taskbarHeight: number; startOpen: boolean; volume: number; jineUnreadCount: number }>();

const emit = defineEmits<{
  (e: 'toggleStart'): void;
  (e: 'tabClick', id: string): void;
  (e: 'open', app: WindowAppType): void;
  (e: 'volumeChange', vol: number): void;
}>();

function openApp(app: WindowAppType) {
  emit('open', app);
}
</script>

<style scoped>
.taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #c0c0c0;
  border-top: 2px solid #fff;
  padding: 0 6px;
  gap: 8px;
}
.start {
  width: 136px;
  height: 32px;
  background: url('/start-menu/start_button.png') no-repeat;
  background-size: 100% 100%;
  border: none;
  padding: 0;
  text-indent: -9999px;
  overflow: hidden;
  cursor: pointer;
}
.start.pressed {
  background-image: url('/start-menu/start_pressed.png');
}
.quick {
  display: flex;
  gap: 4px;
}
.quick-btn {
  font-family: var(--font-ui);
  padding: 2px 6px;
}
.tabs {
  flex: 1;
  display: flex;
  gap: 4px;
  overflow-x: auto;
}
.tab {
  font-family: var(--font-ui);
  padding: 2px 8px;
  background: #e0e0e0;
}
.tab.focused {
  background: #fff;
}
.tab.notify, .quick-btn.notify {
  animation: jineFlash 0.9s steps(2, end) infinite, jineBounce 0.9s ease-in-out infinite;
}
@keyframes jineFlash {
  0% { background: #f6c1ff; }
  50% { background: #ffffff; }
  100% { background: #f6c1ff; }
}
@keyframes jineBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.tray {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-ui);
}
.slot-icon {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: #f6d365;
  position: relative;
}
.slot-icon.dusk { background: #f0b46f; }
.slot-icon.night {
  background: #dcdcec;
}
.slot-icon.night::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #7a80b5;
  top: 1px;
  left: 4px;
}
.volume input { width: 80px; }
</style>
