<template>
  <div class="jine-auth">
    <div class="auth-card">
      <div class="brand">
        <img src="/quickmenu/button_jine.png" class="logo" alt="JINE" />
        <div class="brand-copy">
          <div class="brand-title">JINE</div>
          <div class="brand-sub">{{ mode === 'login' ? 'Sign in to continue.' : 'Create your account.' }}</div>
        </div>
      </div>

      <div v-if="mode === 'login'" class="auth-form">
        <div class="form-title">Welcome back</div>

        <div v-if="storedUsername" class="user-greeting">
          <img :src="storedPfp" class="user-pfp" alt="Stored avatar" />
          <div class="username">@{{ storedUsername }}</div>
        </div>

        <input
          v-if="!storedUsername"
          type="text"
          v-model="loginUsername"
          placeholder="Username"
          class="input"
          maxlength="12"
          autocomplete="username"
        />
        <input
          type="password"
          v-model="password"
          placeholder="Password"
          class="input"
          autocomplete="current-password"
          @keydown.enter="handleLogin"
          @keydown="updateCapsLock"
          @keyup="updateCapsLock"
          @blur="clearCapsLock"
        />

        <div v-if="capsLockOn" class="caps-warning">Caps Lock is ON</div>

        <button class="btn primary" @click="handleLogin" :disabled="busy">
          {{ busy ? 'Signing in...' : 'Sign In' }}
        </button>

        <div class="error" v-if="error">{{ error }}</div>

        <div class="links">
          <button type="button" class="link" @click="mode = 'register'">Create an account</button>
          <button type="button" class="link" v-if="storedUsername" @click="clearAccount">Use new account</button>
        </div>
      </div>

      <div v-else class="auth-form">
        <div class="form-title">Create account</div>

        <div class="default-pfp">
          <img :src="defaultPfp" alt="Default avatar" />
          <span>Default avatar selected</span>
        </div>

        <input
          type="text"
          v-model="username"
          placeholder="Username"
          class="input"
          maxlength="12"
          autocomplete="username"
        />
        <input
          type="password"
          v-model="password"
          placeholder="Password"
          class="input"
          autocomplete="new-password"
          @keydown="updateCapsLock"
          @keyup="updateCapsLock"
          @blur="clearCapsLock"
        />
        <input
          type="password"
          v-model="confirmPassword"
          placeholder="Confirm Password"
          class="input"
          autocomplete="new-password"
          @keydown.enter="handleRegister"
          @keydown="updateCapsLock"
          @keyup="updateCapsLock"
          @blur="clearCapsLock"
        />

        <div v-if="capsLockOn" class="caps-warning">Caps Lock is ON</div>

        <button class="btn primary" @click="handleRegister" :disabled="busy">
          {{ busy ? 'Creating...' : 'Create Account' }}
        </button>

        <div class="error" v-if="error">{{ error }}</div>

        <div class="links">
          <button type="button" class="link" @click="mode = 'login'">Sign in?</button>
        </div>
      </div>
    </div>

    <div class="disclaimer">
      This site is mostly for fun. Even with the protections in place, use a throwaway password you do not use anywhere else.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '../stores/auth';

type AuthMode = 'login' | 'register';

const props = defineProps<{
  initialMode?: AuthMode;
}>();

const emit = defineEmits<{
  authenticated: [];
}>();

const auth = useAuthStore();
const defaultPfp = '/avatars/avatar_1.png';
const mode = ref<AuthMode>('register');
const loginUsername = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const capsLockOn = ref(false);

const storedUsername = computed(() => auth.storedUser?.username ?? '');
const storedPfp = computed(() => auth.storedUser?.pfp ?? defaultPfp);
const busy = computed(() => auth.loading);

watch(
  () => auth.error,
  (value) => {
    if (value) error.value = value;
  },
);

watch(
  () => props.initialMode,
  (value) => {
    if (value) {
      mode.value = value;
    }
  },
);

watch(mode, () => {
  error.value = '';
  password.value = '';
  confirmPassword.value = '';
  capsLockOn.value = false;
});

onMounted(() => {
  if (!auth.firebaseEnabled) {
    error.value = 'Firebase auth is not configured. Add VITE_FIREBASE_* env values.';
    return;
  }
  mode.value = props.initialMode ?? (auth.hasAccount ? 'login' : 'register');
});

function updateCapsLock(event: KeyboardEvent) {
  capsLockOn.value = event.getModifierState('CapsLock');
}

function clearCapsLock() {
  capsLockOn.value = false;
}

async function handleLogin() {
  if (!auth.firebaseEnabled) {
    error.value = 'Firebase auth is not configured.';
    return;
  }
  error.value = '';

  const success = await auth.login(password.value, loginUsername.value);
  if (!success) {
    error.value = auth.error || 'Incorrect password.';
    return;
  }
  password.value = '';
  capsLockOn.value = false;
  emit('authenticated');
}

async function handleRegister() {
  if (!auth.firebaseEnabled) {
    error.value = 'Firebase auth is not configured.';
    return;
  }
  if (!username.value || !password.value) {
    error.value = 'Fill all fields.';
    return;
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.';
    return;
  }

  const success = await auth.register(username.value, password.value, defaultPfp);
  if (!success) {
    error.value = auth.error || 'Failed to create account.';
    return;
  }
  password.value = '';
  confirmPassword.value = '';
  capsLockOn.value = false;
  emit('authenticated');
}

function clearAccount() {
  if (confirm('Delete saved account? This will wipe your history.')) {
    auth.nuke();
    mode.value = 'register';
    loginUsername.value = '';
    username.value = '';
    password.value = '';
    confirmPassword.value = '';
  }
}
</script>

<style scoped>
.jine-auth {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px;
  background: linear-gradient(180deg, #f4f7ff 0%, #e8efff 100%);
  font-family: var(--font-ui);
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.auth-card {
  width: 100%;
  max-width: 260px;
  border: 2px solid #9ab2ff;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 18px rgba(74, 102, 181, 0.15);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #d8e3ff;
  padding-bottom: 8px;
}
.logo {
  width: 38px;
  height: 38px;
  image-rendering: pixelated;
}
.brand-title {
  font-size: 15px;
  font-weight: 700;
  color: #2f4f9e;
  line-height: 1.1;
}
.brand-sub {
  font-size: 11px;
  color: #5775bd;
  margin-top: 1px;
}
.auth-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-title {
  font-weight: 700;
  color: #3d5fb7;
  font-size: 13px;
  text-align: left;
}
.input {
  border: 1px solid #a9bae8;
  padding: 8px;
  border-radius: 6px;
  outline: none;
  font-family: var(--font-ui);
  font-size: 12px;
}
.input:focus {
  border-color: #6b93ff;
  box-shadow: 0 0 0 2px rgba(107, 147, 255, 0.2);
}
.btn {
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: #7ea3ff;
  color: white;
  cursor: pointer;
  font-family: var(--font-ui);
  font-weight: bold;
}
.btn:hover:not(:disabled) {
  background: #6b93ff;
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: 2px;
  flex-wrap: wrap;
}
.link {
  color: #3d5fb7;
  font-size: 11px;
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(--font-ui);
  cursor: pointer;
  text-decoration: underline;
}
.error {
  color: #ff4a4a;
  font-size: 11px;
  text-align: left;
}
.disclaimer {
  font-size: 11px;
  line-height: 1.3;
  color: #334a85;
  background: #e7eeff;
  border: 1px solid #aebce6;
  border-radius: 6px;
  padding: 6px 8px;
  max-width: 260px;
}
.user-greeting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}
.user-pfp {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #9ab2ff;
}
.username {
  font-weight: 700;
  font-size: 12px;
  color: #2f4f9e;
}
.default-pfp {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border: 1px solid #d8e3ff;
  border-radius: 6px;
  background: #f6f9ff;
  color: #3d5fb7;
  font-size: 11px;
}
.default-pfp img {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #9ab2ff;
  object-fit: cover;
}
.caps-warning {
  color: #7b3800;
  background: #ffe4c8;
  border: 1px solid #ffbc84;
  border-radius: 6px;
  font-size: 11px;
  padding: 4px 6px;
}
</style>
