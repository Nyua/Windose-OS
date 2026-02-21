import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const remoteBrowserProxyTarget = env.REMOTE_BROWSER_PROXY_TARGET || 'http://127.0.0.1:8791';
  const ytAudioProxyTarget = env.YT_AUDIO_PROXY_TARGET || 'http://127.0.0.1:8792';

  return {
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          amesCorner: resolve(__dirname, 'ames-corner.html'),
        },
      },
    },
    server: {
      proxy: {
        '/remote-browser-api': {
          target: remoteBrowserProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/remote-browser-api/, ''),
        },
        '/yt-audio-api': {
          target: ytAudioProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/yt-audio-api/, ''),
        },
      },
    },
  };
})
