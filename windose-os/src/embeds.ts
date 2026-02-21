export type JineEmbed = JineYouTubeEmbed | JineTwitterEmbed;

export interface JineYouTubeEmbed {
  type: 'youtube';
  videoId: string;
  url: string;
}

export interface JineTwitterEmbed {
  type: 'twitter';
  tweetId: string;
  url: string;
}

const URL_RE = /https?:\/\/[^\s<>()]+/gi;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);
const TWITTER_HOSTS = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']);

function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().trim();
}

function parseYouTube(url: URL): JineYouTubeEmbed | null {
  const host = normalizeHost(url.hostname);
  if (!YOUTUBE_HOSTS.has(host)) return null;

  let videoId = '';
  if (host === 'youtu.be') {
    videoId = url.pathname.replace('/', '').trim();
  } else if (url.pathname.startsWith('/watch')) {
    videoId = (url.searchParams.get('v') ?? '').trim();
  } else if (url.pathname.startsWith('/shorts/')) {
    videoId = (url.pathname.replace('/shorts/', '').split('/')[0] ?? '').trim();
  } else if (url.pathname.startsWith('/embed/')) {
    videoId = (url.pathname.replace('/embed/', '').split('/')[0] ?? '').trim();
  }

  if (!videoId) return null;
  return { type: 'youtube', videoId, url: url.toString() };
}

function parseTwitter(url: URL): JineTwitterEmbed | null {
  const host = normalizeHost(url.hostname);
  if (!TWITTER_HOSTS.has(host)) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  const statusIdx = parts.findIndex((p) => p.toLowerCase() === 'status');
  if (statusIdx < 0 || statusIdx + 1 >= parts.length) return null;

  const tweetId = (parts[statusIdx + 1] ?? '').trim();
  if (!/^\d+$/.test(tweetId)) return null;
  return { type: 'twitter', tweetId, url: url.toString() };
}

export function parseEmbedFromUrl(raw: string): JineEmbed | null {
  const value = raw.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  return parseYouTube(url) ?? parseTwitter(url);
}

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_RE) ?? [];
  return matches.map((m) => m.trim()).filter((m) => m.length > 0);
}

export function parseEmbedsFromText(text: string): JineEmbed[] {
  const urls = extractUrls(text);
  const out: JineEmbed[] = [];
  const seen = new Set<string>();

  for (const url of urls) {
    const embed = parseEmbedFromUrl(url);
    if (!embed) continue;
    if (seen.has(embed.url)) continue;
    seen.add(embed.url);
    out.push(embed);
  }
  return out;
}

export function toYouTubeEmbedSrc(videoId: string): string {
  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    playsinline: '1',
    loop: '1',
    playlist: videoId,
    enablejsapi: '1',
  });
  if (typeof window !== 'undefined' && window.location?.origin) {
    params.set('origin', window.location.origin);
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
