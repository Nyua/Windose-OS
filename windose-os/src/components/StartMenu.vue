<template>
  <div class="start-menu" v-if="open" @click.stop>
    <button class="menu-item" @click="$emit('controlPanel')">Control Panel</button>
    <button class="menu-item" @click="$emit('restart')">Restart</button>
    <button class="menu-item" @click="$emit('shutdown')">Shut Down</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>();

defineEmits<{
  (e: 'controlPanel'): void;
  (e: 'restart'): void;
  (e: 'shutdown'): void;
}>();
</script>

<style scoped>
.start-menu {
  position: absolute;
  bottom: 60px;
  left: 8px;
  width: 216px;
  height: 204px;
  background: url('/start-menu/start_menu.png') no-repeat;
  background-size: 100% 100%;
  padding: 18px 10px 10px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 9999;
}
.menu-item {
  font-family: var(--font-ui);
  font-size: 12px;
  background: transparent;
  border: none;
  text-align: left;
  padding: 2px 4px;
  color: var(--font-base);
  cursor: pointer;
}
</style>
