<template>
  <div
    class="window"
    :class="{ focused: isFocused, minimized: isMinimized, fullscreen: isFullscreen }"
    :style="windowStyle"
    @pointerdown="onFocus"
  >
    <div class="titlebar" @pointerdown.stop="startDrag">
      <div class="title">{{ title }}</div>
      <div class="buttons">
        <button class="btn minimize" @click.stop="onMinimize" aria-label="Minimize">-</button>
        <button class="btn fullscreen" @click.stop="onToggleFullscreen" aria-label="Fullscreen">=</button>
        <button class="btn close" @pointerenter.stop="onCloseHover" @pointerleave.stop="onCloseHoverEnd" @click.stop="onClose" aria-label="Close">x</button>
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
    <div v-if="resizable" class="resize-edge top" @pointerdown.stop="startResize('top', $event)"></div>
    <div v-if="resizable" class="resize-edge right" @pointerdown.stop="startResize('right', $event)"></div>
    <div v-if="resizable" class="resize-edge bottom" @pointerdown.stop="startResize('bottom', $event)"></div>
    <div v-if="resizable" class="resize-edge left" @pointerdown.stop="startResize('left', $event)"></div>
    <div v-if="resizable" class="resize-corner tl" @pointerdown.stop="startResize('tl', $event)"></div>
    <div v-if="resizable" class="resize-corner tr" @pointerdown.stop="startResize('tr', $event)"></div>
    <div v-if="resizable" class="resize-corner bl" @pointerdown.stop="startResize('bl', $event)"></div>
    <div v-if="resizable" class="resize-corner br" @pointerdown.stop="startResize('br', $event)"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';

const props = defineProps<{ 
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isFocused: boolean;
  isMinimized: boolean;
  isFullscreen: boolean;
  resizable: boolean;
  transitionMs: number;
  transitionEasing: string;
  taskbarHeight: number;
  viewportScale: number;
}>();

const emit = defineEmits<{
  (e: 'focus', id: string): void;
  (e: 'dragStart', id: string): void;
  (e: 'drag', id: string, x: number, y: number): void;
  (e: 'resize', id: string, x: number, y: number, w: number, h: number): void;
  (e: 'minimize', id: string): void;
  (e: 'close', id: string): void;
  (e: 'toggleFullscreen', id: string): void;
  (e: 'closeHover', id: string): void;
  (e: 'closeHoverEnd', id: string): void;
}>();

const dragging = ref(false);
const resizing = ref<null | string>(null);
const start = ref({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

function setGlobalDragLock(active: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('dragging', active);
}


const windowStyle = computed(() => {
  const scale = props.isMinimized ? 0.1 : 1;
  const base = {
    transform: `translate(${props.x}px, ${props.y}px) scale(${scale})`,
    width: `${props.width}px`,
    height: `${props.height}px`,
    zIndex: props.zIndex,
    opacity: props.isMinimized ? 0 : 1,
    pointerEvents: props.isMinimized ? 'none' : 'auto',
    transition: resizing.value
      ? 'none'
      : `transform ${props.transitionMs}ms ${props.transitionEasing}, width ${props.transitionMs}ms ${props.transitionEasing}, height ${props.transitionMs}ms ${props.transitionEasing}, opacity ${props.transitionMs}ms ${props.transitionEasing}`,
  } as Record<string, string | number>;
  return base;
});

function onFocus() {
  emit('focus', props.id);
}

function startDrag(e: PointerEvent) {
  if (props.isFullscreen) return;
  emit('focus', props.id);
  emit('dragStart', props.id);
  dragging.value = true;
  setGlobalDragLock(true);
  e.preventDefault();
  start.value = { x: props.x, y: props.y, w: props.width, h: props.height, px: e.clientX, py: e.clientY };
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', endDrag);
}

function onDrag(e: PointerEvent) {
  if (!dragging.value) return;
  const scale = props.viewportScale || 1;
  const dx = (e.clientX - start.value.px) / scale;
  const dy = (e.clientY - start.value.py) / scale;
  emit('drag', props.id, start.value.x + dx, start.value.y + dy);
}

function endDrag() {
  dragging.value = false;
  setGlobalDragLock(false);
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', endDrag);
}

function startResize(edge: string, e: PointerEvent) {
  if (!props.resizable || props.isFullscreen) return;
  emit('focus', props.id);
  resizing.value = edge;
  setGlobalDragLock(true);
  e.preventDefault();
  start.value = { x: props.x, y: props.y, w: props.width, h: props.height, px: e.clientX, py: e.clientY };
  window.addEventListener('pointermove', onResize);
  window.addEventListener('pointerup', endResize);
}

function onResize(e: PointerEvent) {
  if (!resizing.value) return;
  const scale = props.viewportScale || 1;
  const dx = (e.clientX - start.value.px) / scale;
  const dy = (e.clientY - start.value.py) / scale;
  let x = start.value.x;
  let y = start.value.y;
  let w = start.value.w;
  let h = start.value.h;
  const edge = resizing.value;

  const leftEdge = edge.includes('left') || edge === 'tl' || edge === 'bl';
  const rightEdge = edge.includes('right') || edge === 'tr' || edge === 'br';
  const topEdge = edge.includes('top') || edge === 'tl' || edge === 'tr';
  const bottomEdge = edge.includes('bottom') || edge === 'bl' || edge === 'br';

  if (rightEdge) w = start.value.w + dx;
  if (leftEdge) { w = start.value.w - dx; x = start.value.x + dx; }
  if (bottomEdge) h = start.value.h + dy;
  if (topEdge) { h = start.value.h - dy; y = start.value.y + dy; }

  const minW = 200;
  const minH = 120;
  if (w < minW) { w = minW; if (edge.includes('left')) x = start.value.x + (start.value.w - minW); }
  if (h < minH) { h = minH; if (edge.includes('top')) y = start.value.y + (start.value.h - minH); }

  emit('resize', props.id, x, y, w, h);
}

function endResize() {
  resizing.value = null;
  setGlobalDragLock(false);
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
}

function onMinimize() {
  emit('minimize', props.id);
}

function onClose() {
  emit('close', props.id);
}

function onCloseHover() {
  emit('closeHover', props.id);
}

function onCloseHoverEnd() {
  emit('closeHoverEnd', props.id);
}

function onToggleFullscreen() {
  emit('toggleFullscreen', props.id);
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
  setGlobalDragLock(false);
});
</script>

<style scoped>
.window {
  position: absolute;
  background: var(--window-bg);
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 2px var(--bevel-highlight);
}
.titlebar {
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
  background: var(--title-inactive);
  color: var(--font-base);
  user-select: none;
  cursor: grab;
}
.window.focused .titlebar {
  background: var(--title-active);
}
.title {
  font-family: var(--font-ui);
  font-size: 12px;
}
.buttons {
  display: flex;
  gap: 6px;
}
.btn {
  width: 16px;
  height: 16px;
  border: 2px solid var(--bevel-shadow);
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: var(--title-inactive);
  color: var(--font-base);
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 12px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.window.focused .btn {
  background: var(--title-active);
}
.content {
  padding: 8px;
  height: calc(100% - 28px);
  overflow: hidden;
}
.resize-edge { position: absolute; background: transparent; z-index: 4; touch-action: none; }
.resize-corner { position: absolute; background: transparent; z-index: 5; touch-action: none; }
.resize-edge.top { top: -6px; left: 12px; right: 12px; height: 12px; cursor: ns-resize; }
.resize-edge.bottom { bottom: -6px; left: 12px; right: 12px; height: 12px; cursor: ns-resize; }
.resize-edge.left { left: -6px; top: 12px; bottom: 12px; width: 12px; cursor: ew-resize; }
.resize-edge.right { right: -6px; top: 12px; bottom: 12px; width: 12px; cursor: ew-resize; }
.resize-corner { width: 18px; height: 18px; }
.resize-corner.tl { top: -9px; left: -9px; cursor: nwse-resize; }
.resize-corner.tr { top: -9px; right: -9px; cursor: nesw-resize; }
.resize-corner.bl { bottom: -9px; left: -9px; cursor: nesw-resize; }
.resize-corner.br { bottom: -9px; right: -9px; cursor: nwse-resize; }
</style>


