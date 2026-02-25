function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    return '';
  }
  return '';
}

function formatTimestamp(value) {
  if (!Number.isFinite(value) || value <= 0) return 'pending';
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

function sourceClass(sourceStatus) {
  const normalized = String(sourceStatus || 'PARTIAL').toLowerCase();
  if (normalized === 'ok') return 'chip-source-ok';
  if (normalized === 'failed') return 'chip-source-failed';
  return 'chip-source-partial';
}

function freshnessClass(freshnessStatus) {
  const normalized = String(freshnessStatus || 'STATIC').toLowerCase();
  if (normalized === 'live') return 'chip-fresh-live';
  if (normalized === 'updated') return 'chip-fresh-updated';
  if (normalized === 'cached') return 'chip-fresh-cached';
  return 'chip-fresh-static';
}

const SITE_THEME_LABEL = {
  twitter: 'X / Twitter',
  steam: 'Steam',
  discord: 'Discord',
  lastfm: 'Last.fm',
  spotify: 'Spotify',
  soundcloud: 'SoundCloud',
};

const NON_SHOWCASE_SITE_IDS = new Set(['twitter', 'discord', 'spotify', 'soundcloud']);
const HERO_AVATAR_LOCKED_URL = '/avatars/josie-main-profile.jpg';
const JOSIE_TOP_SHOWCASE_TEXT = "I'm just here, lol.";

function ensurePayload(site, payload) {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const safeProfile = safePayload.profile && typeof safePayload.profile === 'object'
    ? safePayload.profile
    : {};

  return {
    siteId: site.id,
    ...safePayload,
    profile: {
      name: site.label,
      handle: site.url,
      url: site.url,
      avatarUrl: '',
      bio: '',
      ...safeProfile,
    },
    stats: Array.isArray(safePayload.stats) ? safePayload.stats : [],
    items: Array.isArray(safePayload.items) ? safePayload.items : [],
    freshnessStatus: safePayload.freshnessStatus || 'STATIC',
    sourceStatus: safePayload.sourceStatus || 'PARTIAL',
  };
}

function statMapFromList(stats) {
  const map = new Map();
  for (const stat of Array.isArray(stats) ? stats : []) {
    const label = String(stat?.label || '').trim();
    if (!label) continue;
    map.set(label.toLowerCase(), String(stat?.value || '').trim());
  }
  return map;
}

function renderStats(stats, limit = 6) {
  const entries = Array.isArray(stats) ? stats.slice(0, limit) : [];
  if (!entries.length) {
    return '<p class="social-card-empty">No stats available.</p>';
  }

  return `
    <div class="steam-showcase-stats">
      ${entries.map((entry) => `
        <div class="steam-stat">
          <span class="steam-stat-label">${escapeHtml(entry.label)}</span>
          <span class="steam-stat-value">${escapeHtml(entry.value)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderItems(items, maxCount = 10) {
  const entries = Array.isArray(items) ? items.slice(0, maxCount) : [];
  if (!entries.length) {
    return '<p class="social-card-empty">No recent activity.</p>';
  }

  return `
    <ul class="steam-showcase-items">
      ${entries.map((item) => {
    const itemUrl = sanitizeUrl(item.url);
    return `
          <li class="steam-showcase-item">
            <button class="social-item-button" type="button" ${itemUrl ? `data-item-url="${escapeHtml(itemUrl)}"` : ''}>
              <span class="social-item-title">${escapeHtml(item.title)}</span>
              <span class="social-item-meta">${escapeHtml(item.meta)}</span>
            </button>
          </li>
        `;
  }).join('')}
    </ul>
  `;
}

function renderShowcaseHead(site, payload, title, subtitle) {
  const source = escapeHtml(payload.sourceStatus || 'PARTIAL');
  const freshness = escapeHtml(payload.freshnessStatus || 'STATIC');
  const openUrl = sanitizeUrl(payload.profile?.url || site.url);

  return `
    <header class="steam-showcase-head">
      <div class="steam-showcase-title-wrap">
        <h3 class="steam-showcase-title">${escapeHtml(title)}</h3>
        <span class="steam-showcase-subtitle">${escapeHtml(subtitle)}</span>
      </div>
      <div class="steam-showcase-head-actions">
        <span class="social-chip ${freshnessClass(payload.freshnessStatus)}">${freshness}</span>
        <span class="social-chip ${sourceClass(payload.sourceStatus)}">${source}</span>
        <button class="social-open-original" type="button" ${openUrl ? `data-open-url="${escapeHtml(openUrl)}"` : ''}>Open Original</button>
      </div>
    </header>
  `;
}

function resolveDiscordStatusKey(profileStatusKey, statusText) {
  const fromProfile = String(profileStatusKey || '').toLowerCase();
  if (fromProfile === 'online' || fromProfile === 'idle' || fromProfile === 'dnd' || fromProfile === 'offline') {
    return fromProfile;
  }

  const normalized = String(statusText || '').toLowerCase();
  if (normalized.includes('do not disturb') || normalized === 'dnd') return 'dnd';
  if (normalized.includes('online')) return 'online';
  if (normalized.includes('idle')) return 'idle';
  if (normalized.includes('offline')) return 'offline';
  return 'unknown';
}

function resolveLinkOnlineState(siteId, payload) {
  if (!payload || typeof payload !== 'object') return null;

  if (siteId === 'steam') {
    const statMap = statMapFromList(payload.stats);
    const statusText = String(payload.profile?.statusText || statMap.get('status') || '').toLowerCase();
    if (!statusText) return false;
    if (statusText.includes('offline')) return false;
    return (
      statusText.includes('online')
      || statusText.includes('in-game')
      || statusText.includes('away')
      || statusText.includes('busy')
    );
  }

  if (siteId === 'discord') {
    const statMap = statMapFromList(payload.stats);
    const statusText = String(payload.profile?.statusText || statMap.get('status') || '').trim();
    const statusKey = resolveDiscordStatusKey(payload.profile?.statusKey, statusText);
    return statusKey === 'online' || statusKey === 'idle' || statusKey === 'dnd';
  }

  return null;
}

function pickHeroPayload(payloadById, sites) {
  return payloadById.get('steam')
    || payloadById.get('twitter')
    || payloadById.get('discord')
    || payloadById.get(sites?.[0]?.id || '')
    || null;
}

function renderHero(payloadById, sites) {
  const hero = pickHeroPayload(payloadById, sites);
  const avatarUrl = sanitizeUrl(HERO_AVATAR_LOCKED_URL)
    || sanitizeUrl(hero?.profile?.avatarUrl || payloadById.get('steam')?.profile?.avatarUrl || '');
  const heroName = escapeHtml(hero?.profile?.name || 'FoundLifeless');
  const heroBio = escapeHtml(hero?.profile?.bio || '˚₊‧꒰ა ♡ ໒꒱ ‧₊˚');

  return `
    <section class="steam-hero-shell" aria-label="Profile hero">
      <div class="steam-hero-content">
        <div class="steam-hero-avatar-wrap">
          ${avatarUrl
    ? `<img class="steam-hero-avatar" src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" decoding="async" />`
    : '<div class="steam-hero-avatar steam-hero-avatar--fallback">A</div>'}
        </div>
        <div class="steam-hero-copy">
          <h2 class="steam-hero-name">${heroName}</h2>
          <p class="steam-hero-bio">${heroBio}</p>
        </div>
      </div>
    </section>
  `;
}

function renderSteamRecentGames(items) {
  const entries = Array.isArray(items) ? items.slice(0, 8) : [];
  if (!entries.length) {
    return '<p class="social-card-empty">No recently played games available.</p>';
  }

  return `
    <ul class="steam-activity-list">
      ${entries.map((item) => {
    const itemUrl = sanitizeUrl(item.url);
    const imageUrl = sanitizeUrl(item.artworkUrl || item.imageUrl);
    const hoursOnRecord = String(item.hoursOnRecord || '').trim();
    const lastPlayed = String(item.lastPlayed || '').trim();
    const hoursLabel = hoursOnRecord ? `${hoursOnRecord} hrs on record` : 'hours on record unavailable';
    const playedLabel = lastPlayed || 'last played recently';
    return `
          <li class="steam-activity-row">
            <button class="steam-activity-row-button" type="button" ${itemUrl ? `data-item-url="${escapeHtml(itemUrl)}"` : ''}>
              <span class="steam-activity-capsule">
                ${imageUrl
    ? `<img class="steam-activity-capsule-image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async" />`
    : '<span class="steam-activity-capsule-fallback">No Art</span>'}
              </span>
              <span class="steam-activity-main">
                <span class="steam-activity-game-title">${escapeHtml(item.title || 'Unknown game')}</span>
              </span>
              <span class="steam-activity-side">
                <span class="steam-activity-hours">${escapeHtml(hoursLabel)}</span>
                <span class="steam-activity-last-played">${escapeHtml(playedLabel)}</span>
              </span>
            </button>
          </li>
        `;
  }).join('')}
    </ul>
  `;
}

function renderSteamShowcase(site, payload) {
  const statMap = statMapFromList(payload.stats);
  const twoWeekHoursRaw = String(statMap.get('2w hours') || '').trim();
  const twoWeekHours = twoWeekHoursRaw.match(/([\d.,]+)/)?.[1] || '--';
  const twoWeekLabel = `${twoWeekHours} hours past 2 weeks`;

  return `
    <article class="steam-showcase steam-showcase--${escapeHtml(site.id)} steam-showcase--steam-activity" data-site-id="${escapeHtml(site.id)}" data-showcase-variant="steam-recent-activity">
      <div class="steam-activity-header">
        <h3 class="steam-activity-header-title">Recent Activity</h3>
        <span class="steam-activity-header-hours">${escapeHtml(twoWeekLabel)}</span>
      </div>
      <div class="steam-activity-body">
        ${renderSteamRecentGames(payload.items)}
      </div>
    </article>
  `;
}

function renderDiscordActivities(items) {
  const entries = Array.isArray(items) ? items.slice(0, 5) : [];
  if (!entries.length) {
    return '<p class="social-card-empty">No live Discord activity right now.</p>';
  }

  return `
    <ul class="discord-activity-list">
      ${entries.map((item) => {
    const itemUrl = sanitizeUrl(item.url);
    return `
          <li class="discord-activity-item">
            <button class="social-item-button discord-activity-button" type="button" ${itemUrl ? `data-item-url="${escapeHtml(itemUrl)}"` : ''}>
              <span class="social-item-title">${escapeHtml(item.title)}</span>
              <span class="social-item-meta">${escapeHtml(item.meta || 'Activity')}</span>
            </button>
          </li>
        `;
  }).join('')}
    </ul>
  `;
}

function renderDiscordShowcase(site, payload) {
  const statMap = statMapFromList(payload.stats);
  const statusText = payload.profile.statusText || statMap.get('status') || 'Unknown';
  const avatarUrl = sanitizeUrl(payload.profile.avatarUrl);
  const statusKey = resolveDiscordStatusKey(payload.profile.statusKey, statusText);
  const decorationUrl = sanitizeUrl(payload.profile.decorationUrl);
  const bannerUrl = sanitizeUrl(payload.profile.bannerUrl);
  const bannerAttrs = bannerUrl
    ? ` class="discord-card-banner discord-card-banner--image" style="--discord-banner-url: url('${escapeHtml(bannerUrl)}');"`
    : ' class="discord-card-banner"';

  return `
    <article class="steam-showcase steam-showcase--${escapeHtml(site.id)} steam-showcase--discord-card" data-site-id="${escapeHtml(site.id)}" data-showcase-variant="profile-card">
      ${renderShowcaseHead(site, payload, 'Discord Profile Card', 'Lanyard-synced identity, status, and activity')}
      <div class="steam-showcase-body steam-showcase-body--single">
        <section class="steam-showcase-content steam-showcase-content--full">
          <div class="discord-profile-card">
            <div${bannerAttrs}></div>
            <div class="discord-profile-main">
              <div class="discord-avatar-shell${decorationUrl ? ' discord-avatar-shell--decorated' : ''}">
                ${avatarUrl
    ? `<img class="steam-showcase-avatar discord-profile-avatar" src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" decoding="async" />`
    : `<div class="steam-showcase-avatar steam-showcase-avatar--fallback discord-profile-avatar">${escapeHtml(site.shortLabel || 'DC')}</div>`}
                ${decorationUrl
    ? `<img class="discord-avatar-decoration discord-avatar-decoration--active" src="${escapeHtml(decorationUrl)}" alt="" loading="lazy" decoding="async" />`
    : ''}
                <span class="discord-status-dot discord-status-dot--${escapeHtml(statusKey)}" aria-hidden="true"></span>
              </div>
              <div class="steam-showcase-identity">
                <p class="steam-showcase-name">${escapeHtml(payload.profile.name || site.label)}</p>
                <p class="steam-showcase-handle">${escapeHtml(payload.profile.handle || site.url)}</p>
                <p class="discord-status-pill discord-status-pill--${escapeHtml(statusKey)}">${escapeHtml(statusText)}</p>
              </div>
            </div>
            <p class="steam-showcase-bio discord-profile-bio">${escapeHtml(payload.profile.bio || 'Discord profile card.')}</p>
          </div>
          ${renderDiscordActivities(payload.items)}
        </section>
      </div>
    </article>
  `;
}

function renderLastFmRecentTracks(items) {
  const entries = Array.isArray(items) ? items.slice(0, 30) : [];
  if (!entries.length) {
    return '<p class="social-card-empty">No recent Last.fm songs available.</p>';
  }

  return `
    <ul class="lastfm-recent-list">
      ${entries.map((item) => {
    const itemUrl = sanitizeUrl(item.url);
    const buttonAttrs = itemUrl ? ` data-item-url="${escapeHtml(itemUrl)}"` : '';
    return `
          <li class="lastfm-recent-item">
            <button class="social-item-button lastfm-recent-button" type="button"${buttonAttrs}>
              <span class="lastfm-recent-art">
                <span class="lastfm-recent-note" aria-hidden="true">♪</span>
              </span>
              <span class="lastfm-recent-copy">
                <span class="lastfm-recent-title">${escapeHtml(item.title || 'Unknown track')}</span>
                <span class="lastfm-recent-meta">${escapeHtml(item.subtitle || item.meta || 'Unknown artist')}</span>
              </span>
              <span class="lastfm-recent-age">${escapeHtml(item.countLabel || '--')}</span>
            </button>
          </li>
        `;
  }).join('')}
    </ul>
  `;
}

function renderLastFmProfileTotals(totals) {
  const safeTotals = totals && typeof totals === 'object' ? totals : {};
  const entries = [
    { label: 'Scrobbles', value: String(safeTotals.scrobbles || '--') },
    { label: 'Artists', value: String(safeTotals.artists || '--') },
    { label: 'Loved Tracks', value: String(safeTotals.lovedTracks || '--') },
  ];

  return `
    <div class="lastfm-profile-totals" role="list" aria-label="Last.fm totals">
      ${entries.map((entry) => `
        <div class="lastfm-profile-total" role="listitem">
          <span class="lastfm-profile-total-label">${escapeHtml(entry.label)}</span>
          <span class="lastfm-profile-total-value">${escapeHtml(entry.value)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLastFmMediaGrid(items, kind) {
  const entries = Array.isArray(items) ? items.slice(0, 8) : [];
  if (!entries.length) {
    return '<p class="social-card-empty">No chart entries available.</p>';
  }

  return `
    <ul class="lastfm-media-grid lastfm-media-grid--${escapeHtml(kind)}">
      ${entries.map((item) => {
    const itemUrl = sanitizeUrl(item.url);
    const imageUrl = sanitizeUrl(item.imageUrl);
    const buttonAttrs = itemUrl ? ` data-item-url="${escapeHtml(itemUrl)}"` : '';
    return `
          <li class="lastfm-media-item">
            <button class="social-item-button lastfm-media-button" type="button"${buttonAttrs}>
              <span class="lastfm-media-image-wrap">
                ${imageUrl
    ? `<img class="lastfm-media-image" src="${escapeHtml(imageUrl)}" alt="" loading="lazy" decoding="async" />`
    : '<span class="lastfm-media-image lastfm-media-image--fallback">No Art</span>'}
                <span class="lastfm-media-count">${escapeHtml(item.countLabel || '--')}</span>
              </span>
              <span class="lastfm-media-copy">
                <span class="lastfm-media-title">${escapeHtml(item.title || 'Unknown')}</span>
                ${item.subtitle ? `<span class="lastfm-media-subtitle">${escapeHtml(item.subtitle)}</span>` : ''}
              </span>
            </button>
          </li>
        `;
  }).join('')}
    </ul>
  `;
}

function renderLastFmShowcase(site, payload) {
  const sections = payload.sections && typeof payload.sections === 'object' ? payload.sections : {};
  const recentTracks = Array.isArray(sections.recentTracks) && sections.recentTracks.length
    ? sections.recentTracks
    : payload.items;
  const topArtists = Array.isArray(sections.topArtists) ? sections.topArtists : [];
  const topAlbums = Array.isArray(sections.topAlbums) ? sections.topAlbums : [];
  const profileTotals = sections.profileTotals && typeof sections.profileTotals === 'object'
    ? sections.profileTotals
    : {};

  return `
    <article class="steam-showcase steam-showcase--${escapeHtml(site.id)} steam-showcase--lastfm-chart steam-showcase--lastfm-minimal" data-site-id="${escapeHtml(site.id)}" data-showcase-variant="lastfm-sections">
      <div class="steam-showcase-body steam-showcase-body--single steam-showcase-body--lastfm-minimal">
        <section class="steam-showcase-content steam-showcase-content--full steam-showcase-content--lastfm-minimal">
          <div class="lastfm-sections">
            <section class="lastfm-section">
              ${renderLastFmProfileTotals(profileTotals)}
              <h4 class="lastfm-section-title">Recent Tracks</h4>
              ${renderLastFmRecentTracks(recentTracks)}
            </section>
            <section class="lastfm-section">
              <h4 class="lastfm-section-title">Top Artists</h4>
              ${renderLastFmMediaGrid(topArtists, 'artists')}
            </section>
            <section class="lastfm-section">
              <h4 class="lastfm-section-title">Top Albums</h4>
              ${renderLastFmMediaGrid(topAlbums, 'albums')}
            </section>
          </div>
        </section>
      </div>
    </article>
  `;
}

function renderTwitterShowcase(site, payload) {
  const avatarUrl = sanitizeUrl(payload.profile.avatarUrl);
  return `
    <article class="steam-showcase steam-showcase--${escapeHtml(site.id)} steam-showcase--twitter-feed" data-site-id="${escapeHtml(site.id)}" data-showcase-variant="activity">
      ${renderShowcaseHead(site, payload, 'X / Twitter Feed', 'Live timeline highlights')}
      <div class="steam-showcase-body">
        <aside class="steam-showcase-summary">
          <div class="steam-showcase-profile">
            ${avatarUrl
    ? `<img class="steam-showcase-avatar" src="${escapeHtml(avatarUrl)}" alt="" loading="lazy" decoding="async" />`
    : `<div class="steam-showcase-avatar steam-showcase-avatar--fallback">${escapeHtml(site.shortLabel || 'X')}</div>`}
            <div class="steam-showcase-identity">
              <p class="steam-showcase-name">${escapeHtml(payload.profile.name || site.label)}</p>
              <p class="steam-showcase-handle">${escapeHtml(payload.profile.handle || '')}</p>
            </div>
          </div>
          <p class="steam-showcase-bio">${escapeHtml(payload.profile.bio || '')}</p>
          ${renderStats(payload.stats, 4)}
        </aside>
        <section class="steam-showcase-content">
          ${renderItems(payload.items, 8)}
        </section>
      </div>
    </article>
  `;
}

function renderJosieDescriptionShowcase() {
  return `
    <article class="steam-showcase steam-showcase--josie-intro" data-site-id="josie" data-showcase-variant="josie-description">
      <div class="steam-showcase-body steam-showcase-body--single">
        <section class="steam-showcase-content steam-showcase-content--full josie-intro-content">
          <p class="josie-intro-text">${escapeHtml(JOSIE_TOP_SHOWCASE_TEXT)}</p>
        </section>
      </div>
    </article>
  `;
}

function renderSiteShowcase(site, payload) {
  const safePayload = ensurePayload(site, payload);

  if (site.id === 'steam') return renderSteamShowcase(site, safePayload);
  if (site.id === 'discord') return '';
  if (site.id === 'lastfm') return renderLastFmShowcase(site, safePayload);
  if (site.id === 'twitter') return renderTwitterShowcase(site, safePayload);
  return '';
}

function renderSidebar(payloadById, sites) {
  const rows = sites.map((site) => {
    const payload = ensurePayload(site, payloadById.get(site.id));
    const openUrl = sanitizeUrl(payload.profile?.url || site.url);
    const onlineState = resolveLinkOnlineState(site.id, payload);
    const statusDot = onlineState === null
      ? ''
      : `<span class="steam-link-status-dot steam-link-status-dot--${onlineState ? 'online' : 'offline'}" aria-hidden="true" title="${onlineState ? 'Online' : 'Offline'}"></span>`;
    const linkMarkup = openUrl
      ? `<a class="steam-sidebar-link" href="${escapeHtml(openUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(SITE_THEME_LABEL[site.id] || site.label)}</a>`
      : `<span>${escapeHtml(SITE_THEME_LABEL[site.id] || site.label)}</span>`;
    return `
      <li class="steam-sidebar-row steam-sidebar-row--${escapeHtml(site.id)}">
        <div class="steam-sidebar-row-main">
          <p class="steam-sidebar-row-title">
            <span class="steam-sidebar-row-title-wrap">
              ${linkMarkup}
              ${statusDot}
            </span>
          </p>
        </div>
      </li>
    `;
  }).join('');

  return `
    <section class="steam-sidebar-panel">
      <h3 class="steam-sidebar-title">Profile Links</h3>
      <ul class="steam-sidebar-list">
        ${rows}
      </ul>
    </section>
  `;
}

export function createSocialHubRenderer({
  sites,
  root,
  profile,
  showcases,
  sidebar,
  lastRefreshLabel,
  refreshButton,
  onRefreshRequested,
}) {
  let disposed = false;

  function openExternal(url) {
    const safeUrl = sanitizeUrl(url);
    if (!safeUrl) return;
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  }

  function onRootClick(event) {
    if (disposed) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const openButton = target.closest('[data-open-url]');
    if (openButton instanceof HTMLElement) {
      event.preventDefault();
      openExternal(openButton.getAttribute('data-open-url') || '');
      return;
    }

    const itemButton = target.closest('[data-item-url]');
    if (itemButton instanceof HTMLElement) {
      event.preventDefault();
      openExternal(itemButton.getAttribute('data-item-url') || '');
    }
  }

  function onRefreshClick() {
    if (typeof onRefreshRequested !== 'function') return;
    onRefreshRequested();
  }

  function render(snapshot) {
    if (disposed) return;
    if (!(showcases instanceof HTMLElement)) return;
    if (!(profile instanceof HTMLElement)) return;
    if (!(sidebar instanceof HTMLElement)) return;

    const payloadById = new Map((snapshot?.payloads || []).map((payloadEntry) => [payloadEntry.siteId, payloadEntry]));
    const showcaseSites = sites.filter((site) => !NON_SHOWCASE_SITE_IDS.has(site.id));

    profile.innerHTML = renderHero(payloadById, sites);
    showcases.innerHTML = [
      renderJosieDescriptionShowcase(),
      ...showcaseSites.map((site) => renderSiteShowcase(site, payloadById.get(site.id))),
    ].join('');
    sidebar.innerHTML = renderSidebar(payloadById, sites);

    if (lastRefreshLabel instanceof HTMLElement) {
      const refreshText = formatTimestamp(snapshot?.lastRefreshAt);
      const summary = snapshot?.summary || { ok: 0, partial: 0, failed: 0 };
      lastRefreshLabel.textContent = `Last refresh: ${refreshText} | OK ${summary.ok} | Partial ${summary.partial} | Failed ${summary.failed}`;
    }

    if (refreshButton instanceof HTMLButtonElement) {
      refreshButton.disabled = Boolean(snapshot?.refreshAllInProgress);
      refreshButton.textContent = snapshot?.refreshAllInProgress ? 'Refreshing...' : 'Refresh All';
    }
  }

  if (root instanceof HTMLElement) {
    root.setAttribute('data-social-hub-ready', 'true');
  }

  root?.addEventListener('click', onRootClick);
  refreshButton?.addEventListener('click', onRefreshClick);

  function dispose() {
    if (disposed) return;
    disposed = true;
    root?.removeEventListener('click', onRootClick);
    refreshButton?.removeEventListener('click', onRefreshClick);
  }

  return {
    render,
    dispose,
  };
}
