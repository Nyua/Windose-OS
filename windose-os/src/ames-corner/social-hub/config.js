export const SOCIAL_HUB_SITES = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    shortLabel: 'X',
    url: 'https://x.com/ProbablyLaced',
    refreshIntervalMs: 30_000,
  },
  {
    id: 'steam',
    label: 'Steam',
    shortLabel: 'ST',
    url: 'https://steamcommunity.com/id/foundlifeless/',
    refreshIntervalMs: 30_000,
  },
  {
    id: 'discord',
    label: 'Discord',
    shortLabel: 'DC',
    url: 'https://discord.com/users/331350000154050560',
    refreshIntervalMs: 30_000,
  },
  {
    id: 'lastfm',
    label: 'Last.fm',
    shortLabel: 'FM',
    url: 'https://www.last.fm/user/FoundLifeless',
    refreshIntervalMs: 30_000,
  },
  {
    id: 'spotify',
    label: 'Spotify',
    shortLabel: 'SP',
    url: 'https://open.spotify.com/playlist/1Cim4pZnFmNXD8N4OtO3wz?si=b75cc9f3073a473b&nd=1&dlsi=49ce9ea61601457a',
    refreshIntervalMs: 10 * 60_000,
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    shortLabel: 'SC',
    url: 'https://soundcloud.com/probablylacedwithfentanyl',
    refreshIntervalMs: 10 * 60_000,
  },
];

export const DISCORD_PROFILE_OVERRIDES = {
  bannerUrl: '',
  bio: '',
  decorationUrl: '',
};

const BASE_SEED_AT = Date.parse('2026-02-24T00:00:00.000Z');

function buildTwitterSeed() {
  return {
    siteId: 'twitter',
    profile: {
      name: 'ProbablyLaced',
      handle: '@ProbablyLaced',
      url: 'https://x.com/ProbablyLaced',
      avatarUrl: '',
      bio: 'Operator feed mirror for Ame\'s Corner social array.',
    },
    stats: [
      { label: 'Followers', value: 'Live' },
      { label: 'Following', value: 'Live' },
      { label: 'Posts', value: 'Live' },
    ],
    items: [
      { id: 'seed-twitter-1', title: 'Live timeline warming...', meta: 'Waiting for extractor signal' },
      { id: 'seed-twitter-2', title: 'Fallback mode active', meta: 'Card remains interactive without redirect' },
    ],
    embeds: {},
    updatedAt: BASE_SEED_AT,
    freshnessStatus: 'STATIC',
    sourceStatus: 'PARTIAL',
  };
}

function buildSteamSeed() {
  return {
    siteId: 'steam',
    profile: {
      name: 'FoundLifeless',
      handle: 'steamcommunity.com/id/foundlifeless',
      url: 'https://steamcommunity.com/id/foundlifeless/',
      avatarUrl: '',
      borderImageUrl: '',
      borderVideoUrl: '',
      statusText: 'Status pending',
      levelBadgeLabel: 'Level --',
      bio: '˚₊‧꒰ა ♡ ໒꒱ ‧₊˚',
    },
    stats: [
      { label: 'Level', value: '--' },
      { label: 'Status', value: 'Pending' },
      { label: '2W Hours', value: '--' },
      { label: 'Recent Games', value: '--' },
    ],
    items: [
      { id: 'seed-steam-1', title: 'Recent activity pending', meta: 'Awaiting Steam profile extraction' },
      { id: 'seed-steam-2', title: '2-week hours pending', meta: 'Live scrape retry queued' },
    ],
    embeds: {},
    updatedAt: BASE_SEED_AT,
    freshnessStatus: 'STATIC',
    sourceStatus: 'PARTIAL',
  };
}

function buildDiscordSeed() {
  const overrideBanner = String(DISCORD_PROFILE_OVERRIDES.bannerUrl || '').trim();
  const overrideBio = String(DISCORD_PROFILE_OVERRIDES.bio || '').trim();
  const overrideDecoration = String(DISCORD_PROFILE_OVERRIDES.decorationUrl || '').trim();

  return {
    siteId: 'discord',
    profile: {
      name: 'foundlifeless',
      handle: '@foundlifeless',
      url: 'https://discord.com/users/331350000154050560',
      avatarUrl: '',
      statusText: 'Unknown',
      statusKey: 'unknown',
      bannerUrl: overrideBanner,
      decorationUrl: overrideDecoration,
      bio: overrideBio || 'Discord profile card synced with Lanyard.',
    },
    stats: [
      { label: 'Status', value: 'Unknown' },
      { label: 'Presence Source', value: 'Best effort' },
      { label: 'Activities', value: '--' },
    ],
    items: [
      { id: 'seed-discord-1', title: 'Activity unavailable', meta: 'Awaiting live presence feed' },
    ],
    embeds: {},
    updatedAt: BASE_SEED_AT,
    freshnessStatus: 'STATIC',
    sourceStatus: 'PARTIAL',
  };
}

function buildLastFmSeed() {
  const recentTracks = [
    {
      id: 'seed-lastfm-recent-1',
      title: 'Loading recent songs...',
      subtitle: 'Awaiting Last.fm payload',
      countLabel: '--',
      imageUrl: '',
      url: 'https://www.last.fm/user/FoundLifeless',
      meta: 'Awaiting Last.fm payload | --',
    },
    {
      id: 'seed-lastfm-recent-2',
      title: 'Fallback active',
      subtitle: 'Extractor/API handoff pending',
      countLabel: '--',
      imageUrl: '',
      url: 'https://www.last.fm/user/FoundLifeless',
      meta: 'Extractor/API handoff pending | --',
    },
  ];

  const topArtists = [
    {
      id: 'seed-lastfm-artist-1',
      title: 'Top artists loading',
      subtitle: '',
      countLabel: '-- plays',
      imageUrl: '',
      url: 'https://www.last.fm/user/FoundLifeless/library/artists',
    },
  ];

  const topAlbums = [
    {
      id: 'seed-lastfm-album-1',
      title: 'Top albums loading',
      subtitle: '',
      countLabel: '-- plays',
      imageUrl: '',
      url: 'https://www.last.fm/user/FoundLifeless/library/albums',
    },
  ];

  const profileTotals = {
    scrobbles: '--',
    artists: '--',
    lovedTracks: '--',
  };

  return {
    siteId: 'lastfm',
    profile: {
      name: 'FoundLifeless',
      handle: 'last.fm/user/FoundLifeless',
      url: 'https://www.last.fm/user/FoundLifeless',
      avatarUrl: '',
      bio: 'Last.fm compact feed is warming up.',
    },
    stats: [
      { label: 'Feed', value: 'Live+Fallback' },
      { label: 'Scrobbles', value: '--' },
      { label: 'Artists', value: '--' },
      { label: 'Loved Tracks', value: '--' },
      { label: 'Recent', value: '--' },
    ],
    items: recentTracks,
    sections: {
      recentTracks,
      topArtists,
      topAlbums,
      profileTotals,
    },
    embeds: {},
    updatedAt: BASE_SEED_AT,
    freshnessStatus: 'STATIC',
    sourceStatus: 'PARTIAL',
  };
}

function buildSpotifySeed() {
  return {
    siteId: 'spotify',
    profile: {
      name: 'Spotify Playlist',
      handle: 'open.spotify.com',
      url: 'https://open.spotify.com/playlist/1Cim4pZnFmNXD8N4OtO3wz?si=b75cc9f3073a473b&nd=1&dlsi=49ce9ea61601457a',
      avatarUrl: '',
      bio: 'Playlist card with in-page embed.',
    },
    stats: [
      { label: 'Provider', value: 'Spotify' },
      { label: 'Tracks', value: 'Live' },
      { label: 'Mode', value: 'Embed' },
    ],
    items: [
      { id: 'seed-spotify-1', title: 'Playlist metadata loading', meta: 'Embed is available immediately' },
      { id: 'seed-spotify-2', title: 'Track list pending', meta: 'Live extraction requested in background' },
    ],
    embeds: {
      spotifyEmbedUrl: 'https://open.spotify.com/embed/playlist/1Cim4pZnFmNXD8N4OtO3wz?utm_source=generator',
    },
    updatedAt: BASE_SEED_AT,
    freshnessStatus: 'STATIC',
    sourceStatus: 'PARTIAL',
  };
}

function buildSoundCloudSeed() {
  return {
    siteId: 'soundcloud',
    profile: {
      name: 'probablylacedwithfentanyl',
      handle: 'soundcloud.com/probablylacedwithfentanyl',
      url: 'https://soundcloud.com/probablylacedwithfentanyl',
      avatarUrl: '',
      bio: 'SoundCloud profile with in-page widget.',
    },
    stats: [
      { label: 'Provider', value: 'SoundCloud' },
      { label: 'Mode', value: 'Widget' },
      { label: 'Source', value: 'Live+fallback' },
    ],
    items: [
      { id: 'seed-soundcloud-1', title: 'Profile metadata loading', meta: 'Widget is available immediately' },
      { id: 'seed-soundcloud-2', title: 'Recent tracks pending', meta: 'Extractor data will replace fallback' },
    ],
    embeds: {
      soundcloudEmbedUrl: buildSoundCloudEmbedUrl('https://soundcloud.com/probablylacedwithfentanyl'),
    },
    updatedAt: BASE_SEED_AT,
    freshnessStatus: 'STATIC',
    sourceStatus: 'PARTIAL',
  };
}

export function buildSoundCloudEmbedUrl(url) {
  const encoded = encodeURIComponent(url);
  return `https://w.soundcloud.com/player/?url=${encoded}&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
}

function buildSeedPayloadMap() {
  return {
    twitter: buildTwitterSeed(),
    steam: buildSteamSeed(),
    discord: buildDiscordSeed(),
    lastfm: buildLastFmSeed(),
    spotify: buildSpotifySeed(),
    soundcloud: buildSoundCloudSeed(),
  };
}

export function createSeedPayloadMap() {
  return buildSeedPayloadMap();
}

export function getSiteConfig(siteId) {
  return SOCIAL_HUB_SITES.find((site) => site.id === siteId) || null;
}

