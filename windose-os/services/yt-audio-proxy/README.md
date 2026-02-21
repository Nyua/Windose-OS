# Windose YouTube Audio Proxy

Dedicated extraction + streaming service for Ame's Corner fullscreen visualizer.

## API

### `POST /v1/youtube/resolve`
- Request body:
```json
{ "url": "https://www.youtube.com/watch?v=..." }
```
- Response body:
```json
{
  "trackId": "uuid",
  "title": "Track title",
  "durationSec": 240,
  "streamUrl": "https://<service>/v1/youtube/stream/<trackId>",
  "expiresAt": "2026-02-20T00:00:00.000Z"
}
```

### `GET /v1/youtube/stream/:trackId`
Streams audio bytes for the previously resolved track.

### Error format
```json
{
  "error": {
    "code": "invalid_url",
    "message": "Provide a valid YouTube URL."
  }
}
```

Known error codes:
- `invalid_url`
- `unsupported_host`
- `rate_limited`
- `unavailable`
- `expired_track`

## Env
- `PORT` default `8080`
- `YT_TRACK_TTL_MS` default `720000`
- `YT_MAX_DURATION_SEC` default `5400`
- `YT_ALLOWED_ORIGINS` CSV allowlist (optional)
- `YT_PUBLIC_API_BASE` optional absolute base URL override
