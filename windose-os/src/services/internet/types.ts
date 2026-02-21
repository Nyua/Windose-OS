export type InternetSiteId = 'twitter' | 'steam' | 'youtube' | 'lastfm' | 'spotify';

export type InternetFreshnessStatus = 'LIVE' | 'UPDATED' | 'CACHED' | 'STATIC';
export type InternetSourceStatus = 'OK' | 'PARTIAL' | 'FAILED';

export interface InternetProfile {
  name: string;
  handle: string;
  avatarUrl: string;
  bio: string;
}

export interface InternetStat {
  label: string;
  value: string;
}

export type InternetItemMediaType = 'image' | 'video';
export type InternetTwitterPostKind = 'original' | 'retweet' | 'quote';

export interface InternetQuotedTweet {
  text: string;
  handle?: string;
  linkUrl?: string;
  mediaType?: InternetItemMediaType;
  mediaUrl?: string;
  mediaUrls?: string[];
}

export interface InternetSiteItem {
  id: string;
  title: string;
  meta: string;
  mediaType?: InternetItemMediaType;
  mediaUrl?: string;
  mediaUrls?: string[];
  linkUrl?: string;
  postKind?: InternetTwitterPostKind;
  sourceHandle?: string;
  quote?: InternetQuotedTweet;
}

export interface InternetSitePayload {
  siteId: InternetSiteId;
  profile: InternetProfile;
  stats: InternetStat[];
  items: InternetSiteItem[];
  updatedAt: number;
  freshnessStatus: InternetFreshnessStatus;
  sourceStatus: InternetSourceStatus;
}

export interface InternetAdapterContext {
  siteId: InternetSiteId;
  now: number;
  previous: InternetSitePayload | null;
  signal?: AbortSignal;
}

export type InternetSiteAdapter = (
  context: InternetAdapterContext,
) => Promise<InternetSitePayload | null>;

export interface InternetRefreshState {
  isRefreshing: boolean;
  showRefreshBadge: boolean;
  lastSuccessAt: number | null;
  lastErrorAt: number | null;
  failureCount: number;
  errorMessage: string;
}

export function resolveFreshnessStatus(updatedAt: number, now = Date.now()): InternetFreshnessStatus {
  const ageMs = Math.max(0, now - updatedAt);
  if (ageMs <= 60_000) return 'LIVE';
  if (ageMs <= 10 * 60_000) return 'UPDATED';
  return 'CACHED';
}
