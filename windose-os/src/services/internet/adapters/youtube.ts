import type { InternetSiteAdapter, InternetSiteItem } from '../types';
import { carryForwardPayload, fetchJsonWithTimeout, fetchRemoteExtract } from './utils';

interface YoutubeOEmbedResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  thumbnail_url?: string;
}

function handleFromAuthorUrl(authorUrl: string | undefined, fallback: string): string {
  if (!authorUrl) return fallback;
  const parsed = authorUrl.trim();
  if (!parsed) return fallback;
  const handle = parsed.split('/').filter(Boolean).pop();
  if (!handle) return fallback;
  return handle.startsWith('@') ? handle : `@${handle}`;
}

function asText(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

function asTextList(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry || '').trim()).filter((entry) => entry.length > 0);
  }
  const single = String(value || '').trim();
  return single ? [single] : [];
}

function parseChannelName(value: string, fallback: string): string {
  if (!value) return fallback;
  return value.replace(/\s*-\s*YouTube\s*$/i, '').trim() || fallback;
}

function mapVideoTitles(titles: string[]): InternetSiteItem[] {
  return titles.slice(0, 12).map((title, index) => ({
    id: `youtube-live-${index}`,
    title,
    meta: 'Latest upload',
  }));
}

export function createYoutubeAdapter(channelUrl = 'https://www.youtube.com/@fentlacedcat'): InternetSiteAdapter {
  return async ({ now, previous, signal }) => {
    try {
      const remoteData = await fetchRemoteExtract(
        channelUrl,
        [
          { key: 'meta_title', selector: "meta[property='og:title']", attr: 'content' },
          { key: 'meta_description', selector: "meta[name='description']", attr: 'content' },
          { key: 'meta_image', selector: "meta[property='og:image']", attr: 'content' },
          { key: 'channel_name', selector: '#channel-name #text', property: 'innerText' },
          { key: 'channel_handle', selector: '#channel-handle', property: 'innerText' },
          { key: 'video_titles', selector: '#video-title', all: true, limit: 12, property: 'innerText' },
        ],
        {
          waitMs: 2200,
          timeoutMs: 16_000,
          signal,
        },
      );

      if (remoteData && previous) {
        const metaTitle = asText(remoteData.meta_title);
        const description = asText(remoteData.meta_description);
        const imageUrl = asText(remoteData.meta_image);
        const channelName = asText(remoteData.channel_name);
        const channelHandle = asText(remoteData.channel_handle);
        const videoTitles = asTextList(remoteData.video_titles)
          .filter((title) => title.length > 0 && !title.toLowerCase().startsWith('shorts'));

        const resolvedName = parseChannelName(channelName || metaTitle, previous.profile.name);
        const resolvedHandle = channelHandle || previous.profile.handle;
        const resolvedBio = description || previous.profile.bio;
        const resolvedAvatar = imageUrl || previous.profile.avatarUrl;
        const resolvedItems = videoTitles.length ? mapVideoTitles(videoTitles) : previous.items;

        const hasLiveSignal = Boolean(metaTitle || channelName || channelHandle || imageUrl || videoTitles.length);
        if (hasLiveSignal) {
          return {
            ...previous,
            profile: {
              ...previous.profile,
              name: resolvedName,
              handle: resolvedHandle,
              bio: resolvedBio,
              avatarUrl: resolvedAvatar,
            },
            items: resolvedItems,
            updatedAt: now,
            freshnessStatus: 'UPDATED',
            sourceStatus: 'OK',
          };
        }
      }

      const endpoint = new URL('https://www.youtube.com/oembed');
      endpoint.searchParams.set('url', channelUrl);
      endpoint.searchParams.set('format', 'json');

      const data = await fetchJsonWithTimeout<YoutubeOEmbedResponse>(endpoint.toString(), 8_000, signal);
      if (!previous) return null;

      return {
        ...previous,
        profile: {
          ...previous.profile,
          name: data.author_name?.trim() || previous.profile.name,
          handle: handleFromAuthorUrl(data.author_url, previous.profile.handle),
          avatarUrl: data.thumbnail_url?.trim() || previous.profile.avatarUrl,
        },
        updatedAt: now,
        freshnessStatus: 'UPDATED',
        sourceStatus: 'OK',
      };
    } catch {
      return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
    }
  };
}
