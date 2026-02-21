import { createLastFmAdapter } from './lastfm';
import { createSpotifyAdapter } from './spotify';
import { createSteamAdapter } from './steam';
import { createTwitterAdapter } from './twitter';
import { createYoutubeAdapter } from './youtube';
import type { InternetSiteAdapter, InternetSiteId } from '../types';

const lastFmUsername = import.meta.env.VITE_LASTFM_USERNAME as string | undefined;

export const internetAdapters: Record<InternetSiteId, InternetSiteAdapter> = {
  twitter: createTwitterAdapter(),
  steam: createSteamAdapter(),
  youtube: createYoutubeAdapter('https://www.youtube.com/@fentlacedcat'),
  lastfm: createLastFmAdapter(lastFmUsername ?? 'FoundLifeless'),
  spotify: createSpotifyAdapter('https://open.spotify.com/playlist/1Cim4pZnFmNXD8N4OtO3wz'),
};
