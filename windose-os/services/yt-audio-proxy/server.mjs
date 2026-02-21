import express from 'express';
import cors from 'cors';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { randomUUID } from 'node:crypto';
import process from 'node:process';
import ytdl from '@distube/ytdl-core';

const app = express();

const PORT = Number(process.env.PORT || 8080);
const TRACK_TTL_MS = Number(process.env.YT_TRACK_TTL_MS || (1000 * 60 * 12));
const MAX_DURATION_SEC = Number(process.env.YT_MAX_DURATION_SEC || (60 * 90));
const RESOLVE_POINTS = Number(process.env.YT_RESOLVE_RATE_POINTS || 20);
const RESOLVE_DURATION_S = Number(process.env.YT_RESOLVE_RATE_WINDOW_S || 60);
const STREAM_POINTS = Number(process.env.YT_STREAM_RATE_POINTS || 90);
const STREAM_DURATION_S = Number(process.env.YT_STREAM_RATE_WINDOW_S || 60);
const ALLOWED_ORIGINS = String(process.env.YT_ALLOWED_ORIGINS || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

const resolveLimiter = new RateLimiterMemory({
  points: RESOLVE_POINTS,
  duration: RESOLVE_DURATION_S,
});
const streamLimiter = new RateLimiterMemory({
  points: STREAM_POINTS,
  duration: STREAM_DURATION_S,
});

/** @type {Map<string, { id: string, sourceUrl: string, title: string, durationSec: number, createdAt: number, expiresAt: number }>} */
const tracks = new Map();

app.disable('x-powered-by');
app.use(express.json({ limit: '24kb' }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || !ALLOWED_ORIGINS.length) {
      callback(null, true);
      return;
    }
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('origin-not-allowed'));
  },
}));

function jsonError(res, status, code, message) {
  res.status(status).json({
    error: {
      code,
      message,
    },
  });
}

function validateYouTubeUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    const host = parsed.hostname.toLowerCase();
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, code: 'invalid_url', url: null };
    }
    if (host === 'youtube.com' || host === 'www.youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
      return { valid: true, code: null, url: parsed.toString() };
    }
    return { valid: false, code: 'unsupported_host', url: null };
  } catch {
    return { valid: false, code: 'invalid_url', url: null };
  }
}

function cleanupExpiredTracks() {
  const now = Date.now();
  for (const [trackId, track] of tracks.entries()) {
    if (track.expiresAt <= now) {
      tracks.delete(trackId);
    }
  }
}

function getApiBase(req) {
  const configured = (process.env.YT_PUBLIC_API_BASE || '').trim();
  if (configured) return configured.replace(/\/+$/, '');
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  return `${proto}://${host}`;
}

async function consumeOrLimit(limiter, key) {
  try {
    await limiter.consume(key);
    return null;
  } catch {
    return {
      status: 429,
      code: 'rate_limited',
      message: 'Too many requests. Please slow down.',
    };
  }
}

app.get('/healthz', (_req, res) => {
  cleanupExpiredTracks();
  res.status(200).json({ ok: true, tracks: tracks.size });
});

app.post('/v1/youtube/resolve', async (req, res) => {
  const key = `resolve:${req.ip || 'unknown'}`;
  const limitError = await consumeOrLimit(resolveLimiter, key);
  if (limitError) {
    jsonError(res, limitError.status, limitError.code, limitError.message);
    return;
  }

  const validated = validateYouTubeUrl(req.body?.url);
  if (!validated.valid || !validated.url) {
    if (validated.code === 'unsupported_host') {
      jsonError(res, 400, 'unsupported_host', 'Only youtube.com and youtu.be hosts are supported.');
      return;
    }
    jsonError(res, 400, 'invalid_url', 'Provide a valid YouTube URL.');
    return;
  }

  try {
    const info = await ytdl.getInfo(validated.url);
    const durationSec = Number.parseInt(info.videoDetails?.lengthSeconds || '0', 10);
    if (Number.isFinite(durationSec) && durationSec > MAX_DURATION_SEC) {
      jsonError(res, 413, 'unavailable', `Track duration exceeds ${MAX_DURATION_SEC} seconds.`);
      return;
    }

    const trackId = randomUUID();
    const now = Date.now();
    const expiresAt = now + TRACK_TTL_MS;
    const title = String(info.videoDetails?.title || 'Untitled');

    tracks.set(trackId, {
      id: trackId,
      sourceUrl: validated.url,
      title,
      durationSec: Number.isFinite(durationSec) ? durationSec : 0,
      createdAt: now,
      expiresAt,
    });
    cleanupExpiredTracks();

    const apiBase = getApiBase(req);
    res.status(200).json({
      trackId,
      title,
      durationSec: Number.isFinite(durationSec) ? durationSec : 0,
      streamUrl: `${apiBase}/v1/youtube/stream/${trackId}`,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not resolve YouTube URL.';
    jsonError(res, 502, 'unavailable', message);
  }
});

app.get('/v1/youtube/stream/:trackId', async (req, res) => {
  const key = `stream:${req.ip || 'unknown'}`;
  const limitError = await consumeOrLimit(streamLimiter, key);
  if (limitError) {
    jsonError(res, limitError.status, limitError.code, limitError.message);
    return;
  }

  const track = tracks.get(String(req.params.trackId || ''));
  if (!track || track.expiresAt <= Date.now()) {
    if (track) tracks.delete(track.id);
    jsonError(res, 410, 'expired_track', 'Track has expired. Resolve the URL again.');
    return;
  }

  try {
    const rangeHeader = req.headers.range;
    const stream = ytdl(track.sourceUrl, {
      quality: 'highestaudio',
      filter: 'audioonly',
      highWaterMark: 1 << 25,
      ...(rangeHeader ? { range: parseRangeHeader(rangeHeader) } : {}),
    });

    stream.once('response', (upstream) => {
      const headers = upstream.headers || {};
      res.status(rangeHeader ? 206 : 200);
      if (headers['content-type']) res.setHeader('Content-Type', headers['content-type']);
      if (headers['content-length']) res.setHeader('Content-Length', headers['content-length']);
      if (headers['content-range']) res.setHeader('Content-Range', headers['content-range']);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-store');
    });

    stream.once('error', (error) => {
      if (res.headersSent) {
        res.end();
        return;
      }
      const message = error instanceof Error ? error.message : 'Unable to stream track.';
      jsonError(res, 502, 'unavailable', message);
    });

    req.once('close', () => {
      try {
        stream.destroy();
      } catch {
        // ignore destroy errors during disconnect
      }
    });

    stream.pipe(res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to stream track.';
    jsonError(res, 502, 'unavailable', message);
  }
});

app.use((_req, res) => {
  jsonError(res, 404, 'not_found', 'Endpoint not found.');
});

app.listen(PORT, () => {
  console.log(`[yt-audio-proxy] listening on http://0.0.0.0:${PORT}`);
});

function parseRangeHeader(value) {
  const trimmed = String(value || '').trim();
  const match = trimmed.match(/^bytes=(\d+)-(\d+)?$/i);
  if (!match) return undefined;
  const start = Number.parseInt(match[1], 10);
  const end = match[2] ? Number.parseInt(match[2], 10) : undefined;
  if (!Number.isFinite(start)) return undefined;
  if (Number.isFinite(end) && end < start) return undefined;
  return { start, end: Number.isFinite(end) ? end : undefined };
}
