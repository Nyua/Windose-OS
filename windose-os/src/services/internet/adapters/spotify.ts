import type { InternetSiteAdapter, InternetSiteItem } from '../types';
import { carryForwardPayload, fetchJsonWithTimeout, fetchRemoteExtract } from './utils';

interface SpotifyOEmbedResponse {
  title?: string;
  thumbnail_url?: string;
  provider_name?: string;
}

function normalizeSpotifyTitle(value: string | undefined, fallback: string): string {
  const raw = value?.trim();
  if (!raw) return fallback;
  return raw.replace(/\s+-\s+playlist.*$/i, '').trim();
}

function profileBioPrefix(value: string): string {
  const firstSeparator = value.search(/[•|]/);
  if (firstSeparator === -1) return value.trim();
  return value.slice(0, firstSeparator).trim();
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

function normalizeSpotifyTrackLink(raw: string): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('https://open.spotify.com/')) return raw;
  if (raw.startsWith('/track/')) return `https://open.spotify.com${raw}`;
  return undefined;
}

function buildLiveTrackItems(titles: string[], links: string[]): InternetSiteItem[] {
  return titles.slice(0, 20).map((title, index) => ({
    id: `spotify-live-${index}`,
    title,
    meta: 'Spotify playlist track',
    linkUrl: normalizeSpotifyTrackLink(links[index] || ''),
  }));
}

export function createSpotifyAdapter(
  playlistUrl = 'https://open.spotify.com/playlist/1Cim4pZnFmNXD8N4OtO3wz',
): InternetSiteAdapter {
  return async ({ now, previous, signal }) => {
    try {
      if (previous) {
        const remoteData = await fetchRemoteExtract(
          playlistUrl,
          [
            { key: 'playlist_title', selector: "meta[property='og:title']", attr: 'content' },
            { key: 'playlist_description', selector: "meta[name='description']", attr: 'content' },
            { key: 'playlist_image', selector: "meta[property='og:image']", attr: 'content' },
            { key: 'track_titles', selector: "a[data-testid='internal-track-link']", all: true, limit: 24, property: 'innerText' },
            { key: 'track_links', selector: "a[data-testid='internal-track-link']", all: true, limit: 24, attr: 'href' },
          ],
          {
            waitMs: 2100,
            timeoutMs: 16_000,
            signal,
          },
        );

        if (remoteData) {
          const playlistTitle = asText(remoteData.playlist_title);
          const playlistDescription = asText(remoteData.playlist_description);
          const playlistImage = asText(remoteData.playlist_image);
          const trackTitles = asTextList(remoteData.track_titles);
          const trackLinks = asTextList(remoteData.track_links);

          const nextName = normalizeSpotifyTitle(playlistTitle || undefined, previous.profile.name);
          const nextBio = playlistDescription ? `${profileBioPrefix(previous.profile.bio)} - ${playlistDescription}` : previous.profile.bio;
          const nextAvatar = playlistImage || previous.profile.avatarUrl;
          const nextItems = trackTitles.length ? buildLiveTrackItems(trackTitles, trackLinks) : previous.items;

          const hasLiveSignal = Boolean(playlistTitle || playlistDescription || playlistImage || trackTitles.length);
          if (hasLiveSignal) {
            return {
              ...previous,
              profile: {
                ...previous.profile,
                name: nextName,
                avatarUrl: nextAvatar,
                bio: nextBio,
              },
              items: nextItems,
              updatedAt: now,
              freshnessStatus: 'UPDATED',
              sourceStatus: 'OK',
            };
          }
        }
      }

      const endpoint = new URL('https://open.spotify.com/oembed');
      endpoint.searchParams.set('url', playlistUrl);

      const data = await fetchJsonWithTimeout<SpotifyOEmbedResponse>(endpoint.toString(), 8_000, signal);
      if (!previous) return null;

      const bioBase = profileBioPrefix(previous.profile.bio);
      const provider = data.provider_name?.trim();

      return {
        ...previous,
        profile: {
          ...previous.profile,
          name: normalizeSpotifyTitle(data.title, previous.profile.name),
          avatarUrl: data.thumbnail_url?.trim() || previous.profile.avatarUrl,
          bio: provider ? `${bioBase} - ${provider}` : previous.profile.bio,
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
