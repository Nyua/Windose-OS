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
        <button class="btn close" @click.stop="onClose" aria-label="Close">x</button>
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
    <div v-if="resizable" class="resizer tl" @pointerdown.stop="startResize('tl', $event)"></div>
    <div v-if="resizable" class="resizer tr" @pointerdown.stop="startResize('tr', $event)"></div>
    <div v-if="resizable" class="resizer bl" @pointerdown.stop="startResize('bl', $event)"></div>
    <div v-if="resizable" class="resizer br" @pointerdown.stop="startResize('br', $event)"></div>
    <div v-if="resizable" class="resizer top" @pointerdown.stop="startResize('top', $event)"></div>
    <div v-if="resizable" class="resizer right" @pointerdown.stop="startResize('right', $event)"></div>
    <div v-if="resizable" class="resizer bottom" @pointerdown.stop="startResize('bottom', $event)"></div>
    <div v-if="resizable" class="resizer left" @pointerdown.stop="startResize('left', $event)"></div>
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
  (e: 'drag', id: string, x: number, y: number): void;
  (e: 'resize', id: string, x: number, y: number, w: number, h: number): void;
  (e: 'minimize', id: string): void;
  (e: 'close', id: string): void;
  (e: 'toggleFullscreen', id: string): void;
}>();

const dragging = ref(false);
const resizing = ref<null | string>(null);
const start = ref({ x: 0, y: 0, w: 0, h: 0, px: 0, py: 0 });

const windowStyle = computed(() => {
  const scale = props.isMinimized ? 0.1 : 1;
  const base = {
    transform: `translate(${props.x}px, ${props.y}px) scale(${scale})`,
    width: `${props.width}px`,
    height: `${props.height}px`,
    zIndex: props.zIndex,
    opacity: props.isMinimized ? 0 : 1,
    pointerEvents: props.isMinimized ? 'none' : 'auto',
    transition: `transform ${props.transitionMs}ms ${props.transitionEasing}, width ${props.transitionMs}ms ${props.transitionEasing}, height ${props.transitionMs}ms ${props.transitionEasing}, opacity ${props.transitionMs}ms ${props.transitionEasing}`,
  } as Record<string, string | number>;
  return base;
});

function onFocus() {
  emit('focus', props.id);
}

function startDrag(e: PointerEvent) {
  if (props.isFullscreen) return;
  dragging.value = true;
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
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', endDrag);
}

function startResize(edge: string, e: PointerEvent) {
  if (!props.resizable || props.isFullscreen) return;
  resizing.value = edge;
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

  if (edge.includes('right')) w = start.value.w + dx;
  if (edge.includes('left')) { w = start.value.w - dx; x = start.value.x + dx; }
  if (edge.includes('bottom')) h = start.value.h + dy;
  if (edge.includes('top')) { h = start.value.h - dy; y = start.value.y + dy; }

  const minW = 200;
  const minH = 120;
  if (w < minW) { w = minW; if (edge.includes('left')) x = start.value.x + (start.value.w - minW); }
  if (h < minH) { h = minH; if (edge.includes('top')) y = start.value.y + (start.value.h - minH); }

  emit('resize', props.id, x, y, w, h);
}

function endResize() {
  resizing.value = null;
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
}

function onMinimize() {
  emit('minimize', props.id);
}

function onClose() {
  emit('close', props.id);
}

function onToggleFullscreen() {
  emit('toggleFullscreen', props.id);
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
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
.resizer { position: absolute; width: 8px; height: 8px; background: transparent; }
.resizer.tl { top: -4px; left: -4px; cursor: nwse-resize; }
.resizer.tr { top: -4px; right: -4px; cursor: nesw-resize; }
.resizer.bl { bottom: -4px; left: -4px; cursor: nesw-resize; }
.resizer.br { bottom: -4px; right: -4px; cursor: nwse-resize; }
.resizer.top { top: -4px; left: 10px; right: 10px; height: 8px; cursor: ns-resize; }
.resizer.bottom { bottom: -4px; left: 10px; right: 10px; height: 8px; cursor: ns-resize; }
.resizer.left { left: -4px; top: 10px; bottom: 10px; width: 8px; cursor: ew-resize; }
.resizer.right { right: -4px; top: 10px; bottom: 10px; width: 8px; cursor: ew-resize; }
</style>

