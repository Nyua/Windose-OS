/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_REMOTE_BROWSER_API_BASE?: string;
  readonly VITE_AMES_YT_API_BASE?: string;
  readonly VITE_LASTFM_API_KEY?: string;
  readonly VITE_LASTFM_USERNAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
