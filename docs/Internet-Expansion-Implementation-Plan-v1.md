# Internet Expansion Implementation Plan (v1)

## Metadata
- Date: 2026-02-15
- Owner: implementation planning team
- Project: `windose-os`
- Primary target: Extend the Internet app recreations across all sites with higher visual fidelity, richer embedded content, and live data updates (starting with Last.fm real-time song updates).
- Source references:
  - `docs/Strategic-Blueprint.md`
  - `docs/Project_Phase_2_Implementation_Ready.md`
  - `windose-os/src/components/InternetApp.vue`

## Clarity Status
- Decision status: PARTIALLY LOCKED
- Fact markers:
  - VERIFIED: Current mock site shell exists in `windose-os/src/components/InternetApp.vue`.
  - VERIFIED: Click-through behavior routes users to external real sites.
  - VERIFIED: Local dev flow already used for visual iteration.
- Assumptions:
  - ASSUMPTION: Live Spotify and Twitter/X data may require non-trivial auth, scraping fallback, or partial cache-first behavior.
  - ASSUMPTION: Last.fm API key can be provided and used in client-safe pattern or via proxy.
  - ASSUMPTION: "Rest of the sites" means all Internet app entries (Twitter/X, Steam, YouTube, Last.fm, Spotify).

## 1. Objective
Implement the same high-fidelity recreation process for all Internet sub-sites, matching recognizable platform-specific layouts while preserving Windose/NSO identity.  
Add live updates where feasible, with Last.fm real-time track updates as the first production live-data feature.

## 2. Scope

### In Scope
- Visual parity upgrades for:
  - Twitter/X-style timeline/profile recreation
  - Steam profile recreation
  - YouTube channel/profile recreation
  - Last.fm profile/listening recreation
  - Spotify playlist/profile recreation
- Embedded media in cards where relevant (images/videos for Twitter/X mock timeline).
- Full-window rendering (no nested fake browser chrome unless explicitly reintroduced).
- Scrollable, content-dense sections per site.
- Live-data architecture and polling system.
- Real-time Last.fm update implementation.
- Data freshness and fallback state indicators (`LIVE`, `UPDATED`, `CACHED`, `STATIC`).

### Out of Scope (v1)
- Full official OAuth app flows for every platform in this phase.
- Server-side account impersonation or private data access.
- Moderation/admin tooling for content ingestion.
- Full historical data sync for every source.

## 3. Architecture

### 3.1 Unified Internet Data Layer
Create normalized adapters under:
- `windose-os/src/services/internet/types.ts`
- `windose-os/src/services/internet/adapters/lastfm.ts`
- `windose-os/src/services/internet/adapters/youtube.ts`
- `windose-os/src/services/internet/adapters/spotify.ts`
- `windose-os/src/services/internet/adapters/twitter.ts`
- `windose-os/src/services/internet/adapters/steam.ts`
- `windose-os/src/services/internet/cache.ts`
- `windose-os/src/services/internet/refreshManager.ts`

Normalized record contract:
- `siteId`
- `profile` (`name`, `handle`, `avatarUrl`, `bio`)
- `stats[]` (`label`, `value`)
- `sections[]` (site-specific blocks)
- `items[]` (timeline/tracks/cards)
- `updatedAt`
- `freshnessStatus` (`LIVE|UPDATED|CACHED|STATIC`)
- `sourceStatus` (`OK|PARTIAL|FAILED`)

### 3.2 Refresh Model
- Default polling cadence:
  - Last.fm: 30s
  - YouTube: 10m
  - Spotify: 10m
  - Steam: 15m
  - Twitter/X fallback: 5m
- Adaptive backoff on failure: 30s -> 60s -> 120s -> 300s max.
- Stale-while-revalidate behavior:
  - Immediately render cached data.
  - Refresh in background.
  - Patch only changed rows to avoid scroll jumps.

### 3.3 Runtime State
Add internet store:
- `windose-os/src/stores/internet.ts`

Store responsibilities:
- Holds site payloads keyed by `siteId`.
- Tracks freshness timestamps and error state.
- Exposes update actions per site and global refresh trigger.
- Preserves active scroll offsets on partial patch updates.

## 4. Site-by-Site Implementation Plan

### 4.1 Twitter/X Mock
- Expand timeline with embedded media cards:
  - Image gallery cards
  - Auto-muted looping video previews
- Add retweet/repost visual affordances.
- Keep all card/button clicks routing to real links.
- Add right-column module equivalents:
  - Trends block (mocked/cached)
  - Who to follow block (mocked/cached)

### 4.2 Steam Mock
- Recreate profile hero + stats blocks + showcase rows.
- Add comment wall cards and featured groups list.
- Add richer inventory/review placeholders fed by normalized content.

### 4.3 YouTube Mock
- Improve channel header + tab strip + upload grid fidelity.
- Add upload tiles with metadata density similar to classic channel pages.
- Introduce featured/playlist modules and section separators.

### 4.4 Last.fm Mock (Priority Live)
- Implement real-time now playing and recent tracks refresh.
- Update top tracks module with lightweight periodic refresh.
- Add explicit freshness badge and update timestamp.
- Keep privacy fallback message when source unavailable.

### 4.5 Spotify Mock
- Improve playlist hero and track table layout.
- Add richer row metadata and section modules (recommended/related blocks).
- Use cache-first refresh due to potential source access constraints.

## 5. Last.fm Real-Time Update Design

### Data Sources
- Preferred:
  - `user.getRecentTracks`
  - `user.getTopTracks`
  - `user.getTopArtists`
- Optional:
  - `user.getInfo`

### Behavior
- Poll recent tracks every 30 seconds.
- Detect `nowplaying="true"` rows and pin to top section.
- Maintain local dedupe by `(track, artist, timestamp)` hash.
- Patch only delta rows.
- If API fails:
  - Show `CACHED` status with last successful timestamp.
  - Continue retry with backoff.

### UI Status Rules
- `LIVE`: successful update <= 60s.
- `UPDATED`: successful update <= 10m.
- `CACHED`: stale update > 10m but cache available.
- `STATIC`: no live source configured.

## 6. Phased Execution

### Phase 1: Data Foundations (Day 1-2)
- Add normalized types and store.
- Add cache + refresh manager.
- Wire current static payloads to normalized shape.

### Phase 2: Last.fm Live (Day 3-4)
- Implement Last.fm adapter and poller.
- Add freshness state UI.
- Add tests for diff patch and dedupe.

### Phase 3: Remaining Site Upgrades (Day 5-8)
- Twitter/X media/timeline parity pass.
- Steam profile/layout parity pass.
- YouTube channel parity pass.
- Spotify playlist parity pass.

### Phase 4: Hardening + QA (Day 9-10)
- Error/fallback behavior validation.
- Mobile and desktop scroll/interaction regression.
- Performance pass (lazy media loading, offscreen pause).

## 7. Anti-Patterns (DO NOT)

| Don't | Do Instead | Why |
|---|---|---|
| Hardcode site-specific parsing in Vue component | Keep parsing in adapters | Prevents UI/data coupling |
| Full replace entire list on each poll | Apply delta patch updates | Avoids scroll jumps and flicker |
| Treat missing live source as hard failure | Use cache-first fallback with status badge | Keeps UI usable |
| Autoplay audible media in feeds | Use muted/inline loops only | Prevents intrusive UX |
| Assume all sources are public/no-auth | Gate by source capability and fallback mode | Prevents brittle runtime failures |

## 8. Test Case Specifications

### Unit Tests
| Test ID | Component | Input | Expected Output | Edge Cases |
|---|---|---|---|---|
| TC-001 | Last.fm adapter | valid API payload | normalized item list | missing artist image |
| TC-002 | Diff patcher | old/new item arrays | only changed rows replaced | reordered entries |
| TC-003 | Freshness classifier | timestamp deltas | LIVE/UPDATED/CACHED/STATIC | clock skew |
| TC-004 | Cache manager | stale + fresh records | correct TTL behavior | corrupted cache |
| TC-005 | Media parser | tweet media URLs | correct mediaType/mediaUrls | mixed image+video rows |

### Integration Tests
| Test ID | Flow | Setup | Verification | Teardown |
|---|---|---|---|---|
| IT-001 | Last.fm live polling | mock API server | updates render without full rerender | clear intervals |
| IT-002 | Source failure fallback | force adapter error | cached content shown + status CACHED | reset adapter |
| IT-003 | Site switch persistence | open multiple site mocks | per-site data and scroll state retained | clear store |

## 9. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
|---|---|---|---|---|
| Last.fm timeout | request > timeout threshold | retry with backoff | cached recent tracks | `warn` + timestamp |
| 429 rate-limit | HTTP 429 | exponential backoff | cached data + stale badge | `warn` with endpoint |
| malformed payload | schema guard fail | skip invalid row | preserve previous valid rows | `error` with parser key |
| no cache + fetch fail | fetch error and cache miss | show static placeholder module | static data | `error` + siteId |
| media URL load failure | `img/video` error event | hide broken element | text-only card | `info` count only |

## 10. Deliverables
- `docs/Internet-Expansion-Implementation-Plan-v1.md` (this file)
- Implementation PR set:
  - data layer + store
  - Last.fm live updates
  - site-by-site parity updates
  - tests and QA fixes

## 11. Definition of Done
- All Internet mock sites follow the same fidelity pipeline and are visibly closer to real platform layouts.
- Last.fm live song updates work with stable polling and fallback behavior.
- All mock pages remain full-window, scrollable, and click-through to real destinations.
- Freshness state visible and correct for each data source.
- Build/test pass with no regressions to existing window behavior.

## 12. Open Inputs Needed
- Last.fm API key (if not already configured).
- Preferred live update interval confirmation (default proposed: 30s for Last.fm).
- Confirmation on acceptable data source strategy for Twitter/Spotify when direct API access is limited.
