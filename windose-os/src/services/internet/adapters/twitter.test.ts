import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternetSitePayload } from '../types';
import { createTwitterAdapter } from './twitter';
import { fetchRemoteExtract } from './utils';

vi.mock('./utils', async () => {
  const actual = await vi.importActual<typeof import('./utils')>('./utils');
  return {
    ...actual,
    fetchRemoteExtract: vi.fn(),
  };
});

function makePreviousPayload(): InternetSitePayload {
  return {
    siteId: 'twitter',
    profile: {
      name: 'josie',
      handle: '@ProbablyLaced',
      avatarUrl: 'https://pbs.twimg.com/profile_images/example.jpg',
      bio: 'bio',
    },
    stats: [
      { label: 'Tweets', value: '307' },
      { label: 'Following', value: '267' },
      { label: 'Followers', value: '4' },
      { label: 'Likes', value: '3K' },
    ],
    items: [
      {
        id: 'seed-1',
        title: 'Seed tweet',
        meta: 'Seed',
      },
    ],
    updatedAt: 1_700_000_000_000,
    freshnessStatus: 'STATIC',
    sourceStatus: 'OK',
  };
}

describe('twitter adapter quote mapping', () => {
  const fetchRemoteExtractMock = vi.mocked(fetchRemoteExtract);

  beforeEach(() => {
    fetchRemoteExtractMock.mockReset();
  });

  it('maps quote tweets with author text and quoted text into a quote embed', async () => {
    fetchRemoteExtractMock.mockResolvedValue({
      meta_title: 'josie (@ProbablyLaced) / X',
      meta_description: '5 Followers',
      meta_image: 'https://pbs.twimg.com/profile_images/real.jpg',
      tweet_articles: ['my comment @alice'],
      tweet_articles_html: [
        [
          "<div data-testid='tweetText'>my comment</div>",
          "<a href='/ProbablyLaced/status/1001'>open</a>",
          "<div data-testid='card.wrapper'><a href='/alice/status/1002'><div data-testid='tweetText'>quoted thought</div><img src='https://pbs.twimg.com/media/QUOTE_A.jpg' /></a></div>",
        ].join(''),
      ],
    });

    const adapter = createTwitterAdapter();
    const result = await adapter({
      siteId: 'twitter',
      now: 1_700_000_010_000,
      previous: makePreviousPayload(),
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.postKind).toBe('quote');
    expect(result.items[0]?.title).toBe('my comment');
    expect(result.items[0]?.quote?.text).toBe('quoted thought');
    expect(result.items[0]?.quote?.handle).toBe('@alice');
    expect(result.items[0]?.quote?.mediaType).toBe('image');
    expect(result.items[0]?.quote?.mediaUrl).toBe('https://pbs.twimg.com/media/QUOTE_A.jpg');
    expect(result.items[0]?.sourceHandle).toBeUndefined();
  });

  it('maps quote tweets with no added commentary into quote embeds', async () => {
    fetchRemoteExtractMock.mockResolvedValue({
      meta_title: 'josie (@ProbablyLaced) / X',
      meta_description: '5 Followers',
      meta_image: 'https://pbs.twimg.com/profile_images/real.jpg',
      tweet_articles: ['quoted thought'],
      tweet_articles_html: [
        [
          "<a href='/ProbablyLaced/status/2001'>open</a>",
          "<div data-testid='card.wrapper'><a href='/alice/status/2002'><div data-testid='tweetText'>quoted thought</div><img src='https://pbs.twimg.com/media/QUOTE_B.jpg' /></a></div>",
        ].join(''),
      ],
    });

    const adapter = createTwitterAdapter();
    const result = await adapter({
      siteId: 'twitter',
      now: 1_700_000_020_000,
      previous: makePreviousPayload(),
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.postKind).toBe('quote');
    expect(result.items[0]?.title).toBe('Quoted a post');
    expect(result.items[0]?.quote?.text).toBe('quoted thought');
    expect(result.items[0]?.quote?.handle).toBe('@alice');
    expect(result.items[0]?.quote?.mediaType).toBe('image');
    expect(result.items[0]?.quote?.mediaUrl).toBe('https://pbs.twimg.com/media/QUOTE_B.jpg');
    expect(result.items[0]?.mediaType).toBeUndefined();
  });

  it('does not classify regular tweets with mentions as retweets', async () => {
    fetchRemoteExtractMock.mockResolvedValue({
      meta_title: 'josie (@ProbablyLaced) / X',
      meta_description: '5 Followers',
      meta_image: 'https://pbs.twimg.com/profile_images/real.jpg',
      tweet_articles: ['thanks @alice for helping'],
      tweet_articles_html: [
        [
          "<div data-testid='tweetText'>thanks @alice for helping</div>",
          "<a href='/ProbablyLaced/status/3001'>open</a>",
        ].join(''),
      ],
    });

    const adapter = createTwitterAdapter();
    const result = await adapter({
      siteId: 'twitter',
      now: 1_700_000_030_000,
      previous: makePreviousPayload(),
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.postKind).toBe('original');
    expect(result.items[0]?.sourceHandle).toBeUndefined();
    expect(result.items[0]?.quote).toBeUndefined();
  });

  it('maps retweet source media onto the main feed card', async () => {
    fetchRemoteExtractMock.mockResolvedValue({
      meta_title: 'josie (@ProbablyLaced) / X',
      meta_description: '5 Followers',
      meta_image: 'https://pbs.twimg.com/profile_images/real.jpg',
      tweet_articles: ['RT @alice this is huge'],
      tweet_articles_html: [
        [
          "<div data-testid='tweetText'>RT @alice this is huge</div>",
          "<a href='/alice/status/4001'>open</a>",
          "<img src='https://pbs.twimg.com/media/RETWEET_A.jpg' />",
        ].join(''),
      ],
    });

    const adapter = createTwitterAdapter();
    const result = await adapter({
      siteId: 'twitter',
      now: 1_700_000_040_000,
      previous: makePreviousPayload(),
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.postKind).toBe('retweet');
    expect(result.items[0]?.sourceHandle).toBe('@alice');
    expect(result.items[0]?.mediaType).toBe('image');
    expect(result.items[0]?.mediaUrl).toBe('https://pbs.twimg.com/media/RETWEET_A.jpg');
  });

  it('keeps media-only tweets and aligns empty innerText rows with article HTML', async () => {
    fetchRemoteExtractMock.mockResolvedValue({
      meta_title: 'josie (@ProbablyLaced) / X',
      meta_description: '5 Followers',
      meta_image: 'https://pbs.twimg.com/profile_images/real.jpg',
      tweet_articles: ['', 'RT @alice text tweet'],
      tweet_articles_html: [
        [
          "<a href='/ProbablyLaced/status/5001'>open</a>",
          "<video src='https://video.twimg.com/tweet_video/media-only.mp4'></video>",
        ].join(''),
        [
          "<div data-testid='tweetText'>RT @alice text tweet</div>",
          "<a href='/alice/status/5002'>open</a>",
        ].join(''),
      ],
    });

    const adapter = createTwitterAdapter();
    const result = await adapter({
      siteId: 'twitter',
      now: 1_700_000_050_000,
      previous: makePreviousPayload(),
    });

    expect(result).not.toBeNull();
    if (!result) return;
    expect(result.items.length).toBeGreaterThanOrEqual(2);
    expect(result.items[0]?.title).toBe('Media post');
    expect(result.items[0]?.mediaType).toBe('video');
    expect(result.items[0]?.mediaUrl).toBe('https://video.twimg.com/tweet_video/media-only.mp4');
    expect(result.items[1]?.postKind).toBe('retweet');
    expect(result.items[1]?.sourceHandle).toBe('@alice');
  });
});
