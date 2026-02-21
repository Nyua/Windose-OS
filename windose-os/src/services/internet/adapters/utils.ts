import type { InternetSitePayload } from '../types';
import { resolveFreshnessStatus } from '../types';

export interface RemoteExtractField {
  key: string;
  selector: string;
  attr?: string;
  property?: 'text' | 'innerText' | 'html';
  all?: boolean;
  limit?: number;
  preserveEmpty?: boolean;
}

export type RemoteExtractData = Record<string, string | string[] | null>;

interface RemoteExtractResponse {
  ok?: boolean;
  data?: RemoteExtractData;
}

const DEFAULT_REMOTE_BROWSER_API_BASE = '/remote-browser-api';

function resolveRemoteBrowserApiBase(): string {
  const configured = (import.meta.env.VITE_REMOTE_BROWSER_API_BASE as string | undefined)?.trim();
  if (!configured) return DEFAULT_REMOTE_BROWSER_API_BASE;
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), Math.max(1, timeoutMs));

  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', onAbort);
  }
}

export async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    },
    timeoutMs,
    signal,
  );

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function postJsonWithTimeout<T>(
  url: string,
  body: unknown,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body ?? {}),
    },
    timeoutMs,
    signal,
  );

  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchRemoteExtract(
  targetUrl: string,
  fields: RemoteExtractField[],
  options?: {
    waitMs?: number;
    width?: number;
    height?: number;
    scrollSteps?: number;
    scrollBy?: number;
    scrollWaitMs?: number;
    timeoutMs?: number;
    signal?: AbortSignal;
  },
): Promise<RemoteExtractData | null> {
  if (!targetUrl.trim() || fields.length === 0) return null;

  const apiBase = resolveRemoteBrowserApiBase();
  const endpoint = `${apiBase}/extract?t=${Date.now()}`;
  const payload = {
    url: targetUrl,
    waitMs: options?.waitMs,
    width: options?.width,
    height: options?.height,
    scrollSteps: options?.scrollSteps,
    scrollBy: options?.scrollBy,
    scrollWaitMs: options?.scrollWaitMs,
    fields,
  };

  const response = await postJsonWithTimeout<RemoteExtractResponse>(
    endpoint,
    payload,
    options?.timeoutMs ?? 14_000,
    options?.signal,
  );

  if (!response || typeof response !== 'object') return null;
  if (!response.data || typeof response.data !== 'object') return null;
  return response.data;
}

export function carryForwardPayload(
  previous: InternetSitePayload | null,
  now: number,
  sourceStatus: InternetSitePayload['sourceStatus'] = 'PARTIAL',
): InternetSitePayload | null {
  if (!previous) return null;
  const carriedUpdatedAt = previous.updatedAt;
  return {
    ...previous,
    updatedAt: carriedUpdatedAt,
    freshnessStatus: resolveFreshnessStatus(carriedUpdatedAt, now),
    sourceStatus,
  };
}
