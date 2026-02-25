function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isValidNumber(value) {
  return Number.isFinite(value);
}

export function resolveFreshnessStatus(updatedAt, now = Date.now(), sourceStatus = 'OK') {
  if (!isValidNumber(updatedAt)) return 'STATIC';
  if (sourceStatus === 'FAILED') return 'STATIC';
  const ageMs = Math.max(0, now - updatedAt);
  if (ageMs <= 60_000) return 'LIVE';
  if (ageMs <= 10 * 60_000) return 'UPDATED';
  if (ageMs <= 60 * 60_000) return 'CACHED';
  return 'STATIC';
}

export function carryForwardPayload(previous, now = Date.now(), sourceStatus = 'PARTIAL') {
  if (!previous) return null;
  const safeSourceStatus = sourceStatus === 'FAILED' ? 'FAILED' : 'PARTIAL';
  return {
    ...previous,
    updatedAt: previous.updatedAt,
    freshnessStatus: resolveFreshnessStatus(previous.updatedAt, now, safeSourceStatus),
    sourceStatus: safeSourceStatus,
  };
}

function normalizePayload(payload, now) {
  const safeUpdatedAt = isValidNumber(payload?.updatedAt) ? payload.updatedAt : now;
  const sourceStatus = (() => {
    const value = String(payload?.sourceStatus || 'OK').toUpperCase();
    if (value === 'FAILED') return 'FAILED';
    if (value === 'PARTIAL') return 'PARTIAL';
    return 'OK';
  })();

  const providedFreshness = String(payload?.freshnessStatus || '').toUpperCase();
  const freshnessStatus = (
    providedFreshness === 'LIVE'
    || providedFreshness === 'UPDATED'
    || providedFreshness === 'CACHED'
    || providedFreshness === 'STATIC'
  )
    ? providedFreshness
    : resolveFreshnessStatus(safeUpdatedAt, now, sourceStatus);

  return {
    ...payload,
    updatedAt: safeUpdatedAt,
    sourceStatus,
    freshnessStatus,
  };
}

function clonePayload(payload) {
  return JSON.parse(JSON.stringify(payload));
}

function toStatusSummary(payloads) {
  const summary = {
    ok: 0,
    partial: 0,
    failed: 0,
  };
  for (const payload of payloads) {
    const status = String(payload?.sourceStatus || 'OK').toUpperCase();
    if (status === 'FAILED') summary.failed += 1;
    else if (status === 'PARTIAL') summary.partial += 1;
    else summary.ok += 1;
  }
  return summary;
}

export function createSocialHubState({
  sites,
  seedPayloads,
  loadSitePayload,
  onStateChange,
}) {
  const payloadBySite = new Map();
  const inflightBySite = new Map();
  const intervalBySite = new Map();
  const siteById = new Map((sites || []).map((site) => [site.id, site]));

  let lastRefreshAt = 0;
  let disposed = false;
  let refreshAllInProgress = false;

  for (const site of sites) {
    const seedPayload = seedPayloads?.[site.id];
    if (!seedPayload) continue;
    payloadBySite.set(site.id, clonePayload(seedPayload));
  }

  function snapshot(now = Date.now()) {
    const orderedPayloads = sites.map((site) => {
      const payload = payloadBySite.get(site.id) || seedPayloads?.[site.id];
      if (!payload) return null;
      return normalizePayload(payload, now);
    }).filter(Boolean);

    return {
      payloads: orderedPayloads,
      lastRefreshAt,
      refreshAllInProgress,
      summary: toStatusSummary(orderedPayloads),
    };
  }

  function publish(now = Date.now()) {
    if (typeof onStateChange !== 'function') return;
    onStateChange(snapshot(now));
  }

  function commitPayload(payload, now = Date.now()) {
    if (!payload || !payload.siteId) return;
    const normalized = normalizePayload(payload, now);
    payloadBySite.set(normalized.siteId, normalized);
    lastRefreshAt = Math.max(lastRefreshAt, now);
  }

  async function refreshSite(siteId, options = {}) {
    if (disposed) return;
    if (!siteById.has(siteId)) return;
    if (inflightBySite.has(siteId)) return;

    const now = Date.now();
    const site = siteById.get(siteId);
    const previous = payloadBySite.get(siteId) || seedPayloads?.[siteId] || null;
    const controller = new AbortController();
    inflightBySite.set(siteId, controller);

    try {
      const nextPayload = await loadSitePayload({
        site,
        previous,
        now,
        signal: controller.signal,
        reason: options.reason || 'auto',
      });

      if (disposed) return;
      if (nextPayload && nextPayload.siteId === siteId) {
        commitPayload(nextPayload, now);
      } else {
        const carried = carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
        if (carried) commitPayload(carried, now);
      }
    } catch {
      if (disposed) return;
      const carried = carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
      if (carried) commitPayload(carried, now);
    } finally {
      inflightBySite.delete(siteId);
      publish(now);
    }
  }

  async function refreshAll(reason = 'manual') {
    if (disposed) return;
    if (refreshAllInProgress) return;

    refreshAllInProgress = true;
    publish(Date.now());

    try {
      await Promise.all(
        sites.map((site) => refreshSite(site.id, { reason })),
      );
    } finally {
      refreshAllInProgress = false;
      publish(Date.now());
    }
  }

  function startAutoRefresh() {
    if (disposed) return;
    stopAutoRefresh();

    for (const site of sites) {
      const intervalMs = clamp(Number(site.refreshIntervalMs) || 30_000, 5_000, 60 * 60_000);
      void refreshSite(site.id, { reason: 'boot' });
      const timerId = window.setInterval(() => {
        void refreshSite(site.id, { reason: 'interval' });
      }, intervalMs);
      intervalBySite.set(site.id, timerId);
    }
  }

  function stopAutoRefresh() {
    for (const timerId of intervalBySite.values()) {
      window.clearInterval(timerId);
    }
    intervalBySite.clear();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopAutoRefresh();
    for (const controller of inflightBySite.values()) {
      controller.abort();
    }
    inflightBySite.clear();
  }

  publish(Date.now());

  return {
    refreshSite,
    refreshAll,
    startAutoRefresh,
    stopAutoRefresh,
    snapshot,
    dispose,
  };
}
