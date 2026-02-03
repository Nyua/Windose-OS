<template>
  <div
    ref="iconRef"
    class="desktop-icon"
    :class="{ selected: isSelected }"
    :style="{ transform: `translate(${pos.x}px, ${pos.y}px)` }"
    @pointerdown="onPointerDown"
    @click="onClick"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
  >
    <div class="icon" :style="{ width: `${size}px`, height: `${size}px`, backgroundImage: `url(${icon})` }">
      <span v-if="notifications" class="badge"></span>
    </div>
    <strong class="label" :style="{ width: `${size * 1.2}px` }">{{ title }}</strong>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

const props = defineProps<{
  id: string;
  title: string;
  icon: string;
  defaultX: number;
  defaultY: number;
  size: number;
  gridX: number;
  gridY: number;
  gridOffset: number;
  snapEnabled: boolean;
  clampEnabled: boolean;
  clampLeft: number;
  clampTop: number;
  clampRightOffset: number;
  clampBottomOffset: number;
  taskbarHeight: number;
  doubleClickMs: number;
  viewportWidth: number;
  viewportHeight: number;
  notifications?: boolean;
}>();

const emit = defineEmits<{
  (e: 'activate', id: string): void;
  (e: 'select', id: string | null): void;
  (e: 'position', id: string, x: number, y: number): void;
  (e: 'hover', payload: { id: string; hovering: boolean; x: number; y: number; width: number; height: number }): void;
}>();

const iconRef = ref<HTMLDivElement | null>(null);
const pos = ref({ x: props.defaultX, y: props.defaultY });
const isSelected = ref(false);
const clickCount = ref(0);
let clickTimer: number | null = null;
let dragging = false;
let startX = 0;
let startY = 0;
let startPosX = 0;
let startPosY = 0;

function onClick() {
  if (clickTimer) window.clearTimeout(clickTimer);
  clickCount.value += 1;
  if (clickCount.value === 2) {
    emit('activate', props.id);
    clickCount.value = 0;
    isSelected.value = false;
    return;
  }
  clickTimer = window.setTimeout(() => {
    clickCount.value = 0;
  }, props.doubleClickMs);
  isSelected.value = true;
  emit('select', props.id);
}

function onPointerDown(e: PointerEvent) {
  dragging = true;
  startX = e.clientX;
  startY = e.clientY;
  startPosX = pos.value.x;
  startPosY = pos.value.y;
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
}

function emitHover(hovering: boolean) {
  emit('hover', { id: props.id, hovering, x: pos.value.x, y: pos.value.y, width: props.size, height: props.size });
}

function onPointerEnter() {
  emitHover(true);
}

function onPointerLeave() {
  emitHover(false);
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return;
  const scale = props.viewportScale || 1;
  const dx = (e.clientX - startX) / scale;
  const dy = (e.clientY - startY) / scale;
  pos.value = { x: startPosX + dx, y: startPosY + dy };
}

function onPointerUp() {
  dragging = false;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);

  let x = pos.value.x;
  let y = pos.value.y;

  if (props.snapEnabled) {
    x = Math.round(x / props.gridX) * props.gridX + props.gridOffset;
    y = Math.round(y / props.gridY) * props.gridY + props.gridOffset;
  }

  if (props.clampEnabled) {
    const width = props.viewportWidth;
    const height = props.viewportHeight;
    if (y > height - props.taskbarHeight - props.size) {
      y = height - props.size * 2 - props.clampBottomOffset;
    } else if (y < props.size) {
      y = props.clampTop;
    }
    if (x > width - props.size) {
      x = width - props.size * 2 - props.clampRightOffset;
    } else if (x < props.size) {
      x = props.clampLeft;
    }
  }

  pos.value = { x, y };
  emit('position', props.id, x, y);
}

function clearSelection() {
  isSelected.value = false;
  emit('select', null);
}

function onClickAway(e: MouseEvent) {
  if (!iconRef.value) return;
  if (!iconRef.value.contains(e.target as Node)) clearSelection();
}

window.addEventListener('click', onClickAway);

onBeforeUnmount(() => {
  window.removeEventListener('click', onClickAway);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});
</script>

<style scoped>
.desktop-icon {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  user-select: none;
}
.desktop-icon.selected {
  background: rgba(189, 100, 241, 0.35);
}
.icon {
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
}
.badge {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #f6c1ff;
  border: 2px solid #bd64f1;
}
.label {
  font-family: var(--font-ui);
  font-size: 0.85rem;
  color: var(--font-base);
  text-align: center;
  white-space: nowrap;
}
</style>
