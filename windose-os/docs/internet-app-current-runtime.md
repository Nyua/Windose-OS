# Internet App - Current Runtime (Local Mock Site Previews)

Last updated: February 12, 2026

## Scope
This document is the current source of truth for:
- `windose-os/src/components/InternetApp.vue`

The Internet app now uses local interactive mock previews for configured social sites. It does not render remote snapshots in runtime.

## Runtime Summary
- Preview source: local, typed mock data inside `InternetApp.vue`.
- Execution location: browser only.
- Persistence: no snapshot files or remote capture runtime path.
- Navigation behavior:
  - Portal list opens a loading screen, then shows a compact mock page.
  - Any mock interaction button routes users to the real external site URL via `openExternalUrlWithFallback`.

## Data Flow
1. User clicks a portal row.
2. App enters `loading` state and runs a simulated progress ticker.
3. App resolves to `preview` state with the selected site's local mock payload.
4. User clicks profile/action/stat/content buttons in the mock panel.
5. App opens the configured external URL in a new tab flow.

## Sites (Current)
Configured in `linkEntries` inside `InternetApp.vue`.

1. `twitter` -> `https://x.com/ProbablyLaced`
2. `steam` -> `https://steamcommunity.com/id/foundlifeless/`
3. `youtube` -> `https://www.youtube.com/@fentlacedcat`
4. `lastfm` -> `https://www.last.fm/user/FoundLifeless`
5. `spotify` -> `https://open.spotify.com/playlist/1Cim4pZnFmNXD8N4OtO3wz?si=b75cc9f3073a473b&nd=1&dlsi=49ce9ea61601457a`

## Key Implementation Points
- Runtime state:
  - `BrowserState = 'portal' | 'loading' | 'preview'`
- Local preview model:
  - `MockSitePreview` on each `InternetLink`
- External routing:
  - `openExternalCurrent(...)` -> `openExternalUrlWithFallback(...)`
- Loading simulation:
  - `startProgressTicker(...)`
  - `finishLoading(...)`

## What To Edit Next Time
To change mock content, edit these fields in `linkEntries` (`InternetApp.vue`):
- Profile identity: `profileName`, `profileHandle`, `bio`, `avatarUrl`
- Button set: `primaryCta`, `actions`
- Counters and rows: `stats`, `items`
- Theme: `accent`, `themeGradient`

To change portal labels/icons:
- Edit `portalEntries` in `InternetApp.vue`

## Known Constraints
- Mock counters/items are static display data (not live fetched).
- All mock interactions currently open the same canonical URL per site.
- If a site URL changes, update the `url` field in `linkEntries`.

## Verification Checklist
After editing:
1. Run `npm run build`.
2. Open the Internet app.
3. Click each portal row.
4. Verify mock profile layout appears and buttons are clickable.
5. Verify each click opens the external site.
