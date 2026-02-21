<template>
  <div class="internet-app">
    <header v-if="browserState !== 'portal'" class="internet-toolbar">
      <div class="toolbar-actions">
        <button
          class="toolbar-button"
          type="button"
          @click="goPortal"
        >
          Home
        </button>
        <button
          class="toolbar-button"
          type="button"
          :disabled="!activeLink || browserState === 'loading'"
          @click="reloadActiveLink"
        >
          Refresh
        </button>
      </div>
      <div class="address-bar" :title="currentUrl">{{ currentUrl }}</div>
      <div
        v-if="activeStatusBadge"
        class="status-badge"
        :class="activeStatusBadge.className"
        :title="activeStatusBadge.title"
      >
        {{ activeStatusBadge.label }}
      </div>
    </header>

    <section class="internet-body">
      <div v-if="browserState === 'portal'" class="portal-screen">
        <div class="portal-header">
          <img class="portal-star portal-star--left" src="/internet/internet_sparkle.gif" alt="" draggable="false" aria-hidden="true" />
          <div class="portal-logo">
            <h2 class="portal-title">Internet!</h2>
            <img class="portal-title-sprite" src="/internet/icon_Internet.png" alt="" draggable="false" aria-hidden="true" />
          </div>
          <img class="portal-star portal-star--right" src="/internet/internet_sparkle.gif" alt="" draggable="false" aria-hidden="true" />
        </div>
        <div class="portal-list">
          <button
            v-for="entry in portalEntries"
            :key="entry.id"
            class="portal-row"
            type="button"
            :style="portalRowStyle(entry)"
            @click="openLinkById(entry.id)"
          >
            <span class="portal-row-icon-wrap">
              <img class="portal-row-icon" :src="entry.icon" :alt="`${entry.label} icon`" draggable="false" />
              <span v-if="entry.flagged" class="portal-row-badge">!</span>
            </span>
            <span class="portal-row-line" aria-hidden="true"></span>
            <span class="portal-row-text">{{ entry.label }}</span>
          </button>
        </div>
      </div>

      <div v-else-if="browserState === 'loading'" class="loading-panel">
        <div class="loading-title">Connecting...</div>
        <div class="loading-line">{{ loadingLine }}</div>
        <div class="loading-bar">
          <div class="loading-fill" :style="{ width: `${loadProgress}%` }"></div>
        </div>
      </div>

      <div v-else class="preview-panel">
        <article
          v-if="activeLink"
          class="mock-site"
          :class="`mock-site--${activeLink.id}`"
          :style="mockSiteStyle(activeLink)"
        >
          <div ref="mockContentRef" class="mock-content">
            <section
              v-if="activeLink.id === 'twitter'"
              ref="twitterLayoutRef"
              class="mock-layout mock-layout--twitter"
            >
              <div class="mock-twitter-feed">
                <button
                  v-for="item in activeLink.mock.items"
                  :key="item.id"
                  type="button"
                  class="mock-tweet-card"
                  @click="openExternalCurrent(item.title)"
                >
                  <div class="mock-tweet-head" :class="`mock-tweet-head--${twitterPostKind(item)}`">
                    <button
                      class="mock-tweet-avatar-trigger"
                      type="button"
                      aria-label="Open profile card"
                      @click.stop="toggleTwitterProfileCard($event)"
                    >
                      <img
                      class="mock-tweet-self-avatar"
                      :src="activeLink.mock.avatarUrl"
                      :alt="`${activeLink.mock.profileName} avatar`"
                      draggable="false"
                    />
                    </button>
                    <span v-if="twitterPostKind(item) === 'retweet'" class="mock-tweet-retweet-icon" aria-label="Retweet">
                      <img class="mock-mini-icon" src="/internet/icon_tweeter.png" alt="" draggable="false" aria-hidden="true" />
                      <span>RT</span>
                    </span>
                    <span class="mock-tweet-author-name">{{ activeLink.mock.profileName }}</span>
                    <span class="mock-tweet-author-handle">{{ twitterPostHandle(item, activeLink.mock.profileHandle) }}</span>
                    <span class="mock-tweet-kind-chip" :class="`mock-tweet-kind-chip--${twitterPostKind(item)}`">
                      {{ twitterPostLabel(item) }}
                    </span>
                  </div>
                  <span class="mock-item-title">{{ twitterPostTitle(item) }}</span>
                  <span class="mock-item-meta">{{ item.meta }}</span>
                  <div v-if="item.quote?.text" class="mock-tweet-quote-embed">
                    <div class="mock-tweet-quote-head">
                      <span class="mock-tweet-quote-label">Quoted Post</span>
                      <span v-if="item.quote.handle" class="mock-tweet-quote-handle">{{ item.quote.handle }}</span>
                    </div>
                    <span class="mock-tweet-quote-text">{{ item.quote.text }}</span>
                    <div v-if="item.quote.mediaType === 'image'" class="mock-tweet-media mock-tweet-media--quote">
                      <img
                        v-if="item.quote.mediaUrl"
                        class="mock-tweet-image"
                        :src="item.quote.mediaUrl"
                        alt=""
                        draggable="false"
                      />
                      <div v-if="item.quote.mediaUrls?.length" class="mock-tweet-gallery">
                        <img
                          v-for="quoteMediaUrl in item.quote.mediaUrls"
                          :key="quoteMediaUrl"
                          class="mock-tweet-gallery-image"
                          :src="quoteMediaUrl"
                          alt=""
                          draggable="false"
                        />
                      </div>
                    </div>
                    <div v-else-if="item.quote.mediaType === 'video' && item.quote.mediaUrl" class="mock-tweet-media mock-tweet-media--quote">
                      <video
                        class="mock-tweet-video"
                        :src="item.quote.mediaUrl"
                        autoplay
                        muted
                        loop
                        controls
                        playsinline
                        preload="metadata"
                        @click.stop="handleTweetVideoClick"
                      ></video>
                    </div>
                  </div>
                  <div v-if="item.mediaType === 'image'" class="mock-tweet-media">
                    <img
                      v-if="item.mediaUrl"
                      class="mock-tweet-image"
                      :src="item.mediaUrl"
                      alt=""
                      draggable="false"
                    />
                    <div v-if="item.mediaUrls?.length" class="mock-tweet-gallery">
                      <img
                        v-for="mediaUrl in item.mediaUrls"
                        :key="mediaUrl"
                        class="mock-tweet-gallery-image"
                        :src="mediaUrl"
                        alt=""
                        draggable="false"
                      />
                    </div>
                  </div>
                  <div v-else-if="item.mediaType === 'video' && item.mediaUrl" class="mock-tweet-media">
                    <video
                      class="mock-tweet-video"
                      :src="item.mediaUrl"
                      autoplay
                      muted
                      loop
                      controls
                      playsinline
                      preload="metadata"
                      @click.stop="handleTweetVideoClick"
                    ></video>
                  </div>
                </button>
              </div>

              <aside
                v-if="twitterProfileCardOpen"
                ref="twitterProfileCardRef"
                class="mock-panel mock-twitter-profile mock-twitter-profile-card"
                :style="twitterProfileCardStyle"
              >
                <div class="mock-twitter-profile-main mock-social-profile-main">
                  <div class="mock-twitter-profile-header">
                    <button class="mock-avatar-button" type="button" @click="openExternalCurrent('avatar')">
                      <img
                        class="mock-avatar"
                        :src="activeLink.mock.avatarUrl"
                        :alt="`${activeLink.mock.profileName} profile`"
                        draggable="false"
                      />
                    </button>
                    <div class="mock-twitter-identity">
                      <p class="mock-profile-name">{{ activeLink.mock.profileName }}</p>
                      <p class="mock-profile-handle">{{ activeLink.mock.profileHandle }}</p>
                    </div>
                  </div>
                  <p class="mock-profile-bio mock-profile-bio--twitter">{{ activeLink.mock.bio }}</p>
                </div>
                <div class="mock-twitter-profile-stats">
                  <div class="mock-twitter-divider" aria-hidden="true"></div>
                  <div class="mock-stats mock-stats--twitter">
                    <button
                      v-for="stat in activeLink.mock.stats"
                      :key="stat.label"
                      class="mock-stat mock-stat--twitter"
                      type="button"
                      @click="openExternalCurrent(stat.label)"
                    >
                      <span class="mock-stat-label">{{ stat.label }}</span>
                      <span class="mock-stat-value">{{ stat.value }}</span>
                    </button>
                  </div>
                </div>
              </aside>
            </section>

            <section v-else-if="activeLink.id === 'steam'" class="mock-layout mock-layout--steam">
              <div class="mock-steam-hero">
                <button class="mock-avatar-button" type="button" @click="openExternalCurrent('profile')">
                  <img
                    class="mock-avatar"
                    :src="activeLink.mock.avatarUrl"
                    :alt="`${activeLink.mock.profileName} profile`"
                    draggable="false"
                  />
                </button>
                <div class="mock-profile-copy">
                  <p class="mock-profile-name">{{ activeLink.mock.profileName }}</p>
                  <p class="mock-profile-handle">{{ activeLink.mock.profileHandle }}</p>
                  <p class="mock-profile-bio">{{ activeLink.mock.bio }}</p>
                </div>
                <button class="mock-pill" type="button" @click="openExternalCurrent('Add Friend')">Add Friend</button>
              </div>

              <div class="mock-tab-row">
                <button
                  v-for="action in activeLink.mock.actions"
                  :key="action"
                  type="button"
                  class="mock-tab-button"
                  @click="openExternalCurrent(action)"
                >
                  {{ action }}
                </button>
              </div>

              <div class="mock-steam-body">
                <div class="mock-item-grid">
                  <button
                    v-for="item in activeLink.mock.items"
                    :key="item.id"
                    class="mock-item-card mock-item-card--steam"
                    type="button"
                    @click="openExternalCurrent(item.title)"
                  >
                    <img class="mock-mini-icon" src="/internet/icon_vanitysearch.png" alt="" draggable="false" aria-hidden="true" />
                    <span class="mock-item-title">{{ item.title }}</span>
                    <span class="mock-item-meta">{{ item.meta }}</span>
                  </button>
                </div>
                <div class="mock-stats mock-stats--stacked">
                  <button
                    v-for="stat in activeLink.mock.stats"
                    :key="stat.label"
                    class="mock-stat"
                    type="button"
                    @click="openExternalCurrent(stat.label)"
                  >
                    <span class="mock-stat-value">{{ stat.value }}</span>
                    <span class="mock-stat-label">{{ stat.label }}</span>
                  </button>
                </div>
              </div>
            </section>

            <section v-else-if="activeLink.id === 'youtube'" class="mock-layout mock-layout--youtube">
              <div class="mock-yt-toolbar">
                <img class="mock-mini-icon" src="/internet/icon_stream.png" alt="" draggable="false" aria-hidden="true" />
                <div class="mock-yt-search">Search channel videos...</div>
                <button class="mock-tab-button" type="button" @click="openExternalCurrent('Upload')">Upload</button>
              </div>

              <div class="mock-yt-channel">
                <button class="mock-avatar-button" type="button" @click="openExternalCurrent('profile')">
                  <img
                    class="mock-avatar"
                    :src="activeLink.mock.avatarUrl"
                    :alt="`${activeLink.mock.profileName} profile`"
                    draggable="false"
                  />
                </button>
                <div class="mock-profile-copy">
                  <p class="mock-profile-name">{{ activeLink.mock.profileName }}</p>
                  <p class="mock-profile-handle">{{ activeLink.mock.profileHandle }}</p>
                  <p class="mock-profile-bio">{{ activeLink.mock.bio }}</p>
                </div>
                <button class="mock-pill mock-pill--hot" type="button" @click="openExternalCurrent('Subscribe')">Subscribe</button>
              </div>

              <div class="mock-tab-row mock-tab-row--yt">
                <button
                  v-for="action in activeLink.mock.actions"
                  :key="action"
                  type="button"
                  class="mock-tab-button"
                  @click="openExternalCurrent(action)"
                >
                  {{ action }}
                </button>
              </div>

              <div class="mock-item-grid mock-item-grid--yt">
                <button
                  v-for="item in activeLink.mock.items"
                  :key="item.id"
                  type="button"
                  class="mock-item-card mock-item-card--yt"
                  @click="openExternalCurrent(item.title)"
                >
                  <span class="mock-yt-thumb">
                    <img src="/internet/icon_stream.png" alt="" draggable="false" aria-hidden="true" />
                  </span>
                  <span class="mock-item-title">{{ item.title }}</span>
                  <span class="mock-item-meta">{{ item.meta }}</span>
                </button>
              </div>
            </section>

            <section v-else-if="activeLink.id === 'lastfm'" class="mock-layout mock-layout--lastfm">
              <div class="mock-lastfm-header">
                <img class="mock-mini-icon" src="/internet/icon_st.png" alt="" draggable="false" aria-hidden="true" />
                <div class="mock-profile-copy">
                  <p class="mock-profile-name">{{ activeLink.mock.profileName }}</p>
                  <p class="mock-profile-handle">{{ activeLink.mock.profileHandle }}</p>
                </div>
                <span
                  v-if="lastfmStatusBadge"
                  class="mock-live-chip"
                  :class="lastfmStatusBadge.className"
                  :title="lastfmStatusBadge.title"
                >
                  {{ lastfmStatusBadge.compactLabel }}
                </span>
                <button class="mock-pill" type="button" @click="openExternalCurrent('Shout')">Shout</button>
              </div>

              <div class="mock-lastfm-grid">
                <div class="mock-panel">
                  <p class="mock-section-title">Weekly chart</p>
                  <button
                    v-for="(stat, index) in activeLink.mock.stats"
                    :key="stat.label"
                    type="button"
                    class="mock-lastfm-bar"
                    @click="openExternalCurrent(stat.label)"
                  >
                    <span class="mock-lastfm-bar-label">{{ stat.label }}</span>
                    <span class="mock-lastfm-track">
                      <span class="mock-lastfm-fill" :style="{ width: lastfmBarWidth(index) }"></span>
                    </span>
                    <span class="mock-lastfm-value">{{ stat.value }}</span>
                  </button>
                </div>

                <div class="mock-panel">
                  <p class="mock-section-title">Recent scrobbles</p>
                  <button
                    v-for="item in activeLink.mock.items"
                    :key="item.id"
                    class="mock-lastfm-item"
                    type="button"
                    @click="openExternalCurrent(item.title)"
                  >
                    <span class="mock-item-title">{{ item.title }}</span>
                    <span class="mock-item-meta">{{ item.meta }}</span>
                  </button>
                </div>
              </div>
            </section>

            <section v-else-if="activeLink.id === 'spotify'" class="mock-layout mock-layout--spotify">
              <aside class="mock-spotify-sidebar">
                <button
                  v-for="action in activeLink.mock.actions"
                  :key="action"
                  type="button"
                  class="mock-tab-button mock-tab-button--spotify"
                  @click="openExternalCurrent(action)"
                >
                  {{ action }}
                </button>
              </aside>

              <div class="mock-spotify-main">
                <div class="mock-spotify-hero">
                  <button class="mock-avatar-button" type="button" @click="openExternalCurrent('profile')">
                    <img
                      class="mock-avatar"
                      :src="activeLink.mock.avatarUrl"
                      :alt="`${activeLink.mock.profileName} profile`"
                      draggable="false"
                    />
                  </button>
                  <div class="mock-profile-copy">
                    <p class="mock-profile-name">{{ activeLink.mock.profileName }}</p>
                    <p class="mock-profile-handle">{{ activeLink.mock.profileHandle }}</p>
                    <p class="mock-profile-bio">{{ activeLink.mock.bio }}</p>
                  </div>
                </div>

                <div class="mock-stats">
                  <button
                    v-for="stat in activeLink.mock.stats"
                    :key="stat.label"
                    class="mock-stat"
                    type="button"
                    @click="openExternalCurrent(stat.label)"
                  >
                    <span class="mock-stat-value">{{ stat.value }}</span>
                    <span class="mock-stat-label">{{ stat.label }}</span>
                  </button>
                </div>

                <div class="mock-spotify-tracklist">
                  <button
                    v-for="(item, index) in activeLink.mock.items"
                    :key="item.id"
                    class="mock-spotify-track"
                    type="button"
                    @click="openSpotifyTrackPreview(item)"
                  >
                    <span class="mock-spotify-index">{{ spotifyTrackIndex(index) }}</span>
                    <span class="mock-item-title">{{ item.title }}</span>
                    <span class="mock-item-meta">{{ item.meta }}</span>
                  </button>
                </div>

                <div v-if="spotifyPreviewEmbedUrl" class="mock-spotify-preview">
                  <div class="mock-spotify-preview-header">
                    <span class="mock-spotify-preview-title">
                      Preview:
                      <strong>{{ spotifyPreviewTitle }}</strong>
                    </span>
                    <button
                      class="mock-pill mock-pill--spotify-open"
                      type="button"
                      @click="openSpotifyPreviewExternal"
                    >
                      Open In Spotify
                    </button>
                  </div>
                  <iframe
                    class="mock-spotify-embed"
                    :src="spotifyPreviewEmbedUrl"
                    title="Spotify track preview"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  ></iframe>
                </div>
              </div>
            </section>

            <section v-else class="mock-layout">
              <div class="mock-item-grid">
                <button
                  v-for="item in activeLink.mock.items"
                  :key="item.id"
                  class="mock-item-card"
                  type="button"
                  @click="openExternalCurrent(item.title)"
                >
                  <span class="mock-item-title">{{ item.title }}</span>
                  <span class="mock-item-meta">{{ item.meta }}</span>
                </button>
              </div>
            </section>
          </div>
        </article>

        <div v-else class="snapshot-error">
          Preview unavailable.
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { openExternalUrlWithFallback } from '../externalLinks';
import { useInternetStore } from '../stores/internet';
import type {
  InternetFreshnessStatus,
  InternetSiteId,
  InternetSitePayload,
  InternetSourceStatus,
} from '../services/internet/types';

type BrowserState = 'portal' | 'loading' | 'preview';

interface PortalEntry {
  id: InternetSiteId;
  label: string;
  icon: string;
  flagged?: boolean;
  iconSize?: number;
}

interface MockStat {
  label: string;
  value: string;
}

interface MockItem {
  id: string;
  title: string;
  meta: string;
  mediaType?: 'image' | 'video';
  mediaUrl?: string;
  mediaUrls?: string[];
  linkUrl?: string;
  postKind?: 'original' | 'retweet' | 'quote';
  sourceHandle?: string;
  quote?: {
    text: string;
    handle?: string;
    linkUrl?: string;
    mediaType?: 'image' | 'video';
    mediaUrl?: string;
    mediaUrls?: string[];
  };
}

interface MockSitePreview {
  siteName: string;
  profileName: string;
  profileHandle: string;
  bio: string;
  avatarUrl: string;
  primaryCta: string;
  actions: string[];
  stats: MockStat[];
  items: MockItem[];
  themeGradient: string;
}

interface InternetLink {
  id: InternetSiteId;
  label: string;
  url: string;
  accent: string;
  loadWaitMs?: number;
  mock: MockSitePreview;
}

interface ActiveStatusBadge {
  label: string;
  compactLabel: string;
  className: string;
  title: string;
}

const props = withDefaults(defineProps<{ initialSiteId?: InternetSiteId | null }>(), {
  initialSiteId: null,
});

const PORTAL_URL = 'http://www.windose.net/portal';
const DEFAULT_LOAD_WAIT_MS = 1200;
const MAX_LOAD_WAIT_MS = 12000;
const INTERNET_SITE_IDS: InternetSiteId[] = ['twitter', 'steam', 'youtube', 'lastfm', 'spotify'];
const internetStore = useInternetStore();

const linkEntries: InternetLink[] = [
  {
    id: 'twitter',
    label: 'Twitter',
    url: 'https://x.com/ProbablyLaced',
    accent: '#4b71d6',
    loadWaitMs: 1600,
    mock: {
      siteName: 'Twitter',
      profileName: 'josie',
      profileHandle: '@ProbablyLaced',
      bio: "There's a man on the horizon.",
      avatarUrl: 'https://pbs.twimg.com/profile_images/2017319718550704130/N-SZxf32.jpg',
      primaryCta: 'View Profile',
      actions: ['Posts', 'Replies', 'Media', 'Likes', 'Followers', 'Following'],
      stats: [
        { label: 'Tweets', value: '307' },
        { label: 'Following', value: '267' },
        { label: 'Followers', value: '4' },
        { label: 'Likes', value: '3K' },
      ],
      items: [
        {
          id: 'tweet-2024043559775584649',
          title: 'Everyone STFU and let Daddy conclude this argument: Marvel Rivals is WAY harder than Overwatch cause you have to manage to use your keyboard and maybe mouse while SKILFULLY manoeuvring around the pools of DROOL that are near it',
          meta: '3h • repost',
          postKind: 'retweet',
          sourceHandle: '@alvicates',
          linkUrl: 'https://x.com/alvicates/status/2024043559775584649',
        },
        {
          id: 'tweet-2023840148581216684',
          title: 'I JUST GOT KIRKED ON SIEGE WTF',
          meta: '17h • repost clip',
          postKind: 'retweet',
          sourceHandle: '@BikiniBodhi',
          linkUrl: 'https://x.com/BikiniBodhi/status/2023840148581216684',
          mediaType: 'image',
          mediaUrl: 'https://pbs.twimg.com/amplify_video_thumb/2023840062941917187/img/fZf5D0vg7D8F7gRu.jpg',
        },
        {
          id: 'tweet-2023807311014490204',
          title: '그해외루시우원챔분이시그마스프레이따라하는거언제안웃김',
          meta: '19h • repost',
          postKind: 'retweet',
          sourceHandle: '@wuyang_com',
          linkUrl: 'https://x.com/wuyang_com/status/2023807311014490204',
          mediaType: 'image',
          mediaUrl: 'https://pbs.twimg.com/media/HBYCBdWaYAA_Dc_?format=jpg&name=small',
        },
        {
          id: 'tweet-2022898828828119085',
          title: 'microsoft just released a security patch that deletes your internet!!! the dhcp client service is functionally dead because they forgot how dll exports work. the os literally telling you it has lost the will to live the only way to save your pc from kb5077181 is to delete the',
          meta: 'Feb 15 • repost • community notes',
          postKind: 'retweet',
          sourceHandle: '@forloopcodes',
          linkUrl: 'https://x.com/forloopcodes/status/2022898828828119085',
          mediaType: 'image',
          mediaUrls: [
            'https://pbs.twimg.com/media/HBLE96KakAEx1PE?format=png&name=360x360',
            'https://pbs.twimg.com/media/HBLHjPCakAIfLxA?format=png&name=360x360',
          ],
        },
        {
          id: 'tweet-2022805002193084616',
          title: 'Logifanboys are experiencing the placebo effect in full swing',
          meta: 'Feb 15 • quote tweet',
          postKind: 'quote',
          linkUrl: 'https://x.com/ProbablyLaced/status/2022805002193084616',
          mediaType: 'image',
          mediaUrls: [
            'https://pbs.twimg.com/media/HBEmUmPXcAAJIS0?format=png&name=small',
            'https://pbs.twimg.com/media/HBEmUmUXgAA9Lna?format=png&name=360x360',
          ],
          quote: {
            text: 'If you come at the king, you best not miss',
            handle: '@endgamegear',
            linkUrl: 'https://x.com/endgamegear/status/2022482171357802577',
          },
        },
        {
          id: 'tweet-2022690791249019253',
          title: "So when are the tourists and people who haven't played in years gonna leave?",
          meta: 'Feb 15 • repost',
          postKind: 'retweet',
          sourceHandle: '@irlpachi',
          linkUrl: 'https://x.com/irlpachi/status/2022690791249019253',
          mediaType: 'image',
          mediaUrl: 'https://pbs.twimg.com/media/HBIJebtakAsbGYl?format=jpg&name=small',
        },
        {
          id: 'tweet-2022626884396143046',
          title: '✦ . ⁺ . ✦ . ⁺ . ✦. ⁺ . ✦ . ⁺ . ✦ 『ぽやしみブルーライト』 ・YouTube https://youtu.be/r0WjfiFIKFc ・niconico https://nicovideo.jp/watch/sm45934087 ・Streaming＆Download https://linkco.re/ev3Mnncq ✦ . ⁺ . ✦ . ⁺ . ✦. ⁺ . ✦ . ⁺ . ✦ #VOCALOID',
          meta: 'Feb 14 • repost',
          postKind: 'retweet',
          sourceHandle: '@revy_necoze',
          linkUrl: 'https://x.com/revy_necoze/status/2022626884396143046',
          mediaType: 'image',
          mediaUrl: 'https://pbs.twimg.com/amplify_video_thumb/2021453406997815296/img/y373C3pn507OHbvF.jpg',
        },
        {
          id: 'tweet-2022576105207537738',
          title: 'Please stop banning cat, every game I get against cat is fun. Please stop. Let the cat play. Let her play. Let her in, so I can shoot her. I like the cat.',
          meta: 'Feb 14 • repost',
          postKind: 'retweet',
          sourceHandle: '@Matty_OW',
          linkUrl: 'https://x.com/Matty_OW/status/2022576105207537738',
        },
        {
          id: 'tweet-2022486517684539810',
          title: '#OMORIFANART',
          meta: 'Feb 14 • repost gif',
          postKind: 'retweet',
          sourceHandle: '@Ms_Yuri1',
          linkUrl: 'https://x.com/Ms_Yuri1/status/2022486517684539810',
          mediaType: 'video',
          mediaUrl: 'https://video.twimg.com/tweet_video/HBFQq9NWcAA_hRd.mp4',
        },
        {
          id: 'tweet-2021903088005918970',
          title: 'Discord has been caught lying. Discord caught ditching its current age verification provider for Persona after bypasses appeared everywhere. They promised "facial scans never leave your device" and no uploads, but now they send your IDs and data to a third-party company.',
          meta: 'Feb 12 • repost • community notes',
          postKind: 'retweet',
          sourceHandle: '@Pirat_Nation',
          linkUrl: 'https://x.com/Pirat_Nation/status/2021903088005918970',
          mediaType: 'image',
          mediaUrls: [
            'https://pbs.twimg.com/media/HA8-JDOXwAABmgA?format=jpg&name=360x360',
            'https://pbs.twimg.com/media/HA8-JDxbUAEvVHL?format=jpg&name=small',
          ],
        },
        {
          id: 'tweet-2021699300342800499',
          title: 'this is how it feels to play that cat',
          meta: 'Feb 12 • repost gif',
          postKind: 'retweet',
          sourceHandle: '@jumpbugger',
          linkUrl: 'https://x.com/jumpbugger/status/2021699300342800499',
          mediaType: 'video',
          mediaUrl: 'https://video.twimg.com/tweet_video/HA6Ey6dboAA2H00.mp4',
        },
        {
          id: 'tweet-2019238881447800900',
          title: 'Crazy how all of the comments are shitting on this game when it’s in the best state it’s been in for years. Did any of these so called 2016 veterans even play late Overwatch 1? It was fucking miserable.',
          meta: 'Feb 5 • posted by you',
          postKind: 'original',
          linkUrl: 'https://x.com/ProbablyLaced/status/2019238881447800900',
          mediaType: 'image',
          mediaUrl: 'https://pbs.twimg.com/media/HAVZJnOW4AA0msO.png',
        },
      ],
      themeGradient: 'linear-gradient(130deg, #1f3f84 0%, #4f78d8 58%, #83bcff 100%)',
    },
  },
  {
    id: 'steam',
    label: 'Steam',
    url: 'https://steamcommunity.com/id/foundlifeless/',
    accent: '#476fb8',
    loadWaitMs: 1300,
    mock: {
      siteName: 'Steam',
      profileName: 'josie',
      profileHandle: 'steamcommunity.com/id/foundlifeless',
      bio: "Level 45 profile. There’s a man on the horizon.",
      avatarUrl: 'https://avatars.fastly.steamstatic.com/6993c708d2d3e7fd75e29a230ef48e4e99ae27d9_full.jpg',
      primaryCta: 'Open Profile',
      actions: ['Profile', 'Inventory', 'Badges', 'Screenshots', 'Artwork', 'Reviews'],
      stats: [
        { label: 'Level', value: '45' },
        { label: 'Badges', value: '39' },
        { label: 'Reviews', value: '29' },
        { label: 'Groups', value: '65' },
      ],
      items: [
        { id: 'steam-1', title: 'Screenshot showcase', meta: '4 captures • public' },
        { id: 'steam-2', title: 'Artwork showcase', meta: '5 pieces • profile ready' },
        { id: 'steam-3', title: 'Comment wall', meta: '274 comments • page 1/46' },
        { id: 'steam-4', title: 'Featured group: bpd princess', meta: '913 members' },
        { id: 'steam-5', title: 'Featured group: Nine Inch Nails Fans', meta: '26,046 members' },
        { id: 'steam-6', title: 'Featured group: Metal!', meta: '25,831 members' },
        { id: 'steam-7', title: 'Review list', meta: '29 reviews • mixed moods' },
        { id: 'steam-8', title: 'Inventory', meta: 'public inventory pages' },
        { id: 'steam-9', title: 'Recent comment from Aster', meta: '"square tf up"' },
        { id: 'steam-10', title: 'Recent comment from Angel', meta: 'she carries me on every game' },
        { id: 'steam-11', title: 'Steam years badge', meta: '9 years' },
        { id: 'steam-12', title: 'Profile background', meta: 'tchuptchuptchuptchup' },
      ],
      themeGradient: 'linear-gradient(140deg, #162941 0%, #1f4f7d 55%, #4fa0d5 100%)',
    },
  },
  {
    id: 'youtube',
    label: 'YouTube',
    url: 'https://www.youtube.com/@fentlacedcat',
    accent: '#d14d4f',
    loadWaitMs: 1400,
    mock: {
      siteName: 'YouTube',
      profileName: 'Josie',
      profileHandle: '@fentlacedcat',
      bio: 'resident of the comment section',
      avatarUrl: 'https://yt3.googleusercontent.com/WL2ZE01w1qbFKRM-1rAqBhg9heH1TGe0pKma48o08TcT1g32Gapl4CTwh4ySvJ6vyebeIsH1=s900-c-k-c0x00ffffff-no-rj',
      primaryCta: 'Go To Channel',
      actions: ['Home', 'Videos', 'Shorts', 'Playlists', 'Channels', 'About'],
      stats: [
        { label: 'Subscribers', value: '28' },
        { label: 'Videos', value: '3' },
        { label: 'Handle', value: '@fentlacedcat' },
        { label: 'Joined', value: 'Sep 2021' },
      ],
      items: [
        { id: 'yt-1', title: 'bl4ck m4rket c4rt - Doki Doki Literature Club', meta: 'Uploaded • 3:40' },
        { id: 'yt-2', title: 'Your New Home?', meta: 'Uploaded • 2:08' },
        { id: 'yt-3', title: 'POMME GRANATE', meta: 'Uploaded • 2:46' },
        { id: 'yt-4', title: 'Soundcloud in channel links', meta: 'About tab detail' },
        { id: 'yt-5', title: 'Channel intro card (classic style)', meta: 'Home module' },
        { id: 'yt-6', title: 'No community posts yet', meta: 'dead-zone aesthetic' },
        { id: 'yt-7', title: 'Playlist: horizon loop', meta: 'fan-curated' },
        { id: 'yt-8', title: 'Playlist: needy angel mix', meta: 'NSO soundtrack picks' },
        { id: 'yt-9', title: 'Shorts draft queue', meta: 'private concept clips' },
        { id: 'yt-10', title: 'Featured channels', meta: 'friends + collabs' },
        { id: 'yt-11', title: 'Archive: old edit pack', meta: 'unlisted upload notes' },
        { id: 'yt-12', title: 'Subscribed viewer comments', meta: 'resident of the comment section' },
      ],
      themeGradient: 'linear-gradient(135deg, #7b1822 0%, #d13f4a 58%, #f29f9d 100%)',
    },
  },
  {
    id: 'lastfm',
    label: 'Last.fm',
    url: 'https://www.last.fm/user/FoundLifeless',
    accent: '#cc456f',
    loadWaitMs: 1200,
    mock: {
      siteName: 'Last.fm',
      profileName: 'FoundLifeless',
      profileHandle: 'last.fm/user/FoundLifeless',
      bio: 'probablylacedwithfentanyl • scrobbling since 22 Aug 2022',
      avatarUrl: 'https://lastfm.freetls.fastly.net/i/u/avatar170s/e1354b370f022db5ccd9a3088e75997a.png',
      primaryCta: 'Open Listening Log',
      actions: ['Overview', 'Reports', 'Library', 'Loved Tracks', 'Shouts', 'Following'],
      stats: [
        { label: 'Scrobbles', value: '64,364' },
        { label: 'Artists', value: '2,741' },
        { label: 'Loved Tracks', value: '1,172' },
        { label: 'Top Track', value: "can't let you go" },
      ],
      items: [
        { id: 'lfm-1', title: 'Quadeca', meta: '87 plays (last 30 days)' },
        { id: 'lfm-2', title: 'wishlane', meta: '75 plays (last 30 days)' },
        { id: 'lfm-3', title: 'Malcolm Todd', meta: '50 plays (last 30 days)' },
        { id: 'lfm-4', title: 'NEEDY GIRL OVERDOSE', meta: '29 plays (last 30 days)' },
        { id: 'lfm-5', title: 'venturing', meta: '40 plays (last 30 days)' },
        { id: 'lfm-6', title: 'glaive', meta: '32 plays (last 30 days)' },
        { id: 'lfm-7', title: 'Aries', meta: '31 plays (last 30 days)' },
        { id: 'lfm-8', title: 'Black Country, New Road', meta: '28 plays (last 30 days)' },
        { id: 'lfm-9', title: 'vanisher, horizon SCRAPER', meta: '45 plays (top album)' },
        { id: 'lfm-10', title: '[NEEDY STREAMER OVERLOAD] Soundtrack', meta: '21 plays (top album)' },
        { id: 'lfm-11', title: 'Cubibibibism', meta: '4 scrobbles (last 7 days)' },
        { id: 'lfm-12', title: 'Plan 76', meta: '4 scrobbles (last 7 days)' },
      ],
      themeGradient: 'linear-gradient(132deg, #76213f 0%, #be305f 56%, #f0789e 100%)',
    },
  },
  {
    id: 'spotify',
    label: 'Spotify',
    url: 'https://open.spotify.com/playlist/1Cim4pZnFmNXD8N4OtO3wz?si=b75cc9f3073a473b&nd=1&dlsi=49ce9ea61601457a',
    accent: '#34ad72',
    loadWaitMs: 1250,
    mock: {
      siteName: 'Spotify',
      profileName: 'josie',
      profileHandle: 'playlist by Divine Intervention',
      bio: 'public playlist • 1Cim4pZnFmNXD8N4OtO3wz',
      avatarUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67706c0000d72cdfa0bc9c55fc0ee222425c74',
      primaryCta: 'Open Playlist',
      actions: ['Home', 'Search', 'Your Library', 'Create Playlist', 'Liked Songs', 'Blend'],
      stats: [
        { label: 'Saves', value: '3' },
        { label: 'Songs', value: '1,319' },
        { label: 'Length', value: '24h+' },
        { label: 'Visibility', value: 'Public' },
      ],
      items: [
        { id: 'sp-1', title: 'Holy Fucking Shit: 40,000', meta: 'Have A Nice Life • 6:26' },
        { id: 'sp-2', title: 'Bliss Fields', meta: 'Ecco2k • 0:22' },
        { id: 'sp-3', title: 'Time', meta: 'Ecco2k • 2:01' },
        { id: 'sp-4', title: 'Blue Eyes', meta: 'Ecco2k • 1:33' },
        { id: 'sp-5', title: 'Sugar & Diesel', meta: 'Ecco2k • 3:19' },
        { id: 'sp-6', title: 'Peroxide', meta: 'Ecco2k • 3:34' },
        { id: 'sp-7', title: 'Security!', meta: 'Ecco2k • 2:35' },
        { id: 'sp-8', title: 'AAA Powerline', meta: 'Ecco2k • 4:12' },
        { id: 'sp-9', title: 'The Flag is Raised', meta: 'Bladee, Ecco2k • 2:59' },
        { id: 'sp-10', title: 'Faust', meta: 'Bladee, Ecco2k • 2:05' },
        { id: 'sp-11', title: 'I AM SLOWLY BUT SURELY LOSING HOPE', meta: 'Bladee • 2:33' },
        { id: 'sp-12', title: 'Girls Just Want to Have Fun', meta: 'Bladee, Ecco2k • 2:14' },
        { id: 'sp-13', title: 'Enemy', meta: 'Yung Lean, Bladee • 2:50' },
        { id: 'sp-14', title: 'Free The Frail', meta: 'JPEGMAFIA • 3:30' },
        { id: 'sp-15', title: 'song about imAGINARY PEOPEL', meta: 'osquinn • 1:26' },
        { id: 'sp-16', title: "i'm here for a good time, not a long time", meta: 'osquinn • 1:31' },
        { id: 'sp-17', title: 'Bitch Please', meta: 'Death Grips • 2:56' },
        { id: 'sp-18', title: 'Hacker', meta: 'Death Grips • 4:35' },
        { id: 'sp-19', title: "I've Seen Footage", meta: 'Death Grips • 3:22' },
        { id: 'sp-20', title: 'Get Got', meta: 'Death Grips • 2:51' },
      ],
      themeGradient: 'linear-gradient(132deg, #15452d 0%, #248a57 55%, #66d89f 100%)',
    },
  },
];

function cloneMockStats(stats: MockStat[]): MockStat[] {
  return stats.map((stat) => ({ ...stat }));
}

function cloneMockItems(items: MockItem[]): MockItem[] {
  return items.map((item) => ({
    ...item,
    mediaUrls: item.mediaUrls ? [...item.mediaUrls] : undefined,
    quote: item.quote
      ? {
          ...item.quote,
          mediaUrls: item.quote.mediaUrls ? [...item.quote.mediaUrls] : undefined,
        }
      : undefined,
  }));
}

function isLikelyTwitterProfileAvatar(url: string): boolean {
  const candidate = url.trim();
  if (!candidate) return false;
  return /^https?:\/\/pbs\.twimg\.com\/profile_images\//i.test(candidate);
}

function hasTwitterMediaItems(items: MockItem[]): boolean {
  return items.some((item) => {
    if (!item.mediaType) return false;
    if (item.mediaType === 'video') return Boolean(item.mediaUrl);
    return Boolean(item.mediaUrl || (item.mediaUrls && item.mediaUrls.length > 0));
  });
}

function hasTwitterMedia(item: MockItem): boolean {
  if (item.mediaType === 'video') return Boolean(item.mediaUrl);
  if (item.mediaType === 'image') {
    return Boolean(item.mediaUrl || (item.mediaUrls && item.mediaUrls.length > 0));
  }
  return false;
}

function linkToSeedPayload(entry: InternetLink, now = Date.now()): InternetSitePayload {
  return {
    siteId: entry.id,
    profile: {
      name: entry.mock.profileName,
      handle: entry.mock.profileHandle,
      avatarUrl: entry.mock.avatarUrl,
      bio: entry.mock.bio,
    },
    stats: cloneMockStats(entry.mock.stats),
    items: cloneMockItems(entry.mock.items),
    updatedAt: now,
    freshnessStatus: 'STATIC',
    sourceStatus: 'OK',
  };
}

function mergeLinkWithPayload(entry: InternetLink, payload: InternetSitePayload | undefined): InternetLink {
  if (!payload) return entry;

  const mergedStats = payload.stats.length ? cloneMockStats(payload.stats) : cloneMockStats(entry.mock.stats);
  let mergedItems = payload.items.length ? cloneMockItems(payload.items) : cloneMockItems(entry.mock.items);
  let mergedAvatarUrl = payload.profile.avatarUrl || entry.mock.avatarUrl;

  if (entry.id === 'twitter') {
    if (!isLikelyTwitterProfileAvatar(mergedAvatarUrl)) {
      mergedAvatarUrl = entry.mock.avatarUrl;
    }
    if (!mergedItems.length) {
      mergedItems = cloneMockItems(entry.mock.items);
    } else if (!hasTwitterMediaItems(mergedItems)) {
      const mediaBackfill = cloneMockItems(entry.mock.items)
        .filter((item) => hasTwitterMedia(item))
        .slice(0, 6)
        .map((item, index) => ({
          ...item,
          id: `twitter-seed-media-${index}-${item.id}`,
        }));
      mergedItems = [...mergedItems, ...mediaBackfill];
    }
  }

  return {
    ...entry,
    mock: {
      ...entry.mock,
      profileName: payload.profile.name || entry.mock.profileName,
      profileHandle: payload.profile.handle || entry.mock.profileHandle,
      bio: payload.profile.bio || entry.mock.bio,
      avatarUrl: mergedAvatarUrl,
      stats: mergedStats,
      items: mergedItems,
    },
  };
}

function twitterPostKind(item: MockItem): 'original' | 'retweet' | 'quote' {
  if (item.postKind === 'original' || item.postKind === 'retweet' || item.postKind === 'quote') return item.postKind;
  if (item.quote?.text) return 'quote';
  if (/^retweet:\s*/i.test(item.title)) return 'retweet';
  if (/^rt\s+@/i.test(item.title)) return 'retweet';
  if (/\bretweet\b/i.test(item.meta)) return 'retweet';
  if (/\brepost(ed)?\b/i.test(item.meta)) return 'retweet';
  return 'original';
}

function twitterPostHandle(item: MockItem, fallbackHandle: string): string {
  if (twitterPostKind(item) !== 'retweet') return fallbackHandle;
  const source = item.sourceHandle?.trim();
  if (!source) return fallbackHandle;
  return source.startsWith('@') ? source : `@${source}`;
}

function twitterPostLabel(item: MockItem): string {
  const kind = twitterPostKind(item);
  if (kind === 'retweet') return 'Retweet';
  if (kind === 'quote') return 'Quote';
  return 'You';
}

function twitterPostTitle(item: MockItem): string {
  const base = item.title.trim();
  if (twitterPostKind(item) !== 'retweet') return base;
  const withoutNamedPrefix = base.replace(/^retweet:\s*/i, '').trim();
  const withoutRtPrefix = withoutNamedPrefix.replace(/^RT\s+@[A-Za-z0-9_]+\s*:?\s*/i, '').trim();
  return withoutRtPrefix || base;
}

function handleTweetVideoClick(event: MouseEvent): void {
  const target = event.currentTarget;
  if (!(target instanceof HTMLVideoElement)) return;

  const root = mockContentRef.value;
  if (root) {
    const otherVideos = [...root.querySelectorAll('.mock-tweet-video')]
      .filter((video): video is HTMLVideoElement => video instanceof HTMLVideoElement && video !== target);
    for (const video of otherVideos) {
      if (!video.paused) video.pause();
      video.muted = true;
    }
  }

  if (target.muted) {
    target.muted = false;
    if (target.volume <= 0.05) target.volume = 0.8;
  }

  if (target.paused) {
    void target.play().catch(() => {
      // Ignore autoplay/interaction rejections; controls still allow manual play.
    });
  }
}

const portalEntries: PortalEntry[] = [
  { id: 'twitter', label: 'Social Media', icon: '/internet/icon_tweeter.png', flagged: true, iconSize: 50 },
  { id: 'steam', label: 'Vanity Search', icon: '/internet/icon_vanitysearch.png', flagged: true, iconSize: 56 },
  { id: 'youtube', label: 'Video Streaming', icon: '/internet/icon_stream.png', flagged: true, iconSize: 58 },
  { id: 'lastfm', label: '/st/', icon: '/internet/icon_st.png', flagged: true, iconSize: 50 },
  { id: 'spotify', label: 'Dinder', icon: '/internet/icon_dinder.png', iconSize: 56 },
];

const browserState = ref<BrowserState>('portal');
const activeLinkId = ref<InternetSiteId | null>(null);
const loadProgress = ref(0);
const loadingLine = ref('Initializing browser session...');
const spotifyPreviewEmbedUrl = ref<string | null>(null);
const spotifyPreviewExternalUrl = ref<string | null>(null);
const spotifyPreviewTitle = ref('');
const mockContentRef = ref<HTMLElement | null>(null);
const twitterLayoutRef = ref<HTMLElement | null>(null);
const twitterProfileCardRef = ref<HTMLElement | null>(null);
const twitterProfileCardOpen = ref(false);
const twitterProfileCardAnchor = ref({ left: 16, top: 16 });

const twitterProfileCardStyle = computed<Record<string, string>>(() => ({
  left: `${twitterProfileCardAnchor.value.left}px`,
  top: `${twitterProfileCardAnchor.value.top}px`,
}));

const resolvedLinkEntries = computed(() =>
  linkEntries.map((entry) => mergeLinkWithPayload(entry, internetStore.payloads[entry.id])),
);

const activeLink = computed<InternetLink | null>(() => {
  if (!activeLinkId.value) return null;
  return resolvedLinkEntries.value.find((entry) => entry.id === activeLinkId.value) ?? null;
});

const activePayload = computed(() => {
  if (!activeLinkId.value) return null;
  return internetStore.payloads[activeLinkId.value] ?? null;
});

const activeRefreshState = computed(() => {
  if (!activeLinkId.value) return null;
  return internetStore.refreshStates[activeLinkId.value];
});

let progressTimer: number | null = null;
let minLoadTimer: number | null = null;
let completionTimer: number | null = null;
let loadSequence = 0;
let twitterProfileCardDocCleanup: (() => void) | null = null;

function clearTimer(refValue: 'progress' | 'min' | 'complete') {
  if (refValue === 'progress' && progressTimer !== null) {
    window.clearInterval(progressTimer);
    progressTimer = null;
  }
  if (refValue === 'min' && minLoadTimer !== null) {
    window.clearTimeout(minLoadTimer);
    minLoadTimer = null;
  }
  if (refValue === 'complete' && completionTimer !== null) {
    window.clearTimeout(completionTimer);
    completionTimer = null;
  }
}

function clearAllTimers() {
  clearTimer('progress');
  clearTimer('min');
  clearTimer('complete');
}

function clearTwitterProfileCardDocListeners(): void {
  if (!twitterProfileCardDocCleanup) return;
  twitterProfileCardDocCleanup();
  twitterProfileCardDocCleanup = null;
}

function closeTwitterProfileCard(): void {
  twitterProfileCardOpen.value = false;
}

function positionTwitterProfileCard(anchorRect: DOMRect): void {
  const layout = twitterLayoutRef.value;
  if (!layout) return;

  const layoutRect = layout.getBoundingClientRect();
  const cardEl = twitterProfileCardRef.value;
  const cardWidth = cardEl?.offsetWidth ?? Math.min(460, Math.max(280, layoutRect.width - 16));
  const cardHeight = cardEl?.offsetHeight ?? 320;
  const gap = 10;
  const inset = 8;

  let left = anchorRect.left - layoutRect.left + anchorRect.width + gap;
  const leftLimit = Math.max(inset, layoutRect.width - cardWidth - inset);
  if (left > leftLimit) {
    left = anchorRect.left - layoutRect.left - cardWidth - gap;
  }
  left = Math.max(inset, Math.min(leftLimit, left));

  let top = anchorRect.top - layoutRect.top - 6;
  const topLimit = Math.max(inset, layoutRect.height - cardHeight - inset);
  top = Math.max(inset, Math.min(topLimit, top));

  twitterProfileCardAnchor.value = {
    left: Math.round(left),
    top: Math.round(top),
  };
}

async function toggleTwitterProfileCard(event: MouseEvent): Promise<void> {
  const trigger = event.currentTarget;
  if (!(trigger instanceof HTMLElement)) return;

  if (twitterProfileCardOpen.value) {
    closeTwitterProfileCard();
    return;
  }

  twitterProfileCardOpen.value = true;
  await nextTick();
  positionTwitterProfileCard(trigger.getBoundingClientRect());
}

function clampLoadWaitMs(value: unknown, fallback = DEFAULT_LOAD_WAIT_MS): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(MAX_LOAD_WAIT_MS, Math.round(parsed)));
}

function pickLoadingLine(progress: number): string {
  if (progress < 24) return 'Resolving host name...';
  if (progress < 49) return 'Negotiating secure tunnel...';
  if (progress < 72) return 'Composing mock profile shell...';
  if (progress < 90) return 'Binding interactive controls...';
  return 'Finalizing render...';
}

function startProgressTicker(sequence: number) {
  clearTimer('progress');
  progressTimer = window.setInterval(() => {
    if (sequence !== loadSequence) {
      clearTimer('progress');
      return;
    }
    const increment = 2 + Math.floor(Math.random() * 7);
    loadProgress.value = Math.min(92, loadProgress.value + increment);
    loadingLine.value = pickLoadingLine(loadProgress.value);
  }, 120);
}

function finishLoading(sequence: number) {
  if (sequence !== loadSequence) return;
  clearTimer('progress');
  loadProgress.value = 100;
  loadingLine.value = 'Mock page ready. Rendering...';
  clearTimer('complete');
  completionTimer = window.setTimeout(() => {
    if (sequence !== loadSequence) return;
    browserState.value = 'preview';
  }, 180);
}

function resolveLinkById(linkId: InternetSiteId): InternetLink | null {
  return (
    resolvedLinkEntries.value.find((candidate) => candidate.id === linkId)
    ?? linkEntries.find((candidate) => candidate.id === linkId)
    ?? null
  );
}

async function openLink(linkId: InternetSiteId) {
  const entry = resolveLinkById(linkId);
  if (!entry) return;

  const sequence = ++loadSequence;
  activeLinkId.value = linkId;
  if (linkId !== 'spotify') {
    spotifyPreviewEmbedUrl.value = null;
    spotifyPreviewExternalUrl.value = null;
    spotifyPreviewTitle.value = '';
  }
  browserState.value = 'loading';
  loadProgress.value = 4;
  loadingLine.value = 'Initializing browser session...';
  clearAllTimers();
  startProgressTicker(sequence);
  const refreshTask = internetStore.refreshSite(linkId);
  const configuredDelayMs = clampLoadWaitMs(entry.loadWaitMs ?? DEFAULT_LOAD_WAIT_MS, DEFAULT_LOAD_WAIT_MS);
  const minDelayMs = Math.max(950 + Math.floor(Math.random() * 700), configuredDelayMs);

  const minDelayTask = new Promise<void>((resolve) => {
    minLoadTimer = window.setTimeout(() => {
      minLoadTimer = null;
      resolve();
    }, minDelayMs);
  });
  const [initialRefreshSuccess] = await Promise.all([refreshTask, minDelayTask]);
  let refreshSuccess = initialRefreshSuccess;

  if (!refreshSuccess && sequence === loadSequence) {
    loadingLine.value = 'Live source unavailable, retrying...';
    loadProgress.value = Math.max(loadProgress.value, 87);
    const retries = linkId === 'twitter' ? 3 : 1;
    for (let attempt = 0; attempt < retries; attempt += 1) {
      if (attempt > 0) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 650);
        });
      }
      refreshSuccess = await internetStore.refreshSite(linkId);
      if (refreshSuccess) break;
    }
  }

  if (sequence !== loadSequence) return;
  finishLoading(sequence);
}

function goPortal() {
  ++loadSequence;
  clearAllTimers();
  browserState.value = 'portal';
  activeLinkId.value = null;
  spotifyPreviewEmbedUrl.value = null;
  spotifyPreviewExternalUrl.value = null;
  spotifyPreviewTitle.value = '';
  loadProgress.value = 0;
  loadingLine.value = 'Ready.';
}

function reloadActiveLink() {
  if (!activeLinkId.value) return;
  internetStore.triggerSiteRefresh(activeLinkId.value);
}

function openExternalCurrent(action = 'link') {
  if (!activeLink.value) return;
  openExternalUrlWithFallback(activeLink.value.url, `${activeLink.value.mock.siteName} ${action}`);
}

function openLinkById(linkId: InternetSiteId) {
  void openLink(linkId);
}

function parseSpotifyEntity(linkUrl: string): { type: string; id: string } | null {
  try {
    const parsed = new URL(linkUrl);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length < 2) return null;
    const type = segments[0];
    const id = segments[1];
    if (!type || !id) return null;
    return { type, id };
  } catch {
    return null;
  }
}

function spotifySearchQuery(item: MockItem): string {
  const metaArtist = item.meta.split('•')[0]?.trim() || '';
  return `${item.title} ${metaArtist}`.trim();
}

function resolveSpotifyPlaylistEmbedUrl(): string {
  const fallbackId = '1Cim4pZnFmNXD8N4OtO3wz';
  const activeUrl = activeLink.value?.url || '';
  const parsed = activeUrl ? parseSpotifyEntity(activeUrl) : null;
  const playlistId = parsed?.type === 'playlist' ? parsed.id : fallbackId;
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
}

function resolveSpotifyEmbedUrl(item: MockItem): string {
  if (item.linkUrl) {
    const parsed = parseSpotifyEntity(item.linkUrl);
    if (parsed && ['track', 'album', 'playlist', 'artist'].includes(parsed.type)) {
      return `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`;
    }
  }
  return resolveSpotifyPlaylistEmbedUrl();
}

function openSpotifyTrackPreview(item: MockItem): void {
  spotifyPreviewEmbedUrl.value = resolveSpotifyEmbedUrl(item);
  spotifyPreviewExternalUrl.value = item.linkUrl || `https://open.spotify.com/search/${encodeURIComponent(spotifySearchQuery(item))}`;
  spotifyPreviewTitle.value = item.title;
}

function openSpotifyPreviewExternal(): void {
  if (!spotifyPreviewExternalUrl.value) {
    openExternalCurrent('Open Playlist');
    return;
  }
  openExternalUrlWithFallback(spotifyPreviewExternalUrl.value, `${activeLink.value?.mock.siteName ?? 'Spotify'} preview`);
}

function mockSiteStyle(link: InternetLink): Record<string, string> {
  const styles: Record<string, string> = {
    '--mock-accent': link.accent,
    '--mock-gradient': link.mock.themeGradient,
  };
  return styles;
}

function portalRowStyle(entry: PortalEntry): Record<string, string> {
  return {
    '--portal-icon-size': `${entry.iconSize ?? 54}px`,
  };
}

const lastfmBarWidths = ['92%', '78%', '64%', '52%'];

function lastfmBarWidth(index: number): string {
  return lastfmBarWidths[index % lastfmBarWidths.length] ?? '52%';
}

function spotifyTrackIndex(index: number): string {
  return String(index + 1).padStart(2, '0');
}

function formatFreshness(status: InternetFreshnessStatus): string {
  switch (status) {
    case 'LIVE':
      return 'Live';
    case 'UPDATED':
      return 'Updated';
    case 'CACHED':
      return 'Cached';
    case 'STATIC':
    default:
      return 'Static';
  }
}

function formatSource(source: InternetSourceStatus): string {
  switch (source) {
    case 'OK':
      return 'Source OK';
    case 'PARTIAL':
      return 'Fallback';
    case 'FAILED':
      return 'Offline';
    default:
      return 'Unknown';
  }
}

const activeStatusBadge = computed<ActiveStatusBadge | null>(() => {
  if (!activeLink.value) return null;

  const refreshState = activeRefreshState.value;
  if (refreshState?.showRefreshBadge) {
    return {
      label: 'Syncing...',
      compactLabel: 'Syncing',
      className: 'status-badge--refreshing',
      title: 'Fetching latest profile data.',
    };
  }

  const freshnessStatus = activePayload.value?.freshnessStatus ?? 'STATIC';
  const sourceStatus = activePayload.value?.sourceStatus ?? 'OK';
  const freshnessLabel = formatFreshness(freshnessStatus);
  const sourceLabel = formatSource(sourceStatus);
  const updatedAt = activePayload.value
    ? new Date(activePayload.value.updatedAt).toLocaleTimeString()
    : 'seed data';
  const errorDetail = refreshState?.errorMessage ? ` • ${refreshState.errorMessage}` : '';

  return {
    label: `${freshnessLabel} • ${sourceLabel}`,
    compactLabel: freshnessLabel,
    className: `status-badge--${freshnessStatus.toLowerCase()} status-badge--source-${sourceStatus.toLowerCase()}`,
    title: `${freshnessLabel} / ${sourceLabel} • ${updatedAt}${errorDetail}`,
  };
});

const lastfmStatusBadge = computed<ActiveStatusBadge | null>(() => {
  if (activeLink.value?.id !== 'lastfm') return null;
  return activeStatusBadge.value;
});

const currentUrl = computed(() => {
  if (!activeLink.value) return PORTAL_URL;
  return activeLink.value.url;
});

watch(
  [() => browserState.value, () => activeLink.value?.id],
  ([state, activeId]) => {
    if (state === 'preview' && activeId === 'twitter') return;
    closeTwitterProfileCard();
  },
  { flush: 'post' },
);

watch(
  () => twitterProfileCardOpen.value,
  (isOpen) => {
    clearTwitterProfileCardDocListeners();
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (twitterProfileCardRef.value?.contains(target)) return;
      if ((target as Element).closest('.mock-tweet-avatar-trigger')) return;
      closeTwitterProfileCard();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      closeTwitterProfileCard();
    };

    const onResize = () => {
      closeTwitterProfileCard();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onEscape);
    window.addEventListener('resize', onResize);
    twitterProfileCardDocCleanup = () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onEscape);
      window.removeEventListener('resize', onResize);
    };
  },
);

onMounted(() => {
  const seededAt = Date.now();
  for (const siteId of INTERNET_SITE_IDS) {
    const entry = linkEntries.find((candidate) => candidate.id === siteId);
    if (!entry) continue;

    if (!internetStore.payloads[siteId]) {
      internetStore.seedPayload(linkToSeedPayload(entry, seededAt));
    }
    internetStore.startAutoRefresh(siteId);
  }

  if (props.initialSiteId && INTERNET_SITE_IDS.includes(props.initialSiteId)) {
    void openLink(props.initialSiteId);
  }
});

onBeforeUnmount(() => {
  clearAllTimers();
  clearTwitterProfileCardDocListeners();
  internetStore.stopAllAutoRefresh();
});
</script>

<style scoped>
.internet-app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #d5cfdf;
  color: #362ec6;
  font-family: var(--font-ui);
  overflow: hidden;
}

.internet-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-bottom: 2px solid #6234cd;
  background: #efcfef;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-button {
  font-family: var(--font-ui);
  font-size: 10px;
  line-height: 1;
  min-width: 56px;
  min-height: 20px;
  padding: 2px 8px;
  border: 1px solid;
  border-top-color: #ffffff;
  border-left-color: #ffffff;
  border-right-color: #4b4b4b;
  border-bottom-color: #4b4b4b;
  box-shadow: inset 1px 1px 0 #dcdcdc, inset -1px -1px 0 #808080;
  background: #c0c0c0;
  color: #1c1c1c;
  cursor: pointer;
}

.toolbar-button:hover:not(:disabled) {
  background: #c8c8c8;
}

.toolbar-button:active:not(:disabled) {
  border-top-color: #4b4b4b;
  border-left-color: #4b4b4b;
  border-right-color: #ffffff;
  border-bottom-color: #ffffff;
  box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 #dcdcdc;
  background: #b6b6b6;
}

.toolbar-button:disabled {
  color: #6d6d6d;
  background: #c6c6c6;
  cursor: default;
}

.address-bar {
  flex: 1;
  min-width: 0;
  border: 1px solid #6234cd;
  background: #f6f0fa;
  padding: 3px 5px;
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.status-badge {
  flex: 0 0 auto;
  max-width: 160px;
  padding: 2px 6px;
  border: 1px solid #5533be;
  background: #efe9ff;
  color: #3824a8;
  font-size: 9px;
  line-height: 1.2;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge--refreshing {
  border-color: #6d4bd4;
  background: #f7f2ff;
  color: #4b2eb8;
}

.status-badge--live {
  border-color: #1f8a5d;
  background: #dcffe8;
  color: #115a3b;
}

.status-badge--updated {
  border-color: #4e79c9;
  background: #e6f0ff;
  color: #244b9c;
}

.status-badge--cached {
  border-color: #8d6a2e;
  background: #fff4dc;
  color: #6f4f1a;
}

.status-badge--static {
  border-color: #7254c6;
  background: #f0e8ff;
  color: #4d3799;
}

.status-badge--source-failed {
  box-shadow: inset 0 0 0 1px rgba(146, 31, 44, 0.5);
}

.internet-body {
  position: relative;
  flex: 1;
  overflow: hidden;
  background: #cad2e4;
}

.portal-screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 14px 10px;
  background: #e7b2eb url('/internet/internet_base.png') center / cover no-repeat;
}

.portal-header {
  --portal-star-size: 192px;
  --portal-logo-width: calc(228px * var(--portal-logo-scale, 1));
  --portal-star-overlap: 22px;
  width: 100%;
  min-height: calc(52px * var(--portal-logo-scale, 1));
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 7px;
  margin-bottom: 11px;
}

.portal-logo {
  --portal-logo-scale: 1;
  position: relative;
  width: calc(228px * var(--portal-logo-scale));
  height: calc(52px * var(--portal-logo-scale));
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.portal-star {
  width: var(--portal-star-size);
  height: var(--portal-star-size);
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  object-fit: contain;
  image-rendering: pixelated;
  pointer-events: none;
}

.portal-star--left {
  left: calc(50% - (var(--portal-logo-width) / 2) - var(--portal-star-size) + var(--portal-star-overlap));
}

.portal-star--right {
  right: calc(50% - (var(--portal-logo-width) / 2) - var(--portal-star-size) + var(--portal-star-overlap));
}

.portal-title {
  margin: 0;
  font-size: calc(61px * var(--portal-logo-scale));
  line-height: 0.84;
  letter-spacing: 0.45px;
  visibility: hidden;
}

.portal-title-sprite {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(228px * var(--portal-logo-scale));
  height: calc(48px * var(--portal-logo-scale));
  transform: translate(-50%, -50%);
  object-fit: contain;
  image-rendering: pixelated;
  pointer-events: none;
}

.portal-list {
  width: 100%;
  max-width: 430px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.portal-row {
  width: 100%;
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) auto;
  align-items: center;
  min-height: 56px;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  color: #3f31c4;
  text-align: left;
  cursor: pointer;
}

.portal-row:hover .portal-row-text {
  color: #2d20ab;
}

.portal-row-icon-wrap {
  position: relative;
  width: 70px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portal-row-icon {
  width: var(--portal-icon-size, 54px);
  height: var(--portal-icon-size, 54px);
  object-fit: contain;
  image-rendering: pixelated;
}

.portal-row-badge {
  position: absolute;
  top: 3px;
  right: 7px;
  width: 16px;
  height: 16px;
  border: 1px solid #5544cc;
  border-radius: 50%;
  background: #fff16b;
  color: #5544cc;
  font-size: 11px;
  line-height: 14px;
  text-align: center;
}

.portal-row-line {
  border-bottom: 2px solid rgba(115, 74, 140, 0.65);
  transform: translateY(8px);
}

.portal-row-text {
  min-width: 0;
  font-size: 17px;
  line-height: 1;
  color: #4a3cc8;
  letter-spacing: 0.18px;
  transform: translateY(8px);
  white-space: nowrap;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.35);
}

.loading-panel {
  width: 100%;
  height: 100%;
  padding: 14px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.loading-title {
  font-size: 13px;
  line-height: 1;
}

.loading-line {
  font-size: 10px;
  line-height: 1.3;
  min-height: 14px;
}

.loading-bar {
  width: 100%;
  height: 14px;
  border: 1px solid #6234cd;
  background: #edf3ff;
  overflow: hidden;
}

.loading-fill {
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    #6d5bda 0 8px,
    #9bc8ff 8px 16px
  );
}

.preview-panel {
  position: absolute;
  inset: 0;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(circle at 22% 14%, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0) 43%),
    linear-gradient(180deg, #b2c0d8 0%, #8ea2c1 100%);
}

.mock-site {
  --mock-accent: #4f6dbb;
  --mock-gradient: linear-gradient(135deg, #203f6f 0%, #5a82d3 60%, #8ec7ff 100%);
  width: 100%;
  height: 100%;
  min-height: 0;
  margin: 0;
  border: none;
  background: transparent;
  color: #13243d;
  box-shadow: none;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.mock-site--twitter {
  --twitter-nso-pink: #ff6fcf;
  --twitter-nso-cyan: #69c8ff;
  --twitter-nso-ink: #312656;
  position: relative;
  background:
    radial-gradient(circle at 18% 12%, rgba(255, 201, 236, 0.34), rgba(255, 201, 236, 0) 36%) no-repeat,
    radial-gradient(circle at 82% 18%, rgba(173, 225, 255, 0.3), rgba(173, 225, 255, 0) 44%) no-repeat,
    linear-gradient(165deg, rgba(255, 215, 242, 0.24) 0%, rgba(245, 216, 255, 0.2) 24%, rgba(215, 235, 255, 0.2) 62%, rgba(255, 211, 248, 0.2) 100%) no-repeat,
    url('/tweeter/result_background_tile.png') center top / cover no-repeat,
    #ececf5;
  color: var(--twitter-nso-ink);
  overflow: hidden;
}

.mock-site--twitter::before {
  content: none;
}

.mock-site--twitter::after {
  content: none;
}

.mock-site--twitter .mock-content {
  position: relative;
  z-index: 1;
  border: none;
  background: transparent;
}

.mock-site--twitter,
.mock-site--twitter *,
.mock-site--twitter *::before,
.mock-site--twitter *::after {
  animation: none !important;
  transition: none !important;
}

.mock-site--steam {
  background: #d7e9fb;
}

.mock-site--steam .mock-content {
  border: none;
  background: transparent;
}

.mock-site--youtube {
  background: #fff4f5;
}

.mock-site--youtube .mock-content {
  border: none;
  background: transparent;
}

.mock-site--lastfm {
  background: #fff5f5;
}

.mock-site--lastfm .mock-content {
  border: none;
  background: transparent;
}

.mock-site--spotify {
  background: #112017;
  color: #ddf8e7;
}

.mock-site--spotify .mock-content {
  border: none;
  background: transparent;
}

.mock-browser-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.mock-browser-control {
  min-height: 24px;
  border: 1px solid #1f334f;
  background: #e0ebff;
  color: #1d2f4d;
  font-family: var(--font-ui);
  font-size: 10px;
  cursor: pointer;
}

.mock-browser-control:hover {
  background: #d3e3ff;
}

.mock-browser-control:active {
  background: #c3d8ff;
}

.mock-content {
  border: none;
  background: transparent;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.mock-brand-bar {
  min-height: 38px;
  border: 1px solid #243e63;
  background: linear-gradient(180deg, #fefeff 0%, #dbe8ff 100%);
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mock-brand-left {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 7px;
}

.mock-brand-icon {
  width: 20px;
  height: 20px;
  image-rendering: pixelated;
  object-fit: contain;
  border: 1px solid #2b446e;
  background: rgba(255, 255, 255, 0.65);
  padding: 2px;
}

.mock-brand-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mock-brand-title {
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.2px;
}

.mock-brand-handle {
  font-size: 9px;
  line-height: 1;
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-brand-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.mock-overdose-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #6a5db2;
  background: linear-gradient(180deg, #f8d3ff 0%, #e9b8ff 100%);
  color: #4f3391;
  font-size: 9px;
  line-height: 1;
  padding: 2px 6px;
  white-space: nowrap;
}

.mock-overdose-tag img {
  width: 12px;
  height: 12px;
  object-fit: contain;
  image-rendering: pixelated;
}

.mock-overdose-tag::before {
  content: '';
  width: 12px;
  height: 12px;
  background: url('/internet/icon_flame.png') center / contain no-repeat;
  image-rendering: pixelated;
}

.mock-layout {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.mock-panel {
  border: 1px solid #2b446e;
  background: #f8fbff;
  padding: 8px;
}

.mock-mini-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
  image-rendering: pixelated;
  flex: 0 0 14px;
}

.mock-tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mock-tab-button {
  min-height: 22px;
  border: 1px solid #2b446e;
  background: #edf4ff;
  color: #1b3255;
  font-family: var(--font-ui);
  font-size: 10px;
  padding: 0 8px;
  cursor: pointer;
}

.mock-tab-button:hover {
  background: #e2edff;
}

.mock-tab-button:active {
  background: #d8e7ff;
}

.mock-layout--twitter {
  --twitter-feed-target-width: 656px;
  container-type: inline-size;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  flex: 0 0 auto;
  min-height: auto;
  background: transparent;
}

.mock-twitter-profile {
  position: relative;
  width: min(460px, calc(100% - 16px));
  min-width: 0;
  max-height: none;
  min-height: auto;
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(188px, 250px);
  align-items: stretch;
  gap: 10px;
  padding: 11px 11px 12px;
  border: none;
  background: linear-gradient(
    180deg,
    rgba(255, 238, 250, 0.98) 0%,
    rgba(237, 244, 253, 0.96) 72%,
    rgba(236, 239, 248, 0.96) 100%
  );
  box-shadow: none;
  overflow: hidden;
  opacity: 1;
  transform: none;
  z-index: 3;
  isolation: isolate;
}

.mock-twitter-profile-card {
  position: absolute !important;
  z-index: 8;
  box-shadow:
    0 14px 30px rgba(40, 29, 77, 0.22),
    0 4px 12px rgba(40, 29, 77, 0.12);
  animation: twitter-profile-pop 130ms ease-out;
}

.mock-twitter-profile::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 12% 12%, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0) 32%),
    linear-gradient(180deg, rgba(255, 143, 219, 0.28), rgba(118, 206, 255, 0.24)),
    url('/internet/internet_base.png') left top / 190px 190px repeat;
  background-size: auto, auto, 190px 190px;
  opacity: 1;
  pointer-events: none;
}

.mock-twitter-profile::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 86% 82%, rgba(125, 189, 255, 0.52), rgba(125, 189, 255, 0) 44%);
  mix-blend-mode: screen;
  opacity: 0.22;
  pointer-events: none;
}

.mock-twitter-profile > * {
  position: relative;
  z-index: 1;
}

.mock-social-profile-main {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.mock-twitter-profile-main {
  justify-content: center;
}

.mock-twitter-profile-stats {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.mock-twitter-profile-header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}

.mock-twitter-profile .mock-avatar-button {
  width: 88px;
  height: 88px;
  padding: 4px;
  border: 2px solid var(--twitter-nso-pink);
  background: linear-gradient(180deg, #fff8fe 0%, #e8f5ff 100%);
  box-shadow:
    0 0 0 2px rgba(105, 200, 255, 0.55) inset,
    0 5px 18px rgba(56, 42, 106, 0.24);
}

.mock-twitter-profile .mock-avatar-button:hover {
  transform: translateY(-2px);
}

.mock-twitter-identity {
  min-width: 0;
}

.mock-twitter-profile .mock-profile-name {
  font-size: 22px;
  line-height: 0.95;
  letter-spacing: 0.2px;
  font-weight: 700;
  color: #4a2f83;
  text-shadow: 1px 1px 0 rgba(255, 255, 255, 0.72);
}

.mock-twitter-profile .mock-profile-handle {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.08;
  color: #3760ad;
  opacity: 0.95;
  display: block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-profile-bio--twitter {
  margin: 4px 0 0;
  font-size: 15px;
  line-height: 1.24;
  color: #3d3764;
  opacity: 0.95;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.mock-twitter-divider {
  height: 1px;
  background:
    linear-gradient(90deg, rgba(255, 113, 205, 0), rgba(255, 113, 205, 0.75), rgba(109, 198, 255, 0.75), rgba(109, 198, 255, 0));
}

.mock-stats.mock-stats--twitter {
  margin-top: 0;
  padding-top: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: flex-start;
}

.mock-stats.mock-stats--twitter .mock-stat--twitter {
  min-height: 0;
  border: none;
  border-bottom: 1px solid rgba(133, 132, 182, 0.45);
  background: linear-gradient(180deg, rgba(255, 244, 251, 0.82), rgba(233, 245, 255, 0.86));
  padding: 2px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  color: #40386d;
  text-align: center;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.5) inset;
}

.mock-stats.mock-stats--twitter .mock-stat--twitter:hover {
  background: linear-gradient(180deg, rgba(255, 225, 246, 0.9), rgba(221, 241, 255, 0.94));
}

.mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-label {
  margin: 0;
  font-size: 11px;
  line-height: 1.05;
  letter-spacing: 0.12px;
  color: #5a3f96;
  opacity: 1;
  text-transform: none;
  text-align: center;
}

.mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-value {
  font-size: 11px;
  line-height: 1.05;
  letter-spacing: 0.12px;
  color: #2f4f95;
  font-weight: 700;
  text-align: center;
}

.mock-twitter-feed {
  position: relative;
  z-index: 1;
  min-height: auto;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-right: 0;
  width: 100%;
  max-width: min(100%, var(--twitter-feed-target-width));
  background: #f4f4f4;
  margin-inline: auto;
}

@keyframes twitter-profile-pop {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@container (max-width: 760px) {
  .mock-twitter-profile {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px;
  }

  .mock-twitter-profile-main,
  .mock-twitter-profile-stats {
    justify-content: flex-start;
  }

  .mock-twitter-profile .mock-avatar-button {
    width: 88px;
    height: 88px;
  }

  .mock-twitter-profile .mock-profile-name {
    font-size: 22px;
    line-height: 1;
  }

  .mock-twitter-profile .mock-profile-handle {
    font-size: 13px;
    white-space: nowrap;
  }

  .mock-profile-bio--twitter {
    font-size: 14px;
    line-height: 1.22;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter {
    gap: 1px;
    padding: 2px 3px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-label {
    font-size: 10px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-value {
    font-size: 10px;
    line-height: 1.05;
  }
}

@container (max-width: 520px) {
  .mock-twitter-profile-header {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 8px;
  }

  .mock-twitter-profile .mock-avatar-button {
    width: 76px;
    height: 76px;
  }

  .mock-twitter-profile .mock-profile-name {
    font-size: 19px;
  }

  .mock-twitter-profile .mock-profile-handle {
    font-size: 12px;
    white-space: nowrap;
  }

  .mock-profile-bio--twitter {
    font-size: 13px;
  }

  .mock-stats.mock-stats--twitter {
    gap: 3px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter {
    gap: 1px;
    padding: 2px 2px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-label {
    font-size: 9px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-value {
    font-size: 9px;
    line-height: 1.05;
  }
}

.mock-tweet-card {
  border: none;
  border-radius: 0;
  background: transparent;
  color: #2f2b55;
  font-family: var(--font-ui);
  text-align: left;
  padding: 15px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  box-shadow: none;
}

.mock-tweet-card + .mock-tweet-card {
  border-top: 1px solid rgba(143, 144, 174, 0.45);
}

.mock-tweet-card:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: none;
}

.mock-tweet-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  line-height: 1.15;
  color: #4b4570;
  opacity: 0.98;
  flex-wrap: wrap;
}

.mock-tweet-author-name {
  font-size: 12px;
  color: #3f2f80;
  opacity: 1;
  font-weight: 700;
}

.mock-tweet-author-handle {
  color: #466cb4;
  opacity: 0.98;
}

.mock-tweet-self-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 111, 207, 0.85);
  object-fit: cover;
  background: #f7e7ff;
  flex: 0 0 44px;
}

.mock-tweet-avatar-trigger {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: pointer;
}

.mock-tweet-avatar-trigger:hover .mock-tweet-self-avatar {
  border-color: rgba(82, 170, 245, 0.95);
}

.mock-tweet-retweet-icon {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  min-height: 20px;
  padding: 1px 4px;
  border: 1px solid rgba(146, 123, 224, 0.82);
  background: linear-gradient(180deg, #f5eeff 0%, #ece6ff 100%);
  color: #5a4499;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.mock-tweet-retweet-icon .mock-mini-icon {
  width: 11px;
  height: 11px;
  flex: 0 0 11px;
}

.mock-tweet-kind-chip {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 18px;
  padding: 1px 6px;
  border: 1px solid rgba(126, 103, 201, 0.82);
  font-size: 9px;
  letter-spacing: 0.2px;
  font-weight: 700;
  text-transform: uppercase;
}

.mock-tweet-kind-chip--original {
  background: linear-gradient(180deg, #eefaff 0%, #dff4ff 100%);
  color: #29528d;
  border-color: #71a7d9;
}

.mock-tweet-kind-chip--retweet {
  background: linear-gradient(180deg, #f5f0ff 0%, #e8deff 100%);
  color: #62439f;
  border-color: #9a7ed3;
}

.mock-tweet-kind-chip--quote {
  background: linear-gradient(180deg, #ffeefe 0%, #f6e8ff 100%);
  color: #7a3f9b;
  border-color: #d08ccf;
}

.mock-tweet-card .mock-item-title {
  font-size: 14px;
  line-height: 1.34;
  color: #2e2752;
}

.mock-tweet-card .mock-item-meta {
  font-size: 11px;
  line-height: 1.25;
  color: #5c5d80;
}

.mock-tweet-quote-embed {
  border: 1px solid rgba(206, 141, 218, 0.8);
  background: linear-gradient(180deg, rgba(255, 242, 252, 0.9), rgba(236, 246, 255, 0.9));
  padding: 8px 9px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mock-tweet-quote-head {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-wrap: wrap;
}

.mock-tweet-quote-label {
  font-size: 9px;
  line-height: 1;
  font-weight: 700;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  color: #7d4b9d;
}

.mock-tweet-quote-handle {
  font-size: 10px;
  line-height: 1;
  color: #4f74b8;
}

.mock-tweet-quote-text {
  font-size: 12px;
  line-height: 1.35;
  color: #2f315b;
}

.mock-tweet-media {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mock-tweet-media--quote .mock-tweet-image,
.mock-tweet-media--quote .mock-tweet-video {
  max-height: 240px;
  border-color: #cc8ad6;
}

.mock-tweet-media--quote .mock-tweet-gallery-image {
  border-color: #cc8ad6;
}

.mock-tweet-image,
.mock-tweet-video {
  width: 100%;
  max-height: 360px;
  border: 1px solid #8cb0dc;
  background: #ebf4ff;
  object-fit: cover;
  display: block;
}

.mock-tweet-video {
  background: #0f1f36;
}

.mock-tweet-gallery {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.mock-tweet-gallery-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  border: 1px solid #9dbadf;
  object-fit: cover;
  display: block;
}

.mock-layout--steam {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock-steam-hero {
  border: 1px solid #2c456e;
  background: linear-gradient(160deg, #1a2d44 0%, #264f7d 62%, #4f9ed4 100%);
  color: #dff2ff;
  padding: 8px;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.mock-steam-hero .mock-avatar-button {
  width: 64px;
  height: 64px;
  border-color: #79a9d6;
  background: #0f2136;
}

.mock-steam-hero .mock-profile-name,
.mock-steam-hero .mock-profile-handle,
.mock-steam-hero .mock-profile-bio {
  color: #dff2ff;
}

.mock-steam-hero .mock-profile-handle {
  opacity: 0.86;
}

.mock-steam-hero .mock-profile-bio {
  margin-top: 5px;
  opacity: 0.86;
}

.mock-steam-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168px;
  gap: 8px;
}

.mock-item-card--steam {
  min-height: 62px;
  gap: 6px;
  background: linear-gradient(180deg, #f4f8ff 0%, #e7f2ff 100%);
}

.mock-stats--stacked {
  grid-template-columns: 1fr;
}

.mock-layout--youtube {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock-yt-toolbar {
  min-height: 32px;
  border: 1px solid #852a2f;
  background: linear-gradient(180deg, #f7f7f7 0%, #ececec 100%);
  padding: 5px 8px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
}

.mock-yt-search {
  border: 1px solid #b9b9b9;
  background: #ffffff;
  padding: 4px 7px;
  font-size: 10px;
  line-height: 1;
  color: #4d4d4d;
}

.mock-yt-channel {
  border: 1px solid #8b2f34;
  background: linear-gradient(180deg, #f9d3d5 0%, #f4ecec 70%, #ffffff 100%);
  padding: 8px;
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.mock-pill--hot {
  border-color: #94272b;
  color: #ffffff;
  background: linear-gradient(180deg, #eb5d61 0%, #cf373c 100%);
}

.mock-pill--hot:hover {
  background: linear-gradient(180deg, #ee666a 0%, #d04045 100%);
}

.mock-tab-row--yt .mock-tab-button {
  border-color: #c3c3c3;
  background: #f7f7f7;
  color: #2f2f2f;
}

.mock-item-grid--yt {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mock-item-card--yt {
  min-height: 146px;
  align-items: stretch;
  gap: 7px;
  padding: 6px;
  background: #ffffff;
}

.mock-yt-thumb {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid #9f9f9f;
  background:
    radial-gradient(circle at 76% 20%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0) 44%),
    linear-gradient(145deg, #7f131a 0%, #ca2d38 58%, #f8a4a5 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mock-yt-thumb img {
  width: 42px;
  height: 42px;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.26));
}

.mock-layout--lastfm {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock-lastfm-header {
  border: 1px solid #8b1f29;
  background: linear-gradient(180deg, #f5d6da 0%, #fff4f5 100%);
  padding: 7px 8px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
}

.mock-live-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 20px;
  padding: 0 6px;
  border: 1px solid #7d2867;
  background: #ffe1f3;
  color: #79206f;
  font-size: 9px;
  text-transform: uppercase;
  white-space: nowrap;
}

.mock-live-chip.status-badge--refreshing {
  border-color: #6d4bd4;
  background: #f7f2ff;
  color: #4b2eb8;
}

.mock-live-chip.status-badge--live {
  border-color: #1f8a5d;
  background: #dcffe8;
  color: #115a3b;
}

.mock-live-chip.status-badge--updated {
  border-color: #4e79c9;
  background: #e6f0ff;
  color: #244b9c;
}

.mock-live-chip.status-badge--cached {
  border-color: #8d6a2e;
  background: #fff4dc;
  color: #6f4f1a;
}

.mock-live-chip.status-badge--static {
  border-color: #7254c6;
  background: #f0e8ff;
  color: #4d3799;
}

.mock-lastfm-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mock-section-title {
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1;
  letter-spacing: 0.22px;
  color: #7f1e2f;
  text-transform: uppercase;
}

.mock-lastfm-bar {
  border: 1px solid #d5d5d5;
  background: #ffffff;
  color: #2f2f2f;
  padding: 4px 5px;
  margin-bottom: 4px;
  display: grid;
  grid-template-columns: minmax(68px, 92px) minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  font-family: var(--font-ui);
  cursor: pointer;
}

.mock-lastfm-bar:hover {
  background: #f9f9f9;
}

.mock-lastfm-bar:last-child {
  margin-bottom: 0;
}

.mock-lastfm-bar-label {
  font-size: 9px;
  line-height: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mock-lastfm-track {
  border: 1px solid #d8d8d8;
  background: #f4f4f4;
  height: 11px;
  display: block;
}

.mock-lastfm-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ac1d3b 0%, #df5a76 100%);
}

.mock-lastfm-value {
  font-size: 10px;
  line-height: 1;
  color: #7b1728;
}

.mock-lastfm-item {
  width: 100%;
  border: 1px solid #dbdbdb;
  background: #fff;
  color: #2f2f2f;
  padding: 6px 7px;
  margin-bottom: 4px;
  text-align: left;
  font-family: var(--font-ui);
  cursor: pointer;
}

.mock-lastfm-item:hover {
  background: #fafafa;
}

.mock-lastfm-item:last-child {
  margin-bottom: 0;
}

.mock-layout--spotify {
  display: grid;
  grid-template-columns: 134px minmax(0, 1fr);
  gap: 8px;
}

.mock-spotify-sidebar {
  border: 1px solid #1a1f1c;
  background: linear-gradient(180deg, #101714 0%, #1a2721 100%);
  padding: 8px 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mock-tab-button--spotify {
  width: 100%;
  justify-content: flex-start;
  border-color: #2b4037;
  background: rgba(255, 255, 255, 0.04);
  color: #d6f5e4;
  text-align: left;
}

.mock-tab-button--spotify:hover {
  background: rgba(141, 255, 197, 0.14);
}

.mock-spotify-main {
  border: 1px solid #21372d;
  background: linear-gradient(180deg, #1b2f26 0%, #14231d 100%);
  color: #e0ffe9;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mock-spotify-hero {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
}

.mock-spotify-hero .mock-avatar-button {
  width: 64px;
  height: 64px;
  border-color: #37644f;
  background: #101f19;
}

.mock-spotify-main .mock-profile-name,
.mock-spotify-main .mock-profile-handle,
.mock-spotify-main .mock-profile-bio {
  color: #e0ffe9;
}

.mock-spotify-main .mock-profile-handle {
  opacity: 0.85;
}

.mock-spotify-main .mock-profile-bio {
  margin-top: 5px;
  opacity: 0.85;
}

.mock-spotify-main .mock-stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.mock-spotify-main .mock-stat {
  border-color: #3c6954;
  background: rgba(255, 255, 255, 0.08);
  color: #e0ffe9;
}

.mock-spotify-main .mock-stat:hover {
  background: rgba(141, 255, 197, 0.14);
}

.mock-spotify-tracklist {
  border: 1px solid #2d4d3e;
  background: rgba(0, 0, 0, 0.22);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mock-spotify-track {
  border: 1px solid transparent;
  background: transparent;
  color: #e0ffe9;
  font-family: var(--font-ui);
  padding: 5px 6px;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) minmax(90px, auto);
  gap: 8px;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

.mock-spotify-track:hover {
  border-color: #43725d;
  background: rgba(149, 255, 201, 0.12);
}

.mock-spotify-index {
  font-size: 9px;
  line-height: 1;
  opacity: 0.75;
}

.mock-spotify-preview {
  border: 1px solid #2d4d3e;
  background: rgba(0, 0, 0, 0.26);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mock-spotify-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mock-spotify-preview-title {
  font-size: 10px;
  line-height: 1.2;
  color: #dfffe9;
}

.mock-spotify-preview-title strong {
  color: #8df3be;
}

.mock-pill--spotify-open {
  border-color: #3b6f57;
  background: #d5ffe6;
  color: #164430;
}

.mock-pill--spotify-open:hover {
  background: #beffd8;
}

.mock-spotify-embed {
  width: 100%;
  min-height: 152px;
  border: 1px solid #2d4d3e;
  background: #0f1d17;
}

.mock-banner {
  min-height: 58px;
  border: 1px solid #203657;
  background: var(--mock-gradient);
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.mock-site-label {
  font-size: 14px;
  line-height: 1;
  letter-spacing: 0.5px;
  color: #f5fbff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.24);
}

.mock-pill {
  min-height: 22px;
  padding: 0 10px;
  border: 1px solid #193151;
  background: #f7fcff;
  color: #193151;
  font-family: var(--font-ui);
  font-size: 10px;
  cursor: pointer;
}

.mock-pill:hover {
  background: #eff7ff;
}

.mock-profile-row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr) minmax(146px, 182px);
  gap: 8px;
  align-items: start;
}

.mock-avatar-button {
  width: 76px;
  height: 76px;
  border: 1px solid #203657;
  background: #ffffff;
  padding: 3px;
  cursor: pointer;
}

.mock-avatar-button:hover {
  background: #f2f7ff;
}

.mock-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.mock-profile-copy {
  min-width: 0;
  color: #1a2f50;
}

.mock-profile-name {
  margin: 0;
  font-size: 13px;
  line-height: 1;
}

.mock-profile-handle {
  margin: 3px 0 0;
  font-size: 10px;
  line-height: 1.2;
  opacity: 0.84;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mock-profile-bio {
  margin: 8px 0 0;
  font-size: 10px;
  line-height: 1.3;
}

.mock-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.mock-action-button {
  min-height: 22px;
  border: 1px solid color-mix(in srgb, var(--mock-accent) 70%, #162337 30%);
  background: color-mix(in srgb, var(--mock-accent) 20%, #f6fbff 80%);
  color: #192f4e;
  font-family: var(--font-ui);
  font-size: 10px;
  cursor: pointer;
}

.mock-action-button:hover {
  background: color-mix(in srgb, var(--mock-accent) 30%, #f1f8ff 70%);
}

.mock-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.mock-stat {
  min-height: 40px;
  border: 1px solid #28436f;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding: 4px 6px;
  color: #1a2f50;
  font-family: var(--font-ui);
  cursor: pointer;
}

.mock-stat:hover {
  background: #f1f7ff;
}

.mock-stat-value {
  font-size: 12px;
  line-height: 1;
}

.mock-stat-label {
  margin-top: 3px;
  font-size: 9px;
  line-height: 1;
  opacity: 0.85;
}

.mock-item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.mock-item-card {
  min-height: 44px;
  border: 1px solid #2b446e;
  background: #f8fbff;
  color: #1a2f50;
  font-family: var(--font-ui);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  text-align: left;
  cursor: pointer;
}

.mock-item-card:hover {
  background: #eef5ff;
}

.mock-item-title {
  font-size: 11px;
  line-height: 1;
}

.mock-item-meta {
  font-size: 9px;
  line-height: 1.2;
  opacity: 0.84;
}

.snapshot-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
}

@media (max-width: 880px) {
  .status-badge {
    max-width: 118px;
    font-size: 8px;
  }

  .portal-logo {
    --portal-logo-scale: 0.69;
  }

  .portal-list {
    gap: 9px;
  }

  .portal-row {
    grid-template-columns: 50px minmax(0, 1fr) auto;
    gap: 5px;
    min-height: 44px;
  }

  .portal-row-icon-wrap {
    width: 48px;
    height: 44px;
  }

  .portal-row-icon {
    width: calc(var(--portal-icon-size, 54px) * 0.75);
    height: calc(var(--portal-icon-size, 54px) * 0.75);
  }

  .portal-row-badge {
    top: 2px;
    right: 3px;
    width: 12px;
    height: 12px;
    font-size: 8px;
    line-height: 10px;
  }

  .portal-row-line {
    transform: translateY(6px);
  }

  .portal-row-text {
    font-size: 14px;
    transform: translateY(6px);
  }

  .mock-browser-row {
    grid-template-columns: 1fr;
  }

  .mock-profile-row {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .mock-avatar-button {
    width: 64px;
    height: 64px;
  }

  .mock-action-grid {
    grid-column: 1 / -1;
  }

  .mock-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .mock-item-grid {
    grid-template-columns: 1fr;
  }

  .mock-brand-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .mock-brand-right {
    justify-content: space-between;
  }

  .mock-layout--twitter,
  .mock-steam-body,
  .mock-lastfm-grid,
  .mock-layout--spotify {
    grid-template-columns: 1fr;
  }

  .mock-twitter-profile {
    position: static;
    top: auto;
    min-height: 0;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .mock-twitter-profile .mock-avatar-button {
    width: 84px;
    height: 84px;
  }

  .mock-twitter-profile .mock-profile-name {
    font-size: 22px;
  }

  .mock-twitter-profile .mock-profile-handle {
    font-size: 13px;
    white-space: nowrap;
  }

  .mock-profile-bio--twitter {
    font-size: 13px;
  }

  .mock-stats.mock-stats--twitter {
    gap: 3px;
    justify-content: flex-start;
  }

  .mock-twitter-profile-stats {
    gap: 6px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter {
    gap: 1px;
    padding: 2px 2px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-label {
    font-size: 9px;
  }

  .mock-stats.mock-stats--twitter .mock-stat--twitter .mock-stat-value {
    font-size: 9px;
  }

  .mock-steam-hero,
  .mock-yt-channel,
  .mock-lastfm-header {
    grid-template-columns: 56px minmax(0, 1fr);
  }

  .mock-steam-hero .mock-pill,
  .mock-yt-channel .mock-pill,
  .mock-lastfm-header .mock-pill,
  .mock-lastfm-header .mock-live-chip {
    grid-column: 1 / -1;
  }

  .mock-item-grid--yt {
    grid-template-columns: 1fr;
  }

  .mock-yt-toolbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .mock-yt-toolbar .mock-tab-button {
    grid-column: 1 / -1;
  }

  .mock-spotify-track {
    grid-template-columns: 22px minmax(0, 1fr);
  }

  .mock-spotify-track .mock-item-meta {
    grid-column: 2;
  }

  .mock-spotify-preview-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>


