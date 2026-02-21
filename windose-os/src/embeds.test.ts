import { describe, expect, it } from 'vitest';
import { parseEmbedFromUrl, parseEmbedsFromText, toYouTubeEmbedSrc } from './embeds';

describe('embeds', () => {
  it('parses supported YouTube links', () => {
    const parsed = parseEmbedFromUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(parsed).toEqual({
      type: 'youtube',
      videoId: 'dQw4w9WgXcQ',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
  });

  it('parses supported Twitter/X links', () => {
    const parsed = parseEmbedFromUrl('https://x.com/amechan/status/1234567890123456789');
    expect(parsed).toEqual({
      type: 'twitter',
      tweetId: '1234567890123456789',
      url: 'https://x.com/amechan/status/1234567890123456789',
    });
  });

  it('rejects unsupported links', () => {
    expect(parseEmbedFromUrl('https://example.com/post/123')).toBeNull();
  });

  it('extracts deterministic embeds from text without duplicates', () => {
    const embeds = parseEmbedsFromText(
      'watch https://youtu.be/dQw4w9WgXcQ and https://youtu.be/dQw4w9WgXcQ plus https://twitter.com/a/status/1',
    );

    expect(embeds).toEqual([
      {
        type: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        url: 'https://youtu.be/dQw4w9WgXcQ',
      },
      {
        type: 'twitter',
        tweetId: '1',
        url: 'https://twitter.com/a/status/1',
      },
    ]);
  });

  it('builds YouTube iframe URL from video id', () => {
    const url = new URL(toYouTubeEmbedSrc('abc123'));
    expect(url.origin + url.pathname).toBe('https://www.youtube-nocookie.com/embed/abc123');
    expect(url.searchParams.get('rel')).toBe('0');
    expect(url.searchParams.get('modestbranding')).toBe('1');
    expect(url.searchParams.get('iv_load_policy')).toBe('3');
    expect(url.searchParams.get('playsinline')).toBe('1');
    expect(url.searchParams.get('loop')).toBe('1');
    expect(url.searchParams.get('playlist')).toBe('abc123');
    expect(url.searchParams.get('enablejsapi')).toBe('1');
  });
});
