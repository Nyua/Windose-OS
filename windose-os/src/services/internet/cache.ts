import type { InternetSiteId, InternetSitePayload } from './types';
import { resolveFreshnessStatus } from './types';

const CACHE_KEY_PREFIX = 'windose_internet_cache_v2:';

interface CachedInternetPayload {
  payload: InternetSitePayload;
  expiresAt: number;
}

function cacheKey(siteId: InternetSiteId): string {
  return `${CACHE_KEY_PREFIX}${siteId}`;
}

export function readInternetCache(siteId: InternetSiteId, now = Date.now()): InternetSitePayload | null {
  try {
    const raw = localStorage.getItem(cacheKey(siteId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedInternetPayload;
    if (!parsed || typeof parsed !== 'object' || !parsed.payload || typeof parsed.expiresAt !== 'number') {
      return null;
    }
    if (parsed.expiresAt < now) {
      return {
        ...parsed.payload,
        freshnessStatus: 'CACHED',
        sourceStatus: parsed.payload.sourceStatus === 'OK' ? 'PARTIAL' : parsed.payload.sourceStatus,
      };
    }
    return {
      ...parsed.payload,
      freshnessStatus: resolveFreshnessStatus(parsed.payload.updatedAt, now),
    };
  } catch {
    return null;
  }
}

export function writeInternetCache(
  siteId: InternetSiteId,
  payload: InternetSitePayload,
  ttlMs: number,
  now = Date.now(),
): void {
  try {
    const record: CachedInternetPayload = {
      payload,
      expiresAt: now + Math.max(0, ttlMs),
    };
    localStorage.setItem(cacheKey(siteId), JSON.stringify(record));
  } catch {
    // Ignore storage failures; live state still works.
  }
}

export function clearInternetCache(siteId: InternetSiteId): void {
  try {
    localStorage.removeItem(cacheKey(siteId));
  } catch {
    // Ignore storage failures.
  }
}
