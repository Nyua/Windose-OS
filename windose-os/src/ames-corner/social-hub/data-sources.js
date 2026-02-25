import { fetchJsonWithTimeout, fetchRemoteExtract } from '../../services/internet/adapters/utils';
import { DISCORD_PROFILE_OVERRIDES, buildSoundCloudEmbedUrl } from './config';

const LASTFM_RECENT_TRACK_LIMIT = 30;

function asText(value) {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

function asTextList(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry ?? '').trim()).filter((entry) => entry.length > 0);
  }
  const single = String(value ?? '').trim();
  return single ? [single] : [];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const candidate = String(value ?? '').trim();
    if (candidate) return candidate;
  }
  return '';
}

function hashText(value) {
  let hash = 0;
  const source = String(value || '');
  for (let i = 0; i < source.length; i += 1) {
    hash = ((hash << 5) - hash) + source.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

function resolveUrl(raw, baseUrl = window.location.origin) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value, baseUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

function parseSteamHoursLastTwoWeeks(value) {
  const text = String(value || '');
  const match = text.match(/([\d.,]+)\s*(?:hours|hour|hrs|hr)\s+past\s+2\s+weeks/i);
  return match?.[1] ? match[1] : '';
}

function parseSteamHoursOnRecord(value) {
  const text = String(value || '');
  const match = text.match(/([\d.,]+)\s*(?:hours|hour|hrs|hr)\s+on\s+record/i);
  return match?.[1] ? match[1] : '';
}

function parseSteamLastPlayed(value) {
  const text = String(value || '');
  const onMatch = text.match(/last\s+played\s+on\s+([^\n\r]+)/i);
  if (onMatch?.[1]) return onMatch[1].trim();

  const genericMatch = text.match(/last\s+played\s+([^\n\r]+)/i);
  if (genericMatch?.[1]) return genericMatch[1].trim();
  return '';
}

function formatSteamLastPlayedLabel(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (/^last played/i.test(text)) return text;
  return `last played on ${text}`;
}

function parseSrcsetUrl(value) {
  const source = String(value || '').trim();
  if (!source) return '';
  const firstEntry = source.split(',')[0] || '';
  const firstToken = firstEntry.trim().split(/\s+/)[0] || '';
  return firstToken;
}

function parseSteamAppId(value) {
  const text = String(value || '');
  const match = text.match(/\/app\/(\d+)/i);
  return match?.[1] ? match[1] : '';
}

function buildSteamCapsuleArtworkUrl(appId) {
  const safeAppId = String(appId || '').trim();
  if (!safeAppId) return '';
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${safeAppId}/capsule_184x69.jpg`;
}

function resolveSteamRecentArtwork({
  gameLink,
  capsuleImage,
  capsuleSrcset,
  capsuleDataSrc,
  capsuleDataSrcset,
  siteUrl,
}) {
  const directUrl = resolveUrl(capsuleImage, siteUrl);
  const srcsetUrl = resolveUrl(parseSrcsetUrl(capsuleSrcset), siteUrl);
  const dataSrcUrl = resolveUrl(capsuleDataSrc, siteUrl);
  const dataSrcsetUrl = resolveUrl(parseSrcsetUrl(capsuleDataSrcset), siteUrl);
  const appId = parseSteamAppId(gameLink);
  const appArtworkUrl = buildSteamCapsuleArtworkUrl(appId);
  const imageUrl = firstNonEmpty(directUrl, srcsetUrl, dataSrcUrl, dataSrcsetUrl);
  const artworkUrl = firstNonEmpty(imageUrl, appArtworkUrl);
  return {
    appId,
    imageUrl,
    artworkUrl,
  };
}

function parseSteamStatusText(statusHeader, statusGame, avatarClass, fallback = '') {
  const header = String(statusHeader || '').replace(/\s+/g, ' ').trim();
  const game = String(statusGame || '').replace(/\s+/g, ' ').trim();
  if (header && game) return `${header} - ${game}`;
  if (header) return header;

  const classes = String(avatarClass || '').toLowerCase();
  if (classes.includes('in-game')) return game ? `Currently In-Game - ${game}` : 'Currently In-Game';
  if (classes.includes('online')) return 'Online';
  if (classes.includes('offline')) return 'Offline';
  return String(fallback || '').trim() || 'Status Unknown';
}

function mapSteamRecentGames(
  gameNames,
  gameDetails,
  gameLinks,
  gameCapsuleImages,
  gameCapsuleSrcsets,
  gameCapsuleDataSrc,
  gameCapsuleDataSrcset,
  totalHoursLastTwoWeeks,
  siteUrl,
) {
  return gameNames.slice(0, 8).map((name, index) => {
    const safeName = String(name || '').trim();
    const detailsRaw = String(gameDetails[index] || '');
    const details = detailsRaw.replace(/\s+/g, ' ').trim();
    const detailHours = parseSteamHoursLastTwoWeeks(details);
    const hoursOnRecord = parseSteamHoursOnRecord(detailsRaw);
    const lastPlayed = formatSteamLastPlayedLabel(parseSteamLastPlayed(detailsRaw));
    const linkUrl = resolveUrl(gameLinks[index], siteUrl);
    const artwork = resolveSteamRecentArtwork({
      gameLink: linkUrl,
      capsuleImage: gameCapsuleImages[index],
      capsuleSrcset: gameCapsuleSrcsets[index],
      capsuleDataSrc: gameCapsuleDataSrc[index],
      capsuleDataSrcset: gameCapsuleDataSrcset[index],
      siteUrl,
    });
    const totalHoursMeta = index === 0 && totalHoursLastTwoWeeks
      ? `${totalHoursLastTwoWeeks} hrs past 2 weeks`
      : '';
    const hourMeta = detailHours ? `${detailHours} hrs past 2 weeks` : totalHoursMeta;
    const meta = [hourMeta, details]
      .filter((entry) => String(entry || '').trim().length > 0)
      .join(' | ') || 'Recently played';
    return {
      id: `steam-live-${index}-${hashText(`${safeName}-${meta}`).slice(0, 10)}`,
      title: safeName || 'Unknown game',
      meta,
      url: linkUrl,
      appId: artwork.appId,
      imageUrl: artwork.imageUrl,
      artworkUrl: artwork.artworkUrl,
      hoursOnRecord,
      lastPlayed,
    };
  });
}

function parseDiscordUserId(url, fallback = '') {
  const fromUrl = String(url || '').match(/discord\.com\/users\/(\d{6,})/i)?.[1] || '';
  if (fromUrl) return fromUrl;
  const fromFallback = String(fallback || '').match(/(\d{6,})/)?.[1] || '';
  return fromFallback;
}

function formatDiscordStatus(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'online') return 'Online';
  if (normalized === 'idle') return 'Idle';
  if (normalized === 'dnd') return 'Do Not Disturb';
  if (normalized === 'offline') return 'Offline';
  return 'Unknown';
}

function normalizeDiscordStatusKey(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'online') return 'online';
  if (normalized === 'idle') return 'idle';
  if (normalized === 'dnd') return 'dnd';
  if (normalized === 'offline') return 'offline';
  return 'unknown';
}

function buildDiscordAvatarUrl(userId, avatarHash) {
  const safeUserId = String(userId || '').trim();
  const safeHash = String(avatarHash || '').trim();
  if (!safeUserId || !safeHash) return '';
  const ext = safeHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${safeUserId}/${safeHash}.${ext}?size=256`;
}

function buildDiscordBannerUrl(userId, bannerHash) {
  const safeUserId = String(userId || '').trim();
  const safeHash = String(bannerHash || '').trim();
  if (!safeUserId || !safeHash) return '';
  const ext = safeHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${safeUserId}/${safeHash}.${ext}?size=640`;
}

function buildDiscordDecorationUrl(asset) {
  const safeAsset = String(asset || '').trim();
  if (!safeAsset) return '';
  return `https://cdn.discordapp.com/avatar-decoration-presets/${safeAsset}.png?size=160&passthrough=true`;
}

function extractDiscordProfileBio(discordUser, activities, fallbackMetaDescription, previousBio = '') {
  const list = Array.isArray(activities) ? activities : [];
  const custom = list.find((activity) => Number(activity?.type) === 4) || null;
  const customText = firstNonEmpty(custom?.state, custom?.details, custom?.name === 'Custom Status' ? '' : custom?.name);
  const customEmoji = custom?.emoji?.name ? `:${custom.emoji.name}:` : '';
  const customBio = [customEmoji, customText].filter(Boolean).join(' ').trim();

  const active = list.find((activity) => Number(activity?.type) !== 4) || null;
  const activeText = firstNonEmpty(active?.details, active?.state, active?.name);
  const activeBio = activeText ? `Active: ${activeText}` : '';

  return firstNonEmpty(
    customBio,
    activeBio,
    fallbackMetaDescription,
    discordUser?.global_name ? `${discordUser.global_name} on Discord` : '',
    previousBio,
    'Discord presence synced from Lanyard.',
  );
}

function mapLanyardActivities(activities, siteUrl) {
  const entries = Array.isArray(activities) ? activities : [];
  const typeLabel = {
    0: 'Playing',
    1: 'Streaming',
    2: 'Listening',
    3: 'Watching',
    4: 'Custom Status',
    5: 'Competing',
  };

  return entries.slice(0, 5).map((activity, index) => {
    const type = Number(activity?.type);
    const label = typeLabel[type] || 'Activity';
    const name = firstNonEmpty(
      activity?.name === 'Custom Status' ? '' : activity?.name,
      activity?.details,
      activity?.state,
      'Activity',
    );
    const details = firstNonEmpty(activity?.details, activity?.state, '');
    const emojiName = activity?.emoji?.name ? `:${activity.emoji.name}:` : '';
    const meta = [label, emojiName, details]
      .filter((entry) => String(entry || '').trim().length > 0)
      .join(' | ');
    return {
      id: `discord-activity-${index}-${hashText(`${name}-${meta}`).slice(0, 10)}`,
      title: name,
      meta,
      url: resolveUrl(siteUrl),
    };
  });
}

function parseLastFmCountLabel(value, fallbackSuffix = 'plays') {
  const raw = String(value || '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  if (/play|scrobble/i.test(raw)) return raw;
  return `${raw} ${fallbackSuffix}`;
}

function pickLastFmCountValue(value, fallback = '') {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  const match = text.match(/(\d[\d,]*)/);
  return match?.[1] ? match[1] : fallback;
}

function pickFirstLastFmCountFromList(values, fallback = '') {
  const entries = Array.isArray(values) ? values : [];
  for (const entry of entries) {
    const picked = pickLastFmCountValue(entry);
    if (picked) return picked;
  }
  return fallback;
}

function pickLastFmImageUrl(images, fallback = '') {
  const list = Array.isArray(images) ? images : [];
  const sizePriority = ['extralarge', 'large', 'medium', 'small'];
  for (const size of sizePriority) {
    const match = list.find((entry) => String(entry?.size || '').toLowerCase() === size);
    const candidate = firstNonEmpty(match?.['#text'], match?.url);
    const resolved = resolveUrl(candidate, 'https://www.last.fm');
    if (resolved) return resolved;
  }

  for (const entry of list) {
    const candidate = firstNonEmpty(entry?.['#text'], entry?.url);
    const resolved = resolveUrl(candidate, 'https://www.last.fm');
    if (resolved) return resolved;
  }
  return resolveUrl(fallback, 'https://www.last.fm');
}

function formatLastFmAgeLabel(uts, nowMs = Date.now()) {
  const numericUts = Number(uts);
  if (!Number.isFinite(numericUts) || numericUts <= 0) return '';
  const deltaMs = Math.max(0, nowMs - (numericUts * 1000));
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (deltaMs < hour) return '<1h ago';
  if (deltaMs < day) return `${Math.round(deltaMs / hour)}h ago`;
  return `${Math.round(deltaMs / day)}d ago`;
}

function toLastFmRecentTrackItem({
  index,
  title,
  artist,
  album,
  countLabel,
  imageUrl,
  itemUrl,
}) {
  const safeTitle = firstNonEmpty(title, 'Unknown track');
  const safeArtist = firstNonEmpty(artist, 'Unknown artist');
  const safeCountLabel = firstNonEmpty(countLabel, 'recent');
  const safeAlbum = String(album || '').replace(/\s+/g, ' ').trim();
  const meta = [safeArtist, safeCountLabel].filter(Boolean).join(' | ');
  return {
    id: `lastfm-recent-${index}-${hashText(`${safeTitle}-${safeArtist}-${safeCountLabel}`).slice(0, 12)}`,
    title: safeTitle,
    subtitle: safeArtist,
    album: safeAlbum,
    countLabel: safeCountLabel,
    imageUrl: resolveUrl(imageUrl, 'https://www.last.fm'),
    url: resolveUrl(itemUrl, 'https://www.last.fm'),
    meta,
  };
}

function mapLastFmRecentTracksFromApi(response, nowMs = Date.now()) {
  const rawTrack = response?.recenttracks?.track;
  const tracks = Array.isArray(rawTrack) ? rawTrack : (rawTrack ? [rawTrack] : []);
  return tracks.slice(0, LASTFM_RECENT_TRACK_LIMIT).map((entry, index) => {
    const nowPlaying = entry?.['@attr']?.nowplaying === 'true';
    const title = firstNonEmpty(entry?.name, 'Unknown track');
    const artist = firstNonEmpty(entry?.artist?.name, entry?.artist?.['#text'], 'Unknown artist');
    const album = firstNonEmpty(entry?.album?.['#text'], '');
    const playedAtLabel = formatLastFmAgeLabel(entry?.date?.uts, nowMs);
    const fallbackPlayedAt = firstNonEmpty(entry?.date?.['#text'], '');
    const countLabel = nowPlaying
      ? 'now playing'
      : firstNonEmpty(playedAtLabel, fallbackPlayedAt, 'recent');
    return toLastFmRecentTrackItem({
      index,
      title,
      artist,
      album,
      countLabel,
      imageUrl: pickLastFmImageUrl(entry?.image),
      itemUrl: entry?.url,
    });
  });
}

function mapLastFmRecentTracksFromExtract(trackNames, artists, scrobbleCounts, trackUrls, siteUrl) {
  return trackNames.slice(0, LASTFM_RECENT_TRACK_LIMIT).map((trackName, index) => {
    const title = String(trackName || '').replace(/\s+/g, ' ').trim();
    const artist = String(artists[index] || '').replace(/\s+/g, ' ').trim();
    const countLabel = parseLastFmCountLabel(scrobbleCounts[index], 'scrobbles');
    return toLastFmRecentTrackItem({
      index,
      title,
      artist,
      album: '',
      countLabel: firstNonEmpty(countLabel, 'private'),
      imageUrl: '',
      itemUrl: resolveUrl(trackUrls[index], siteUrl),
    });
  });
}

function mapLastFmTopArtistsFromApi(response) {
  const rawArtist = response?.topartists?.artist;
  const artists = Array.isArray(rawArtist) ? rawArtist : (rawArtist ? [rawArtist] : []);
  return artists.slice(0, 12).map((entry, index) => {
    const title = firstNonEmpty(entry?.name, 'Unknown artist');
    const countLabel = parseLastFmCountLabel(entry?.playcount, 'plays');
    return {
      id: `lastfm-top-artist-${index}-${hashText(`${title}-${countLabel}`).slice(0, 12)}`,
      title,
      subtitle: '',
      countLabel: firstNonEmpty(countLabel, '-- plays'),
      imageUrl: pickLastFmImageUrl(entry?.image),
      url: resolveUrl(entry?.url, 'https://www.last.fm'),
    };
  });
}

function mapLastFmTopAlbumsFromApi(response) {
  const rawAlbums = response?.topalbums?.album;
  const albums = Array.isArray(rawAlbums) ? rawAlbums : (rawAlbums ? [rawAlbums] : []);
  return albums.slice(0, 12).map((entry, index) => {
    const title = firstNonEmpty(entry?.name, 'Unknown album');
    const subtitle = firstNonEmpty(entry?.artist?.name, entry?.artist?.['#text'], '');
    const countLabel = parseLastFmCountLabel(entry?.playcount, 'plays');
    return {
      id: `lastfm-top-album-${index}-${hashText(`${title}-${subtitle}-${countLabel}`).slice(0, 12)}`,
      title,
      subtitle,
      countLabel: firstNonEmpty(countLabel, '-- plays'),
      imageUrl: pickLastFmImageUrl(entry?.image),
      url: resolveUrl(entry?.url, 'https://www.last.fm'),
    };
  });
}

function mapLastFmGridItemsFromExtract({
  titles,
  subtitles,
  counts,
  imageUrls,
  itemUrls,
  prefix,
  siteUrl,
}) {
  const safeTitles = Array.isArray(titles) ? titles : [];
  const safeSubtitles = Array.isArray(subtitles) ? subtitles : [];
  const safeCounts = Array.isArray(counts) ? counts : [];
  const safeImages = Array.isArray(imageUrls) ? imageUrls : [];
  const safeItemUrls = Array.isArray(itemUrls) ? itemUrls : [];

  return safeTitles.slice(0, 12).map((entry, index) => {
    const title = String(entry || '').replace(/\s+/g, ' ').trim();
    const subtitle = String(safeSubtitles[index] || '').replace(/\s+/g, ' ').trim();
    const countLabel = parseLastFmCountLabel(safeCounts[index], 'plays');
    const imageUrl = resolveUrl(safeImages[index], siteUrl);
    const itemUrl = resolveUrl(safeItemUrls[index], siteUrl);
    return {
      id: `${prefix}-${index}-${hashText(`${title}-${subtitle}-${countLabel}`).slice(0, 12)}`,
      title: firstNonEmpty(title, 'Unknown'),
      subtitle,
      countLabel: firstNonEmpty(countLabel, '-- plays'),
      imageUrl,
      url: itemUrl,
    };
  });
}

function buildActivityItems(items, prefix, maxCount = 6) {
  const deduped = [];
  const seen = new Set();
  for (const item of items) {
    const text = String(item || '').replace(/\s+/g, ' ').trim();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    deduped.push(text);
    if (deduped.length >= maxCount) break;
  }
  return deduped.map((title, index) => ({
    id: `${prefix}-${index}-${hashText(title).slice(0, 8)}`,
    title,
    meta: 'Live extract',
  }));
}

function parseTwitterIdentity(metaTitle, fallbackName, fallbackHandle) {
  const cleanTitle = String(metaTitle || '').replace(/\s*\/\s*X\s*$/i, '').trim();
  if (!cleanTitle) {
    return {
      name: fallbackName,
      handle: fallbackHandle,
    };
  }

  const handleMatch = cleanTitle.match(/(@[A-Za-z0-9_]+)/);
  const handle = handleMatch?.[1] || fallbackHandle;
  const name = cleanTitle.split('(@')[0]?.trim() || fallbackName;
  return { name, handle };
}

function parseTwitterStats(metaDescription, previousStats = []) {
  const fallback = previousStats.length
    ? previousStats.map((entry) => ({ ...entry }))
    : [
      { label: 'Followers', value: 'Live' },
      { label: 'Following', value: 'Live' },
      { label: 'Posts', value: 'Live' },
    ];

  const patterns = [
    { label: 'Followers', regex: /([\d.,]+[KMB]?)\s+Followers/i },
    { label: 'Following', regex: /([\d.,]+[KMB]?)\s+Following/i },
    { label: 'Posts', regex: /([\d.,]+[KMB]?)\s+(Posts|Tweets)/i },
  ];

  for (const pattern of patterns) {
    const match = String(metaDescription || '').match(pattern.regex);
    if (!match?.[1]) continue;
    const target = fallback.find((entry) => entry.label === pattern.label);
    if (target) target.value = match[1];
  }

  return fallback;
}

function parsePlaylistId(spotifyUrl) {
  const match = String(spotifyUrl || '').match(/playlist\/([A-Za-z0-9]+)/i);
  return match?.[1] || '';
}

function buildSpotifyEmbedUrl(spotifyUrl) {
  const playlistId = parsePlaylistId(spotifyUrl);
  if (!playlistId) return '';
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
}

function resolveFreshness(sourceStatus) {
  if (sourceStatus === 'OK') return 'LIVE';
  if (sourceStatus === 'PARTIAL') return 'UPDATED';
  return 'STATIC';
}

function mergePayload(previous, now, patch, sourceStatus = 'OK') {
  const sectionPatch = patch.sections && typeof patch.sections === 'object' ? patch.sections : null;
  return {
    ...previous,
    ...patch,
    profile: {
      ...previous.profile,
      ...(patch.profile || {}),
    },
    stats: Array.isArray(patch.stats) ? patch.stats : previous.stats,
    items: Array.isArray(patch.items) ? patch.items : previous.items,
    embeds: {
      ...(previous.embeds || {}),
      ...(patch.embeds || {}),
    },
    sections: sectionPatch
      ? {
        ...(previous.sections || {}),
        ...sectionPatch,
      }
      : previous.sections,
    updatedAt: now,
    freshnessStatus: resolveFreshness(sourceStatus),
    sourceStatus,
  };
}

function buildLastFmRecentTracksEndpoint(username, apiKey) {
  const endpoint = new URL('https://ws.audioscrobbler.com/2.0/');
  endpoint.searchParams.set('method', 'user.getrecenttracks');
  endpoint.searchParams.set('user', username);
  endpoint.searchParams.set('api_key', apiKey);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('limit', String(LASTFM_RECENT_TRACK_LIMIT));
  endpoint.searchParams.set('extended', '1');
  return endpoint.toString();
}

function buildLastFmTopArtistsEndpoint(username, apiKey) {
  const endpoint = new URL('https://ws.audioscrobbler.com/2.0/');
  endpoint.searchParams.set('method', 'user.gettopartists');
  endpoint.searchParams.set('user', username);
  endpoint.searchParams.set('api_key', apiKey);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('period', '1month');
  endpoint.searchParams.set('limit', '12');
  return endpoint.toString();
}

function buildLastFmTopAlbumsEndpoint(username, apiKey) {
  const endpoint = new URL('https://ws.audioscrobbler.com/2.0/');
  endpoint.searchParams.set('method', 'user.gettopalbums');
  endpoint.searchParams.set('user', username);
  endpoint.searchParams.set('api_key', apiKey);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('period', '1month');
  endpoint.searchParams.set('limit', '12');
  return endpoint.toString();
}

function buildLastFmUserInfoEndpoint(username, apiKey) {
  const endpoint = new URL('https://ws.audioscrobbler.com/2.0/');
  endpoint.searchParams.set('method', 'user.getinfo');
  endpoint.searchParams.set('user', username);
  endpoint.searchParams.set('api_key', apiKey);
  endpoint.searchParams.set('format', 'json');
  return endpoint.toString();
}

function buildLastFmLovedTracksEndpoint(username, apiKey) {
  const endpoint = new URL('https://ws.audioscrobbler.com/2.0/');
  endpoint.searchParams.set('method', 'user.getlovedtracks');
  endpoint.searchParams.set('user', username);
  endpoint.searchParams.set('api_key', apiKey);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('limit', '1');
  return endpoint.toString();
}

async function loadTwitterPayload({ site, previous, now, signal }) {
  const data = await fetchRemoteExtract(
    site.url,
    [
      { key: 'meta_title', selector: "meta[property='og:title']", attr: 'content' },
      { key: 'meta_description', selector: "meta[property='og:description']", attr: 'content' },
      { key: 'meta_image', selector: "meta[property='og:image']", attr: 'content' },
      { key: 'tweet_articles', selector: "article[data-testid='tweet']", all: true, limit: 8, property: 'innerText' },
    ],
    {
      waitMs: 3200,
      timeoutMs: 22_000,
      scrollSteps: 5,
      scrollBy: 1200,
      scrollWaitMs: 240,
      signal,
    },
  );

  if (!data) return null;
  const metaTitle = asText(data.meta_title);
  const metaDescription = asText(data.meta_description);
  const avatarUrl = asText(data.meta_image);
  const tweetArticles = asTextList(data.tweet_articles)
    .map((entry) => entry.split('\n')[0]?.trim() || '')
    .filter((entry) => entry.length > 0);

  const identity = parseTwitterIdentity(metaTitle, previous.profile.name, previous.profile.handle);
  const stats = parseTwitterStats(metaDescription, previous.stats);
  const items = tweetArticles.length
    ? buildActivityItems(tweetArticles, 'twitter-live', 6)
    : previous.items;

  const hasLiveSignal = Boolean(metaTitle || metaDescription || tweetArticles.length);
  const sourceStatus = hasLiveSignal ? 'OK' : 'PARTIAL';

  return mergePayload(previous, now, {
    profile: {
      name: identity.name,
      handle: identity.handle,
      bio: firstNonEmpty(metaDescription, previous.profile.bio),
      avatarUrl: firstNonEmpty(avatarUrl, previous.profile.avatarUrl),
    },
    stats,
    items,
  }, sourceStatus);
}

async function loadSteamPayload({ site, previous, now, signal }) {
  const data = await fetchRemoteExtract(
    site.url,
    [
      { key: 'persona_name', selector: '.actual_persona_name', property: 'innerText' },
      { key: 'avatar_url', selector: '.playerAvatarAutoSizeInner img', attr: 'src' },
      { key: 'avatar_frame_srcset', selector: ".profile_avatar_frame picture source[srcset]:not([media])", attr: 'srcset' },
      { key: 'avatar_frame_img', selector: '.profile_avatar_frame img', attr: 'src' },
      { key: 'profile_summary', selector: '.profile_summary', property: 'innerText' },
      { key: 'level', selector: '.friendPlayerLevelNum', property: 'innerText' },
      { key: 'avatar_status_class', selector: '.playerAvatar.profile_header_size', attr: 'class' },
      { key: 'status_header', selector: '.profile_in_game_header', property: 'innerText' },
      { key: 'status_game', selector: '.profile_in_game_name', property: 'innerText' },
      { key: 'recent_summary', selector: '.profile_recentgame_header', property: 'innerText' },
      { key: 'recent_game_names', selector: '.recent_game .game_name', all: true, limit: 8, property: 'innerText' },
      { key: 'recent_game_details', selector: '.recent_game .game_info_details', all: true, limit: 8, property: 'innerText' },
      { key: 'recent_game_links', selector: '.recent_game .game_name a', all: true, limit: 8, attr: 'href' },
      { key: 'recent_game_capsules', selector: '.recent_game .game_capsule img', all: true, limit: 8, attr: 'src' },
      { key: 'recent_game_capsules_srcset', selector: '.recent_game .game_capsule img', all: true, limit: 8, attr: 'srcset' },
      { key: 'recent_game_capsules_data_src', selector: '.recent_game .game_capsule img', all: true, limit: 8, attr: 'data-src' },
      { key: 'recent_game_capsules_data_srcset', selector: '.recent_game .game_capsule img', all: true, limit: 8, attr: 'data-srcset' },
    ],
    {
      waitMs: 1900,
      timeoutMs: 18_000,
      signal,
    },
  );

  if (!data) return null;

  const personaName = asText(data.persona_name);
  const avatarUrl = resolveUrl(asText(data.avatar_url), site.url);
  const frameSrcset = resolveUrl(parseSrcsetUrl(asText(data.avatar_frame_srcset)), site.url);
  const frameImage = resolveUrl(asText(data.avatar_frame_img), site.url);
  const summary = asText(data.profile_summary).replace(/\s+/g, ' ').trim();
  const level = asText(data.level);
  const avatarStatusClass = asText(data.avatar_status_class);
  const statusHeader = asText(data.status_header);
  const statusGame = asText(data.status_game);
  const recentSummary = asText(data.recent_summary).replace(/\s+/g, ' ').trim();
  const totalHoursLastTwoWeeks = parseSteamHoursLastTwoWeeks(recentSummary);
  const statusText = parseSteamStatusText(statusHeader, statusGame, avatarStatusClass, previous.profile.statusText);
  const gameNames = asTextList(data.recent_game_names);
  const gameDetails = asTextList(data.recent_game_details);
  const gameLinks = asTextList(data.recent_game_links);
  const gameCapsules = asTextList(data.recent_game_capsules);
  const gameCapsuleSrcsets = asTextList(data.recent_game_capsules_srcset);
  const gameCapsuleDataSrc = asTextList(data.recent_game_capsules_data_src);
  const gameCapsuleDataSrcset = asTextList(data.recent_game_capsules_data_srcset);
  const items = gameNames.length
    ? mapSteamRecentGames(
      gameNames,
      gameDetails,
      gameLinks,
      gameCapsules,
      gameCapsuleSrcsets,
      gameCapsuleDataSrc,
      gameCapsuleDataSrcset,
      totalHoursLastTwoWeeks,
      site.url,
    )
    : previous.items;

  const stats = [
    { label: 'Level', value: firstNonEmpty(level, previous.stats?.[0]?.value, '--') },
    { label: 'Status', value: firstNonEmpty(statusText, previous.stats?.[1]?.value, 'Unknown') },
    {
      label: '2W Hours',
      value: totalHoursLastTwoWeeks
        ? `${totalHoursLastTwoWeeks}h`
        : firstNonEmpty(previous.stats?.[2]?.value, '--'),
    },
    { label: 'Recent Games', value: String(items.length || 0) },
  ];

  const sourceStatus = (personaName || summary || gameNames.length || level || statusText) ? 'OK' : 'PARTIAL';
  return mergePayload(previous, now, {
    profile: {
      name: firstNonEmpty(personaName, previous.profile.name),
      handle: previous.profile.handle,
      bio: firstNonEmpty(summary, previous.profile.bio),
      avatarUrl: firstNonEmpty(avatarUrl, previous.profile.avatarUrl),
      borderImageUrl: firstNonEmpty(frameSrcset, frameImage, previous.profile.borderImageUrl),
      statusText: firstNonEmpty(statusText, previous.profile.statusText),
      levelBadgeLabel: level ? `Level ${level}` : firstNonEmpty(previous.profile.levelBadgeLabel, 'Level --'),
    },
    stats,
    items,
  }, sourceStatus);
}

async function loadDiscordPayload({ site, previous, now, signal }) {
  const userId = parseDiscordUserId(site.url, previous.profile.handle);
  const overrideBio = String(DISCORD_PROFILE_OVERRIDES.bio || '').trim();
  const overrideBannerUrl = resolveUrl(DISCORD_PROFILE_OVERRIDES.bannerUrl, site.url);
  const overrideDecorationUrl = resolveUrl(DISCORD_PROFILE_OVERRIDES.decorationUrl, site.url);

  const [extractResult, lanyardResult] = await Promise.allSettled([
    fetchRemoteExtract(
      site.url,
      [
        { key: 'meta_title', selector: "meta[property='og:title']", attr: 'content' },
        { key: 'meta_description', selector: "meta[property='og:description']", attr: 'content' },
        { key: 'meta_image', selector: "meta[property='og:image']", attr: 'content' },
      ],
      {
        waitMs: 1200,
        timeoutMs: 12_000,
        signal,
      },
    ),
    userId
      ? fetchJsonWithTimeout(`https://api.lanyard.rest/v1/users/${userId}`, 8_500, signal)
      : Promise.resolve(null),
  ]);

  const extractData = extractResult.status === 'fulfilled' ? extractResult.value : null;
  const lanyardData = lanyardResult.status === 'fulfilled' ? lanyardResult.value : null;

  const metaTitle = asText(extractData?.meta_title);
  const metaDescription = asText(extractData?.meta_description);
  const metaImage = asText(extractData?.meta_image);
  const fallbackName = metaTitle
    ? metaTitle.replace(/\s*on Discord$/i, '').trim()
    : previous.profile.name;

  const discordUser = lanyardData?.data?.discord_user || null;
  const lanyardActivities = Array.isArray(lanyardData?.data?.activities) ? lanyardData.data.activities : [];
  const statusText = formatDiscordStatus(lanyardData?.data?.discord_status);
  const statusKey = normalizeDiscordStatusKey(lanyardData?.data?.discord_status);
  const displayName = firstNonEmpty(
    discordUser?.display_name,
    discordUser?.global_name,
    discordUser?.username,
    fallbackName,
    previous.profile.name,
  );
  const usernameHandle = discordUser?.username ? `@${discordUser.username}` : previous.profile.handle;
  const avatarUrl = firstNonEmpty(
    buildDiscordAvatarUrl(discordUser?.id || userId, discordUser?.avatar),
    resolveUrl(metaImage, site.url),
    previous.profile.avatarUrl,
  );
  const bioText = firstNonEmpty(
    overrideBio,
    extractDiscordProfileBio(discordUser, lanyardActivities, metaDescription, previous.profile.bio),
  );
  const bannerUrl = firstNonEmpty(
    overrideBannerUrl,
    buildDiscordBannerUrl(discordUser?.id || userId, discordUser?.banner),
    previous.profile.bannerUrl,
  );
  const decorationUrl = firstNonEmpty(
    overrideDecorationUrl,
    buildDiscordDecorationUrl(discordUser?.avatar_decoration_data?.asset),
    previous.profile.decorationUrl,
  );
  const activityItems = mapLanyardActivities(lanyardActivities, site.url);
  const items = activityItems.length
    ? activityItems
    : [
      {
        id: `discord-item-${hashText(displayName).slice(0, 8)}`,
        title: 'Activity unavailable',
        meta: 'No live activity exposed right now',
        url: resolveUrl(site.url),
      },
    ];

  const statusSource = Boolean(discordUser || lanyardActivities.length);
  const metaSource = Boolean(metaTitle || metaDescription || metaImage);
  const overrideSource = Boolean(overrideBio || overrideBannerUrl || overrideDecorationUrl);
  const sourceStatus = (statusSource || metaSource || overrideSource) ? 'OK' : 'PARTIAL';

  return mergePayload(previous, now, {
    profile: {
      name: displayName,
      handle: firstNonEmpty(usernameHandle, previous.profile.handle),
      bio: bioText,
      avatarUrl,
      bannerUrl,
      statusText: firstNonEmpty(statusText, previous.profile.statusText, 'Unknown'),
      statusKey,
      decorationUrl,
    },
    stats: [
      { label: 'Status', value: firstNonEmpty(statusText, 'Unknown') },
      { label: 'Presence Source', value: statusSource ? 'Lanyard live' : 'Fallback' },
      { label: 'Activities', value: String(activityItems.length || lanyardActivities.length || 0) },
    ],
    items,
  }, sourceStatus);
}

async function loadLastFmPayload({ site, previous, now, signal }) {
  const apiKey = (import.meta.env.VITE_LASTFM_API_KEY || '').trim();
  const username = previous.profile.handle.split('/').pop() || 'FoundLifeless';
  const previousSections = previous.sections && typeof previous.sections === 'object'
    ? previous.sections
    : {};

  let recentTracks = Array.isArray(previousSections.recentTracks) ? previousSections.recentTracks : [];
  let topArtists = Array.isArray(previousSections.topArtists) ? previousSections.topArtists : [];
  let topAlbums = Array.isArray(previousSections.topAlbums) ? previousSections.topAlbums : [];
  let profileTotals = previousSections.profileTotals && typeof previousSections.profileTotals === 'object'
    ? previousSections.profileTotals
    : {
      scrobbles: '',
      artists: '',
      lovedTracks: '',
    };
  let feedSource = apiKey ? 'API+Extract' : 'Extract';
  let hasApiSignal = false;
  let hasApiRecentTracks = false;
  let hasApiTopArtists = false;
  let hasApiTopAlbums = false;
  let hasApiProfileTotals = false;

  if (apiKey) {
    const [recentResult, artistsResult, albumsResult, userInfoResult, lovedTracksResult] = await Promise.allSettled([
      fetchJsonWithTimeout(buildLastFmRecentTracksEndpoint(username, apiKey), 10_000, signal),
      fetchJsonWithTimeout(buildLastFmTopArtistsEndpoint(username, apiKey), 10_000, signal),
      fetchJsonWithTimeout(buildLastFmTopAlbumsEndpoint(username, apiKey), 10_000, signal),
      fetchJsonWithTimeout(buildLastFmUserInfoEndpoint(username, apiKey), 10_000, signal),
      fetchJsonWithTimeout(buildLastFmLovedTracksEndpoint(username, apiKey), 10_000, signal),
    ]);

    if (recentResult.status === 'fulfilled') {
      const mappedRecent = mapLastFmRecentTracksFromApi(recentResult.value, now);
      if (mappedRecent.length) {
        recentTracks = mappedRecent;
        hasApiSignal = true;
        hasApiRecentTracks = true;
      }
    }

    if (artistsResult.status === 'fulfilled') {
      const mappedArtists = mapLastFmTopArtistsFromApi(artistsResult.value);
      if (mappedArtists.length) {
        topArtists = mappedArtists;
        hasApiSignal = true;
        hasApiTopArtists = true;
      }
    }

    if (albumsResult.status === 'fulfilled') {
      const mappedAlbums = mapLastFmTopAlbumsFromApi(albumsResult.value);
      if (mappedAlbums.length) {
        topAlbums = mappedAlbums;
        hasApiSignal = true;
        hasApiTopAlbums = true;
      }
    }

    if (userInfoResult.status === 'fulfilled') {
      const nextScrobbles = pickLastFmCountValue(userInfoResult.value?.user?.playcount);
      const nextArtists = pickLastFmCountValue(userInfoResult.value?.user?.artist_count);
      if (nextScrobbles || nextArtists) {
        hasApiSignal = true;
        hasApiProfileTotals = true;
        profileTotals = {
          ...profileTotals,
          scrobbles: firstNonEmpty(nextScrobbles, profileTotals.scrobbles),
          artists: firstNonEmpty(nextArtists, profileTotals.artists),
        };
      }
    }

    if (lovedTracksResult.status === 'fulfilled') {
      const nextLoved = pickLastFmCountValue(lovedTracksResult.value?.lovedtracks?.['@attr']?.total);
      if (nextLoved) {
        hasApiSignal = true;
        hasApiProfileTotals = true;
        profileTotals = {
          ...profileTotals,
          lovedTracks: firstNonEmpty(nextLoved, profileTotals.lovedTracks),
        };
      }
    }

    if (hasApiSignal && recentTracks.length && topArtists.length && topAlbums.length && hasApiProfileTotals) {
      feedSource = 'API';
    }
  }

  const data = await fetchRemoteExtract(
    site.url,
    [
      { key: 'meta_title', selector: "meta[property='og:title']", attr: 'content' },
      { key: 'meta_description', selector: "meta[property='og:description']", attr: 'content' },
      { key: 'meta_image', selector: "meta[property='og:image']", attr: 'content' },
      { key: 'profile_name', selector: 'h1', property: 'innerText' },
      { key: 'profile_avatar', selector: "img[alt*='Avatar for']", attr: 'src' },
      { key: 'profile_total_scrobbles', selector: "a[href*='/user/'][href*='/library']", all: true, limit: 20, property: 'innerText' },
      { key: 'profile_total_artists', selector: "a[href*='/library/artists']", all: true, limit: 20, property: 'innerText' },
      { key: 'profile_total_loved', selector: "a[href*='/loved']", all: true, limit: 20, property: 'innerText' },
      { key: 'recent_private_message', selector: '.recent-tracks-placeholder p', property: 'innerText' },
      { key: 'chart_track_names', selector: 'table.chartlist tbody tr .chartlist-name a', all: true, limit: LASTFM_RECENT_TRACK_LIMIT, property: 'innerText' },
      { key: 'chart_track_artists', selector: 'table.chartlist tbody tr .chartlist-artist a', all: true, limit: LASTFM_RECENT_TRACK_LIMIT, property: 'innerText' },
      { key: 'chart_track_scrobbles', selector: 'table.chartlist tbody tr .chartlist-count-bar-value', all: true, limit: LASTFM_RECENT_TRACK_LIMIT, property: 'innerText' },
      { key: 'chart_track_links', selector: 'table.chartlist tbody tr .chartlist-name a', all: true, limit: LASTFM_RECENT_TRACK_LIMIT, attr: 'href' },
      { key: 'top_artist_names', selector: '#top-artists li.grid-items-item .grid-items-item-main-text a.link-block-target', all: true, limit: 12, property: 'innerText' },
      { key: 'top_artist_counts', selector: "#top-artists li.grid-items-item .grid-items-item-aux-text a[href*='/library/music/']", all: true, limit: 12, property: 'innerText' },
      { key: 'top_artist_links', selector: '#top-artists li.grid-items-item .grid-items-item-main-text a.link-block-target', all: true, limit: 12, attr: 'href' },
      { key: 'top_artist_images', selector: '#top-artists li.grid-items-item .grid-items-cover-image-image img', all: true, limit: 12, attr: 'src' },
      { key: 'top_album_titles', selector: '#top-albums li.grid-items-item .grid-items-item-main-text a.link-block-target', all: true, limit: 12, property: 'innerText' },
      { key: 'top_album_artists', selector: '#top-albums li.grid-items-item .grid-items-item-aux-text .grid-items-item-aux-block', all: true, limit: 12, property: 'innerText' },
      { key: 'top_album_counts', selector: "#top-albums li.grid-items-item .grid-items-item-aux-text a[href*='/library/music/']", all: true, limit: 12, property: 'innerText' },
      { key: 'top_album_links', selector: '#top-albums li.grid-items-item .grid-items-item-main-text a.link-block-target', all: true, limit: 12, attr: 'href' },
      { key: 'top_album_images', selector: '#top-albums li.grid-items-item .grid-items-cover-image-image img', all: true, limit: 12, attr: 'src' },
    ],
    {
      waitMs: 2400,
      timeoutMs: 20_000,
      signal,
    },
  );

  const metaTitle = asText(data?.meta_title);
  const metaDescription = asText(data?.meta_description);
  const metaImage = asText(data?.meta_image);
  const profileName = asText(data?.profile_name);
  const profileAvatar = resolveUrl(asText(data?.profile_avatar), site.url);
  const recentPrivateMessage = asText(data?.recent_private_message);
  const chartTrackNames = asTextList(data?.chart_track_names);
  const chartTrackArtists = asTextList(data?.chart_track_artists);
  const chartTrackScrobbles = asTextList(data?.chart_track_scrobbles);
  const chartTrackLinks = asTextList(data?.chart_track_links);
  const extractedScrobbles = pickFirstLastFmCountFromList(asTextList(data?.profile_total_scrobbles));
  const extractedArtists = pickFirstLastFmCountFromList(asTextList(data?.profile_total_artists));
  const extractedLovedTracks = pickFirstLastFmCountFromList(asTextList(data?.profile_total_loved));

  profileTotals = {
    scrobbles: firstNonEmpty(
      hasApiProfileTotals ? profileTotals.scrobbles : '',
      extractedScrobbles,
      profileTotals.scrobbles,
      '--',
    ),
    artists: firstNonEmpty(
      hasApiProfileTotals ? profileTotals.artists : '',
      extractedArtists,
      profileTotals.artists,
      '--',
    ),
    lovedTracks: firstNonEmpty(
      hasApiProfileTotals ? profileTotals.lovedTracks : '',
      extractedLovedTracks,
      profileTotals.lovedTracks,
      '--',
    ),
  };

  const extractedRecent = mapLastFmRecentTracksFromExtract(
    chartTrackNames,
    chartTrackArtists,
    chartTrackScrobbles,
    chartTrackLinks,
    site.url,
  );
  if (extractedRecent.length && !hasApiRecentTracks) {
    recentTracks = extractedRecent;
  }

  const extractedTopArtists = mapLastFmGridItemsFromExtract({
    titles: asTextList(data?.top_artist_names),
    subtitles: [],
    counts: asTextList(data?.top_artist_counts),
    imageUrls: asTextList(data?.top_artist_images),
    itemUrls: asTextList(data?.top_artist_links),
    prefix: 'lastfm-top-artist',
    siteUrl: site.url,
  });
  if (extractedTopArtists.length && !hasApiTopArtists) {
    topArtists = extractedTopArtists;
  }

  const extractedTopAlbums = mapLastFmGridItemsFromExtract({
    titles: asTextList(data?.top_album_titles),
    subtitles: asTextList(data?.top_album_artists),
    counts: asTextList(data?.top_album_counts),
    imageUrls: asTextList(data?.top_album_images),
    itemUrls: asTextList(data?.top_album_links),
    prefix: 'lastfm-top-album',
    siteUrl: site.url,
  });
  if (extractedTopAlbums.length && !hasApiTopAlbums) {
    topAlbums = extractedTopAlbums;
  }

  const sections = {
    recentTracks,
    topArtists,
    topAlbums,
    profileTotals,
  };

  const items = recentTracks.length ? recentTracks : previous.items;
  const hasTotalsSignal = Boolean(
    pickLastFmCountValue(profileTotals.scrobbles)
    || pickLastFmCountValue(profileTotals.artists)
    || pickLastFmCountValue(profileTotals.lovedTracks),
  );
  const sourceStatus = (
    hasApiSignal
    || Boolean(metaTitle || profileName || items.length || topArtists.length || topAlbums.length || hasTotalsSignal)
  )
    ? 'OK'
    : 'PARTIAL';

  const bio = firstNonEmpty(
    recentPrivateMessage,
    metaDescription,
    previous.profile.bio,
  );

  return mergePayload(previous, now, {
    profile: {
      name: firstNonEmpty(profileName, metaTitle.replace(/\s*\|.*$/, ''), previous.profile.name),
      bio,
      avatarUrl: firstNonEmpty(profileAvatar, resolveUrl(metaImage, site.url), previous.profile.avatarUrl),
    },
    stats: [
      { label: 'Feed', value: feedSource },
      { label: 'Scrobbles', value: profileTotals.scrobbles || '--' },
      { label: 'Artists', value: profileTotals.artists || '--' },
      { label: 'Loved Tracks', value: profileTotals.lovedTracks || '--' },
      { label: 'Recent', value: String(recentTracks.length || 0) },
    ],
    items,
    sections,
  }, sourceStatus);
}

async function loadSpotifyPayload({ site, previous, now, signal }) {
  const extractorData = await fetchRemoteExtract(
    site.url,
    [
      { key: 'playlist_title', selector: "meta[property='og:title']", attr: 'content' },
      { key: 'playlist_description', selector: "meta[name='description']", attr: 'content' },
      { key: 'playlist_image', selector: "meta[property='og:image']", attr: 'content' },
      { key: 'track_titles', selector: "a[data-testid='internal-track-link']", all: true, limit: 8, property: 'innerText' },
    ],
    {
      waitMs: 2100,
      timeoutMs: 18_000,
      signal,
    },
  );

  let oEmbed = null;
  try {
    const endpoint = new URL('https://open.spotify.com/oembed');
    endpoint.searchParams.set('url', site.url);
    oEmbed = await fetchJsonWithTimeout(endpoint.toString(), 8_000, signal);
  } catch {
    oEmbed = null;
  }

  if (!extractorData && !oEmbed) return null;

  const playlistTitle = firstNonEmpty(asText(extractorData?.playlist_title), asText(oEmbed?.title));
  const playlistDescription = firstNonEmpty(asText(extractorData?.playlist_description), asText(oEmbed?.provider_name));
  const playlistImage = firstNonEmpty(asText(extractorData?.playlist_image), asText(oEmbed?.thumbnail_url));
  const trackTitles = asTextList(extractorData?.track_titles);
  const items = trackTitles.length
    ? trackTitles.map((title, index) => ({
      id: `spotify-track-${index}-${hashText(title).slice(0, 8)}`,
      title,
      meta: 'Playlist track',
    }))
    : previous.items;

  const sourceStatus = (playlistTitle || trackTitles.length || oEmbed) ? 'OK' : 'PARTIAL';
  return mergePayload(previous, now, {
    profile: {
      name: firstNonEmpty(playlistTitle, previous.profile.name),
      bio: firstNonEmpty(playlistDescription, previous.profile.bio),
      avatarUrl: firstNonEmpty(playlistImage, previous.profile.avatarUrl),
    },
    stats: [
      { label: 'Provider', value: 'Spotify' },
      { label: 'Tracks', value: String(trackTitles.length || previous.items.length || 0) },
      { label: 'Mode', value: 'Embed' },
    ],
    items,
    embeds: {
      spotifyEmbedUrl: buildSpotifyEmbedUrl(site.url),
    },
  }, sourceStatus);
}

async function loadSoundCloudPayload({ site, previous, now, signal }) {
  const extractorData = await fetchRemoteExtract(
    site.url,
    [
      { key: 'meta_title', selector: "meta[property='og:title']", attr: 'content' },
      { key: 'meta_description', selector: "meta[property='og:description']", attr: 'content' },
      { key: 'meta_image', selector: "meta[property='og:image']", attr: 'content' },
      { key: 'track_titles', selector: "a[href*='/tracks/'] h2", all: true, limit: 8, property: 'innerText' },
    ],
    {
      waitMs: 2100,
      timeoutMs: 18_000,
      scrollSteps: 2,
      scrollBy: 900,
      scrollWaitMs: 260,
      signal,
    },
  );

  let oEmbed = null;
  try {
    const endpoint = new URL('https://soundcloud.com/oembed');
    endpoint.searchParams.set('format', 'json');
    endpoint.searchParams.set('url', site.url);
    oEmbed = await fetchJsonWithTimeout(endpoint.toString(), 8_000, signal);
  } catch {
    oEmbed = null;
  }

  if (!extractorData && !oEmbed) return null;

  const title = firstNonEmpty(asText(extractorData?.meta_title), asText(oEmbed?.title), previous.profile.name);
  const description = firstNonEmpty(asText(extractorData?.meta_description), asText(oEmbed?.description), previous.profile.bio);
  const image = firstNonEmpty(asText(extractorData?.meta_image), asText(oEmbed?.thumbnail_url), previous.profile.avatarUrl);
  const trackTitles = asTextList(extractorData?.track_titles);
  const items = trackTitles.length
    ? trackTitles.map((trackTitle, index) => ({
      id: `soundcloud-track-${index}-${hashText(trackTitle).slice(0, 8)}`,
      title: trackTitle,
      meta: 'SoundCloud track',
    }))
    : previous.items;

  const sourceStatus = (title || description || trackTitles.length || oEmbed) ? 'OK' : 'PARTIAL';
  return mergePayload(previous, now, {
    profile: {
      name: title.replace(/\s*\|\s*Listen online.*$/i, '').trim(),
      bio: description,
      avatarUrl: image,
    },
    stats: [
      { label: 'Provider', value: 'SoundCloud' },
      { label: 'Tracks', value: String(trackTitles.length || previous.items.length || 0) },
      { label: 'Mode', value: 'Widget' },
    ],
    items,
    embeds: {
      soundcloudEmbedUrl: buildSoundCloudEmbedUrl(site.url),
    },
  }, sourceStatus);
}

export function createSocialHubDataSources() {
  async function loadSitePayload(context) {
    const { site } = context;
    if (!site || !site.id) return null;
    if (site.id === 'twitter') return await loadTwitterPayload(context);
    if (site.id === 'steam') return await loadSteamPayload(context);
    if (site.id === 'discord') return await loadDiscordPayload(context);
    if (site.id === 'lastfm') return await loadLastFmPayload(context);
    if (site.id === 'spotify') return await loadSpotifyPayload(context);
    if (site.id === 'soundcloud') return await loadSoundCloudPayload(context);
    return null;
  }

  return {
    loadSitePayload,
  };
}
