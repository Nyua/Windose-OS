import type { InternetSiteId } from './types';

interface RefreshTarget {
  siteId: InternetSiteId;
  baseIntervalMs: number;
  maxBackoffMs: number;
  run: () => Promise<boolean>;
  timer: ReturnType<typeof window.setTimeout> | null;
  failureCount: number;
  active: boolean;
}

export class InternetRefreshManager {
  private readonly targets = new Map<InternetSiteId, RefreshTarget>();

  startTarget(options: {
    siteId: InternetSiteId;
    baseIntervalMs: number;
    maxBackoffMs?: number;
    run: () => Promise<boolean>;
  }): void {
    this.stopTarget(options.siteId);

    const target: RefreshTarget = {
      siteId: options.siteId,
      baseIntervalMs: Math.max(1_000, options.baseIntervalMs),
      maxBackoffMs: Math.max(5_000, options.maxBackoffMs ?? 300_000),
      run: options.run,
      timer: null,
      failureCount: 0,
      active: true,
    };

    this.targets.set(options.siteId, target);
    this.scheduleNext(target, 0);
  }

  stopTarget(siteId: InternetSiteId): void {
    const target = this.targets.get(siteId);
    if (!target) return;
    target.active = false;
    if (target.timer !== null) {
      window.clearTimeout(target.timer);
      target.timer = null;
    }
    this.targets.delete(siteId);
  }

  stopAll(): void {
    for (const siteId of this.targets.keys()) {
      this.stopTarget(siteId);
    }
  }

  triggerNow(siteId: InternetSiteId): void {
    const target = this.targets.get(siteId);
    if (!target || !target.active) return;
    if (target.timer !== null) {
      window.clearTimeout(target.timer);
      target.timer = null;
    }
    this.scheduleNext(target, 0);
  }

  private scheduleNext(target: RefreshTarget, delayMs: number): void {
    target.timer = window.setTimeout(async () => {
      if (!target.active) return;
      let ok = false;
      try {
        ok = await target.run();
      } catch {
        ok = false;
      }

      if (ok) {
        target.failureCount = 0;
        this.scheduleNext(target, target.baseIntervalMs);
        return;
      }

      target.failureCount += 1;
      const multiplier = Math.min(2 ** target.failureCount, 32);
      const backoffDelay = Math.min(target.baseIntervalMs * multiplier, target.maxBackoffMs);
      this.scheduleNext(target, backoffDelay);
    }, Math.max(0, delayMs));
  }
}

