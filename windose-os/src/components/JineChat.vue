<template>
  <div ref="chatRootRef" class="jine-chat" :class="{ 'jine-chat--typing-preview': isComposerHidden }">
    <div class="chat-stack">
      <div ref="logRef" class="log">
        <div class="day-pill">Noon</div>
        <div v-for="msg in messages" :key="msg.id" class="message" :class="{ me: isOwnMessage(msg), sticker: msg.kind === 'sticker' }">
          <div class="avatar-column">
            <button
              type="button"
              class="avatar-btn"
              :title="`View ${msg.authorName}`"
              @click="openProfileCard(msg)"
            >
              <div class="avatar" aria-hidden="true" :style="getAvatarStyle(msg.authorAvatar, isOwnMessage(msg))"></div>
            </button>
            <button
              v-if="canDeleteMessage(msg)"
              type="button"
              class="message-delete-btn"
              :title="deleteMessageTitle(msg)"
              :aria-label="deleteMessageTitle(msg)"
              @click.stop="deleteMessageFromOverlay(msg)"
            >
              Delete
            </button>
          </div>
          
          <div class="message-content">
            <template v-if="msg.kind === 'sticker'">
              <div class="sticker-only">
                <img v-if="stickerMap[msg.body]" class="sticker-img" :src="stickerMap[msg.body]" :alt="msg.body" />
                <div v-else class="text">{{ msg.body }}</div>
              </div>
            </template>

            <div v-else class="bubble" :class="{ 'bubble--embed-fill': hasYouTubeEmbed(msg) }">
              <div class="text" v-if="displayMessageText(msg)">{{ displayMessageText(msg) }}</div>
              <div v-if="msg.embeds.length > 0" class="embed-list">
                <template v-for="embed in msg.embeds" :key="embed.url">
                  <iframe
                    v-if="embed.type === 'youtube'"
                    width="200"
                    height="113"
                    :src="toYouTubeEmbedSrc(embed.videoId)"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                    class="media-content media-content--youtube"
                  ></iframe>
                  <a
                    v-else
                    class="twitter-link"
                    :href="embed.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View post on X
                  </a>
                </template>
              </div>
            </div>
            <div v-if="isMessageExploding(msg.id)" class="message-explosion" aria-hidden="true">
              <div class="message-explosion-flash"></div>
              <img class="message-explosion-sprite" :src="explosionSprite" alt="" />
            </div>
          </div>
        </div>
        <div v-if="showTypingPreviewBubble" class="message me message--typing-preview">
          <div class="avatar-column" aria-hidden="true">
            <div class="avatar-btn avatar-btn--preview">
              <div class="avatar" :style="typingPreviewAvatarStyle"></div>
            </div>
          </div>
          <div class="message-content">
            <div class="bubble">
              <div class="text">{{ typingPreviewText }}</div>
            </div>
          </div>
        </div>
      </div>

      <aside v-if="canModerate && moderationAlertItems.length > 0" class="moderation-alerts">
        <div class="moderation-alerts-title">Moderator Alerts</div>
        <article
          v-for="incident in moderationAlertItems"
          :key="incident.id"
          class="moderation-alert-item"
        >
          <div class="moderation-alert-meta">
            @{{ incident.offenderName }} ({{ incident.offenderUid }})
          </div>
          <div class="moderation-alert-body">
            {{ moderationAlertSummary(incident) }}
          </div>
          <div class="moderation-alert-rec">{{ incident.recommendation }}</div>
        </article>
      </aside>

      <div class="stickers" :class="{ open: stickerOpen }" :aria-hidden="!stickerOpen">
        <div class="sticker-groups">
          <div class="sticker-grid">
            <button
              v-for="sticker in pchanStickers"
              :key="`pchan-${sticker.label}`"
              class="sticker-btn"
              :title="sticker.label"
              :aria-label="sticker.label"
              @click="sendSticker(sticker.label)"
            >
              <img :src="sticker.src" :alt="sticker.label" />
            </button>
          </div>
          <div
            v-if="pchanStickers.length > 0 && ameStickers.length > 0"
            class="sticker-group-divider"
            aria-hidden="true"
          ></div>
          <div class="sticker-grid">
            <button
              v-for="sticker in ameStickers"
              :key="`ame-${sticker.label}`"
              class="sticker-btn"
              :title="sticker.label"
              :aria-label="sticker.label"
              @click="sendSticker(sticker.label)"
            >
              <img :src="sticker.src" :alt="sticker.label" />
            </button>
          </div>
        </div>
      </div>
      
      <div class="embed-modal" v-if="embedOpen">
        <div class="embed-box">
             <div class="embed-title">Embed Media</div>
             <input v-model="embedUrl" placeholder="YouTube or Twitter/X URL..." class="embed-input" @keydown.enter="confirmEmbed" />
             <div class="embed-actions">
                 <button @click="confirmEmbed">OK</button>
                 <button @click="embedOpen = false">Cancel</button>
             </div>
        </div>
      </div>

      <aside v-if="selectedProfile" class="profile-card">
        <button type="button" class="profile-close" aria-label="Close profile card" @click="closeProfileCard">
          x
        </button>
        <div class="profile-header">
          <div class="profile-avatar" :style="getAvatarStyle(selectedProfile.avatarUrl)"></div>
          <div class="profile-meta">
            <div class="profile-name">@{{ selectedProfile.username }}</div>
            <div v-if="selectedProfile.role" class="profile-role">{{ selectedProfile.role }}</div>
            <div class="profile-join">Joined {{ formatJoinDate(selectedProfile.joinedAt) }}</div>
          </div>
        </div>

        <div v-if="profileLoading" class="profile-state">Loading profile...</div>
        <div v-else-if="profileError" class="profile-state profile-state--error">{{ profileError }}</div>

        <div class="profile-log-title">Message log</div>
        <div class="profile-log">
          <div v-if="selectedProfileLog.length === 0" class="profile-log-empty">No non-sticker messages.</div>
          <div v-for="entry in selectedProfileLog" :key="entry.id" class="profile-log-item">
            <div class="profile-log-time">{{ formatLogDate(entry.createdAt) }}</div>
            <div class="profile-log-text">{{ entry.body }}</div>
          </div>
        </div>
      </aside>
    </div>

    <button
      v-if="jineAuthEnabled && auth.isAuthenticated"
      type="button"
      class="logout-float"
      @click="handleLogout"
    >
      Log out
    </button>

    <div v-if="chatError" class="chat-error">{{ chatError }}</div>
    <div class="composer-shell" :class="{ 'composer-shell--hidden': isComposerHidden }">
      <div class="composer" :class="{ 'composer--hidden': isComposerHidden }">
        <button type="button" class="embed-btn" @click="openEmbed" title="Embed Media">+</button>
        <textarea
          ref="inputRef"
          v-model="draft"
          class="input"
          maxlength="200"
          placeholder="Type a reply..."
          @keydown="onKeydown"
          @input="onDraftInput"
        ></textarea>
        <button
          type="button"
          class="emote-toggle"
          :class="{ active: stickerOpen }"
          :aria-expanded="stickerOpen"
          :title="stickerOpen ? 'Close sticker picker' : 'Open sticker picker'"
          :aria-label="stickerOpen ? 'Close sticker picker' : 'Open sticker picker'"
          @click="toggleStickers"
          @mouseenter="handleEmoteMouseEnter"
          @mouseleave="handleEmoteMouseLeave"
        >
          <img
            v-if="currentEmoteEmoji"
            class="emote-icon emote-icon--img"
            :class="{ 'is-hovered': emoteHovered }"
            :src="currentEmoteEmoji"
            alt=""
            aria-hidden="true"
          />
          <span v-else class="emote-icon" aria-hidden="true">&#9786;</span>
        </button>
        <button type="button" class="send" @click="sendText" aria-label="Send">
          &gt;
        </button>
      </div>
    </div>

    <div v-if="jineAuthEnabled && showAuthPrompt" class="auth-modal" @click.self="dismissAuthPrompt">
      <div class="auth-modal-card">
        <button type="button" class="auth-close" @click="dismissAuthPrompt" aria-label="Close">
          x
        </button>
        <div v-if="authPromptView === 'choice'" class="auth-choice">
          <div class="auth-choice-title">Use an account?</div>
          <div class="auth-choice-copy">
            You can keep chatting anonymously, but anonymous mode has limits:
          </div>
          <div class="auth-choice-copy">- 1 sticker per hour</div>
          <div class="auth-choice-copy">- 5 messages every 3 hours</div>
          <details class="auth-safety">
            <summary>How we keep accounts safer</summary>
            <div class="auth-safety-body">
              <div class="auth-safety-line">
                <strong>1. Sign-in system:</strong> We use Firebase Authentication for account creation, login, and session handling.
              </div>
              <div class="auth-safety-line">
                <strong>2. Password handling:</strong> This app sends your password to Firebase Auth for verification and does not store your raw password in local storage.
              </div>
              <div class="auth-safety-line">
                <strong>3. Database rules:</strong> Firestore rules restrict message creation to signed-in users, and deletion to message owners or moderators.
              </div>
              <div class="auth-safety-line">
                <strong>4. Profile protections:</strong> Database rules only allow users to create and update their own profile records.
              </div>
              <div class="auth-safety-line">
                <strong>5. Abuse controls:</strong> We apply spam controls, cooldowns, and moderation incident logging for high-rate abuse patterns.
              </div>
              <div class="auth-safety-line">
                <strong>6. Browser storage:</strong> We store convenience account/session details in this browser (username/avatar/email), but not plaintext passwords.
              </div>
              <div class="auth-safety-warning">
                Even with these protections, this is still a fun project. Use a throwaway password you do not use anywhere else.
              </div>
            </div>
          </details>
          <div class="auth-choice-actions">
            <button type="button" class="auth-choice-btn primary" @click="openAuthPrompt('register')">Create account</button>
            <button type="button" class="auth-choice-btn" @click="openAuthPrompt('login')">Sign in</button>
            <button type="button" class="auth-choice-btn" @click="continueAnonymously">Continue anonymously</button>
          </div>
          <div v-if="authPromptError" class="auth-choice-error">{{ authPromptError }}</div>
        </div>
        <JineAuth v-else :initial-mode="authPromptMode" @authenticated="handleAuthSuccess" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch, computed } from 'vue';
import { useJineStore } from '../stores/jine';
import { useMedicineStore } from '../stores/medicine';
import { useAuthStore } from '../stores/auth';
import { parseEmbedFromUrl, parseEmbedsFromText, toYouTubeEmbedSrc } from '../embeds';
import { useSettings } from '../useSettings';
import type { JineDeleteEffect, JineMessage, JineModerationIncident } from '../stores/jine';
import { getJineProfileSummary, type JineProfileSummary } from '../jineCloud';
import JineAuth from './JineAuth.vue';
import explosionSprite from '../assets/emoji/emoji_explosion.png';

const jineStore = useJineStore();
const medicineStore = useMedicineStore();
const auth = useAuthStore();
const { settings } = useSettings();

const MODERATOR_USERNAMES = new Set(['joser']);

function isModeratorUsername(username: string): boolean {
  return MODERATOR_USERNAMES.has(username.trim().toLowerCase());
}

const messages = computed(() => jineStore.messages);
const deleteEffects = computed(() => jineStore.deleteEffects);
const moderationIncidents = computed(() => jineStore.moderationIncidents);
const canModerate = computed(() => isModeratorUsername(auth.currentUser?.username ?? ''));
const isAnonymousSession = computed(() => auth.currentUser?.isAnonymous === true);
const moderationAlertItems = computed(() => moderationIncidents.value.slice(0, 3));

const draft = ref('');
const chatRootRef = ref<HTMLDivElement | null>(null);
const logRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);
const stickerOpen = ref(false);
const emoteHovered = ref(false);
const currentEmoteEmoji = ref('');
const embedOpen = ref(false);
const embedUrl = ref('');
const chatError = ref('');
const showAuthPrompt = ref(false);
const authPromptMode = ref<AuthMode>('register');
const authPromptView = ref<'choice' | 'auth'>('choice');
const authPromptError = ref('');
const selectedProfile = ref<ProfileCard | null>(null);
const profileLoading = ref(false);
const profileError = ref('');

const profileCache = new Map<string, JineProfileSummary | null>();
const anonymousPromptAcknowledged = ref(false);
const emojiIconModules = import.meta.glob('../assets/emoji/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;
const emojiIconPool = Object.values(emojiIconModules).sort();

type AuthMode = 'login' | 'register';

interface ProfileCard {
  uid: string;
  username: string;
  avatarUrl: string;
  joinedAt: number | null;
  role: string | null;
}

interface ProfileLogEntry {
  id: string;
  createdAt: number;
  body: string;
}

const sfxVolumeMin = computed(() => Number(settings.value.sfxVolumeMin ?? 0));
const sfxVolumeMax = computed(() => Number(settings.value.sfxVolumeMax ?? 1));
const sfxEnabled = computed(() => Boolean(settings.value.sfxEnabled ?? true));
const sfxJineSendPath = computed(() => String(settings.value.sfxJineSendPath ?? ''));
const jineFlipOwnPfp = computed(() => Boolean(settings.value.jineFlipOwnPfp ?? false));
const jineAuthEnabled = computed(() => Boolean(settings.value.jineAuthEnabled ?? true));
const jineEmbedYouTubeEnabled = computed(() => Boolean(settings.value.jineEmbedYouTubeEnabled ?? true));
const jineEmbedTwitterEnabled = computed(() => Boolean(settings.value.jineEmbedTwitterEnabled ?? true));
const volume = computed(() => (settings.value.sfxVolumeDefault as number) || 0.5);
const SFX_MASTER_GAIN = 0.5;
const TYPING_PREVIEW_IDLE_MS = 900;
const TYPING_TICK_MIN_INTERVAL_MS = 18;
const DELETE_EXPLOSION_MS = 340;
const DELETE_BOOM_MIN_INTERVAL_MS = 60;

const explodingMessageMap = ref<Record<string, string>>({});
const explosionTimeouts = new Map<string, number>();
const consumedDeleteEffectIds = new Set<string>();
let deleteBoomContext: AudioContext | null = null;
let deleteBoomNoiseBuffer: AudioBuffer | null = null;
let lastDeleteBoomAt = 0;
let typingTickContext: AudioContext | null = null;
let typingTickNoiseBuffer: AudioBuffer | null = null;
let lastTypingTickAt = 0;

function clampSfxVolume(value: number) {
  const min = sfxVolumeMin.value;
  const max = sfxVolumeMax.value;
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function playSfx(path: string) {
  if (!sfxEnabled.value) return;
  if (!path) return;
  const src = path.startsWith('/') ? path : `/${path}`;
  
  const audio = new Audio(src);
  audio.volume = clampSfxVolume(volume.value * SFX_MASTER_GAIN);

  try {
    audio.play().catch(() => {});
  } catch {
    // ignore
  }
}

function toggleStickers() {
  stickerOpen.value = !stickerOpen.value;
}

function pickRandomEmoteEmoji(avoidCurrent = true) {
  if (emojiIconPool.length === 0) return;
  const pick = () => emojiIconPool[Math.floor(Math.random() * emojiIconPool.length)] ?? '';
  if (!avoidCurrent || emojiIconPool.length === 1 || !currentEmoteEmoji.value) {
    currentEmoteEmoji.value = pick();
    return;
  }
  let next = currentEmoteEmoji.value;
  while (next === currentEmoteEmoji.value) {
    next = pick();
  }
  currentEmoteEmoji.value = next;
}

function handleEmoteMouseEnter() {
  emoteHovered.value = true;
  pickRandomEmoteEmoji(true);
}

function handleEmoteMouseLeave() {
  emoteHovered.value = false;
}

function resizeInput(force = false) {
  if (!inputRef.value) return;
  const style = window.getComputedStyle(inputRef.value);
  const minHeight = Number.parseFloat(style.minHeight) || 18;
  inputRef.value.style.height = `${minHeight}px`;
  if (!force && isComposerHidden.value) {
    inputRef.value.style.overflowY = 'hidden';
    return;
  }
  inputRef.value.style.overflowY = inputRef.value.scrollHeight > minHeight + 1 ? 'auto' : 'hidden';
}

const typingPreviewActive = ref(false);
let typingPreviewIdleTimer: number | null = null;
let typingPreviewTimerToken = 0;
let stabilizeScrollRafId: number | null = null;
const hasDraftText = computed(() => draft.value.trim().length > 0);
const typingPreviewText = computed(() => draft.value);
const showTypingPreviewBubble = computed(() => typingPreviewActive.value && hasDraftText.value);
const isComposerHidden = computed(() => showTypingPreviewBubble.value);
const typingPreviewAvatarStyle = computed(() =>
  getAvatarStyle(auth.currentUser?.pfp ?? '/avatars/avatar_1.png', true),
);

function clearTypingPreviewIdleTimer() {
  typingPreviewTimerToken += 1;
  if (typingPreviewIdleTimer !== null) {
    window.clearTimeout(typingPreviewIdleTimer);
    typingPreviewIdleTimer = null;
  }
}

function getAudioContextCtor(): typeof AudioContext | null {
  const webkitCtor = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return window.AudioContext ?? webkitCtor ?? null;
}

function getDeleteBoomContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (deleteBoomContext) return deleteBoomContext;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  deleteBoomContext = new Ctor();
  return deleteBoomContext;
}

function getTypingTickContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (typingTickContext) return typingTickContext;
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  typingTickContext = new Ctor();
  return typingTickContext;
}

function getDeleteBoomNoiseBuffer(context: AudioContext): AudioBuffer {
  if (deleteBoomNoiseBuffer && deleteBoomNoiseBuffer.sampleRate === context.sampleRate) {
    return deleteBoomNoiseBuffer;
  }

  const durationSeconds = 0.32;
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);

  // Basic sample-and-hold quantization for a coarse bitcrushed texture.
  const holdSamples = Math.max(8, Math.floor(sampleRate / 700));
  let held = 0;
  for (let i = 0; i < length; i += 1) {
    if (i % holdSamples === 0) {
      held = Math.random() * 2 - 1;
    }
    channel[i] = held;
  }

  deleteBoomNoiseBuffer = buffer;
  return buffer;
}

function getTypingTickNoiseBuffer(context: AudioContext): AudioBuffer {
  if (typingTickNoiseBuffer && typingTickNoiseBuffer.sampleRate === context.sampleRate) {
    return typingTickNoiseBuffer;
  }

  const durationSeconds = 0.24;
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const buffer = context.createBuffer(1, length, sampleRate);
  const channel = buffer.getChannelData(0);

  let previous = 0;
  for (let i = 0; i < length; i += 1) {
    const white = (Math.random() * 2) - 1;
    previous = (previous * 0.34) + (white * 0.66);
    channel[i] = previous;
  }

  typingTickNoiseBuffer = buffer;
  return buffer;
}

function playTypingTickSfx() {
  if (!sfxEnabled.value) return;
  if (typeof performance === 'undefined') return;
  const nowMs = performance.now();
  if (nowMs - lastTypingTickAt < TYPING_TICK_MIN_INTERVAL_MS) return;
  lastTypingTickAt = nowMs;

  const context = getTypingTickContext();
  if (!context) return;
  if (context.state === 'suspended') {
    void context.resume().catch(() => {});
  }

  const start = context.currentTime + 0.001;
  const medicineRate = medicineStore.effectActive
    ? Math.max(0.55, Math.min(1.08, medicineStore.audioRateMultiplier))
    : 1;
  const duration = (0.028 + (Math.random() * 0.022)) / medicineRate;
  const baseGain = clampSfxVolume(volume.value * SFX_MASTER_GAIN * 2.944);
  if (baseGain <= 0) return;

  const output = context.createGain();
  output.gain.setValueAtTime(baseGain * (0.78 + (Math.random() * 0.34)), start);

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = getTypingTickNoiseBuffer(context);
  noiseSource.playbackRate.setValueAtTime((0.88 + (Math.random() * 0.3)) * medicineRate, start);
  const noiseBand = context.createBiquadFilter();
  noiseBand.type = 'bandpass';
  noiseBand.frequency.setValueAtTime((1250 + (Math.random() * 900)) * medicineRate, start);
  noiseBand.Q.setValueAtTime(0.85 + (Math.random() * 0.75), start);
  const noiseTone = context.createBiquadFilter();
  noiseTone.type = 'lowpass';
  noiseTone.frequency.setValueAtTime((2900 + (Math.random() * 1700)) * medicineRate, start);
  const noiseEnv = context.createGain();
  noiseEnv.gain.setValueAtTime(0.0001, start);
  noiseEnv.gain.linearRampToValueAtTime(0.9, start + (0.0025 / medicineRate));
  noiseEnv.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const tone = context.createOscillator();
  tone.type = Math.random() > 0.6 ? 'square' : 'triangle';
  tone.frequency.setValueAtTime((1240 + (Math.random() * 780)) * medicineRate, start);
  tone.frequency.exponentialRampToValueAtTime((780 + (Math.random() * 420)) * medicineRate, start + (duration * 0.95));
  const toneEnv = context.createGain();
  toneEnv.gain.setValueAtTime(0.0001, start);
  toneEnv.gain.linearRampToValueAtTime(0.22, start + (0.0015 / medicineRate));
  toneEnv.gain.exponentialRampToValueAtTime(0.0001, start + (duration * 0.78));

  noiseSource.connect(noiseBand);
  noiseBand.connect(noiseTone);
  noiseTone.connect(noiseEnv);
  noiseEnv.connect(output);

  tone.connect(toneEnv);
  toneEnv.connect(output);

  let panner: StereoPannerNode | null = null;
  if (typeof context.createStereoPanner === 'function') {
    panner = context.createStereoPanner();
    panner.pan.setValueAtTime((Math.random() * 0.28) - 0.14, start);
    output.connect(panner);
    panner.connect(context.destination);
  } else {
    output.connect(context.destination);
  }

  noiseSource.start(start, Math.random() * 0.12);
  noiseSource.stop(start + duration + 0.008);
  tone.start(start);
  tone.stop(start + duration + 0.01);

  window.setTimeout(() => {
    noiseSource.disconnect();
    noiseBand.disconnect();
    noiseTone.disconnect();
    noiseEnv.disconnect();
    tone.disconnect();
    toneEnv.disconnect();
    output.disconnect();
    if (panner) panner.disconnect();
  }, Math.ceil((duration + 0.08) * 1000));
}

function playDeleteBoomSfx() {
  if (!sfxEnabled.value) return;
  if (typeof performance === 'undefined') return;
  const nowMs = performance.now();
  if (nowMs - lastDeleteBoomAt < DELETE_BOOM_MIN_INTERVAL_MS) return;
  lastDeleteBoomAt = nowMs;

  const context = getDeleteBoomContext();
  if (!context) return;
  if (context.state === 'suspended') {
    void context.resume().catch(() => {});
  }

  const rateMultiplier = medicineStore.effectActive ? Math.max(0.55, Math.min(1.08, medicineStore.audioRateMultiplier)) : 1;
  const temporalScale = 1 / rateMultiplier;
  const reverbMix = medicineStore.effectActive
    ? Math.max(0, Math.min(1, medicineStore.reverbMix))
    : 0;
  const start = context.currentTime + 0.006;
  const output = context.createGain();
  output.gain.setValueAtTime(clampSfxVolume(volume.value * SFX_MASTER_GAIN), start);

  const dry = context.createGain();
  const wet = context.createGain();
  const delay = context.createDelay(1);
  const feedback = context.createGain();
  const damp = context.createBiquadFilter();
  damp.type = 'lowpass';
  dry.gain.setValueAtTime(1 - Math.min(0.62, reverbMix * 0.52), start);
  wet.gain.setValueAtTime(0.68 * reverbMix, start);
  delay.delayTime.setValueAtTime(0.045 + (0.16 * reverbMix), start);
  feedback.gain.setValueAtTime(0.14 + (0.58 * reverbMix), start);
  damp.frequency.setValueAtTime(1800 - (reverbMix * 780), start);

  output.connect(dry);
  dry.connect(context.destination);
  output.connect(delay);
  delay.connect(damp);
  damp.connect(wet);
  wet.connect(context.destination);
  delay.connect(feedback);
  feedback.connect(delay);

  const noiseSource = context.createBufferSource();
  noiseSource.buffer = getDeleteBoomNoiseBuffer(context);
  const noiseFilter = context.createBiquadFilter();
  noiseFilter.type = 'lowpass';
  noiseFilter.frequency.setValueAtTime(240 * rateMultiplier, start);
  noiseFilter.frequency.exponentialRampToValueAtTime(72 * rateMultiplier, start + (0.26 * temporalScale));
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, start);
  noiseGain.gain.exponentialRampToValueAtTime(0.95, start + (0.01 * temporalScale));
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, start + (0.28 * temporalScale));

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(output);
  noiseSource.start(start);
  noiseSource.stop(start + (0.3 * temporalScale));

  const boomTone = context.createOscillator();
  boomTone.type = 'square';
  boomTone.frequency.setValueAtTime(116 * rateMultiplier, start);
  boomTone.frequency.exponentialRampToValueAtTime(48 * rateMultiplier, start + (0.21 * temporalScale));
  const boomGain = context.createGain();
  boomGain.gain.setValueAtTime(0.0001, start);
  boomGain.gain.exponentialRampToValueAtTime(0.24, start + (0.01 * temporalScale));
  boomGain.gain.exponentialRampToValueAtTime(0.0001, start + (0.22 * temporalScale));

  boomTone.connect(boomGain);
  boomGain.connect(output);
  boomTone.start(start);
  boomTone.stop(start + (0.24 * temporalScale));

  window.setTimeout(() => {
    output.disconnect();
    dry.disconnect();
    wet.disconnect();
    delay.disconnect();
    feedback.disconnect();
    damp.disconnect();
  }, Math.ceil((650 * temporalScale) + (560 * reverbMix)));
}

function clearExplosionForMessage(messageId: string): void {
  const timeoutId = explosionTimeouts.get(messageId);
  if (timeoutId !== undefined) {
    window.clearTimeout(timeoutId);
    explosionTimeouts.delete(messageId);
  }
  if (!(messageId in explodingMessageMap.value)) return;
  const next = { ...explodingMessageMap.value };
  delete next[messageId];
  explodingMessageMap.value = next;
}

function triggerMessageExplosion(messageId: string): void {
  if (!messageId) return;
  const next = { ...explodingMessageMap.value, [messageId]: messageId };
  explodingMessageMap.value = next;

  const existing = explosionTimeouts.get(messageId);
  if (existing !== undefined) {
    window.clearTimeout(existing);
  }
  const timeoutId = window.setTimeout(() => {
    clearExplosionForMessage(messageId);
  }, DELETE_EXPLOSION_MS);
  explosionTimeouts.set(messageId, timeoutId);

  playDeleteBoomSfx();
}

function isMessageExploding(messageId: string): boolean {
  return messageId in explodingMessageMap.value;
}

function applyDeleteEffect(effect: JineDeleteEffect): void {
  if (!effect.id || consumedDeleteEffectIds.has(effect.id)) return;
  consumedDeleteEffectIds.add(effect.id);
  triggerMessageExplosion(effect.messageId);
  jineStore.consumeDeleteEffect(effect.id);
}

function stabilizeChatRootScroll() {
  if (!chatRootRef.value) return;
  if (chatRootRef.value.scrollTop !== 0) {
    chatRootRef.value.scrollTop = 0;
  }
}

function stabilizeChatRootScrollDeferred() {
  if (stabilizeScrollRafId !== null) {
    window.cancelAnimationFrame(stabilizeScrollRafId);
  }
  stabilizeScrollRafId = window.requestAnimationFrame(() => {
    stabilizeScrollRafId = null;
    stabilizeChatRootScroll();
  });
}

function stopTypingPreview() {
  typingPreviewActive.value = false;
  clearTypingPreviewIdleTimer();
  stabilizeChatRootScroll();
}

function keepTypingPreviewActive() {
  typingPreviewActive.value = true;
  stickerOpen.value = false;
  stabilizeChatRootScroll();
  stabilizeChatRootScrollDeferred();
  armTypingPreviewIdleTimer();
}

function armTypingPreviewIdleTimer() {
  if (typingPreviewIdleTimer !== null) {
    window.clearTimeout(typingPreviewIdleTimer);
  }
  const token = ++typingPreviewTimerToken;
  typingPreviewIdleTimer = window.setTimeout(() => {
    if (token !== typingPreviewTimerToken) return;
    typingPreviewActive.value = false;
    typingPreviewIdleTimer = null;
  }, TYPING_PREVIEW_IDLE_MS);
}

function onDraftInput(event: Event) {
  const textarea = event.target as HTMLTextAreaElement | null;
  const hasText = (textarea?.value ?? draft.value).trim().length > 0;
  if (!hasText) {
    resizeInput(true);
    stopTypingPreview();
    return;
  }
  keepTypingPreviewActive();
  resizeInput();
  scrollToBottom();
}

function openAuthPrompt(mode: AuthMode = 'register') {
  if (!jineAuthEnabled.value) return;
  authPromptMode.value = mode;
  authPromptView.value = 'auth';
  authPromptError.value = '';
  showAuthPrompt.value = true;
}

function openSendGatePrompt(mode: AuthMode = 'register') {
  if (!jineAuthEnabled.value) return;
  authPromptMode.value = mode;
  authPromptView.value = 'choice';
  authPromptError.value = '';
  showAuthPrompt.value = true;
}

function dismissAuthPrompt() {
  showAuthPrompt.value = false;
  authPromptView.value = 'choice';
  authPromptError.value = '';
}

async function ensureCanSend(mode: AuthMode = 'register'): Promise<boolean> {
  if (!jineAuthEnabled.value) {
    if (auth.firebaseEnabled && !auth.isAuthenticated) {
      const signedIn = await auth.loginAnonymously();
      if (!signedIn) {
        chatError.value = auth.error || 'Unable to start anonymous session.';
        return false;
      }
    }
    anonymousPromptAcknowledged.value = true;
    authPromptError.value = '';
    return true;
  }
  if (!auth.isAuthenticated) {
    openSendGatePrompt(mode);
    return false;
  }
  if (isAnonymousSession.value && !anonymousPromptAcknowledged.value) {
    openSendGatePrompt(mode);
    return false;
  }
  authPromptError.value = '';
  return true;
}

async function continueAnonymously() {
  authPromptError.value = '';
  if (!auth.isAuthenticated) {
    const signedIn = await auth.loginAnonymously();
    if (!signedIn) {
      authPromptError.value = auth.error || 'Failed to continue anonymously.';
      return;
    }
  }
  anonymousPromptAcknowledged.value = true;
  showAuthPrompt.value = false;
  authPromptView.value = 'choice';
  authPromptError.value = '';
  nextTick(() => inputRef.value?.focus());
}

function handleAuthSuccess() {
  showAuthPrompt.value = false;
  authPromptView.value = 'choice';
  authPromptError.value = '';
  anonymousPromptAcknowledged.value = true;
  nextTick(() => inputRef.value?.focus());
}

interface StickerOption {
  label: string;
  src: string;
  group: 'pchan' | 'ame';
}

const stickers: StickerOption[] = [
  { label: 'OK', src: '/stickers/sticker_ok.png', group: 'pchan' },
  { label: 'OMG', src: '/stickers/sticker_omg.png', group: 'pchan' },
  { label: 'SAD', src: '/stickers/sticker_panic.png', group: 'pchan' },
  { label: 'IDC', src: '/stickers/sticker_idc.png', group: 'pchan' },
  { label: 'SORRY', src: '/stickers/sticker_deflate.png', group: 'pchan' },
  { label: 'LOVE', src: '/stickers/sticker_love.png', group: 'pchan' },
  { label: 'THIS', src: '/stickers/sticker_this.png', group: 'pchan' },
  { label: 'ZZZ', src: '/stickers/sticker_zzz.png', group: 'pchan' },
  { label: 'HI', src: '/stickers/sticker_amechan.png', group: 'ame' },
];

const pchanStickers = stickers.filter((sticker) => sticker.group === 'pchan');
const ameStickers = stickers.filter((sticker) => sticker.group === 'ame');

const stickerMap: Record<string, string> = stickers.reduce((acc, item) => {
  acc[item.label] = item.src;
  return acc;
}, {} as Record<string, string>);

function scrollToBottom() {
  nextTick(() => {
    if (!logRef.value) return;
    logRef.value.scrollTop = logRef.value.scrollHeight;
    stabilizeChatRootScroll();
    stabilizeChatRootScrollDeferred();
  });
}

async function performSendText(value: string): Promise<boolean> {
  const embeds = parseEmbedsFromText(value).filter((embed) => {
    if (embed.type === 'youtube') return jineEmbedYouTubeEnabled.value;
    if (embed.type === 'twitter') return jineEmbedTwitterEnabled.value;
    return true;
  });

  const ok = await jineStore.sendMessage('text', value, embeds);
  if (!ok) {
    chatError.value = jineStore.syncError || 'Failed to send message.';
    return false;
  }
  chatError.value = '';
  playSfx(sfxJineSendPath.value);
  draft.value = '';
  resizeInput();
  scrollToBottom();
  return true;
}

async function sendText() {
  const value = draft.value.trim();
  if (!value) return;
  stopTypingPreview();
  const canSend = await ensureCanSend();
  if (!canSend) return;
  await performSendText(value);
}

async function performSendSticker(label: string): Promise<boolean> {
  const ok = await jineStore.sendMessage('sticker', label, []);
  if (!ok) {
    chatError.value = jineStore.syncError || 'Failed to send sticker.';
    return false;
  }
  chatError.value = '';
  playSfx(sfxJineSendPath.value);
  scrollToBottom();
  stickerOpen.value = false;
  return true;
}

async function sendSticker(label: string) {
  const canSend = await ensureCanSend();
  if (!canSend) return;
  await performSendSticker(label);
}

function canDeleteMessage(message: JineMessage): boolean {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  if (message.authorUid === uid) return true;
  return canModerate.value;
}

function deleteMessageTitle(message: JineMessage): string {
  if (canModerate.value && !isOwnMessage(message)) {
    return `Delete ${message.authorName}'s message`;
  }
  return 'Delete your message';
}

function deleteMessageFromOverlay(message: JineMessage) {
  if (!canDeleteMessage(message)) return;
  void jineStore.deleteMessage(message.id).then((ok) => {
    if (!ok) {
      chatError.value = jineStore.syncError || 'Failed to delete message.';
      return;
    }
    chatError.value = '';
  });
}

function getFallbackJoinDate(uid: string): number | null {
  const authored = messages.value.filter((msg) => msg.authorUid === uid && msg.createdAt > 0);
  const first = authored[0];
  if (!first) return null;
  return authored.reduce((min, msg) => Math.min(min, msg.createdAt), first.createdAt);
}

async function openProfileCard(message: JineMessage) {
  profileError.value = '';
  selectedProfile.value = {
    uid: message.authorUid,
    username: message.authorName || 'unknown',
    avatarUrl: message.authorAvatar || '/avatars/avatar_1.png',
    joinedAt: getFallbackJoinDate(message.authorUid),
    role: isModeratorUsername(message.authorName || '') ? 'Moderator' : null,
  };

  if (!auth.isAuthenticated) return;

  profileLoading.value = true;
  try {
    let summary = profileCache.get(message.authorUid);
    if (summary === undefined) {
      summary = await getJineProfileSummary(message.authorUid);
      profileCache.set(message.authorUid, summary);
    }

    const current = selectedProfile.value;
    if (summary && current && current.uid === message.authorUid) {
      selectedProfile.value = {
        uid: message.authorUid,
        username: summary.username || current.username,
        avatarUrl: summary.avatarUrl || current.avatarUrl,
        joinedAt: summary.createdAt ?? current.joinedAt,
        role: isModeratorUsername(summary.username || current.username) ? 'Moderator' : null,
      };
    }
  } catch {
    profileError.value = 'Profile details unavailable.';
  } finally {
    profileLoading.value = false;
  }
}

function closeProfileCard() {
  selectedProfile.value = null;
  profileLoading.value = false;
  profileError.value = '';
}

function shouldPlayTypingTick(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return false;
  if (event.isComposing) return false;
  if (event.ctrlKey || event.metaKey || event.altKey) return false;
  if (event.key === 'Enter' || event.key === 'Tab' || event.key === 'Escape') return false;
  if (event.key.length !== 1) return false;

  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement)) return true;
  if (target.maxLength <= 0) return true;
  if (target.selectionStart !== target.selectionEnd) return true;
  return target.value.length < target.maxLength;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    void sendText();
    return;
  }
  if (shouldPlayTypingTick(e)) {
    playTypingTickSfx();
  }
  if (!e.ctrlKey && !e.metaKey && !e.altKey) {
    keepTypingPreviewActive();
  }
}

async function openEmbed() {
  embedUrl.value = '';
  embedOpen.value = true;
}

async function performSendEmbed(url: string): Promise<boolean> {
  const parsed = parseEmbedFromUrl(url);
  if (!parsed) {
    chatError.value = 'Only YouTube and Twitter/X links are supported.';
    return false;
  }
  if (parsed.type === 'youtube' && !jineEmbedYouTubeEnabled.value) {
    chatError.value = 'YouTube embeds are disabled in settings.';
    return false;
  }
  if (parsed.type === 'twitter' && !jineEmbedTwitterEnabled.value) {
    chatError.value = 'Twitter/X embeds are disabled in settings.';
    return false;
  }

  const ok = await jineStore.sendMessage('text', parsed.url, [parsed]);
  if (!ok) {
    chatError.value = jineStore.syncError || 'Failed to send embed.';
    return false;
  }
  chatError.value = '';
  playSfx(sfxJineSendPath.value);
  embedOpen.value = false;
  scrollToBottom();
  return true;
}

async function confirmEmbed() {
  const value = embedUrl.value.trim();
  if (!value) return;
  const canSend = await ensureCanSend();
  if (!canSend) return;
  await performSendEmbed(value);
}

function isOwnMessage(msg: JineMessage) {
  const uid = auth.currentUser?.uid;
  return !!uid && msg.authorUid === uid;
}

function getAvatarStyle(avatarUrl: string, isOwn = false) {
  if (!avatarUrl) return {};
  const shouldFlip = isOwn && jineFlipOwnPfp.value;
  return {
    backgroundImage: `url('${avatarUrl}')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transform: shouldFlip ? 'scaleX(-1)' : undefined,
  };
}

function stripYouTubeUrls(msg: JineMessage): string {
  const youtubeUrls = msg.embeds
    .filter((embed) => embed.type === 'youtube')
    .map((embed) => embed.url)
    .filter((value) => value.length > 0);
  if (youtubeUrls.length === 0) return msg.body;

  let cleaned = msg.body;
  for (const url of youtubeUrls) {
    const normalized = url.replace(/\/+$/, '');
    cleaned = cleaned.split(url).join(' ');
    if (normalized && normalized !== url) {
      cleaned = cleaned.split(normalized).join(' ');
    }
    cleaned = cleaned.split(`${normalized}/`).join(' ');
  }
  return cleaned.replace(/\s+/g, ' ').trim();
}

function displayMessageText(msg: JineMessage): string {
  return stripYouTubeUrls(msg);
}

function hasYouTubeEmbed(msg: JineMessage): boolean {
  return msg.embeds.some((embed) => embed.type === 'youtube');
}

function formatJoinDate(value: number | null): string {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatLogDate(value: number): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function moderationAlertSummary(incident: JineModerationIncident): string {
  const time = formatLogDate(incident.triggeredAt);
  const sample = incident.purgedMessages
    .slice(0, 2)
    .map((message) => message.body.trim())
    .filter((body) => body.length > 0)
    .map((body) => (body.length > 70 ? `${body.slice(0, 70)}...` : body))
    .join(' | ');
  const blockedAttempt = incident.blockedAttempt.trim();
  const blockedAttemptText = blockedAttempt.length > 0
    ? blockedAttempt.length > 70
      ? `${blockedAttempt.slice(0, 70)}...`
      : blockedAttempt
    : 'n/a';
  const contentSample = sample.length > 0 ? sample : 'no retained message sample';
  return `${time}: purged ${incident.purgedCount} messages. Blocked attempt: "${blockedAttemptText}". Purged sample: ${contentSample}.`;
}

const selectedProfileLog = computed<ProfileLogEntry[]>(() => {
  const profile = selectedProfile.value;
  if (!profile) return [];
  return messages.value
    .filter((msg) => msg.authorUid === profile.uid && msg.kind !== 'sticker')
    .map((msg) => {
      const text = displayMessageText(msg);
      const fallback = msg.embeds.length > 0 ? '[media embed]' : '(empty)';
      return {
        id: msg.id,
        createdAt: msg.createdAt,
        body: text || fallback,
      };
    });
});

async function handleLogout() {
  chatError.value = '';
  try {
    await auth.logout();
  } catch (error) {
    chatError.value = error instanceof Error ? error.message : 'Failed to log out.';
  }
}

onMounted(() => {
  jineStore.markRead();
  scrollToBottom();
  resizeInput();
  pickRandomEmoteEmoji(false);
});

watch(
  deleteEffects,
  (effects) => {
    for (const effect of effects) {
      applyDeleteEffect(effect);
    }
  },
  { immediate: true },
);

watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  }
);

watch(
  () => messages.value.map((message) => message.id),
  (ids) => {
    const activeMessageIds = new Set(ids);
    for (const messageId of Object.keys(explodingMessageMap.value)) {
      if (activeMessageIds.has(messageId)) continue;
      clearExplosionForMessage(messageId);
    }
  },
);

watch(draft, (value) => {
  if (value.trim().length === 0) {
    stopTypingPreview();
    return;
  }
  keepTypingPreviewActive();
});

watch(showTypingPreviewBubble, (visible) => {
  if (visible) {
    scrollToBottom();
    return;
  }
  nextTick(() => resizeInput(true));
});

watch(typingPreviewText, () => {
  if (showTypingPreviewBubble.value) {
    scrollToBottom();
  }
});

watch(
  () => jineStore.syncError,
  (value) => {
    if (!value) return;
    chatError.value = value;
  },
);

watch(
  jineAuthEnabled,
  (enabled) => {
    if (enabled) return;
    dismissAuthPrompt();
    anonymousPromptAcknowledged.value = true;
  },
  { immediate: true },
);

watch(
  () => auth.isAuthenticated,
  (value) => {
    if (!value) {
      dismissAuthPrompt();
      anonymousPromptAcknowledged.value = false;
      return;
    }
    if (!isAnonymousSession.value) {
      anonymousPromptAcknowledged.value = true;
      showAuthPrompt.value = false;
      authPromptView.value = 'choice';
    }
  },
);

watch(
  () => auth.currentUser?.uid,
  () => {
    anonymousPromptAcknowledged.value = false;
    authPromptError.value = '';
  },
);

onBeforeUnmount(() => {
  clearTypingPreviewIdleTimer();
  if (stabilizeScrollRafId !== null) {
    window.cancelAnimationFrame(stabilizeScrollRafId);
    stabilizeScrollRafId = null;
  }
  for (const timeoutId of explosionTimeouts.values()) {
    window.clearTimeout(timeoutId);
  }
  explosionTimeouts.clear();
  explodingMessageMap.value = {};
  consumedDeleteEffectIds.clear();
  if (deleteBoomContext && deleteBoomContext.state !== 'closed') {
    void deleteBoomContext.close().catch(() => {});
  }
  deleteBoomContext = null;
  deleteBoomNoiseBuffer = null;
  if (typingTickContext && typingTickContext.state !== 'closed') {
    void typingTickContext.close().catch(() => {});
  }
  typingTickContext = null;
  typingTickNoiseBuffer = null;
  lastTypingTickAt = 0;
});
</script>

<style scoped>
.jine-chat {
  --jine-font-scale: 2;
  --composer-shell-height: calc(20px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
  background: url('/jine/JINE_background.png') repeat;
  background-size: 266px 388px;
  padding: 0;
  overflow: hidden;
  position: relative;
}
.chat-stack {
  position: relative;
  flex: 1;
  min-height: 0;
  padding-bottom: 0;
  transition: padding-bottom 170ms ease;
}
.moderation-alerts {
  position: absolute;
  left: 8px;
  right: 8px;
  top: 8px;
  z-index: 23;
  max-height: 40%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 7px;
  border: 1px solid rgba(95, 70, 132, 0.55);
  background: rgba(243, 236, 252, 0.9);
}
.moderation-alerts-title {
  font-family: var(--font-ui);
  font-size: 11px;
  color: #4f2c7a;
  text-transform: uppercase;
}
.moderation-alert-item {
  padding: 5px 6px;
  border: 1px solid rgba(97, 52, 205, 0.25);
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.moderation-alert-meta {
  font-family: var(--font-ui);
  font-size: 10px;
  color: #4f2c7a;
}
.moderation-alert-body {
  font-size: 10px;
  line-height: 1.2;
  color: #2f3d6e;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.moderation-alert-rec {
  font-family: var(--font-ui);
  font-size: 10px;
  color: #81234f;
}
.logout-float {
  position: absolute;
  top: 6px;
  left: 8px;
  z-index: 26;
  border: 1px solid rgba(116, 116, 126, 0.72);
  background: rgba(199, 199, 206, 0.58);
  color: rgba(58, 58, 64, 0.85);
  font-family: var(--font-ui);
  font-size: 10px;
  line-height: 1;
  padding: 3px 7px 2px;
  cursor: pointer;
  opacity: 0.45;
  transition: opacity 120ms ease, background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.logout-float:hover {
  opacity: 0.95;
  background: rgba(228, 228, 234, 0.94);
  color: rgba(42, 42, 48, 0.98);
  border-color: rgba(96, 96, 104, 0.9);
}
.profile-card {
  position: absolute;
  top: 8px;
  right: 8px;
  width: min(280px, calc(100% - 16px));
  max-height: calc(100% - 16px);
  border: 2px solid #87a2e8;
  background: #f7f9ff;
  box-shadow: 0 8px 20px rgba(43, 63, 110, 0.25);
  z-index: 24;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 6px;
}
.profile-close {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 18px;
  height: 18px;
  border: 1px solid #7f95d7;
  background: #dbe5ff;
  color: #2d4591;
  font-family: var(--font-ui);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}
.profile-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-right: 20px;
}
.profile-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffe3f5, #c77cdf);
  flex-shrink: 0;
}
.profile-meta {
  min-width: 0;
}
.profile-name {
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  color: #2a3f78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-role {
  display: inline-block;
  margin-top: 2px;
  padding: 1px 6px;
  border: 1px solid #8b63bd;
  background: #ecd9ff;
  color: #4f2c7a;
  font-family: var(--font-ui);
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
}
.profile-join {
  font-family: var(--font-ui);
  font-size: 10px;
  color: #4e65a8;
}
.profile-state {
  font-family: var(--font-ui);
  font-size: 10px;
  color: #2f3d6e;
}
.profile-state--error {
  color: #8a1f3e;
}
.profile-log-title {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
  color: #2a3f78;
}
.profile-log {
  border: 1px solid #b7c8f3;
  background: #fff;
  min-height: 56px;
  max-height: 180px;
  overflow-y: auto;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.profile-log-empty {
  font-family: var(--font-ui);
  font-size: 10px;
  color: #5f6f99;
}
.profile-log-item {
  border-bottom: 1px solid #edf1fb;
  padding-bottom: 3px;
}
.profile-log-item:last-child {
  border-bottom: none;
}
.profile-log-time {
  font-family: var(--font-ui);
  font-size: 9px;
  color: #6a7cad;
  margin-bottom: 1px;
}
.profile-log-text {
  font-size: calc(11px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: 1.2;
  color: #22325f;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.log {
  position: relative;
  height: 100%;
  overflow-y: auto;
  padding: 12px 10px 8px;
  background: transparent;
  display: flex;
  flex-direction: column;
}
/* Scrollbar styles same as before */
.log {
  scrollbar-width: thin;
  scrollbar-color: #f2a3d4 #7ea3ff;
}
.log::-webkit-scrollbar {
  width: calc(14px * var(--ui-scale, 1));
}
.log::-webkit-scrollbar-track {
  background: #7ea3ff;
}
.log::-webkit-scrollbar-thumb {
  background: #f2a3d4;
  border: calc(2px * var(--ui-scale, 1)) solid #7ea3ff;
}
.log::-webkit-scrollbar-button {
  display: none;
}
.day-pill {
  width: 120px;
  margin: 0 auto 12px;
  text-align: center;
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  color: #4a66b5;
  background: #dce7ff;
  border-radius: 999px;
  padding: 2px 0;
}
.message {
  position: relative;
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  align-items: flex-start;
  width: 100%;
}
.avatar-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
}
.message-delete-btn {
  border: 1px solid rgba(122, 84, 170, 0.88);
  background: rgba(241, 228, 255, 0.95);
  color: #5f3b8a;
  font-family: var(--font-ui);
  font-size: 9px;
  line-height: 1;
  padding: 2px 5px;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-2px);
  pointer-events: none;
  transition: opacity 110ms ease, transform 110ms ease, filter 110ms ease;
}
.message:hover .message-delete-btn,
.message:focus-within .message-delete-btn {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}
.message-delete-btn:hover {
  animation: delete-flash-red 650ms steps(2, end) infinite;
}
@keyframes delete-flash-red {
  0%,
  49% {
    border-color: rgba(122, 84, 170, 0.88);
    background: rgba(241, 228, 255, 0.95);
    color: #5f3b8a;
  }
  50%,
  100% {
    border-color: #8c2236;
    background: #ff5f76;
    color: #fff5f8;
  }
}
.message--typing-preview {
  margin-bottom: 0;
}
.message.me {
  justify-content: flex-end;
  text-align: right;
}
.message.me .avatar-column {
  order: 2;
}
.message.sticker {
  width: 100%;
  justify-content: flex-start;
}
.message.sticker.me {
  justify-content: flex-end;
}
.message-content {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
}
.message.me .message-content {
  order: 1;
  align-items: flex-end;
}
.sticker-only {
  display: flex;
  justify-content: flex-start;
  width: auto;
}
.message.sticker.me .sticker-only {
  justify-content: flex-end;
}
.message-explosion {
  position: absolute;
  inset: -8px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}
.message-explosion-flash {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at center, rgba(255, 219, 132, 0.88) 0, rgba(255, 115, 60, 0.65) 42%, rgba(255, 74, 74, 0) 80%),
    repeating-linear-gradient(45deg, rgba(255, 242, 158, 0.3) 0 4px, rgba(255, 104, 84, 0.3) 4px 8px);
  mix-blend-mode: screen;
  animation: explosion-flash 340ms steps(5, end) both;
}
.message-explosion-sprite {
  position: relative;
  width: 72px;
  height: 72px;
  max-width: min(150%, calc(100% + 22px));
  max-height: min(150%, calc(100% + 22px));
  object-fit: contain;
  image-rendering: pixelated;
  filter: saturate(1.25) contrast(1.1);
  animation: explosion-pop 340ms steps(6, end) both;
}
@keyframes explosion-pop {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  22% {
    opacity: 1;
    transform: scale(1.08);
  }
  62% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.22);
  }
}
@keyframes explosion-flash {
  0% {
    opacity: 0;
  }
  24% {
    opacity: 0.95;
  }
  65% {
    opacity: 0.55;
  }
  100% {
    opacity: 0;
  }
}
.avatar-btn {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  cursor: pointer;
  display: inline-flex;
}
.avatar-btn--preview {
  cursor: default;
  pointer-events: none;
}
.avatar-btn:disabled {
  cursor: default;
}
.avatar-btn:focus-visible .avatar {
  outline: 2px solid #5e7ed1;
  outline-offset: 1px;
}
.avatar {
  width: calc(56px * 0.9025);
  height: calc(56px * 0.9025);
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #ffe3f5, #c77cdf);
  flex-shrink: 0;
}
.bubble {
  max-width: 35ch;
  width: fit-content;
  background: #cfe8ff;
  color: #2f3d6e;
  padding: calc(6px * var(--ui-scale, 1)) calc(12px * var(--ui-scale, 1));
  border: none;
  border-radius: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  clip-path: polygon(
    4px 0,
    calc(100% - 4px) 0,
    calc(100% - 2px) 2px,
    100% 4px,
    100% calc(100% - 4px),
    calc(100% - 2px) calc(100% - 2px),
    calc(100% - 4px) 100%,
    4px 100%,
    2px calc(100% - 2px),
    0 calc(100% - 4px),
    0 4px,
    2px 2px
  );
}
.message.me .bubble {
  background: #6fdc5b;
  color: #1f3a1b;
}
.bubble--embed-fill {
  --embed-fill: #d4e4ff;
  --embed-border: #5f73ac;
  --embed-hi: #f9fbff;
  --embed-lo: #9db7f0;
  background: var(--embed-fill);
  border: 2px solid var(--embed-border);
  box-shadow:
    inset 2px 2px 0 var(--embed-hi),
    inset -2px -2px 0 var(--embed-lo),
    2px 2px 0 rgba(58, 77, 130, 0.35);
  image-rendering: pixelated;
  width: min(100%, 460px);
  max-width: min(100%, 460px);
  padding: 0;
  overflow: hidden;
  clip-path: none;
  border-radius: 0;
}
.author {
  font-size: 10px;
  line-height: 1.1;
  color: #4a66b5;
  margin-bottom: 3px;
}
.bubble.media {
    padding: 0;
    overflow: hidden;
}
.media-content {
    max-width: 100%;
    display: block;
}
.media-content--youtube {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  border: 0;
}
.embed-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 6px;
  width: 100%;
}
.bubble--embed-fill .embed-list {
  margin-top: 0;
  gap: 0;
}
.twitter-link {
  display: inline-block;
  font-size: 11px;
  color: #2d4fa3;
  text-decoration: underline;
}
.text {
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: 1.2;
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.sticker-img {
  width: 190px;
  height: 110px;
  object-fit: contain;
  image-rendering: pixelated;
}
.composer-shell {
  flex: 0 0 var(--composer-shell-height);
  height: var(--composer-shell-height);
  margin-top: auto;
  overflow: hidden;
  transition: flex-basis 170ms ease, height 170ms ease;
}
.composer-shell--hidden {
  flex-basis: 0;
  height: 0;
}
.composer {
  display: grid;
  grid-template-columns:
    calc(24px * var(--ui-scale, 1) * var(--jine-font-scale, 1))
    1fr
    calc(26px * var(--ui-scale, 1) * var(--jine-font-scale, 1))
    calc(24px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  gap: 0;
  align-items: stretch;
  background: transparent;
  width: 100%;
  transform: translateY(0);
  transition: transform 170ms ease;
}
.composer--hidden {
  pointer-events: none;
  transform: translateY(calc(100% + 6px));
}
.input {
  border: 2px solid #8a5ec6;
  resize: none;
  padding: calc(2px * var(--ui-scale, 1)) calc(4px * var(--ui-scale, 1)) 0 calc(4px * var(--ui-scale, 1));
  font-family: var(--font-chat);
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  color: #2b2b2b;
  background: #ffffff;
  outline: none;
  height: calc(18px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  min-height: calc(18px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  overflow: hidden;
  width: 100%;
}
.send {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 2px solid var(--bevel-shadow);
  border-left: 0;
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: #d0b2f0;
  color: #4f2c7a;
  font-family: var(--font-ui);
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  cursor: pointer;
}
.send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.embed-btn {
  width: 100%;
  height: 100%;
  border: 2px solid var(--bevel-shadow);
  border-right: 0;
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: #d0b2f0;
  color: #4f2c7a;
  font-family: var(--font-ui);
  font-size: calc(12px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.emote-toggle {
  width: 100%;
  height: 100%;
  border: 2px solid var(--bevel-shadow);
  border-left: 0;
  box-shadow: inset 0 0 0 1px var(--bevel-highlight);
  background: #f4ecff;
  color: #6b4f94;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.embed-btn:hover,
.emote-toggle:hover,
.send:hover {
  filter: brightness(0.97);
}
.embed-btn:active,
.emote-toggle:active,
.send:active {
  filter: brightness(0.92);
}
.emote-toggle.active {
  background: #e2d2ff;
  color: #4f2c7a;
}
.emote-icon {
  font-family: var(--font-ui);
  font-size: calc(13px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  line-height: 1;
}
.emote-icon--img {
  width: calc(14px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  height: calc(14px * var(--ui-scale, 1) * var(--jine-font-scale, 1));
  object-fit: contain;
  image-rendering: pixelated;
  filter: grayscale(1) sepia(0.75) saturate(2000%) hue-rotate(210deg) brightness(0.72);
  transition: filter 120ms ease;
}
.emote-icon--img.is-hovered {
  filter: none;
}
.stickers {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -8px;
  background: rgba(200, 141, 226, 0.75);
  padding: 6px;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  transition: max-height 200ms ease-out, opacity 200ms ease-out;
  z-index: 10;
}
.stickers.open {
  max-height: 220px;
  opacity: 1;
  pointer-events: auto;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.stickers.open::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
.sticker-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.sticker-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sticker-group-divider {
  height: 2px;
  background: rgba(79, 44, 122, 0.25);
  border-radius: 999px;
}
.sticker-btn {
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
}
.sticker-btn img {
  width: 100%;
  height: 102px;
  object-fit: contain;
  image-rendering: pixelated;
}
.embed-modal {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
}
.embed-box {
    background: #fff;
    padding: 12px;
    border: 2px solid #8a5ec6;
    width: 80%;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.embed-title {
    font-weight: bold;
    color: #4f2c7a;
}
.embed-input {
    width: 100%;
    border: 1px solid #ccc;
    padding: 4px;
}
.embed-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}
.embed-actions button {
    padding: 4px 8px;
    cursor: pointer;
    background: #d0b2f0;
    border: 1px solid #8a5ec6;
}
.auth-modal {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  padding: 10px;
}
.auth-modal-card {
  width: min(300px, 100%);
  max-height: 100%;
  position: relative;
  overflow: auto;
}
.auth-choice {
  border: 2px solid #9ab2ff;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 18px rgba(74, 102, 181, 0.15);
  padding: 28px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-family: var(--font-ui);
}
.auth-choice-title {
  font-size: 14px;
  font-weight: 700;
  color: #2f4f9e;
}
.auth-choice-copy {
  font-size: 11px;
  color: #3f5fa8;
  line-height: 1.3;
}
.auth-safety {
  margin-top: 2px;
  border: 1px solid #9db3ec;
  background: #f8fbff;
  padding: 5px 6px;
}
.auth-safety > summary {
  cursor: pointer;
  font-size: 11px;
  color: #2e4f9f;
  font-family: var(--font-ui);
}
.auth-safety-body {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.auth-safety-line {
  font-size: 10px;
  color: #385796;
  line-height: 1.3;
}
.auth-safety-warning {
  margin-top: 2px;
  font-size: 10px;
  color: #7f1f4a;
  line-height: 1.3;
}
.auth-choice-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}
.auth-choice-btn {
  border: 1px solid #7d91d6;
  background: #e8efff;
  color: #2f4f9e;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.2;
  padding: 7px 8px;
  cursor: pointer;
}
.auth-choice-btn.primary {
  background: #7ea3ff;
  border-color: #6b93ff;
  color: #ffffff;
}
.auth-choice-btn:hover {
  filter: brightness(0.97);
}
.auth-choice-error {
  color: #b00020;
  font-size: 11px;
  line-height: 1.2;
}
.auth-close {
  position: absolute;
  top: 4px;
  right: 6px;
  z-index: 31;
  border: 1px solid #7d91d6;
  background: #d7e2ff;
  color: #2f4f9e;
  font-family: var(--font-ui);
  font-size: 11px;
  width: 20px;
  height: 20px;
  cursor: pointer;
}
.chat-error {
  color: #b00020;
  font-size: 11px;
  font-family: var(--font-ui);
  padding: 0 2px;
}
</style>

