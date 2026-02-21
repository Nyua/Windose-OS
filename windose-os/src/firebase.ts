import {
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import {
  type FirebaseEnvKey,
  getFirebaseEnvOrThrow,
  validateFirebaseEnv,
} from './firebaseEnv';

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let cachedServices: FirebaseServices | null = null;

function toFirebaseConfig(): FirebaseOptions {
  const env = getFirebaseEnvOrThrow();
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

export function isFirebaseConfigured(): boolean {
  return validateFirebaseEnv().ok;
}

export function getMissingFirebaseEnvKeys(): FirebaseEnvKey[] {
  return validateFirebaseEnv().missing;
}

export function getFirebaseServices(): FirebaseServices {
  if (cachedServices) return cachedServices;
  const config = toFirebaseConfig();
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  cachedServices = {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
  return cachedServices;
}
