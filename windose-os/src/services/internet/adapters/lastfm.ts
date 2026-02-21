import type { InternetSiteAdapter, InternetSiteItem, InternetSitePayload } from '../types';
import { carryForwardPayload, fetchJsonWithTimeout } from './utils';

interface LastFmTrackImage {
  size?: string;
  '#text'?: string;
}

interface LastFmRecentTrack {
  name?: string;
  url?: string;
  artist?: { '#text'?: string };
  date?: { uts?: string; '#text'?: string };
  image?: LastFmTrackImage[];
  '@attr'?: { nowplaying?: string };
}

interface LastFmRecentTracksResponse {
  recenttracks?: {
    track?: LastFmRecentTrack[] | LastFmRecentTrack;
  };
}

function pickTrackImage(images: LastFmTrackImage[] | undefined): string | undefined {
  if (!Array.isArray(images)) return undefined;
  const preferredSizes = ['extralarge', 'large', 'medium', 'small'];
  for (const size of preferredSizes) {
    const match = images.find((image) => image?.size === size && image?.['#text']);
    if (match?.['#text']) return match['#text'];
  }
  return images.find((image) => Boolean(image?.['#text']))?.['#text'];
}

function normalizeTracks(response: LastFmRecentTracksResponse): LastFmRecentTrack[] {
  const raw = response.recenttracks?.track;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [raw];
}

function mapTrackToItem(track: LastFmRecentTrack, index: number): InternetSiteItem {
  const title = String(track.name ?? 'Unknown track');
  const artist = String(track.artist?.['#text'] ?? 'Unknown artist');
  const nowPlaying = track['@attr']?.nowplaying === 'true';
  const meta = nowPlaying ? `${artist} - now playing` : artist;
  const trackId = String(track.date?.uts ?? `now-${index}`);
  const mediaUrl = pickTrackImage(track.image);

  return {
    id: `lastfm-track-${trackId}-${index}`,
    title,
    meta,
    mediaType: mediaUrl ? 'image' : undefined,
    mediaUrl,
    linkUrl: track.url ? String(track.url) : undefined,
  };
}

export function createLastFmAdapter(username: string): InternetSiteAdapter {
  return async ({ now, previous, signal }): Promise<InternetSitePayload | null> => {
    const apiKey = import.meta.env.VITE_LASTFM_API_KEY as string | undefined;
    if (!apiKey) {
      return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
    }

    try {
      const endpoint = new URL('https://ws.audioscrobbler.com/2.0/');
      endpoint.searchParams.set('method', 'user.getrecenttracks');
      endpoint.searchParams.set('user', username);
      endpoint.searchParams.set('api_key', apiKey);
      endpoint.searchParams.set('format', 'json');
      endpoint.searchParams.set('limit', '20');

      const data = await fetchJsonWithTimeout<LastFmRecentTracksResponse>(endpoint.toString(), 10_000, signal);
      const tracks = normalizeTracks(data);
      const items = tracks.map(mapTrackToItem);

      if (!items.length) {
        return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
      }

      return {
        siteId: 'lastfm',
        profile: previous?.profile ?? {
          name: username,
          handle: `last.fm/user/${username}`,
          avatarUrl: '',
          bio: 'Live from Last.fm',
        },
        stats: previous?.stats ?? [],
        items,
        updatedAt: now,
        freshnessStatus: 'LIVE',
        sourceStatus: 'OK',
      };
    } catch {
      return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
    }
  };
}
