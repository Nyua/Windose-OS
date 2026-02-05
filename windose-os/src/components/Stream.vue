<template>
  <div class="stream-video">
    <div v-if="locked" class="placeholder">Streaming is only available at Night</div>
    <div v-else-if="!embedSrc" class="placeholder">Set Stream Video URL in Control Panel</div>
    <iframe
      v-else
      ref="iframeRef"
      class="video"
      :src="embedSrc"
      title="Stream"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      @load="onIframeLoad"
    ></iframe>
    <div v-if="loadState === 'loading'" class="overlay">Loading...</div>
    <div v-else-if="loadState === 'error'" class="overlay error">
      <div>Content blocked by browser.</div>
      <a v-if="cleanedSrc" :href="cleanedSrc" target="_blank" rel="noopener">Open externally</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ src: string; isMinimized?: boolean; isFocused?: boolean; isOpen?: boolean; locked?: boolean }>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const loadState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
let loadTimer: number | null = null;

function parseStart(value: string | null) {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return 0;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function extractYoutubeId(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      return url.pathname.replace('/', '').trim();
    }
    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      if (url.pathname.startsWith('/watch')) {
        return url.searchParams.get('v') || '';
      }
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/')[2] || '';
      }
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/')[2] || '';
      }
    }
  } catch {
    return '';
  }
  return '';
}

const cleanedSrc = computed(() => (props.src || '').trim());
const youtubeId = computed(() => extractYoutubeId(cleanedSrc.value));
const isYouTube = computed(() => Boolean(youtubeId.value));

const embedSrc = computed(() => {
  if (!cleanedSrc.value) return '';
  if (!isYouTube.value) return cleanedSrc.value;
  const params = new URLSearchParams();
  params.set('autoplay', '1');
  params.set('mute', '0');
  params.set('controls', '0');
  params.set('playsinline', '1');
  params.set('enablejsapi', '1');
  params.set('rel', '0');
  const startParam = (() => {
    try {
      const url = new URL(cleanedSrc.value);
      return url.searchParams.get('t') || url.searchParams.get('start');
    } catch {
      return null;
    }
  })();
  const startSeconds = parseStart(startParam);
  if (startSeconds > 0) params.set('start', String(startSeconds));
  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin);
  }
  return `https://www.youtube.com/embed/${youtubeId.value}?${params.toString()}`;
});

function clearLoadTimer() {
  if (loadTimer !== null) {
    window.clearTimeout(loadTimer);
    loadTimer = null;
  }
}

function startLoadTimer() {
  clearLoadTimer();
  loadState.value = 'loading';
  loadTimer = window.setTimeout(() => {
    if (loadState.value === 'loading') {
      loadState.value = 'error';
    }
  }, 4000);
}

function sendCommand(func: 'playVideo' | 'pauseVideo' | 'stopVideo') {
  if (!isYouTube.value) return;
  const target = iframeRef.value?.contentWindow;
  if (!target) return;
  target.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
}

function onIframeLoad() {
  clearLoadTimer();
  loadState.value = 'ready';
  if (props.isMinimized || props.locked) return;
  sendCommand('playVideo');
}

watch(
  () => props.isMinimized,
  (minimized) => {
    if (!isYouTube.value) return;
    if (minimized) {
      sendCommand('pauseVideo');
    } else if (props.isFocused) {
      sendCommand('playVideo');
    }
  }
);

watch(
  () => props.isFocused,
  (focused) => {
    if (!isYouTube.value) return;
    if (focused && !props.isMinimized) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }
);

watch(
  () => props.locked,
  (locked) => {
    if (!isYouTube.value) return;
    if (locked) {
      sendCommand('pauseVideo');
    } else if (!props.isMinimized && props.isFocused) {
      sendCommand('playVideo');
    }
  }
);

watch(
  () => embedSrc.value,
  () => {
    if (!isYouTube.value) return;
    nextTick(() => {
      if (!props.isMinimized) sendCommand('playVideo');
    });
  }
);

watch(
  [() => embedSrc.value, () => props.locked],
  ([src, locked]) => {
    if (!src || locked) {
      clearLoadTimer();
      loadState.value = 'idle';
      return;
    }
    startLoadTimer();
  },
  { immediate: true }
);

onMounted(() => {
  if (!props.isMinimized && !props.locked) sendCommand('playVideo');
});

onBeforeUnmount(() => {
  clearLoadTimer();
  sendCommand('stopVideo');
});
</script>

<style scoped>
.stream-video {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
}
.video {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 12px;
  color: #d0d0d0;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-ui);
  font-size: 12px;
  color: #666;
  background: rgba(255, 255, 255, 0.9);
  text-align: center;
  padding: 10px;
}
.overlay.error {
  color: #444;
}
.overlay a {
  color: #5a4bb7;
  text-decoration: none;
}
</style>

