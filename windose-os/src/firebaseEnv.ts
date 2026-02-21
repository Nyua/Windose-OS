export const FIREBASE_ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export type FirebaseEnvKey = (typeof FIREBASE_ENV_KEYS)[number];

export interface FirebaseEnvContract {
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_STORAGE_BUCKET: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  VITE_FIREBASE_APP_ID: string;
}

export interface FirebaseEnvValidationResult {
  ok: boolean;
  missing: FirebaseEnvKey[];
  value: FirebaseEnvContract | null;
}

function readEnvValue(key: FirebaseEnvKey): string {
  const raw = import.meta.env[key];
  if (typeof raw !== 'string') return '';
  return raw.trim();
}

export function validateFirebaseEnv(): FirebaseEnvValidationResult {
  const values = {
    VITE_FIREBASE_API_KEY: readEnvValue('VITE_FIREBASE_API_KEY'),
    VITE_FIREBASE_AUTH_DOMAIN: readEnvValue('VITE_FIREBASE_AUTH_DOMAIN'),
    VITE_FIREBASE_PROJECT_ID: readEnvValue('VITE_FIREBASE_PROJECT_ID'),
    VITE_FIREBASE_STORAGE_BUCKET: readEnvValue('VITE_FIREBASE_STORAGE_BUCKET'),
    VITE_FIREBASE_MESSAGING_SENDER_ID: readEnvValue('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    VITE_FIREBASE_APP_ID: readEnvValue('VITE_FIREBASE_APP_ID'),
  } satisfies FirebaseEnvContract;

  const missing = FIREBASE_ENV_KEYS.filter((key) => values[key].length === 0);
  if (missing.length > 0) {
    return { ok: false, missing, value: null };
  }
  return { ok: true, missing: [], value: values };
}

export function getFirebaseEnvOrThrow(): FirebaseEnvContract {
  const result = validateFirebaseEnv();
  if (!result.ok || !result.value) {
    const message = `Missing Firebase env keys: ${result.missing.join(', ')}`;
    throw new Error(message);
  }
  return result.value;
}
