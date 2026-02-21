<template>
  <div class="trash-bin">
    <div class="toolbar">
      <span>File</span>
      <span>Edit</span>
      <span>View</span>
      <span>Help</span>
    </div>
    <div class="address-bar">
      <span>Address:</span>
      <div class="input">C:\Recycle Bin</div>
    </div>
    
    <div class="file-list">
      <div
        v-for="entry in fileEntries"
        :key="entry.name"
        class="file-item"
        :class="{ locked: entry.locked }"
        :title="entry.title"
        @dblclick="openFile(entry)"
      >
        <img src="/icons/trash.png" class="icon" />
        <span class="filename">{{ entry.name }}</span>
        <span v-if="entry.locked" class="lock-pill">LOCKED</span>
      </div>
    </div>
    
    <div class="status-bar">
      {{ fileEntries.length }} objects
    </div>

    <!-- Simple Text Viewer Overlay -->
    <div v-if="openDoc" class="notepad-overlay" @click.self="openDoc = null">
      <div class="notepad-window">
        <div class="notepad-header">
          <span>{{ openDoc.title }} - Notepad</span>
          <button @click="openDoc = null">X</button>
        </div>
        <div class="notepad-body">
          <textarea readonly :value="openDoc.content"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSecretsStore } from '../stores/secrets';

type TrashFileEntry = {
  name: string;
  locked: boolean;
  title: string;
};

const fileEntries: TrashFileEntry[] = [
  {
    name: 'passwords.txt',
    locked: false,
    title: 'Never store your passwords in a txt file',
  },
  {
    name: 'photos_backup.zip',
    locked: true,
    title: 'Encrypted archive',
  },
  {
    name: 'homework_final_v2.zip',
    locked: true,
    title: 'Encrypted archive',
  },
  {
    name: 'me_and_pchan.jpg',
    locked: false,
    title: 'Preview unavailable',
  },
];

const openDoc = ref<{ title: string; content: string } | null>(null);
const secretsStore = useSecretsStore();

function openFile(entry: TrashFileEntry) {
  if (entry.locked) return;
  if (entry.name === 'passwords.txt') {
    secretsStore.markPasswordsSeen();
    openDoc.value = {
      title: 'passwords.txt',
      content: `Control Panel: "angelkawaii2"`
    };
    return;
  }
  openDoc.value = {
    title: entry.name,
    content: 'File preview is unavailable in this build.'
  };
}
</script>

<style scoped>
.trash-bin {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  font-family: var(--font-ui);
  border: 1px solid #808080;
}
.toolbar {
  display: flex;
  gap: 12px;
  padding: 4px 8px;
  background: #d4d0c8;
  border-bottom: 1px solid #fff;
}
.address-bar {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: #d4d0c8;
  align-items: center;
  border-bottom: 1px solid #808080;
}
.address-bar .input {
  background: #fff;
  border: 1px solid #808080;
  flex: 1;
  padding: 2px;
  font-size: 11px;
}
.file-list {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 20px;
  background: #fff;
  overflow-y: auto;
}
.file-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 80px;
  cursor: pointer;
}

.file-item.locked {
  opacity: 0.75;
}

.file-item:hover {
  background: #eef3ff;
  outline: 1px dotted #808080;
}
.icon {
  width: 32px;
  height: 32px;
  image-rendering: pixelated;
}
.filename {
  font-size: 11px;
  text-align: center;
  word-break: break-all;
}

.lock-pill {
  font-size: 10px;
  padding: 0 4px;
  border: 1px solid #555;
  border-radius: 10px;
  background: #f1d4d4;
  color: #700;
}
.status-bar {
  border-top: 1px solid #808080;
  padding: 2px 4px;
  background: #d4d0c8;
  font-size: 11px;
}
.notepad-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.notepad-window {
  width: 300px;
  height: 200px;
  background: #d4d0c8;
  border: 2px solid #fff;
  border-right-color: #404040;
  border-bottom-color: #404040;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
}
.notepad-header {
  background: #000080;
  color: #fff;
  padding: 2px 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.notepad-header button {
  background: #d4d0c8;
  border: 1px solid #fff;
  border-right-color: #404040;
  border-bottom-color: #404040;
  width: 16px;
  height: 14px;
  line-height: 10px;
  font-size: 10px;
  cursor: pointer;
}
.notepad-body {
  flex: 1;
  padding: 2px;
}
.notepad-body textarea {
  width: 100%;
  height: 100%;
  resize: none;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: none;
  border: 1px solid #808080;
  outline: none;
}
</style>
