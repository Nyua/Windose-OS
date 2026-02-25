# Ame's Corner Social Hub Rebuild Spec (Implementation)

## 1. Scope
This implementation replaces the entire post-loader Ame's Corner experience with a new single-screen social hub while preserving BIOS and loader behavior.

In scope:
1. Preserve BIOS and loader stages exactly as the current user-visible pre-entry flow.
2. Replace `#os-stage` content with a social hub containing six cards: X/Twitter, Steam, Discord, Last.fm, Spotify, SoundCloud.
3. Use a fixed, non-scroll desktop viewport with adaptive mobile behavior.
4. Implement live-plus-fallback data loading with per-site refresh cadence.
5. Provide in-page embeds for Spotify and SoundCloud.
6. Expand remote-browser allowed hosts for Discord and SoundCloud extraction.

Out of scope:
1. Changes to routes outside `ames-corner.html`.
2. Reintroduction of legacy OS shell UX (taskbar/start/windows/desktop icons).
3. New test framework setup.

## 2. Locked Decisions
1. BIOS + loader flow is preserved.
2. Post-loader stage is a social hub only.
3. Data policy is live + fallback + last-good cache retention.
4. Desktop is non-scrollable.
5. Mobile may use internal card scrolling only.
6. Discord card is user-profile mode.
7. Targets are fixed:
   - X: `https://x.com/ProbablyLaced`
   - Steam: `https://steamcommunity.com/id/foundlifeless/`
   - Last.fm: `https://www.last.fm/user/FoundLifeless`
   - Spotify: `https://open.spotify.com/playlist/1Cim4pZnFmNXD8N4OtO3wz?si=b75cc9f3073a473b&nd=1&dlsi=49ce9ea61601457a`
   - Discord: `https://discord.com/users/331350000154050560`
   - SoundCloud: `https://soundcloud.com/probablylacedwithfentanyl`
8. Spotify and SoundCloud include embedded players.
9. Outbound navigation is optional via explicit controls.

## 3. Architecture
### 3.1 Entry/Handoff
1. `runFlow()` remains BIOS -> loader -> ready.
2. Loader completion calls social-hub handoff (`enterSocialHubState`) instead of legacy OS shell initialization.

### 3.2 File Ownership
1. HTML entry points:
   - `windose-os/ames-corner.html`
   - `windose-os/public/ames-corner.html`
2. Runtime:
   - `windose-os/src/ames-corner/main.js`
   - `windose-os/src/ames-corner/social-hub/config.js`
   - `windose-os/src/ames-corner/social-hub/state.js`
   - `windose-os/src/ames-corner/social-hub/data-sources.js`
   - `windose-os/src/ames-corner/social-hub/render.js`
3. Styles:
   - `windose-os/public/ames-corner.css`

## 4. Data Contracts
### 4.1 Site IDs
`SocialSiteId = 'twitter' | 'steam' | 'discord' | 'lastfm' | 'spotify' | 'soundcloud'`

### 4.2 Payload Shape
Each site payload implements:
1. `siteId: SocialSiteId`
2. `profile: { name: string, handle: string, url: string, avatarUrl: string, bio: string }`
3. `stats: Array<{ label: string, value: string }>`
4. `items: Array<{ id: string, title: string, meta: string, url?: string }>`
5. `embeds: { spotifyEmbedUrl?: string, soundcloudEmbedUrl?: string }`
6. `updatedAt: number`
7. `freshnessStatus: 'LIVE' | 'UPDATED' | 'CACHED' | 'STATIC'`
8. `sourceStatus: 'OK' | 'PARTIAL' | 'FAILED'`

### 4.3 Refresh Intervals
1. Twitter: 30s
2. Last.fm: 30s
3. Discord: 5m
4. Steam: 15m
5. Spotify: 10m
6. SoundCloud: 10m

### 4.4 Source/Fallback Rules
1. Primary source: remote extraction via `/remote-browser-api/extract` where applicable.
2. Last.fm:
   - Prefer API when `VITE_LASTFM_API_KEY` exists.
   - Fallback to extractor when API unavailable/failing.
3. Spotify:
   - Prefer extractor + oEmbed metadata.
   - Always provide embeddable playlist URL.
4. SoundCloud:
   - Use extractor metadata + SoundCloud widget embed URL.
5. Discord:
   - Best-effort extraction from user page.
   - Guaranteed static fallback payload.
6. On refresh failure:
   - Keep last good payload if available.
   - If no last-good payload exists, use deterministic seed payload.

## 5. UI Contract
1. Stage is fixed: `height: 100dvh`, `overflow: hidden`.
2. Desktop layout:
   - Utility strip at top with title, last refresh time, refresh action.
   - Grid of six cards, 3 columns x 2 rows.
3. Mobile layout:
   - Page remains non-scrollable.
   - Grid collapses to 1-2 columns as needed.
   - Card internals may scroll.
4. Card structure:
   - Header: platform badge, profile identity, freshness/source badges, open button.
   - Stats row: key metrics.
   - Activity region: recent entries.
   - Embed region for Spotify/SoundCloud cards.
5. Accessibility:
   - Keyboard navigation for all interactive controls.
   - Clear `:focus-visible` outlines.
   - High-contrast readable text on glass/chrome surfaces.

## 6. Visual Direction
1. Single theme: modern Y2K/2000s futurism.
2. Materials: plasticky glass and chrome panels.
3. Lighting style: neon cyan/blue accents, specular highlights, atmospheric gradients.
4. Motion style: subtle reveal and refresh pulse only; avoid aggressive animation loops.

## 7. Anti-Patterns (DO NOT)
| Do Not | Do Instead | Why |
| --- | --- | --- |
| Keep legacy OS DOM and hide it with CSS | Remove legacy shell markup from `#os-stage` | Prevents dead interactive surface and selector drift |
| Hard-fail a card on transient fetch error | Keep last-good payload and show `PARTIAL/CACHED` badge | Maintains single-screen continuity |
| Make the body/page scroll on desktop | Keep stage fixed with internal overflow control | Preserves non-scroll requirement |
| Auto-redirect card clicks to external URLs | Use explicit `Open Original` actions only | Preserves in-page-first browsing |
| Couple all site refreshes to one timer | Use per-site cadence and independent failure handling | Avoids one-source outage affecting all cards |
| Depend on Discord live data only | Always ship deterministic static fallback | Discord extraction can be blocked/rate-limited |

## 8. Error Handling Matrix
| Error Type | Detection | Response | Fallback | Badge |
| --- | --- | --- | --- | --- |
| Remote extractor timeout | request error/abort | keep prior payload | seed payload if no prior | `PARTIAL` |
| Host blocked by allowlist | 400 from extractor | log + keep prior payload | seed payload | `STATIC` |
| Last.fm API key missing | env key absent | skip API path | extractor path | `PARTIAL` |
| Last.fm API/extractor both fail | null/invalid payload | keep prior payload | seed payload | `CACHED` or `STATIC` |
| Spotify oEmbed failure | request error | keep extractor metadata | static embed URL | `PARTIAL` |
| SoundCloud widget blocked | iframe load issue | keep metadata list | open-link action remains | `PARTIAL` |
| Discord extractor no profile fields | empty extraction | preserve static profile payload | static only mode | `STATIC` |
| One card refresh fails repeatedly | failure counter increments | exponential backoff for that site | last-good payload | `CACHED` |

## 9. Test Case Specifications
### 9.1 Unit/Module Tests
| Test ID | Target | Input | Expected |
| --- | --- | --- | --- |
| TC-SH-001 | seed payloads | missing live payload | deterministic static payload rendered |
| TC-SH-002 | freshness resolver | `updatedAt` age buckets | `LIVE/UPDATED/CACHED/STATIC` resolved correctly |
| TC-SH-003 | carry-forward logic | fetch fail with previous payload | previous payload retained, source status degraded |
| TC-SH-004 | per-site scheduler | mixed intervals | each site refreshes on configured cadence |
| TC-SH-005 | embed URL builders | Spotify/SoundCloud target URLs | iframe-compatible URLs generated |
| TC-SH-006 | Discord fallback | empty extractor result | static profile card remains valid |

### 9.2 Integration Tests
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-SH-001 | BIOS -> loader -> handoff | social hub renders; legacy taskbar/start/windows absent |
| IT-SH-002 | Desktop viewport 1920x1080 | six cards visible without page scroll |
| IT-SH-003 | Desktop viewport 1366x768 | six cards still visible without page scroll |
| IT-SH-004 | Mobile viewport | page does not scroll; card internals can scroll |
| IT-SH-005 | Refresh action | refresh timestamp updates; badges react per source status |
| IT-SH-006 | Spotify/SoundCloud cards | embedded players render in-page |
| IT-SH-007 | Outbound controls | `Open Original` launches target; no forced redirect on card content interaction |
| IT-SH-008 | Allowlist expansion | extractor calls to Discord/SoundCloud hosts succeed |
| IT-SH-009 | Build integrity | `npm run build` passes |
| IT-SH-010 | Dual entry parity | root/public `ames-corner.html` remain synchronized |

## 10. References
| Topic | Location |
| --- | --- |
| Entry HTML (root) | `windose-os/ames-corner.html` |
| Entry HTML (public) | `windose-os/public/ames-corner.html` |
| Main runtime handoff | `windose-os/src/ames-corner/main.js` |
| Social hub config | `windose-os/src/ames-corner/social-hub/config.js` |
| Social hub state | `windose-os/src/ames-corner/social-hub/state.js` |
| Social hub data sources | `windose-os/src/ames-corner/social-hub/data-sources.js` |
| Social hub renderer | `windose-os/src/ames-corner/social-hub/render.js` |
| Theme/styles | `windose-os/public/ames-corner.css` |
| Env allowlist | `windose-os/.env.example` |
| Remote browser allowlist | `windose-os/scripts/remote-browser-server.mjs` |
| Runtime docs note | `windose-os/README.md` |
| CGD output | `docs/ames-corner-social-hub-rebuild-spec.cgd.md` |
