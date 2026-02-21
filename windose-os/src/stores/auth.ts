import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseServices, isFirebaseConfigured } from '../firebase';

const STORAGE_KEY = 'windose_auth_profile_v2';
const DEFAULT_AVATAR = '/avatars/avatar_1.png';
const JOSER_USERNAME = 'joser';
const JOSER_AVATAR = '/avatars/avatar_joser.jpg';
const ANON_PLACEHOLDER_AVATARS = [
  '/tweeter/placeholder-profiles/avatar_blue.png',
  '/tweeter/placeholder-profiles/avatar_bright-pink.png',
  '/tweeter/placeholder-profiles/avatar_green.png',
  '/tweeter/placeholder-profiles/avatar_lavender.png',
  '/tweeter/placeholder-profiles/avatar_mango.png',
  '/tweeter/placeholder-profiles/avatar_pink.png',
  '/tweeter/placeholder-profiles/avatar_purple.png',
  '/tweeter/placeholder-profiles/avatar_yellow.png',
] as const;

export interface UserProfile {
  uid: string;
  username: string;
  pfp: string;
  email: string;
  isAnonymous: boolean;
}

interface StoredProfile {
  username: string;
  pfp: string;
  email: string;
}

function sanitizeUsername(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const normalized = trimmed.replace(/[^a-z0-9._-]+/g, '_').replace(/^[_\-.]+|[_\-.]+$/g, '');
  return normalized.length > 0 ? normalized : `user_${Date.now()}`;
}

function usernameToEmail(username: string): string {
  return `${sanitizeUsername(username)}@windose.local`;
}

function anonymousUsername(uid: string): string {
  return `anon_${uid.slice(0, 6)}`;
}

function randomAnonymousAvatar(): string {
  const index = Math.floor(Math.random() * ANON_PLACEHOLDER_AVATARS.length);
  return ANON_PLACEHOLDER_AVATARS[index] ?? DEFAULT_AVATAR;
}

function isAnonymousPlaceholderAvatar(value: string): boolean {
  return ANON_PLACEHOLDER_AVATARS.includes(value as (typeof ANON_PLACEHOLDER_AVATARS)[number]);
}

function isJoserUsername(value: string): boolean {
  return value.trim().toLowerCase() === JOSER_USERNAME;
}

function isJoserAvatar(value: string): boolean {
  return value.trim() === JOSER_AVATAR;
}

function resolveExclusiveAvatar(username: string, currentAvatar: string, isAnonymous: boolean): string {
  if (isJoserUsername(username)) {
    return JOSER_AVATAR;
  }
  if (isJoserAvatar(currentAvatar)) {
    return isAnonymous ? randomAnonymousAvatar() : DEFAULT_AVATAR;
  }
  return currentAvatar;
}

function loadStoredUser(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredProfile>;
    if (!parsed || typeof parsed !== 'object') return null;
    const username = String(parsed.username ?? '').trim();
    const pfp = String(parsed.pfp ?? DEFAULT_AVATAR);
    const email = String(parsed.email ?? '');
    if (!username || !email) return null;
    return { username, pfp, email };
  } catch {
    return null;
  }
}

function saveStoredUser(user: StoredProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export const useAuthStore = defineStore('auth', () => {
  const storedUser = ref<StoredProfile | null>(loadStoredUser());
  const currentUser = ref<UserProfile | null>(null);
  const ready = ref(false);
  const loading = ref(false);
  const error = ref('');
  const firebaseEnabled = ref(isFirebaseConfigured());

  let unsubscribe: Unsubscribe | null = null;

  const hasAccount = computed(() => !!storedUser.value);
  const isAuthenticated = computed(() => !!currentUser.value);

  async function upsertProfile(uid: string, username: string, pfp: string, isAnonymous = false): Promise<void> {
    const { db } = getFirebaseServices();
    await setDoc(
      doc(db, 'profiles', uid),
      {
        displayName: username,
        avatarId: pfp,
        isAnonymous,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }

  async function loadProfile(uid: string, email: string, isAnonymous: boolean): Promise<UserProfile> {
    const { db } = getFirebaseServices();
    const profileRef = doc(db, 'profiles', uid);
    const snap = await getDoc(profileRef);

    const fallbackName = isAnonymous ? anonymousUsername(uid) : email.split('@')[0] || 'user';
    const fallbackPfp = isAnonymous ? randomAnonymousAvatar() : DEFAULT_AVATAR;
    if (!snap.exists()) {
      await upsertProfile(uid, fallbackName, fallbackPfp, isAnonymous);
      return { uid, username: fallbackName, pfp: fallbackPfp, email, isAnonymous };
    }

    const data = snap.data() as Record<string, unknown>;
    const profileIsAnonymous = typeof data.isAnonymous === 'boolean' ? data.isAnonymous : isAnonymous;
    const profileName = String(data.displayName ?? fallbackName);
    const profileAvatar = String(data.avatarId ?? '').trim();
    let resolvedAvatar = profileAvatar || fallbackPfp;
    let needsProfileUpdate = false;

    if (profileIsAnonymous) {
      if (!isAnonymousPlaceholderAvatar(profileAvatar)) {
        resolvedAvatar = randomAnonymousAvatar();
        needsProfileUpdate = true;
      }
    } else if (!profileAvatar) {
      needsProfileUpdate = true;
    }

    const exclusiveAvatar = resolveExclusiveAvatar(profileName, resolvedAvatar, profileIsAnonymous);
    if (exclusiveAvatar !== resolvedAvatar) {
      resolvedAvatar = exclusiveAvatar;
      needsProfileUpdate = true;
    }

    if (needsProfileUpdate) {
      await upsertProfile(uid, profileName, resolvedAvatar, profileIsAnonymous);
    }

    return {
      uid,
      username: profileName,
      pfp: resolvedAvatar,
      email,
      isAnonymous: profileIsAnonymous,
    };
  }

  function setStoreUser(user: UserProfile | null): void {
    currentUser.value = user;
    if (!user) return;
    if (!user.isAnonymous && user.email) {
      storedUser.value = { username: user.username, pfp: user.pfp, email: user.email };
      saveStoredUser(storedUser.value);
    }
  }

  function ensureAuthListener(): void {
    if (!firebaseEnabled.value) {
      ready.value = true;
      return;
    }
    if (unsubscribe) return;

    const { auth } = getFirebaseServices();
    unsubscribe = onAuthStateChanged(
      auth,
      async (fbUser) => {
        if (!fbUser) {
          currentUser.value = null;
          ready.value = true;
          return;
        }
        try {
          const isAnon = fbUser.isAnonymous;
          const email = isAnon ? '' : fbUser.email ?? usernameToEmail('user');
          const profile = await loadProfile(fbUser.uid, email, isAnon);
          setStoreUser(profile);
        } catch (e) {
          error.value = e instanceof Error ? e.message : 'Failed to load profile.';
        } finally {
          ready.value = true;
        }
      },
      (e) => {
        error.value = e instanceof Error ? e.message : 'Authentication listener failed.';
        ready.value = true;
      },
    );
  }

  async function register(username: string, password: string, pfp: string): Promise<boolean> {
    error.value = '';
    if (!firebaseEnabled.value) {
      error.value = 'Firebase is not configured for auth.';
      return false;
    }
    const cleanName = username.trim();
    if (!cleanName) {
      error.value = 'Username is required.';
      return false;
    }
    loading.value = true;
    try {
      const email = usernameToEmail(cleanName);
      const { auth } = getFirebaseServices();
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const resolvedPfp = resolveExclusiveAvatar(cleanName, pfp, false);
      await upsertProfile(credential.user.uid, cleanName, resolvedPfp, false);
      setStoreUser({ uid: credential.user.uid, username: cleanName, pfp: resolvedPfp, email, isAnonymous: false });
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to register.';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function login(password: string, username?: string): Promise<boolean> {
    error.value = '';
    if (!firebaseEnabled.value) {
      error.value = 'Firebase is not configured for auth.';
      return false;
    }
    const fallbackUsername = username?.trim() ?? '';
    const email = storedUser.value?.email || (fallbackUsername ? usernameToEmail(fallbackUsername) : '');
    if (!email) {
      error.value = 'Enter a username to sign in.';
      return false;
    }
    loading.value = true;
    try {
      const { auth } = getFirebaseServices();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const profile = await loadProfile(credential.user.uid, email, false);
      setStoreUser(profile);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Incorrect password.';
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function logout(): Promise<void> {
    if (!firebaseEnabled.value) {
      currentUser.value = null;
      return;
    }
    const { auth } = getFirebaseServices();
    await signOut(auth);
    currentUser.value = null;
  }

  async function loginAnonymously(): Promise<boolean> {
    error.value = '';
    if (!firebaseEnabled.value) {
      error.value = 'Firebase is not configured for auth.';
      return false;
    }
    loading.value = true;
    try {
      const { auth } = getFirebaseServices();
      const credential = await signInAnonymously(auth);
      const profile = await loadProfile(credential.user.uid, '', true);
      setStoreUser(profile);
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to sign in anonymously.';
      return false;
    } finally {
      loading.value = false;
    }
  }

  function nuke(): void {
    currentUser.value = null;
    storedUser.value = null;
    saveStoredUser(null);
  }

  ensureAuthListener();

  return {
    storedUser,
    currentUser,
    hasAccount,
    isAuthenticated,
    ready,
    loading,
    error,
    firebaseEnabled,
    register,
    login,
    loginAnonymously,
    logout,
    nuke,
  };
});
