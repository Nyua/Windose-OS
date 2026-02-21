import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from './auth';
import { useJineStore } from './jine';

vi.mock('../firebase', () => ({
  isFirebaseConfigured: () => false,
  getFirebaseServices: vi.fn(),
}));

describe('jine store moderation and limits', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-10T12:00:00.000Z'));
    localStorage.clear();
    setActivePinia(createPinia());
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('blocks text messages longer than 200 characters', async () => {
    const auth = useAuthStore();
    auth.currentUser = {
      uid: 'uid-limit',
      username: 'limit_user',
      pfp: '/avatars/avatar_1.png',
      email: 'limit_user@windose.local',
      isAnonymous: false,
    };

    const store = useJineStore();
    const initialCount = store.messages.length;
    const ok = await store.sendMessage('text', 'x'.repeat(201), []);
    expect(ok).toBe(false);
    expect(store.syncError).toContain('Maximum 200 characters');
    expect(store.messages.length).toBe(initialCount);
  });

  it('triggers spam cooldown, purges recent user messages, and logs an incident', async () => {
    const now = Date.now();
    const spamUid = 'uid-spam';

    localStorage.setItem(
      'windose_jine_spam_rate_v1',
      JSON.stringify({
        [spamUid]: {
          sentAt: Array.from({ length: 99 }, (_, index) => now - (index + 1) * 1000),
          cooldownUntil: 0,
        },
      }),
    );

    localStorage.setItem(
      'windose_jine_fallback_v2',
      JSON.stringify([
        {
          id: 'spam-1',
          authorUid: spamUid,
          authorName: 'spammer',
          authorAvatar: '/avatars/avatar_1.png',
          body: 'a',
          createdAt: now - 30_000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
        {
          id: 'spam-2',
          authorUid: spamUid,
          authorName: 'spammer',
          authorAvatar: '/avatars/avatar_1.png',
          body: 'b',
          createdAt: now - 20_000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
        {
          id: 'spam-3',
          authorUid: spamUid,
          authorName: 'spammer',
          authorAvatar: '/avatars/avatar_1.png',
          body: 'c',
          createdAt: now - 10_000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
        {
          id: 'safe-1',
          authorUid: 'uid-safe',
          authorName: 'safe_user',
          authorAvatar: '/avatars/avatar_2.png',
          body: 'safe',
          createdAt: now - 5_000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
      ]),
    );

    const auth = useAuthStore();
    auth.currentUser = {
      uid: spamUid,
      username: 'spammer',
      pfp: '/avatars/avatar_1.png',
      email: 'spammer@windose.local',
      isAnonymous: false,
    };

    const store = useJineStore();
    expect(store.messages.length).toBe(4);

    const blocked = await store.sendMessage('text', 'triggering spam guard', []);
    expect(blocked).toBe(false);
    expect(store.syncError).toContain('Spam guard triggered');

    const remainingIds = store.messages.map((message) => message.id);
    expect(remainingIds).toEqual(['safe-1']);

    expect(store.moderationIncidents.length).toBe(1);
    const incident = store.moderationIncidents[0];
    expect(incident).toBeDefined();
    if (!incident) return;
    expect(incident.offenderUid).toBe(spamUid);
    expect(incident.offenderName).toBe('spammer');
    expect(incident.purgedCount).toBe(3);
    expect(incident.blockedAttempt).toContain('triggering spam guard');
    expect(incident.recommendation.toLowerCase()).toContain('ban');

    const onCooldown = await store.sendMessage('text', 'still blocked', []);
    expect(onCooldown).toBe(false);
    expect(store.syncError).toContain('Spam cooldown active');

    vi.setSystemTime(now + 5 * 60 * 1000 + 1000);
    const afterCooldown = await store.sendMessage('text', 'cooldown finished', []);
    expect(afterCooldown).toBe(true);
    expect(store.messages.some((message) => message.body === 'cooldown finished')).toBe(true);
  });

  it('allows users to delete only their own messages', async () => {
    const now = Date.now();
    localStorage.setItem(
      'windose_jine_fallback_v2',
      JSON.stringify([
        {
          id: 'own-msg',
          authorUid: 'uid-user-1',
          authorName: 'user_one',
          authorAvatar: '/avatars/avatar_1.png',
          body: 'my message',
          createdAt: now - 5000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
        {
          id: 'other-msg',
          authorUid: 'uid-user-2',
          authorName: 'user_two',
          authorAvatar: '/avatars/avatar_2.png',
          body: 'their message',
          createdAt: now - 4000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
      ]),
    );

    const auth = useAuthStore();
    auth.currentUser = {
      uid: 'uid-user-1',
      username: 'user_one',
      pfp: '/avatars/avatar_1.png',
      email: 'user_one@windose.local',
      isAnonymous: false,
    };

    const store = useJineStore();
    const ownDelete = await store.deleteMessage('own-msg');
    expect(ownDelete).toBe(true);
    expect(store.messages.map((message) => message.id)).toEqual(['other-msg']);

    const otherDelete = await store.deleteMessage('other-msg');
    expect(otherDelete).toBe(false);
    expect(store.syncError).toContain('only delete your own messages');
    expect(store.messages.map((message) => message.id)).toEqual(['other-msg']);
  });

  it('allows moderators to delete both others and their own messages', async () => {
    const now = Date.now();
    localStorage.setItem(
      'windose_jine_fallback_v2',
      JSON.stringify([
        {
          id: 'other-msg',
          authorUid: 'uid-user-2',
          authorName: 'user_two',
          authorAvatar: '/avatars/avatar_2.png',
          body: 'other',
          createdAt: now - 5000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
        {
          id: 'mod-msg',
          authorUid: 'uid-mod',
          authorName: 'joser',
          authorAvatar: '/avatars/avatar_joser.jpg',
          body: 'mine',
          createdAt: now - 4000,
          embeds: [],
          isUnread: false,
          kind: 'text',
        },
      ]),
    );

    const auth = useAuthStore();
    auth.currentUser = {
      uid: 'uid-mod',
      username: 'joser',
      pfp: '/avatars/avatar_joser.jpg',
      email: 'joser@windose.local',
      isAnonymous: false,
    };

    const store = useJineStore();
    const deleteOtherPromise = store.deleteMessage('other-msg');
    await vi.advanceTimersByTimeAsync(400);
    const deleteOther = await deleteOtherPromise;
    expect(deleteOther).toBe(true);
    expect(store.deleteEffects.length).toBe(1);
    expect(store.deleteEffects[0]?.messageId).toBe('other-msg');
    expect(store.deleteEffects[0]?.targetUid).toBe('uid-user-2');
    const deleteOwn = await store.deleteMessage('mod-msg');
    expect(deleteOwn).toBe(true);
    expect(store.messages.length).toBe(0);
  });
});
