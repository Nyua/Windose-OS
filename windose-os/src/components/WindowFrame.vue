<template>
  <div
    class="window"
    :class="{ focused: isFocused, minimized: isMinimized, fullscreen: isFullscreen }"
    :style="windowStyle"
    @pointerdown="onFocus"
  >
    <div class="titlebar" @pointerdown.stop="startDrag">
      <div class="title">
        <span class="title-icon" aria-hidden="true"></span>
        <span class="title-text">{{ title }}</span>
      </div>
      <div class="buttons">
        <button type="button" class="btn minimize" @pointerdown.stop @click.stop="onMinimize" aria-label="Minimize">
          <span class="glyph" aria-hidden="true"></span>
        </button>
        <button type="button" class="btn fullscreen" @pointerdown.stop @click.stop="onToggleFullscreen" aria-label="Fullscreen">
          <span class="glyph" aria-hidden="true"></span>
        </button>
        <button
          type="button"
          class="btn close"
          @pointerdown.stop
          @pointerenter.stop="onCloseHover"
          @pointerleave.stop="onCloseHoverEnd"
          @click.stop="onClose"
          aria-label="Close"
        >
          <span class="glyph" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
    <div class="status-strip" aria-hidden="true">
      <span class="status-pill"></span>
      <span class="status-dots">
        <span class="status-dot"></span>
        <span class="status-dot"></span>
        <span class="status-dot"></span>
      </span>
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
  (e: 'dragEnd', id: string): void;
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
let dragPointerId: number | null = null;
let resizePointerId: number | null = null;
let dragPointerOwner: HTMLElement | null = null;
let resizePointerOwner: HTMLElement | null = null;

function setGlobalDragLock(active: boolean) {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle('dragging', active);
}


const windowStyle = computed(() => {
  const scale = props.isMinimized ? 0.1 : 1;
  const frameBottomTrim = 0;
  const visualHeight = Math.max(0, props.height - frameBottomTrim);
  const base = {
    transform: `translate(${props.x}px, ${props.y}px) scale(${scale})`,
    width: `${props.width}px`,
    height: `${visualHeight}px`,
    '--viewport-scale': `${props.viewportScale || 1}`,
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
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const target = e.target;
  if (target instanceof HTMLElement && target.closest('.buttons')) return;
  emit('focus', props.id);
  emit('dragStart', props.id);
  dragging.value = true;
  dragPointerId = e.pointerId;
  const owner = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
  dragPointerOwner = owner;
  if (owner) {
    try {
      owner.setPointerCapture(e.pointerId);
    } catch {
      // ignore capture failures on unsupported platforms
    }
  }
  setGlobalDragLock(true);
  e.preventDefault();
  start.value = { x: props.x, y: props.y, w: props.width, h: props.height, px: e.clientX, py: e.clientY };
  window.addEventListener('pointermove', onDrag);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
}

function onDrag(e: PointerEvent) {
  if (!dragging.value) return;
  if (dragPointerId !== null && e.pointerId !== dragPointerId) return;
  const scale = props.viewportScale || 1;
  const dx = (e.clientX - start.value.px) / scale;
  const dy = (e.clientY - start.value.py) / scale;
  emit('drag', props.id, start.value.x + dx, start.value.y + dy);
}

function endDrag(e?: PointerEvent) {
  if (!dragging.value) return;
  if (e && dragPointerId !== null && e.pointerId !== dragPointerId) return;
  dragging.value = false;
  if (dragPointerOwner && dragPointerId !== null) {
    try {
      dragPointerOwner.releasePointerCapture(dragPointerId);
    } catch {
      // ignore capture release failures
    }
  }
  dragPointerOwner = null;
  dragPointerId = null;
  setGlobalDragLock(false);
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointercancel', endDrag);
  emit('dragEnd', props.id);
}

function startResize(edge: string, e: PointerEvent) {
  if (!props.resizable || props.isFullscreen) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  emit('focus', props.id);
  resizing.value = edge;
  resizePointerId = e.pointerId;
  const owner = e.currentTarget instanceof HTMLElement ? e.currentTarget : null;
  resizePointerOwner = owner;
  if (owner) {
    try {
      owner.setPointerCapture(e.pointerId);
    } catch {
      // ignore capture failures on unsupported platforms
    }
  }
  setGlobalDragLock(true);
  e.preventDefault();
  start.value = { x: props.x, y: props.y, w: props.width, h: props.height, px: e.clientX, py: e.clientY };
  window.addEventListener('pointermove', onResize);
  window.addEventListener('pointerup', endResize);
  window.addEventListener('pointercancel', endResize);
}

function onResize(e: PointerEvent) {
  if (!resizing.value) return;
  if (resizePointerId !== null && e.pointerId !== resizePointerId) return;
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
  if (resizePointerOwner && resizePointerId !== null) {
    try {
      resizePointerOwner.releasePointerCapture(resizePointerId);
    } catch {
      // ignore capture release failures
    }
  }
  resizePointerOwner = null;
  resizePointerId = null;
  resizing.value = null;
  setGlobalDragLock(false);
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
  window.removeEventListener('pointercancel', endResize);
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
  if (dragging.value) {
    emit('dragEnd', props.id);
  }
  dragPointerOwner = null;
  dragPointerId = null;
  resizePointerOwner = null;
  resizePointerId = null;
  window.removeEventListener('pointermove', onDrag);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointercancel', endDrag);
  window.removeEventListener('pointermove', onResize);
  window.removeEventListener('pointerup', endResize);
  window.removeEventListener('pointercancel', endResize);
  setGlobalDragLock(false);
});
</script>

<style scoped>
.window {
  --frame-blue: #6234cd;
  --frame-cyan: #90f3e1;
  --frame-shell: #90f3e1;
  --frame-shell-inactive: #e3e3e3;
  --frame-panel: #fff8ff;
  --frame-panel-inactive: #e3e3e3;
  --frame-accent: #efcfef;
  --viewport-scale: 1;
  position: absolute;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 4px 4px 1px;
  background: var(--frame-shell-inactive);
  border: 2px solid var(--frame-blue);
  border-top-width: 1px;
  box-shadow:
    1px 1px 0 rgba(63, 43, 224, 0.32),
    2px 2px 0 rgba(63, 43, 224, 0.2);
}

.window::before {
  content: none;
}

.window.focused {
  background: var(--frame-shell);
  box-shadow:
    1px 1px 0 rgba(63, 43, 224, 0.42),
    2px 2px 0 rgba(63, 43, 224, 0.28);
}

.titlebar {
  height: 26px;
  flex: 0 0 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -1px;
  padding: 0 3px 0 5px;
  background: var(--frame-shell-inactive);
  border: 2px solid var(--frame-blue);
  color: var(--frame-blue);
  image-rendering: pixelated;
  user-select: none;
  cursor: grab;
  touch-action: none;
}

.window.focused .titlebar {
  background: var(--frame-accent);
}

.title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: -4px;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1;
  text-transform: uppercase;
}

.title-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  background: url('/windows/windowbase_icon.png') center / 20px 20px no-repeat;
  image-rendering: pixelated;
}

.title-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  letter-spacing: 0.35px;
}

.buttons {
  display: flex;
  gap: 2px;
}

.btn {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent center / 16px 16px no-repeat;
  padding: 0;
  display: block;
  cursor: pointer;
  image-rendering: pixelated;
  flex: 0 0 16px;
}

.btn.minimize {
  background-image: url('/windows/button_minimize.png');
}

.btn.fullscreen {
  background-image: url('/windows/button_maximize.png');
}

.btn.close {
  background-image: url('/windows/button_close.png');
}

.btn .glyph {
  display: none;
}

.btn:hover {
  filter: brightness(1.03);
}

.btn:active {
  transform: translateY(1px);
}

.content {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: calc(2px / var(--viewport-scale, 1));
  border: 2px solid var(--frame-blue);
  background: var(--frame-panel-inactive);
  box-shadow: none;
  padding: 0;
  position: relative;
  overflow: hidden;
}

.content::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 2px;
  left: 0;
  pointer-events: none;
  box-shadow:
    inset 0 1px 2px rgba(98, 52, 205, 0.18),
    inset 1px 0 1px rgba(98, 52, 205, 0.12),
    inset -1px 0 1px rgba(98, 52, 205, 0.12);
}

.window.focused .content {
  background: var(--frame-panel);
  box-shadow: none;
}

.status-strip {
  flex: 0 0 auto;
  height: 9px;
  margin-top: 2px;
  align-self: flex-start;
  width: fit-content;
  border: 0;
  background: transparent;
  position: relative;
  top: 2px;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0;
}

.window.focused .status-strip {
  background: transparent;
}

.status-pill {
  width: 32px;
  height: 100%;
  background: var(--frame-accent);
  border: 2px solid var(--frame-blue);
  border-bottom: 0;
  box-sizing: border-box;
  box-shadow: none;
}

.status-dots {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  margin-left: 2px;
  margin-top: -3px;
  transform: translateY(0);
}

.status-dot {
  width: 6.5px;
  height: 6.5px;
  border: 2px solid var(--frame-blue);
  background: var(--frame-shell-inactive);
}

.window.focused .status-dot {
  background: var(--frame-cyan);
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


