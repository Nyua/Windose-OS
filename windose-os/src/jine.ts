export type JineMessageKind = 'text' | 'sticker';

export interface JineMessage {
  id: string;
  author: string;
  body: string;
  timestamp: number;
  isUnread: boolean;
  kind: JineMessageKind;
}

export interface JineState {
  messages: JineMessage[];
  lastReadAt: number | null;
  unreadCount: number;
}

export const JINE_STORAGE_KEY = 'windose_jine_v1';

const emptyState: JineState = {
  messages: [],
  lastReadAt: null,
  unreadCount: 0,
};

export function loadJineState(): JineState {
  try {
    const raw = localStorage.getItem(JINE_STORAGE_KEY);
    if (!raw) return { ...emptyState };
    const parsed = JSON.parse(raw) as Partial<JineState>;
    return {
      ...emptyState,
      ...parsed,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      lastReadAt: typeof parsed.lastReadAt === 'number' ? parsed.lastReadAt : null,
      unreadCount: typeof parsed.unreadCount === 'number' ? parsed.unreadCount : 0,
    };
  } catch {
    return { ...emptyState };
  }
}

export function saveJineState(state: JineState) {
  try {
    localStorage.setItem(JINE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

function makeMessage(author: string, body: string, timestamp: number, isUnread: boolean, kind: JineMessageKind = 'text'): JineMessage {
  return {
    id: `${author}-${timestamp}`,
    author,
    body,
    timestamp,
    isUnread,
    kind,
  };
}

export function seedJineState(now = Date.now()): JineState {
  const messages: JineMessage[] = [
    makeMessage('Ame', 'u awake? i just posted something weird...', now - 1000 * 60 * 12, true),
    makeMessage('Ame', 'dont forget to eat ok?', now - 1000 * 60 * 9, true),
    makeMessage('Ame', 'new day new vibes', now - 1000 * 60 * 5, true),
  ];
  return {
    messages,
    lastReadAt: null,
    unreadCount: messages.filter((m) => m.isUnread).length,
  };
}
