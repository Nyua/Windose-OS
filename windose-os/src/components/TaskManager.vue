<template>
  <div class="task-manager">
    <div class="header">Task Manager</div>
    <div class="list">
      <div class="row header-row">
        <span>App</span>
        <span>Status</span>
        <span>Size</span>
      </div>
      <div v-for="win in openWindows" :key="win.id" class="row">
        <span class="title">{{ win.title }}</span>
        <span>{{ statusFor(win) }}</span>
        <span>{{ Math.round(win.width) }}x{{ Math.round(win.height) }}</span>
      </div>
      <div v-if="openWindows.length === 0" class="empty">No open apps.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WindowState } from '../types';

const props = defineProps<{ windows: WindowState[] }>();

const openWindows = computed(() => props.windows.filter((win) => win.isOpen));

function statusFor(win: WindowState) {
  if (win.isMinimized) return 'Minimized';
  if (win.isFocused) return 'Focused';
  return 'Open';
}
</script>

<style scoped>
.task-manager {
  font-family: var(--font-ui);
  font-size: 12px;
  color: var(--font-base);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.header {
  font-weight: bold;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 4px;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
  background: #ffffff;
  height: 100%;
  overflow: auto;
}
.row {
  display: grid;
  grid-template-columns: 1fr 90px 90px;
  gap: 8px;
  padding: 2px 4px;
  align-items: center;
}
.header-row {
  font-weight: bold;
  border-bottom: 1px solid #d0d0d0;
  padding-bottom: 4px;
}
.title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.empty {
  padding: 8px 4px;
  color: #777;
}
</style>
