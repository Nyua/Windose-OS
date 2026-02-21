<template>
  <div class="taskbar" :class="{ 'body-hidden': !taskbarBodyVisible }" :style="{ height: `${taskbarHeight}px`, '--taskbar-alpha': taskbarOpacity, '--quick-gap': `${quickMenuGap}px`, '--quick-offset': `${quickMenuOffsetX}px`, '--tab-offset': `${tabOffsetX}px`, '--tab-gap': `${tabGapPx}px`, '--tab-width': `${tabWidth}px` }">
    <button
      class="start"
      :class="{ pressed: startOpen }"
      @click.stop="$emit('toggleStart')"
      aria-label="Start"
    >
      <span class="start-label" aria-hidden="true">START</span>
    </button>
    <div class="quick">
      <button class="quick-btn tweeter" @click="openApp('tweeter')" aria-label="Tweeter">Tweeter</button>
      <button class="quick-btn jine" :class="{ notify: jineUnreadCount > 0 }" @click="openApp('jine')" aria-label="JINE">JINE</button>
      <button class="quick-btn task" @click="openApp('task')" aria-label="Task Manager">Task</button>
    </div>
    <div class="tabs" ref="tabsRef">
      <button
        v-for="win in windows"
        :key="win.id"
        :data-window-id="win.id"
        class="tab"
        :class="{ focused: win.isFocused, active: !win.isMinimized, notify: win.appType === 'jine' && jineUnreadCount > 0 }"
        @click="$emit('tabClick', win.id)"
      >
        {{ win.title }}
      </button>
    </div>
    <div class="tray">
      <div class="volume bevel">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          :value="volume"
          @input="$emit('volumeChange', Number(($event.target as HTMLInputElement).value))"
        />
      </div>
      <div class="day bevel">DAY {{ dayOfYear }}</div>
      <div class="slot-icon" :class="timeSlot.toLowerCase()" aria-hidden="true"></div>
      <div class="slot bevel">{{ timeSlot }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { TimeSlot, WindowState, WindowAppType } from '../types';

const props = defineProps<{ windows: WindowState[]; dayOfYear: number; timeSlot: TimeSlot; taskbarHeight: number; taskbarOpacity: number; taskbarBodyVisible: boolean; quickMenuGap: number; quickMenuOffsetX: number; tabOffsetX: number; startOpen: boolean; volume: number; jineUnreadCount: number }>();

const emit = defineEmits<{
  (e: 'toggleStart'): void;
  (e: 'tabClick', id: string): void;
  (e: 'open', app: WindowAppType): void;
  (e: 'volumeChange', vol: number): void;
}>();

function openApp(app: WindowAppType) {
  emit('open', app);
}

const tabsRef = ref<HTMLDivElement | null>(null);
const tabsWidth = ref(0);
const tabGapPx = 4;
const tabMaxWidth = 220;

const tabWidth = computed(() => {
  const count = props.windows.length;
  if (count <= 0) return tabMaxWidth;
  const available = Math.max(0, tabsWidth.value);
  if (available <= 0) return tabMaxWidth;
  const gaps = tabGapPx * (count - 1);
  const per = Math.floor((available - gaps) / count);
  if (!Number.isFinite(per)) return tabMaxWidth;
  return Math.max(0, Math.min(tabMaxWidth, per));
});

let tabsObserver: ResizeObserver | null = null;
let resizeFallback: (() => void) | null = null;

onMounted(() => {
  if (!tabsRef.value) return;
  tabsWidth.value = tabsRef.value.clientWidth;
  if (typeof ResizeObserver !== 'undefined') {
    tabsObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === tabsRef.value) {
          tabsWidth.value = entry.contentRect.width;
        }
      }
    });
    tabsObserver.observe(tabsRef.value);
    return;
  }
  resizeFallback = () => {
    if (!tabsRef.value) return;
    tabsWidth.value = tabsRef.value.clientWidth;
  };
  window.addEventListener('resize', resizeFallback);
});

onBeforeUnmount(() => {
  if (tabsObserver) {
    tabsObserver.disconnect();
    tabsObserver = null;
  }
  if (resizeFallback) {
    window.removeEventListener('resize', resizeFallback);
    resizeFallback = null;
  }
});
</script>

<style scoped>
.taskbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: rgba(211, 193, 222, var(--taskbar-alpha, 1));
  border-top: 2px solid rgba(255, 255, 255, var(--taskbar-alpha, 1));
  padding: 0 6px;
  gap: 8px;
}
.taskbar.body-hidden {
  background: transparent;
  border-top-color: transparent;
}
.start {
  position: relative;
  width: 136px;
  height: 32px;
  background: url('/start-menu/start_button.png') no-repeat;
  background-size: 100% 100%;
  border: none;
  padding: 0;
  cursor: pointer;
}
.start.pressed {
  background-image: url('/start-menu/start_pressed.png');
}
.start-label {
  position: absolute;
  left: 72px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-ui);
  font-size: 13px;
  letter-spacing: 0.8px;
  color: #22133a;
  text-shadow: 1px 1px 0 #f4e9ff;
  pointer-events: none;
}
.start.pressed .start-label {
  transform: translateY(calc(-50% + 1px));
}
.quick {
  display: flex;
  gap: var(--quick-gap, 8px);
  margin-left: var(--quick-offset, 0px);
}
.bevel {
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
  box-sizing: border-box;
  background: rgba(211, 193, 222, var(--taskbar-alpha, 1));
}
.quick-btn {
  width: 24px;
  height: 24px;
  background: transparent no-repeat center / contain;
  border: none;
  outline: none;
  padding: 0;
  text-indent: -9999px;
  overflow: hidden;
  font-family: var(--font-ui);
}
.quick-btn.tweeter {
  background-image: url('/quickmenu/button_tweeter.png');
}
.quick-btn.jine {
  background-image: url('/quickmenu/button_jine.png');
}
.quick-btn.task {
  background-image: url('/quickmenu/button_task-manager.png');
}
.quick-btn:active {
  filter: brightness(0.7);
}
.tabs {
  flex: 1;
  display: flex;
  gap: var(--tab-gap, 4px);
  overflow-x: hidden;
  align-items: center;
  margin-left: var(--tab-offset, 0px);
  position: relative;
}
.tab {
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1;
  padding: 2px 10px 2px 8px;
  width: var(--tab-width, 220px);
  max-width: var(--tab-width, 220px);
  min-width: 0;
  height: 28px;
  display: inline-flex;
  flex: 0 0 var(--tab-width, 220px);
  align-items: center;
  gap: 5px;
  color: #2f1a67;
  background: rgba(236, 223, 245, var(--taskbar-alpha, 1));
  border: 1px solid #8b75b1;
  box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #c7afd9;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 0;
}
.tab.active {
  border-color: #7a61a6;
  box-shadow: inset 1px 1px 0 #cdb7de, inset -1px -1px 0 #f8f2ff;
  background: rgba(221, 199, 236, var(--taskbar-alpha, 1));
}
.tab:not(.focused) {
  color: #6d6d6d;
  background: rgba(227, 227, 227, var(--taskbar-alpha, 1));
  border-color: #9c9c9c;
  box-shadow: inset 1px 1px 0 #f5f5f5, inset -1px -1px 0 #c8c8c8;
}
.tab:not(.focused).active {
  background: rgba(214, 214, 214, var(--taskbar-alpha, 1));
  border-color: #909090;
  box-shadow: inset 1px 1px 0 #ececec, inset -1px -1px 0 #c0c0c0;
}
.tab::before {
  content: '';
  width: 12px;
  height: 12px;
  background: #6541a2;
  border: 1px solid #523587;
  flex-shrink: 0;
}
.tab:not(.focused)::before {
  background: #a6a6a6;
  border-color: #7f7f7f;
}
.tab.notify {
  animation: jineFlash 0.9s steps(2, end) infinite, jineBounce 0.9s ease-in-out infinite;
}
.quick-btn.notify {
  animation: jinePulse 0.9s steps(2, end) infinite, jineBounce 0.9s ease-in-out infinite;
}
@keyframes jineFlash {
  0% { background: rgba(246, 193, 255, var(--taskbar-alpha, 1)); }
  50% { background: rgba(255, 255, 255, var(--taskbar-alpha, 1)); }
  100% { background: rgba(246, 193, 255, var(--taskbar-alpha, 1)); }
}
@keyframes jinePulse {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
  100% { filter: brightness(1); }
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
.tray .day,
.tray .slot {
  padding: 2px 6px;
  background: rgba(211, 193, 222, var(--taskbar-alpha, 1));
}
.volume {
  padding: 2px 4px;
  background: rgba(211, 193, 222, var(--taskbar-alpha, 1));
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
