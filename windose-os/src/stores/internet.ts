import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { InternetRefreshManager } from '../services/internet/refreshManager';
import { internetAdapters } from '../services/internet/adapters';
import type {
  InternetRefreshState,
  InternetSiteId,
  InternetSitePayload,
} from '../services/internet/types';

const DEFAULT_REFRESH_INTERVAL_MS: Record<InternetSiteId, number> = {
  twitter: 30_000,
  steam: 15 * 60_000,
  youtube: 10 * 60_000,
  lastfm: 30_000,
  spotify: 10 * 60_000,
};

const MIN_REFRESH_BADGE_VISIBLE_MS = 720;

function createInitialRefreshState(): InternetRefreshState {
  return {
    isRefreshing: false,
    showRefreshBadge: false,
    lastSuccessAt: null,
    lastErrorAt: null,
    failureCount: 0,
    errorMessage: '',
  };
}

export const useInternetStore = defineStore('internet', () => {
  const payloads = ref<Partial<Record<InternetSiteId, InternetSitePayload>>>({});
  const refreshStates = ref<Record<InternetSiteId, InternetRefreshState>>({
    twitter: createInitialRefreshState(),
    steam: createInitialRefreshState(),
    youtube: createInitialRefreshState(),
    lastfm: createInitialRefreshState(),
    spotify: createInitialRefreshState(),
  });

  const refreshManager = new InternetRefreshManager();
  const badgeTimers = new Map<InternetSiteId, ReturnType<typeof window.setTimeout>>();

  const siteIds = computed(() => Object.keys(payloads.value) as InternetSiteId[]);

  function setPayload(payload: InternetSitePayload): void {
    payloads.value = {
      ...payloads.value,
      [payload.siteId]: payload,
    };
  }

  function clearBadgeTimer(siteId: InternetSiteId): void {
    const existing = badgeTimers.get(siteId);
    if (!existing) return;
    window.clearTimeout(existing);
    badgeTimers.delete(siteId);
  }

  function settleRefreshBadge(siteId: InternetSiteId, startedAt: number): void {
    const state = refreshStates.value[siteId];
    if (!state) return;
    const elapsedMs = Date.now() - startedAt;
    const remainingMs = Math.max(0, MIN_REFRESH_BADGE_VISIBLE_MS - elapsedMs);

    clearBadgeTimer(siteId);
    if (remainingMs === 0) {
      state.showRefreshBadge = false;
      return;
    }

    const timer = window.setTimeout(() => {
      const latestState = refreshStates.value[siteId];
      if (latestState) latestState.showRefreshBadge = false;
      badgeTimers.delete(siteId);
    }, remainingMs);
    badgeTimers.set(siteId, timer);
  }

  function seedPayload(payload: InternetSitePayload): void {
    setPayload(payload);
  }

  function loadCachedPayload(siteId: InternetSiteId): InternetSitePayload | null {
    // Cache is intentionally disabled for live-only internet panels.
    return payloads.value[siteId] ?? null;
  }

  async function refreshSite(siteId: InternetSiteId): Promise<boolean> {
    const adapter = internetAdapters[siteId];
    const state = refreshStates.value[siteId];
    if (!adapter || !state) return false;

    clearBadgeTimer(siteId);
    const startedAt = Date.now();
    state.isRefreshing = true;
    state.showRefreshBadge = true;
    state.errorMessage = '';

    const now = startedAt;
    const previous = payloads.value[siteId] ?? null;

    try {
      const result = await adapter({
        siteId,
        now,
        previous: previous ?? null,
      });
      if (!result) {
        state.isRefreshing = false;
        settleRefreshBadge(siteId, startedAt);
        return false;
      }

      if (result.sourceStatus !== 'OK') {
        state.lastErrorAt = now;
        state.failureCount += 1;
        state.errorMessage = 'Live source unavailable.';
        state.isRefreshing = false;
        settleRefreshBadge(siteId, startedAt);
        return false;
      }

      setPayload(result);

      state.lastSuccessAt = now;
      state.failureCount = 0;
      state.isRefreshing = false;
      settleRefreshBadge(siteId, startedAt);
      return true;
    } catch (error) {
      state.lastErrorAt = now;
      state.failureCount += 1;
      state.errorMessage = error instanceof Error ? error.message : 'Unknown refresh error.';
      state.isRefreshing = false;
      settleRefreshBadge(siteId, startedAt);
      return false;
    }
  }

  function startAutoRefresh(siteId: InternetSiteId, intervalMs = DEFAULT_REFRESH_INTERVAL_MS[siteId]): void {
    const maxBackoffMs = siteId === 'twitter'
      ? Math.max(60_000, Math.round(intervalMs * 2))
      : undefined;
    refreshManager.startTarget({
      siteId,
      baseIntervalMs: intervalMs,
      maxBackoffMs,
      run: () => refreshSite(siteId),
    });
  }

  function triggerSiteRefresh(siteId: InternetSiteId): void {
    refreshManager.triggerNow(siteId);
  }

  function stopAutoRefresh(siteId: InternetSiteId): void {
    refreshManager.stopTarget(siteId);
  }

  function stopAllAutoRefresh(): void {
    refreshManager.stopAll();
    for (const siteId of Object.keys(refreshStates.value) as InternetSiteId[]) {
      clearBadgeTimer(siteId);
      const state = refreshStates.value[siteId];
      if (state) state.showRefreshBadge = false;
    }
  }

  return {
    payloads,
    refreshStates,
    siteIds,
    seedPayload,
    loadCachedPayload,
    refreshSite,
    startAutoRefresh,
    triggerSiteRefresh,
    stopAutoRefresh,
    stopAllAutoRefresh,
  };
});
