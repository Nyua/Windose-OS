<template>
  <div class="stream-video">
    <iframe
      v-if="embedSrc"
      ref="iframeRef"
      class="video"
      :src="embedSrc"
      title="Stream"
      frameborder="0"
      allow="autoplay; fullscreen; picture-in-picture"
      allowfullscreen
      @load="onIframeLoad"
    ></iframe>
    <div v-else class="placeholder">Set Stream Video URL in Control Panel</div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ src: string; isMinimized?: boolean; isFocused?: boolean; isOpen?: boolean }>();

const iframeRef = ref<HTMLIFrameElement | null>(null);

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

function sendCommand(func: 'playVideo' | 'pauseVideo' | 'stopVideo') {
  if (!isYouTube.value) return;
  const target = iframeRef.value?.contentWindow;
  if (!target) return;
  target.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');
}

function onIframeLoad() {
  if (props.isMinimized) return;
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
  () => embedSrc.value,
  () => {
    if (!isYouTube.value) return;
    nextTick(() => {
      if (!props.isMinimized) sendCommand('playVideo');
    });
  }
);

onMounted(() => {
  if (!props.isMinimized) sendCommand('playVideo');
});

onBeforeUnmount(() => {
  sendCommand('stopVideo');
});
</script>

<style scoped>
.stream-video {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}
.video {
  width: 100%;
  height: 100%;
  border: none;
  background: #000;
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
</style>
