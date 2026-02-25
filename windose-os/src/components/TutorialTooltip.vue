<template>
  <Teleport to="body">
    <div
      v-if="visible && message"
      class="tutorial-tooltip"
      :style="{ transform: `translate(${cursorX}px, ${cursorY}px)` }"
    >
      <div class="tooltip-balloon">
        <span class="tooltip-text">{{ message }}</span>
        <div class="tooltip-tail"></div>
      </div>
      <img class="tooltip-pien" src="/tutorials/pien_tutorial.png" alt="" aria-hidden="true" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  message: string;
}>();

const cursorX = ref(0);
const cursorY = ref(0);

function onMouseMove(e: MouseEvent) {
  cursorX.value = e.clientX - 60;
  cursorY.value = e.clientY - 220;
}

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    window.addEventListener('mousemove', onMouseMove);
  } else {
    window.removeEventListener('mousemove', onMouseMove);
  }
});

onMounted(() => {
  if (props.visible) {
    window.addEventListener('mousemove', onMouseMove);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMouseMove);
});
</script>

<style scoped>
.tutorial-tooltip {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99999;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.tooltip-balloon {
  position: relative;
  background: #f0d1f1;
  border: 2px solid #4d23cf;
  border-radius: 12px;
  padding: 10px 14px;
  box-shadow: 2px 2px 0 rgba(60, 45, 98, 0.3);
  max-width: 400px;
}

.tooltip-text {
  font-family: var(--font-ui);
  font-size: 1.7rem;
  line-height: 1.3;
  color: #4d23cf;
  text-align: left;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tooltip-tail {
  position: absolute;
  bottom: -10px;
  right: 45px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 10px solid #4d23cf;
}

.tooltip-tail::after {
  display: none;
}

.tooltip-pien {
  width: 120px;
  height: auto;
  margin-top: 4px;
  margin-right: 0;
  align-self: flex-end;
  image-rendering: pixelated;
}
</style>
