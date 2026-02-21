import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { JineEmbed } from '../embeds';
import {
  createJineModerationEvent,
  createJineCloudMessage,
  deleteJineCloudMessage,
  subscribeToJineMessages,
  subscribeToJineModerationEvents,
  type JineModerationEvent,
  type JineMessageKind,
} from '../jineCloud';
import { isFirebaseConfigured } from '../firebase';
import { useAuthStore, type UserProfile } from './auth';

export interface JineMessage {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: number;
  editedAt?: number;
  embeds: JineEmbed[];
  isUnread: boolean;
  kind: JineMessageKind;
}

const META_STORAGE_KEY = 'windose_jine_meta_v2';
const FALLBACK_STORAGE_KEY = 'windose_jine_fallback_v2';
const ANON_RATE_STORAGE_KEY = 'windose_jine_anon_rate_v1';
const SPAM_RATE_STORAGE_KEY = 'windose_jine_spam_rate_v1';
const MODERATION_LOG_STORAGE_KEY = 'windose_jine_moderation_log_v1';
const JOSER_USERNAME = 'joser';
const JOSER_AVATAR = '/avatars/avatar_joser.jpg';
const LOCAL_FALLBACK_USER_UID = 'local-fallback-user';
const LOCAL_FALLBACK_USERNAME = 'local_guest';
const LOCAL_FALLBACK_AVATAR = '/avatars/avatar_1.png';
const ANON_TEXT_WINDOW_MS = 3 * 60 * 60 * 1000;
const ANON_TEXT_LIMIT = 5;
const ANON_STICKER_WINDOW_MS = 60 * 60 * 1000;
const ANON_STICKER_LIMIT = 1;
const MAX_MESSAGE_CHARS = 200;
const SPAM_WINDOW_MS = 10 * 60 * 1000;
const SPAM_LIMIT = 100;
const SPAM_COOLDOWN_MS = 5 * 60 * 1000;
const MODERATION_LOG_LIMIT = 60;
const DELETE_EFFECT_VISIBILITY_MS = 340;
const DELETE_EFFECT_BUFFER_LIMIT = 48;
const MODERATION_EVENT_GRACE_MS = 0;
const MODERATION_BAN_RECOMMENDATION =
  'Possible ban recommendation: apply a 24h temporary ban and escalate to permanent ban for repeat incidents.';
const LINK_PATTERN = /(?:\bhttps?:\/\/\S+|\bwww\.\S+|\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?)/i;

interface JineMetaState {
  lastReadAt: number | null;
}

interface AnonymousRateBucket {
  textSentAt: number[];
  stickerSentAt: number[];
}

type AnonymousRateMap = Record<string, AnonymousRateBucket>;

interface AnonymousPendingSend {
  uid: string;
  kind: JineMessageKind;
  timestamp: number;
}

interface SpamRateBucket {
  sentAt: number[];
  cooldownUntil: number;
}

type SpamRateMap = Record<string, SpamRateBucket>;

interface SpamPendingSend {
  uid: string;
  timestamp: number;
}

export interface JineModerationIncidentMessage {
  id: string;
  kind: JineMessageKind;
  body: string;
  createdAt: number;
}

export interface JineModerationIncident {
  id: string;
  offenderUid: string;
  offenderName: string;
  offenderAvatar: string;
  triggeredAt: number;
  cooldownUntil: number;
  purgedCount: number;
  purgedMessages: JineModerationIncidentMessage[];
  blockedAttempt: string;
  recommendation: string;
}

export interface JineDeleteEffect {
  id: string;
  messageId: string;
  actorUid: string;
  actorName: string;
  targetUid: string;
  targetName: string;
  createdAt: number;
}

function loadMetaState(): JineMetaState {
  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) return { lastReadAt: null };
    const parsed = JSON.parse(raw) as Partial<JineMetaState>;
    return {
      lastReadAt: typeof parsed.lastReadAt === 'number' ? parsed.lastReadAt : null,
    };
  } catch {
    return { lastReadAt: null };
  }
}

function saveMetaState(state: JineMetaState): void {
  try {
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function loadFallbackMessages(): JineMessage[] {
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as JineMessage[];
  } catch {
    return [];
  }
}

function saveFallbackMessages(messages: JineMessage[]): void {
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // ignore storage failures
  }
}

function createAnonymousRateBucket(): AnonymousRateBucket {
  return { textSentAt: [], stickerSentAt: [] };
}

function loadAnonymousRateMap(): AnonymousRateMap {
  try {
    const raw = localStorage.getItem(ANON_RATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const next: AnonymousRateMap = {};
    for (const [uid, value] of Object.entries(parsed)) {
      if (!uid || !value || typeof value !== 'object') continue;
      const bucket = value as Partial<AnonymousRateBucket>;
      const textSentAt = Array.isArray(bucket.textSentAt)
        ? bucket.textSentAt.filter((v): v is number => typeof v === 'number')
        : [];
      const stickerSentAt = Array.isArray(bucket.stickerSentAt)
        ? bucket.stickerSentAt.filter((v): v is number => typeof v === 'number')
        : [];
      next[uid] = { textSentAt, stickerSentAt };
    }
    return next;
  } catch {
    return {};
  }
}

function saveAnonymousRateMap(state: AnonymousRateMap): void {
  try {
    localStorage.setItem(ANON_RATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function createSpamRateBucket(): SpamRateBucket {
  return { sentAt: [], cooldownUntil: 0 };
}

function loadSpamRateMap(): SpamRateMap {
  try {
    const raw = localStorage.getItem(SPAM_RATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const next: SpamRateMap = {};
    for (const [uid, value] of Object.entries(parsed)) {
      if (!uid || !value || typeof value !== 'object') continue;
      const bucket = value as Partial<SpamRateBucket>;
      const sentAt = Array.isArray(bucket.sentAt)
        ? bucket.sentAt.filter((v): v is number => typeof v === 'number')
        : [];
      const cooldownUntil = typeof bucket.cooldownUntil === 'number' ? bucket.cooldownUntil : 0;
      next[uid] = { sentAt, cooldownUntil };
    }
    return next;
  } catch {
    return {};
  }
}

function saveSpamRateMap(state: SpamRateMap): void {
  try {
    localStorage.setItem(SPAM_RATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function loadModerationIncidents(): JineModerationIncident[] {
  try {
    const raw = localStorage.getItem(MODERATION_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is JineModerationIncident => !!item && typeof item === 'object')
      .map((incident) => ({
        id: String(incident.id ?? ''),
        offenderUid: String(incident.offenderUid ?? ''),
        offenderName: String(incident.offenderName ?? 'unknown'),
        offenderAvatar: String(incident.offenderAvatar ?? ''),
        triggeredAt: typeof incident.triggeredAt === 'number' ? incident.triggeredAt : 0,
        cooldownUntil: typeof incident.cooldownUntil === 'number' ? incident.cooldownUntil : 0,
        purgedCount: typeof incident.purgedCount === 'number' ? incident.purgedCount : 0,
        blockedAttempt: String(incident.blockedAttempt ?? ''),
        recommendation: String(incident.recommendation ?? MODERATION_BAN_RECOMMENDATION),
        purgedMessages: Array.isArray(incident.purgedMessages)
          ? incident.purgedMessages
              .filter((msg): msg is JineModerationIncidentMessage => !!msg && typeof msg === 'object')
              .map((msg): JineModerationIncidentMessage => {
                const kind: JineMessageKind = msg.kind === 'sticker' ? 'sticker' : 'text';
                return {
                  id: String(msg.id ?? ''),
                  kind,
                  body: String(msg.body ?? ''),
                  createdAt: typeof msg.createdAt === 'number' ? msg.createdAt : 0,
                };
              })
          : [],
      }))
      .filter((incident) => incident.id.length > 0);
  } catch {
    return [];
  }
}

function saveModerationIncidents(incidents: JineModerationIncident[]): void {
  try {
    localStorage.setItem(MODERATION_LOG_STORAGE_KEY, JSON.stringify(incidents));
  } catch {
    // ignore storage failures
  }
}

function formatCooldown(ms: number): string {
  if (ms <= 0) return 'a moment';
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours}h ${remainder}m`;
}

function containsLinkLikeText(value: string): boolean {
  return LINK_PATTERN.test(value);
}

function isJoserUsername(value: string): boolean {
  return value.trim().toLowerCase() === JOSER_USERNAME;
}

function resolveAuthorAvatar(username: string, avatar: string): string {
  if (isJoserUsername(username)) return JOSER_AVATAR;
  return avatar;
}

function createLocalFallbackUser(): UserProfile {
  return {
    uid: LOCAL_FALLBACK_USER_UID,
    username: LOCAL_FALLBACK_USERNAME,
    pfp: LOCAL_FALLBACK_AVATAR,
    email: '',
    isAnonymous: false,
  };
}

function createLocalDeleteEffect(message: JineMessage, actor: UserProfile): JineDeleteEffect {
  const createdAt = Date.now();
  return {
    id: `local-delete-${message.id}-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
    messageId: message.id,
    actorUid: actor.uid,
    actorName: actor.username,
    targetUid: message.authorUid,
    targetName: message.authorName,
    createdAt,
  };
}

function toDeleteEffect(event: JineModerationEvent): JineDeleteEffect {
  return {
    id: event.id,
    messageId: event.messageId,
    actorUid: event.actorUid,
    actorName: event.actorName,
    targetUid: event.targetUid,
    targetName: event.targetName,
    createdAt: event.createdAt,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const useJineStore = defineStore('jine', () => {
  const auth = useAuthStore();
  const firebaseEnabled = isFirebaseConfigured();

  const messages = ref<JineMessage[]>([]);
  const lastReadAt = ref<number | null>(loadMetaState().lastReadAt);
  const unreadCount = ref(0);
  const isConnected = ref(false);
  const syncError = ref('');
  const anonymousRateMap = ref<AnonymousRateMap>(loadAnonymousRateMap());
  const spamRateMap = ref<SpamRateMap>(loadSpamRateMap());
  const moderationIncidents = ref<JineModerationIncident[]>(loadModerationIncidents());
  const deleteEffects = ref<JineDeleteEffect[]>([]);
  const anonymousPendingSends = ref<AnonymousPendingSend[]>([]);
  const spamPendingSends = ref<SpamPendingSend[]>([]);

  let unsubscribeCloudMessages: (() => void) | null = null;
  let unsubscribeCloudModeration: (() => void) | null = null;
  let moderationSubscriptionStartedAt = 0;
  const seenModerationEventIds = new Set<string>();

  function computeUnreadForMessage(message: JineMessage): boolean {
    const uid = auth.currentUser?.uid ?? (firebaseEnabled ? null : LOCAL_FALLBACK_USER_UID);
    if (!uid) return false;
    if (message.authorUid === uid) return false;
    const readAt = lastReadAt.value ?? 0;
    return message.createdAt > readAt;
  }

  function refreshUnreadState(): void {
    let count = 0;
    messages.value = messages.value.map((m) => {
      const isUnread = computeUnreadForMessage(m);
      if (isUnread) count += 1;
      return { ...m, isUnread };
    });
    unreadCount.value = count;
  }

  function setMessages(next: JineMessage[]): void {
    messages.value = next
      .slice()
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((m) => ({ ...m, isUnread: false }));
    refreshUnreadState();
  }

  function queueDeleteEffect(effect: JineDeleteEffect): void {
    const next = [...deleteEffects.value.filter((item) => item.id !== effect.id), effect];
    deleteEffects.value = next.slice(-DELETE_EFFECT_BUFFER_LIMIT);
  }

  function consumeDeleteEffect(effectId: string): void {
    deleteEffects.value = deleteEffects.value.filter((effect) => effect.id !== effectId);
  }

  function getAnonymousBucket(uid: string): AnonymousRateBucket {
    const existing = anonymousRateMap.value[uid];
    if (existing) return existing;
    const fresh = createAnonymousRateBucket();
    anonymousRateMap.value = {
      ...anonymousRateMap.value,
      [uid]: fresh,
    };
    return fresh;
  }

  function pruneAnonymousBucket(bucket: AnonymousRateBucket, now: number): void {
    bucket.textSentAt = bucket.textSentAt.filter((ts) => now - ts < ANON_TEXT_WINDOW_MS);
    bucket.stickerSentAt = bucket.stickerSentAt.filter((ts) => now - ts < ANON_STICKER_WINDOW_MS);
  }

  function prunePending(now: number): void {
    const maxWindow = Math.max(ANON_TEXT_WINDOW_MS, ANON_STICKER_WINDOW_MS);
    anonymousPendingSends.value = anonymousPendingSends.value.filter((entry) => now - entry.timestamp < maxWindow);
  }

  function getPendingTimestamps(uid: string, kind: JineMessageKind, now: number): number[] {
    prunePending(now);
    const window = kind === 'sticker' ? ANON_STICKER_WINDOW_MS : ANON_TEXT_WINDOW_MS;
    return anonymousPendingSends.value
      .filter((entry) => entry.uid === uid && entry.kind === kind && now - entry.timestamp < window)
      .map((entry) => entry.timestamp);
  }

  function checkAnonymousSlowMode(uid: string, kind: JineMessageKind, now: number): string | null {
    const bucket = getAnonymousBucket(uid);
    pruneAnonymousBucket(bucket, now);
    saveAnonymousRateMap(anonymousRateMap.value);

    const committed = kind === 'sticker' ? bucket.stickerSentAt : bucket.textSentAt;
    const pending = getPendingTimestamps(uid, kind, now);
    const attempts = committed.length + pending.length;
    const limit = kind === 'sticker' ? ANON_STICKER_LIMIT : ANON_TEXT_LIMIT;
    const window = kind === 'sticker' ? ANON_STICKER_WINDOW_MS : ANON_TEXT_WINDOW_MS;

    if (attempts < limit) return null;

    const relevant = [...committed, ...pending].sort((a, b) => a - b);
    const earliest = relevant[0] ?? now;
    const retryAt = earliest + window;
    const remaining = Math.max(0, retryAt - now);
    const cooldown = formatCooldown(remaining);

    if (kind === 'sticker') {
      return `Anonymous slow mode: 1 sticker per hour. Try again in ${cooldown}.`;
    }
    return `Anonymous slow mode: 5 messages every 3 hours. Try again in ${cooldown}.`;
  }

  function finalizeAnonymousSend(
    uid: string,
    kind: JineMessageKind,
    pendingTimestamp: number,
    succeeded: boolean,
  ): void {
    anonymousPendingSends.value = anonymousPendingSends.value.filter(
      (entry) => !(entry.uid === uid && entry.kind === kind && entry.timestamp === pendingTimestamp),
    );
    if (!succeeded) return;

    const bucket = getAnonymousBucket(uid);
    const now = Date.now();
    pruneAnonymousBucket(bucket, now);
    if (kind === 'sticker') {
      bucket.stickerSentAt.push(now);
    } else {
      bucket.textSentAt.push(now);
    }
    saveAnonymousRateMap(anonymousRateMap.value);
  }

  function getSpamBucket(uid: string): SpamRateBucket {
    const existing = spamRateMap.value[uid];
    if (existing) return existing;
    const fresh = createSpamRateBucket();
    spamRateMap.value = {
      ...spamRateMap.value,
      [uid]: fresh,
    };
    return fresh;
  }

  function pruneSpamBucket(bucket: SpamRateBucket, now: number): void {
    bucket.sentAt = bucket.sentAt.filter((ts) => now - ts < SPAM_WINDOW_MS);
    if (bucket.cooldownUntil <= now) {
      bucket.cooldownUntil = 0;
    }
  }

  function pruneSpamPending(now: number): void {
    spamPendingSends.value = spamPendingSends.value.filter((entry) => now - entry.timestamp < SPAM_WINDOW_MS);
  }

  function getSpamPendingTimestamps(uid: string, now: number): number[] {
    pruneSpamPending(now);
    return spamPendingSends.value
      .filter((entry) => entry.uid === uid && now - entry.timestamp < SPAM_WINDOW_MS)
      .map((entry) => entry.timestamp);
  }

  function getCooldownError(uid: string, now: number): string | null {
    const bucket = getSpamBucket(uid);
    pruneSpamBucket(bucket, now);
    saveSpamRateMap(spamRateMap.value);
    if (bucket.cooldownUntil <= now) return null;
    const cooldown = formatCooldown(bucket.cooldownUntil - now);
    return `Spam cooldown active. Try again in ${cooldown}.`;
  }

  function willTriggerSpamGuard(uid: string, now: number): boolean {
    const bucket = getSpamBucket(uid);
    pruneSpamBucket(bucket, now);
    const pending = getSpamPendingTimestamps(uid, now);
    const attempts = bucket.sentAt.length + pending.length + 1;
    return attempts >= SPAM_LIMIT;
  }

  function finalizeSpamSend(uid: string, pendingTimestamp: number, succeeded: boolean): void {
    spamPendingSends.value = spamPendingSends.value.filter(
      (entry) => !(entry.uid === uid && entry.timestamp === pendingTimestamp),
    );
    if (!succeeded) return;

    const bucket = getSpamBucket(uid);
    const now = Date.now();
    pruneSpamBucket(bucket, now);
    bucket.sentAt.push(now);
    saveSpamRateMap(spamRateMap.value);
  }

  function appendModerationIncident(incident: JineModerationIncident): void {
    moderationIncidents.value = [incident, ...moderationIncidents.value]
      .sort((a, b) => b.triggeredAt - a.triggeredAt)
      .slice(0, MODERATION_LOG_LIMIT);
    saveModerationIncidents(moderationIncidents.value);
  }

  function getRecentUserMessages(uid: string, now: number): JineMessage[] {
    return messages.value.filter((message) => {
      if (message.authorUid !== uid) return false;
      if (message.createdAt <= 0) return true;
      return now - message.createdAt < SPAM_WINDOW_MS;
    });
  }

  async function purgeUserRecentMessages(uid: string, now: number): Promise<JineMessage[]> {
    const recent = getRecentUserMessages(uid, now);
    if (recent.length === 0) return [];
    const recentIds = new Set(recent.map((message) => message.id));

    if (!firebaseEnabled) {
      const next = messages.value.filter((message) => !recentIds.has(message.id));
      setMessages(next);
      saveFallbackMessages(next);
      return recent;
    }

    // Optimistically hide purged messages in this client while cloud deletes settle.
    setMessages(messages.value.filter((message) => !recentIds.has(message.id)));
    const deleteOps = recent.map((message) => deleteJineCloudMessage(message.id));
    await Promise.allSettled(deleteOps);
    return recent;
  }

  async function applySpamGuardAndLog(
    user: UserProfile,
    attemptedBody: string,
    now: number,
  ): Promise<{ cooldownUntil: number; purgedCount: number }> {
    const bucket = getSpamBucket(user.uid);
    pruneSpamBucket(bucket, now);
    bucket.cooldownUntil = now + SPAM_COOLDOWN_MS;
    bucket.sentAt = [];
    saveSpamRateMap(spamRateMap.value);

    const purgedMessages = await purgeUserRecentMessages(user.uid, now);
    const incident: JineModerationIncident = {
      id: `${user.uid}-${now}-${Math.random().toString(36).slice(2, 8)}`,
      offenderUid: user.uid,
      offenderName: user.username,
      offenderAvatar: resolveAuthorAvatar(user.username, user.pfp),
      triggeredAt: now,
      cooldownUntil: bucket.cooldownUntil,
      purgedCount: purgedMessages.length,
      purgedMessages: purgedMessages.map((message) => ({
        id: message.id,
        kind: message.kind,
        body: message.body,
        createdAt: message.createdAt,
      })),
      blockedAttempt: attemptedBody,
      recommendation: MODERATION_BAN_RECOMMENDATION,
    };
    appendModerationIncident(incident);
    return {
      cooldownUntil: bucket.cooldownUntil,
      purgedCount: purgedMessages.length,
    };
  }

  function stopCloudSync(): void {
    if (unsubscribeCloudMessages) {
      unsubscribeCloudMessages();
      unsubscribeCloudMessages = null;
    }
    if (unsubscribeCloudModeration) {
      unsubscribeCloudModeration();
      unsubscribeCloudModeration = null;
    }
    seenModerationEventIds.clear();
    moderationSubscriptionStartedAt = 0;
    isConnected.value = false;
  }

  function startCloudSync(): void {
    if (!firebaseEnabled) return;
    stopCloudSync();
    moderationSubscriptionStartedAt = Date.now();

    unsubscribeCloudMessages = subscribeToJineMessages(
      (cloudMessages) => {
        const mapped: JineMessage[] = cloudMessages.map((m) => ({
          id: m.id,
          authorUid: m.authorUid,
          authorName: m.authorName,
          authorAvatar: resolveAuthorAvatar(m.authorName, m.authorAvatar),
          kind: m.kind,
          body: m.body,
          embeds: m.embeds,
          createdAt: m.createdAt || Date.now(),
          editedAt: m.editedAt,
          isUnread: false,
        }));
        setMessages(mapped);
        isConnected.value = true;
        syncError.value = '';
      },
      (error) => {
        syncError.value = error instanceof Error ? error.message : 'JINE sync failed.';
        isConnected.value = false;
      },
    );

    unsubscribeCloudModeration = subscribeToJineModerationEvents(
      (events) => {
        for (const event of events) {
          if (seenModerationEventIds.has(event.id)) continue;
          if (event.createdAt <= 0) continue;

          const isPreSessionEvent = event.createdAt + MODERATION_EVENT_GRACE_MS < moderationSubscriptionStartedAt;
          if (isPreSessionEvent) {
            seenModerationEventIds.add(event.id);
            continue;
          }

          seenModerationEventIds.add(event.id);
          queueDeleteEffect(toDeleteEffect(event));
        }
      },
      (error) => {
        syncError.value = error instanceof Error ? error.message : 'JINE moderation sync failed.';
      },
    );
  }

  function seed(): void {
    if (messages.value.length > 0) return;
    const now = Date.now();
    const seedMessages: JineMessage[] = [
      {
        id: `ame-${now - 1000 * 60 * 12}`,
        authorUid: 'ame-official',
        authorName: 'Ame',
        authorAvatar: '/avatars/avatar_1.png',
        kind: 'text',
        body: 'u awake? i just posted something weird...',
        createdAt: now - 1000 * 60 * 12,
        embeds: [],
        isUnread: true,
      },
      {
        id: `ame-${now - 1000 * 60 * 9}`,
        authorUid: 'ame-official',
        authorName: 'Ame',
        authorAvatar: '/avatars/avatar_1.png',
        kind: 'text',
        body: 'dont forget to eat ok?',
        createdAt: now - 1000 * 60 * 9,
        embeds: [],
        isUnread: true,
      },
    ];
    setMessages(seedMessages);
  }

  async function sendMessage(kind: JineMessageKind, body: string, embeds: JineEmbed[] = []): Promise<boolean> {
    const value = body.trim();
    if (!value) return false;
    if (kind === 'text' && value.length > MAX_MESSAGE_CHARS) {
      syncError.value = `Message too long. Maximum ${MAX_MESSAGE_CHARS} characters.`;
      return false;
    }

    const user = auth.currentUser ?? (firebaseEnabled ? null : createLocalFallbackUser());
    if (!user) return false;
    const isAnonymous = user.isAnonymous === true;
    if (isAnonymous && kind === 'text' && (embeds.length > 0 || containsLinkLikeText(value))) {
      syncError.value = 'Anonymous users cannot send links or embeds. Sign in to post links.';
      return false;
    }

    const pendingTimestamp = Date.now();
    const cooldownError = getCooldownError(user.uid, pendingTimestamp);
    if (cooldownError) {
      syncError.value = cooldownError;
      return false;
    }

    if (willTriggerSpamGuard(user.uid, pendingTimestamp)) {
      const penalty = await applySpamGuardAndLog(user, value, pendingTimestamp);
      const cooldown = formatCooldown(Math.max(0, penalty.cooldownUntil - pendingTimestamp));
      syncError.value =
        `Spam guard triggered: ${penalty.purgedCount} recent messages removed. Cooldown active for ${cooldown}.`;
      return false;
    }

    spamPendingSends.value.push({ uid: user.uid, timestamp: pendingTimestamp });
    if (isAnonymous) {
      const slowModeError = checkAnonymousSlowMode(user.uid, kind, pendingTimestamp);
      if (slowModeError) {
        syncError.value = slowModeError;
        finalizeSpamSend(user.uid, pendingTimestamp, false);
        return false;
      }
      anonymousPendingSends.value.push({ uid: user.uid, kind, timestamp: pendingTimestamp });
    }

    if (!firebaseEnabled) {
      const local: JineMessage = {
        id: `${user.uid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        authorUid: user.uid,
        authorName: user.username,
        authorAvatar: resolveAuthorAvatar(user.username, user.pfp),
        kind,
        body: value,
        createdAt: Date.now(),
        embeds,
        isUnread: false,
      };
      setMessages([...messages.value, local]);
      saveFallbackMessages(messages.value);
      finalizeSpamSend(user.uid, pendingTimestamp, true);
      if (isAnonymous) {
        finalizeAnonymousSend(user.uid, kind, pendingTimestamp, true);
      }
      return true;
    }

    try {
      await createJineCloudMessage({
        authorUid: user.uid,
        authorName: user.username,
        authorAvatar: resolveAuthorAvatar(user.username, user.pfp),
        kind,
        body: value,
        embeds,
      });
      finalizeSpamSend(user.uid, pendingTimestamp, true);
      if (isAnonymous) {
        finalizeAnonymousSend(user.uid, kind, pendingTimestamp, true);
      }
      return true;
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to send message.';
      finalizeSpamSend(user.uid, pendingTimestamp, false);
      if (isAnonymous) {
        finalizeAnonymousSend(user.uid, kind, pendingTimestamp, false);
      }
      return false;
    }
  }

  async function deleteMessage(messageId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) {
      syncError.value = 'You must be signed in to delete messages.';
      return false;
    }
    const target = messages.value.find((message) => message.id === messageId);
    const isModerator = isJoserUsername(user.username);
    const isOwner = target ? target.authorUid === user.uid : false;
    if (!isModerator && !isOwner) {
      syncError.value = 'You can only delete your own messages.';
      return false;
    }
    const isModeratorDeletingOther = Boolean(isModerator && target && target.authorUid !== user.uid);

    if (!firebaseEnabled) {
      if (isModeratorDeletingOther && target) {
        queueDeleteEffect(createLocalDeleteEffect(target, user));
        await wait(DELETE_EFFECT_VISIBILITY_MS);
      }
      const next = messages.value.filter((message) => message.id !== messageId);
      setMessages(next);
      saveFallbackMessages(next);
      syncError.value = '';
      return true;
    }

    try {
      if (isModeratorDeletingOther && target) {
        try {
          await createJineModerationEvent({
            type: 'delete_explosion',
            messageId,
            actorUid: user.uid,
            actorName: user.username,
            targetUid: target.authorUid,
            targetName: target.authorName,
          });
        } catch {
          // Keep deletion functional if event broadcast fails.
        }
        await wait(DELETE_EFFECT_VISIBILITY_MS);
      }
      await deleteJineCloudMessage(messageId);
      syncError.value = '';
      return true;
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to delete message.';
      return false;
    }
  }

  function markRead(): void {
    lastReadAt.value = Date.now();
    refreshUnreadState();
  }

  watch(lastReadAt, (value) => {
    saveMetaState({ lastReadAt: value });
    refreshUnreadState();
  });

  watch(
    () => auth.currentUser?.uid,
    () => {
      if (firebaseEnabled) {
        startCloudSync();
        return;
      }
      const fallback = loadFallbackMessages();
      if (fallback.length > 0) {
        setMessages(fallback);
      } else {
        seed();
      }
    },
    { immediate: true },
  );

  return {
    messages,
    lastReadAt,
    unreadCount,
    isConnected,
    syncError,
    moderationIncidents,
    deleteEffects,
    sendMessage,
    deleteMessage,
    consumeDeleteEffect,
    markRead,
    seed,
  };
});
