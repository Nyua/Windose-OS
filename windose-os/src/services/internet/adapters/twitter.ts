import type {
  InternetQuotedTweet,
  InternetSiteAdapter,
  InternetSiteItem,
  InternetTwitterPostKind,
} from '../types';
import { carryForwardPayload, fetchRemoteExtract } from './utils';

const TWITTER_PROFILE_URL = 'https://x.com/ProbablyLaced';
const TWITTER_OWN_HANDLE = '@ProbablyLaced';
const MAX_TWEET_ITEMS = 160;
const TWITTER_EXTRACT_WAIT_MS = 4600;
const TWITTER_EXTRACT_SCROLL_STEPS = 14;
const TWITTER_EXTRACT_SCROLL_BY = 1500;
const TWITTER_EXTRACT_SCROLL_WAIT_MS = 300;

function asText(value: string | string[] | null | undefined): string {
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

function asTextList(
  value: string | string[] | null | undefined,
  options?: { preserveEmpty?: boolean },
): string[] {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => String(entry || '').trim());
    if (options?.preserveEmpty) return normalized;
    return normalized.filter((entry) => entry.length > 0);
  }
  const single = String(value || '').trim();
  if (single) return [single];
  return [];
}

function parseHandle(metaTitle: string, fallback: string): string {
  const handleMatch = metaTitle.match(/(\@[A-Za-z0-9_]+)/);
  if (handleMatch?.[1]) return handleMatch[1];

  const slashMatch = metaTitle.match(/\b(@[A-Za-z0-9_]+)\b/);
  if (slashMatch?.[1]) return slashMatch[1];

  return fallback;
}

function parseName(metaTitle: string, fallback: string): string {
  const withoutSuffix = metaTitle.replace(/\s*\/\s*X\s*$/i, '').trim();
  const namePart = withoutSuffix.split('(@')[0]?.trim();
  if (!namePart) return fallback;
  return namePart;
}

function parseStatsFromDescription(description: string, fallback: { label: string; value: string }[]) {
  const next = fallback.map((entry) => ({ ...entry }));
  if (!description) return next;

  const map = [
    { key: 'Followers', regex: /([\d.,]+[KMB]?)\s+Followers/i },
    { key: 'Following', regex: /([\d.,]+[KMB]?)\s+Following/i },
    { key: 'Tweets', regex: /([\d.,]+[KMB]?)\s+(Posts|Tweets)/i },
  ];

  for (const entry of map) {
    const match = description.match(entry.regex);
    if (!match) continue;
    const target = next.find((stat) => stat.label.toLowerCase() === entry.key.toLowerCase());
    if (target && match[1]) target.value = match[1];
  }

  return next;
}

function isLikelyTwitterProfileAvatar(url: string): boolean {
  const candidate = url.trim();
  if (!candidate) return false;
  return /^https?:\/\/pbs\.twimg\.com\/profile_images\//i.test(candidate);
}

function normalizeTweetText(value: string): string {
  return value
    .replace(/\b(Show more|Translate post)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTweetTitle(value: string): string {
  return normalizeTweetText(value)
    .replace(/^RT\s+@[A-Za-z0-9_]+\s*:?\s*/i, '')
    .replace(/^Retweet:\s*/i, '')
    .trim();
}

function normalizeHandle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}

function parseHandlesFromArticle(articleText: string): string[] {
  const matches = articleText.match(/@[A-Za-z0-9_]+/g) ?? [];
  const deduped: string[] = [];
  for (const handle of matches) {
    if (!deduped.includes(handle)) deduped.push(handle);
  }
  return deduped;
}

function hashText(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 8);
}

function extractStatusIdFromLink(link: string | undefined): string {
  const raw = String(link || '').trim();
  if (!raw) return '';
  const match = raw.match(/\/status\/(\d+)/i);
  return match?.[1] ?? '';
}

type TweetMediaPayload = Pick<InternetSiteItem, 'mediaType' | 'mediaUrl' | 'mediaUrls'>;

function normalizeAssetUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `https://x.com${trimmed}`;
  try {
    return new URL(trimmed, 'https://x.com').toString();
  } catch {
    return '';
  }
}

function isLikelyTweetImageUrl(url: string): boolean {
  const normalized = normalizeAssetUrl(url).toLowerCase();
  if (!normalized) return false;
  if (!normalized.includes('twimg.com')) return false;
  if (normalized.includes('/profile_images/')) return false;
  if (normalized.includes('/profile_banners/')) return false;
  if (normalized.includes('/emoji/')) return false;
  return (
    normalized.includes('pbs.twimg.com/media/')
    || normalized.includes('pbs.twimg.com/ext_tw_video_thumb/')
    || normalized.includes('pbs.twimg.com/amplify_video_thumb/')
    || normalized.includes('pbs.twimg.com/tweet_video_thumb/')
  );
}

function isLikelyTweetVideoUrl(url: string): boolean {
  const normalized = normalizeAssetUrl(url).toLowerCase();
  if (!normalized) return false;
  return (
    normalized.includes('video.twimg.com/')
    || normalized.includes('.mp4')
    || normalized.includes('.m3u8')
  );
}

function selectImageCandidate(node: Element): string {
  const directSrc = normalizeAssetUrl(node.getAttribute('src') || '');
  if (directSrc) return directSrc;

  const srcsetRaw = String(node.getAttribute('srcset') || '').trim();
  if (!srcsetRaw) return '';
  const firstCandidate = srcsetRaw.split(',')[0]?.trim() || '';
  const firstUrl = firstCandidate.split(/\s+/)[0] || '';
  return normalizeAssetUrl(firstUrl);
}

function collectMediaFromScope(scope: Element, excludeScope?: Element | null): TweetMediaPayload | undefined {
  const videoDedupe = new Set<string>();
  const videoUrls: string[] = [];
  const videoNodes = [...scope.querySelectorAll('video[src], source[src]')];
  for (const node of videoNodes) {
    if (excludeScope && excludeScope.contains(node)) continue;
    const src = normalizeAssetUrl((node as Element).getAttribute('src') || '');
    if (!src || !isLikelyTweetVideoUrl(src) || videoDedupe.has(src)) continue;
    videoDedupe.add(src);
    videoUrls.push(src);
  }

  if (videoUrls.length > 0) {
    return {
      mediaType: 'video',
      mediaUrl: videoUrls[0],
    };
  }

  const imageDedupe = new Set<string>();
  const imageUrls: string[] = [];
  const imageNodes = [...scope.querySelectorAll('img[src], img[srcset]')];
  for (const node of imageNodes) {
    if (excludeScope && excludeScope.contains(node)) continue;
    const src = selectImageCandidate(node as Element);
    if (!src || !isLikelyTweetImageUrl(src) || imageDedupe.has(src)) continue;
    imageDedupe.add(src);
    imageUrls.push(src);
  }

  if (imageUrls.length === 1) {
    return {
      mediaType: 'image',
      mediaUrl: imageUrls[0],
    };
  }

  if (imageUrls.length > 1) {
    return {
      mediaType: 'image',
      mediaUrls: imageUrls,
    };
  }

  return undefined;
}

function findQuoteRoot(root: Element, statusLinks: string[]): Element | null {
  const statusCandidates = statusLinks.filter((link) => link.includes('/status/'));
  const ownStatus = statusCandidates.find((link) => link.toLowerCase().includes('/probablylaced/status/')) || '';
  const quoteStatus = statusCandidates.find((link) => link !== ownStatus) || '';

  const anchors = [...root.querySelectorAll("a[href*='/status/']")];
  if (quoteStatus) {
    for (const anchor of anchors) {
      const normalized = normalizeStatusLink(anchor.getAttribute('href') || '');
      if (normalized !== quoteStatus) continue;
      const cardWrapper = anchor.closest("[data-testid='card.wrapper']");
      if (cardWrapper && cardWrapper !== root) return cardWrapper as Element;
      const nestedTweet = anchor.closest("[data-testid='tweet']");
      if (nestedTweet && nestedTweet !== root) return nestedTweet as Element;
      const roleLink = anchor.closest("div[role='link']");
      if (roleLink && roleLink !== root) return roleLink as Element;
      if (anchor.parentElement && anchor.parentElement !== root) return anchor.parentElement;
    }
  }

  const fallbackCard = root.querySelector("[data-testid='card.wrapper']");
  if (fallbackCard && fallbackCard !== root) return fallbackCard as Element;

  return null;
}

function toAbsoluteXLink(pathOrUrl: string): string {
  const raw = pathOrUrl.trim();
  if (!raw) return TWITTER_PROFILE_URL;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://x.com${raw.startsWith('/') ? raw : `/${raw}`}`;
}

function normalizeStatusLink(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  let pathname = trimmed;
  try {
    const parsed = new URL(trimmed, 'https://x.com');
    pathname = parsed.pathname;
  } catch {
    pathname = trimmed;
  }

  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/analytics$/i, '');
  pathname = pathname.replace(/\/(?:photo|video)\/\d+$/i, '');
  return pathname;
}

interface ExtractedTweetArticleParts {
  tweetTexts: string[];
  statusLinks: string[];
  hasQuoteCard: boolean;
  mainMedia?: TweetMediaPayload;
  quoteMedia?: TweetMediaPayload;
}

function parseHandleFromStatusLink(link: string): string {
  const match = link.match(/^\/([^/]+)\/status\/\d+/i);
  if (!match?.[1]) return '';
  return normalizeHandle(match[1]);
}

function extractArticleParts(articleHtml: string): ExtractedTweetArticleParts {
  if (!articleHtml) return { tweetTexts: [], statusLinks: [], hasQuoteCard: false };

  try {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(`<article>${articleHtml}</article>`, 'text/html');
    const root = parsed.querySelector('article') ?? parsed.body;

    const tweetTexts = [...root.querySelectorAll("[data-testid='tweetText']")]
      .map((node) => normalizeTweetText((node as HTMLElement).innerText || node.textContent || ''))
      .filter((text) => text.length > 0);

    const dedupe = new Set<string>();
    const statusLinks: string[] = [];
    const anchors = [...root.querySelectorAll("a[href*='/status/']")];
    for (const anchor of anchors) {
      const href = normalizeStatusLink(anchor.getAttribute('href') || '');
      if (!href || !href.includes('/status/')) continue;
      if (dedupe.has(href)) continue;
      dedupe.add(href);
      statusLinks.push(href);
    }

    const hasQuoteCard = Boolean(
      root.querySelector("[data-testid='tweet'] [data-testid='tweetText']")
      || root.querySelector("div[role='link'][href*='/status/'] [data-testid='tweetText']")
      || root.querySelector("[data-testid='card.wrapper'] [data-testid='tweetText']"),
    );

    const quoteRoot = findQuoteRoot(root, statusLinks);
    const quoteMedia = quoteRoot ? collectMediaFromScope(quoteRoot) : undefined;
    const mainMedia = collectMediaFromScope(root, quoteRoot);

    return { tweetTexts, statusLinks, hasQuoteCard, mainMedia, quoteMedia };
  } catch {
    return { tweetTexts: [], statusLinks: [], hasQuoteCard: false };
  }
}

function buildQuoteTweet(
  articleText: string,
  parts: ExtractedTweetArticleParts,
): InternetQuotedTweet | undefined {
  const statusCandidates = parts.statusLinks.filter((link) => link.includes('/status/'));
  const ownStatus = statusCandidates.find((link) => link.toLowerCase().includes('/probablylaced/status/')) || '';
  const quoteLink = statusCandidates.find((link) => link !== ownStatus) || '';

  const quoteFromSecondText = normalizeTweetText(parts.tweetTexts[1] || '');
  const quoteFromSingleText = normalizeTweetText(parts.tweetTexts[0] || '');
  const shouldUseSingleTextAsQuote = Boolean(
    !quoteFromSecondText && quoteFromSingleText
    && (parts.hasQuoteCard || statusCandidates.length > 1)
    && quoteLink,
  );
  const quoteText = quoteFromSecondText || (shouldUseSingleTextAsQuote ? quoteFromSingleText : '');
  if (!quoteText) return undefined;

  const quoteHandleFromLink = parseHandleFromStatusLink(quoteLink);
  const quoteHandle = quoteHandleFromLink || parseHandlesFromArticle(articleText)
    .find((handle) => handle.toLowerCase() !== TWITTER_OWN_HANDLE.toLowerCase());

  let resolvedQuoteLink = quoteLink;
  if (quoteHandle && !resolvedQuoteLink) {
    const handleSlug = quoteHandle.slice(1).toLowerCase();
    resolvedQuoteLink = statusCandidates.find((link) => link.toLowerCase().includes(`/${handleSlug}/status/`)) || '';
  }
  if (!resolvedQuoteLink && statusCandidates.length > 1) {
    resolvedQuoteLink = statusCandidates[1] || '';
  }

  const media = parts.quoteMedia || (shouldUseSingleTextAsQuote ? parts.mainMedia : undefined);

  return {
    text: quoteText,
    handle: quoteHandle || undefined,
    linkUrl: resolvedQuoteLink ? toAbsoluteXLink(resolvedQuoteLink) : undefined,
    mediaType: media?.mediaType,
    mediaUrl: media?.mediaUrl,
    mediaUrls: media?.mediaUrls ? [...media.mediaUrls] : undefined,
  };
}

function classifyTweetFromArticle(
  mainText: string,
  articleText: string,
  statusLinks: string[],
  quote: InternetQuotedTweet | undefined,
): { title: string; postKind: InternetTwitterPostKind; sourceHandle?: string } {
  const directRtMatch = mainText.match(/^RT\s+(@[A-Za-z0-9_]+)\s*:?\s*/i);
  const articleLooksRepost = /\bYou reposted\b/i.test(articleText) || /\b(reposted|retweet)\b/i.test(articleText);
  const textLooksRetweet = /^RT\s+@/i.test(mainText) || /^Retweet:\s*/i.test(mainText);
  const retweetHandleFromText = directRtMatch?.[1] ? normalizeHandle(directRtMatch[1]) : '';
  const retweetHandleFromStatus = statusLinks
    .map((link) => parseHandleFromStatusLink(link))
    .find((handle) => handle && handle.toLowerCase() !== TWITTER_OWN_HANDLE.toLowerCase()) || '';
  const sourceHandle = retweetHandleFromText || retweetHandleFromStatus;

  let postKind: InternetTwitterPostKind = 'original';
  if (articleLooksRepost || textLooksRetweet) {
    postKind = 'retweet';
  } else if (quote?.text) {
    postKind = 'quote';
  }

  return {
    title: cleanTweetTitle(mainText) || normalizeTweetText(mainText),
    postKind,
    sourceHandle: postKind === 'retweet' ? sourceHandle || undefined : undefined,
  };
}

function selectPrimaryTweetLink(
  statusLinks: string[],
  postKind: InternetTwitterPostKind,
  sourceHandle?: string,
): string {
  const candidates = statusLinks.filter((link) => link.includes('/status/'));
  if (!candidates.length) return TWITTER_PROFILE_URL;

  if (postKind === 'retweet' && sourceHandle) {
    const sourceSlug = sourceHandle.slice(1).toLowerCase();
    const sourceMatch = candidates.find((link) => link.toLowerCase().includes(`/${sourceSlug}/status/`));
    if (sourceMatch) return toAbsoluteXLink(sourceMatch);
  }

  const ownMatch = candidates.find((link) => link.toLowerCase().includes('/probablylaced/status/'));
  if (ownMatch) return toAbsoluteXLink(ownMatch);

  return toAbsoluteXLink(candidates[0] || '');
}

function mapLiveTweetItems(
  articleTexts: string[],
  articleHtmlEntries: string[],
  previousItems: InternetSiteItem[],
): InternetSiteItem[] {
  const liveItems: InternetSiteItem[] = [];

  const articleCount = Math.min(MAX_TWEET_ITEMS, articleHtmlEntries.length || articleTexts.length);
  for (let index = 0; index < articleCount; index += 1) {
    const rawArticleText = String(articleTexts[index] || '');
    const parts = extractArticleParts(articleHtmlEntries[index] || '');
    const articleText = normalizeTweetText(rawArticleText || parts.tweetTexts.join(' '));
    const hasRenderableSignal = Boolean(
      articleText
      || parts.mainMedia
      || parts.quoteMedia
      || parts.statusLinks.length > 0,
    );
    if (!hasRenderableSignal) continue;

    const mainText = normalizeTweetText(parts.tweetTexts[0] || rawArticleText || '');
    const mainTextForClassification = mainText || (parts.mainMedia ? 'Media post' : articleText || 'Post');

    const quote = buildQuoteTweet(articleText, parts);
    const classification = classifyTweetFromArticle(mainTextForClassification, articleText, parts.statusLinks, quote);
    const title = classification.postKind === 'quote' && quote?.text && classification.title === quote.text
      ? 'Quoted a post'
      : classification.title;
    const shouldSuppressMainMedia = Boolean(
      classification.postKind === 'quote'
      && quote?.text
      && classification.title === quote.text
      && !parts.quoteMedia
      && parts.mainMedia,
    );
    const itemMedia = shouldSuppressMainMedia ? undefined : parts.mainMedia;
    const sourceSuffix = classification.sourceHandle ? ` | ${classification.sourceHandle}` : '';
    const quoteSuffix = quote?.handle ? ` | ${quote.handle}` : '';
    const meta = classification.postKind === 'retweet'
      ? `Retweet${sourceSuffix} | Live`
      : classification.postKind === 'quote'
        ? `Quote tweet${quoteSuffix} | Live`
        : 'Posted by you | Live';
    const linkUrl = selectPrimaryTweetLink(parts.statusLinks, classification.postKind, classification.sourceHandle);
    const statusId = extractStatusIdFromLink(linkUrl);

    liveItems.push({
      id: statusId
        ? `twitter-live-${statusId}`
        : `twitter-live-${index}-${hashText(`${mainTextForClassification} ${articleText}`)}`,
      title,
      meta,
      postKind: classification.postKind,
      sourceHandle: classification.sourceHandle,
      quote,
      mediaType: itemMedia?.mediaType,
      mediaUrl: itemMedia?.mediaUrl,
      mediaUrls: itemMedia?.mediaUrls ? [...itemMedia.mediaUrls] : undefined,
      linkUrl,
    });
  }

  if (!liveItems.length) return previousItems;
  const deduped: InternetSiteItem[] = [];
  const seen = new Set<string>();
  for (const item of liveItems) {
    const statusId = extractStatusIdFromLink(item.linkUrl);
    const key = statusId || `${item.title}::${item.meta}::${item.mediaUrl || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= MAX_TWEET_ITEMS) break;
  }

  return deduped.length > 0 ? deduped : previousItems;
}

export function createTwitterAdapter(): InternetSiteAdapter {
  return async ({ now, previous, signal }) => {
    try {
      const data = await fetchRemoteExtract(
        TWITTER_PROFILE_URL,
        [
          { key: 'meta_title', selector: "meta[property='og:title']", attr: 'content' },
          { key: 'meta_description', selector: "meta[property='og:description']", attr: 'content' },
          { key: 'meta_image', selector: "meta[property='og:image']", attr: 'content' },
          { key: 'profile_avatar', selector: "a[href='/ProbablyLaced'] img[src*='profile_images/']", attr: 'src' },
          { key: 'tweet_articles_html', selector: "article[data-testid='tweet']", all: true, limit: MAX_TWEET_ITEMS, property: 'html' },
        ],
        {
          waitMs: TWITTER_EXTRACT_WAIT_MS,
          width: 1280,
          height: 2200,
          scrollSteps: TWITTER_EXTRACT_SCROLL_STEPS,
          scrollBy: TWITTER_EXTRACT_SCROLL_BY,
          scrollWaitMs: TWITTER_EXTRACT_SCROLL_WAIT_MS,
          timeoutMs: 28_000,
          signal,
        },
      );

      if (!data || !previous) {
        return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
      }

      const metaTitle = asText(data.meta_title);
      const description = asText(data.meta_description);
      const imageUrl = asText(data.meta_image);
      const profileAvatarUrl = asText(data.profile_avatar);
      const nextName = parseName(metaTitle, previous.profile.name);
      const nextHandle = parseHandle(metaTitle, previous.profile.handle);
      const nextBio = description ? description : previous.profile.bio;
      const nextAvatar = isLikelyTwitterProfileAvatar(profileAvatarUrl)
        ? profileAvatarUrl
        : isLikelyTwitterProfileAvatar(imageUrl)
          ? imageUrl
          : previous.profile.avatarUrl;
      const nextStats = parseStatsFromDescription(description, previous.stats);
      const tweetArticles = asTextList(data.tweet_articles, { preserveEmpty: true });
      const tweetArticleHtml = asTextList(data.tweet_articles_html);
      const nextItems = tweetArticleHtml.length
        ? mapLiveTweetItems(tweetArticles, tweetArticleHtml, previous.items)
        : previous.items;
      const statsChanged = nextStats.some(
        (stat, index) => stat.value !== (previous.stats[index]?.value ?? ''),
      );
      const avatarChanged = nextAvatar !== previous.profile.avatarUrl;
      const itemsChanged = nextItems.length !== previous.items.length
        || nextItems.some((item, index) => item.title !== (previous.items[index]?.title ?? ''));

      const hasTweetPayload = tweetArticleHtml.some((entry) => entry.length > 0);
      const hasMeaningfulSignal = Boolean(description || statsChanged || avatarChanged || hasTweetPayload || itemsChanged);
      if (!hasMeaningfulSignal) {
        return carryForwardPayload(previous, now, 'PARTIAL');
      }

      return {
        ...previous,
        profile: {
          ...previous.profile,
          name: nextName,
          handle: nextHandle,
          bio: nextBio,
          avatarUrl: nextAvatar,
        },
        stats: nextStats,
        items: nextItems,
        updatedAt: now,
        freshnessStatus: 'UPDATED',
        sourceStatus: 'OK',
      };
    } catch {
      return carryForwardPayload(previous, now, previous ? 'PARTIAL' : 'FAILED');
    }
  };
}
