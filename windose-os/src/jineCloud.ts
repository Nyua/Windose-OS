import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import type { JineEmbed } from './embeds';
import { getFirebaseServices } from './firebase';

export type JineMessageKind = 'text' | 'sticker';
export type JineModerationEventType = 'delete_explosion';

export interface JineCloudMessage {
  id: string;
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  kind: JineMessageKind;
  body: string;
  embeds: JineEmbed[];
  createdAt: number;
  editedAt?: number;
}

export interface CreateJineCloudMessageInput {
  authorUid: string;
  authorName: string;
  authorAvatar: string;
  kind: JineMessageKind;
  body: string;
  embeds: JineEmbed[];
}

export interface JineModerationEvent {
  id: string;
  type: JineModerationEventType;
  messageId: string;
  actorUid: string;
  actorName: string;
  targetUid: string;
  targetName: string;
  createdAt: number;
}

export interface CreateJineModerationEventInput {
  type: JineModerationEventType;
  messageId: string;
  actorUid: string;
  actorName: string;
  targetUid: string;
  targetName: string;
}

export interface JineProfileSummary {
  uid: string;
  username: string;
  avatarUrl: string;
  createdAt: number | null;
}

function toMillis(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toMillis' in (value as Record<string, unknown>)) {
    try {
      return (value as Timestamp).toMillis();
    } catch {
      return 0;
    }
  }
  return 0;
}

function sanitizeEmbeds(value: unknown): JineEmbed[] {
  if (!Array.isArray(value)) return [];
  return value.filter((embed): embed is JineEmbed => {
    if (!embed || typeof embed !== 'object') return false;
    const e = embed as Record<string, unknown>;
    if (e.type === 'youtube') {
      return typeof e.videoId === 'string' && typeof e.url === 'string';
    }
    if (e.type === 'twitter') {
      return typeof e.tweetId === 'string' && typeof e.url === 'string';
    }
    return false;
  });
}

function sanitizeKind(value: unknown): JineMessageKind {
  return value === 'sticker' ? 'sticker' : 'text';
}

function sanitizeModerationEventType(value: unknown): JineModerationEventType | null {
  if (value === 'delete_explosion') return 'delete_explosion';
  return null;
}

export function subscribeToJineMessages(
  onMessages: (messages: JineCloudMessage[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const { db } = getFirebaseServices();
  const q = query(collection(db, 'jine_messages'), orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages: JineCloudMessage[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          authorUid: String(data.authorUid ?? ''),
          authorName: String(data.authorName ?? 'Unknown'),
          authorAvatar: String(data.authorAvatar ?? ''),
          kind: sanitizeKind(data.kind),
          body: String(data.body ?? ''),
          embeds: sanitizeEmbeds(data.embeds),
          createdAt: toMillis(data.createdAt),
          editedAt: toMillis(data.editedAt) || undefined,
        };
      });
      onMessages(messages);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

export async function createJineCloudMessage(input: CreateJineCloudMessageInput): Promise<void> {
  const { db } = getFirebaseServices();
  await addDoc(collection(db, 'jine_messages'), {
    authorUid: input.authorUid,
    authorName: input.authorName,
    authorAvatar: input.authorAvatar,
    kind: input.kind,
    body: input.body,
    embeds: input.embeds,
    createdAt: serverTimestamp(),
    editedAt: null,
  });
}

export async function deleteJineCloudMessage(messageId: string): Promise<void> {
  const { db } = getFirebaseServices();
  await deleteDoc(doc(db, 'jine_messages', messageId));
}

export function subscribeToJineModerationEvents(
  onEvents: (events: JineModerationEvent[]) => void,
  onError?: (error: unknown) => void,
): () => void {
  const { db } = getFirebaseServices();
  const q = query(collection(db, 'jine_events'), orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const events: JineModerationEvent[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const type = sanitizeModerationEventType(data.type);
          if (!type) return null;
          return {
            id: docSnap.id,
            type,
            messageId: String(data.messageId ?? ''),
            actorUid: String(data.actorUid ?? ''),
            actorName: String(data.actorName ?? 'unknown'),
            targetUid: String(data.targetUid ?? ''),
            targetName: String(data.targetName ?? 'unknown'),
            createdAt: toMillis(data.createdAt),
          };
        })
        .filter((event): event is JineModerationEvent => !!event && event.messageId.length > 0);
      onEvents(events);
    },
    (error) => {
      if (onError) onError(error);
    },
  );
}

export async function createJineModerationEvent(input: CreateJineModerationEventInput): Promise<void> {
  const { db } = getFirebaseServices();
  await addDoc(collection(db, 'jine_events'), {
    type: input.type,
    messageId: input.messageId,
    actorUid: input.actorUid,
    actorName: input.actorName,
    targetUid: input.targetUid,
    targetName: input.targetName,
    createdAt: serverTimestamp(),
  });
}

export async function getJineProfileSummary(uid: string): Promise<JineProfileSummary | null> {
  const { db } = getFirebaseServices();
  const snap = await getDoc(doc(db, 'profiles', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  return {
    uid,
    username: String(data.displayName ?? ''),
    avatarUrl: String(data.avatarId ?? ''),
    createdAt: toMillis(data.createdAt) || null,
  };
}
