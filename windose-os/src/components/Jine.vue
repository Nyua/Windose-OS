<template>
  <div class="jine-app">
    <div v-if="!auth.ready" class="jine-loading">Connecting...</div>
    <JineChat v-else />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import JineChat from './JineChat.vue';

const auth = useAuthStore();
</script>

<style scoped>
.jine-app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f0f4ff; 
}
.jine-loading {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-family: var(--font-ui);
  color: #4a66b5;
}
</style>
