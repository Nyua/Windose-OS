# Ame's Corner Live Social Showcase Spec (Discord+Last.fm Expansion)

## 1. Scope
Expand the existing live social hub implementation to satisfy the latest platform-specific fidelity requirements.

In scope:
1. Preserve BIOS + loader behavior exactly.
2. Keep Steam live showcase behavior delivered in prior pass.
3. Keep Discord as a data source/sidebar target, but remove the Discord profile showcase card from the main showcases feed.
4. Refactor Steam showcase to only present:
   - recently played list only
   with Steam-style Recent Activity formatting and live game artwork in each row.
5. Upgrade Last.fm showcase from single chartlist to compact multi-section Last.fm-style presentation with:
   - recent songs (dense list) with a single right-side metric label per row (scrobbles/recency from source)
   - profile totals row above recent songs: total scrobbles, artists, loved tracks
   - top artists (image cards + scrobble/play counts overlay)
   - top albums (cover cards + scrobble/play counts overlay)
   - minimal sectioned layout with no extra title/meta clutter above Last.fm content blocks
6. Keep Twitter, Discord, Spotify, and SoundCloud excluded from showcase rendering (sidebar links only).
7. Apply a slight, consistent border radius across post-loader social hub container surfaces.
8. Use a left-floated profile rail layout: main profile card on the left, with `Profile Links` stacked directly beneath it.
9. Show Steam and Discord online indicators in `Profile Links`:
   - green dot when online
   - grey dot when offline.
   - small circular shape
   - no outline/border
   - subtle online-only bloom.
10. Remove the top social-hub utility container and all of its contents (title, refresh timestamp, refresh button).
11. Remove the `Main Profile` label text from the top of the main profile hero.
12. Apply frosted-glass styling to each showcase surface:
   - semi-transparent backdrop
   - subtle glass texture/grain layer
   - gaussian-blur-generated texture/caustic variation so panels are not visually uniform
   - preserve each showcase's dedicated platform color treatment.
13. Set the post-loader page background to `windose-os/public/background/2026-01-28 17-41-15.mp4`.
14. Set the main profile (Josie) avatar to the user-provided static image asset, independent of live Steam avatar changes.
15. Add a static top showcase at the top of the showcases feed with Josie description text: `I'm just here, lol.`.
16. Apply `2rem` top padding to the social hub content area.
17. Apply white frosted-glass styling to all post-loader social hub containers (not just showcase shells).
18. Ensure the post-loader social hub stage is vertically scrollable.
19. Last.fm recent list must render exactly 30 tracks (when available) with no internal list scrollbar.
20. Last.fm recent rows are separated only by a thin white divider line.
21. Last.fm totals row (`Scrobbles`, `Artists`, `Loved Tracks`) remains in one horizontal row and must appear above the `Recent Tracks` heading.
22. Frosted-glass platform tinting is dimmed for readability:
   - reduce whitening intensity/brightness on showcase and nested glass layers
   - maintain clear text contrast across all showcase content
   - preserve platform-specific tint identity while lowering perceived glare.
23. `Profile Links` interactions use direct hyperlinks (`<a href>`), not action buttons, so users can open links via standard browser link behavior.
24. Remove debug telemetry text from `Profile Links` rows (no freshness/source/no-showcase inline text).
25. Increase `Profile Links` text sizing slightly for readability.
26. Remove the `Quick Stats` sidebar container.

Out of scope:
1. Reintroducing legacy OS shell.
2. Non-`ames-corner` routes.
3. Guaranteeing private Last.fm/Discord data that is not publicly available from source APIs/pages.

## 2. Locked Decisions
1. Discord data source priority:
   - Primary: Lanyard API (`https://api.lanyard.rest/v1/users/{id}`)
   - Secondary fallback: existing profile-page meta extraction
2. Discord and Twitter cards are removed from the main showcase feed; both remain represented via sidebar/profile-link surfaces.
3. Discord profile data sourcing remains Lanyard-first for identity/status/activity for non-showcase usage.
4. Discord banner + bio source priority is:
   - explicit user overrides (provided in local social-hub config)
   - Lanyard/fallback extraction (for bio only)
   - previous cached payload
5. Discord avatar decoration data remains available for non-showcase/profile usage when needed.
6. Steam showcase content is constrained to recently played only (no in-showcase presence/level chips).
7. Steam recent activity visual format should mirror Steam's list structure:
   - section header with total hours past 2 weeks
   - game rows with capsule image, title, hours on record, and last-played line
8. Steam and Discord online state must be surfaced beside their `Profile Links` labels as a binary dot indicator (online vs offline).
9. Status-dot styling is fixed to small circles without outlines and with subtle glow only when online.
10. Last.fm data source priority:
   - Primary: Last.fm API (if `VITE_LASTFM_API_KEY` exists) for recent tracks + top artists + top albums + profile totals
   - Secondary fallback: page extraction for chartlist/top lists
11. Recent songs should display one right-side metric label from available source data (for example scrobbles or recency), without extra columns.
12. Top artists and top albums cards must include artwork and count badge anchored in bottom-left.
13. Last.fm showcase must not render a generic showcase header label (for example, no "Last.fm Activity" strip).
14. Container surfaces use a slight, consistent border radius across the post-loader social hub UI.
15. Last.fm monthly top artists and top albums grids must render in a fixed 2-row by 4-column layout (8 cards each) when enough data exists.
16. Main profile presentation must match the requested container style: large profile image block with profile copy/bio directly underneath, anchored in the left rail.
17. Main profile hero text treatment:
   - center username directly beneath the profile image
   - center bio text beneath username
   - do not render the profile URL/handle line beneath username.
18. Steam seed/fallback hero bio text must be exactly: `Ëšâ‚Šâ€§ê’°áƒ â™¡ à»’ê’± â€§â‚ŠËš`.

19. Top utility strip is removed from the social hub layout and is not rendered in DOM.
20. Main profile hero is rendered without the `Main Profile` heading row.
21. Showcase visual treatment is a glass-tinted, translucent shell (with blur + texture) rather than opaque flat fills.
22. The `os-stage` background source is a dedicated full-viewport MP4 video layer using `2026-01-28 17-41-15.mp4`.
23. Main profile hero avatar source is locked to `/avatars/josie-main-profile.jpg`.
24. Showcase frosted-glass texture is driven by gaussian-blurred multi-layer overlays at the shared showcase shell level (all showcases inherit).
25. A static non-live showcase renders first in the showcase stack with the exact description text: `I'm just here, lol.`.
26. Social hub main content grid uses `padding-top: 2rem`.
27. All social-hub containers use a white frosted-glass surface treatment with blur and translucency.
28. Last.fm recent section title text is `Recent Tracks`.
29. Last.fm recent list item cap is fixed to 30.
30. Last.fm recent list uses page scroll (no inner scroll region).
31. Last.fm totals block is rendered before the `Recent Tracks` title and remains horizontally aligned.
32. Showcase and nested frosted-glass layers use a lower-luminance mix to improve readability while keeping platform accents visible.
33. `Profile Links` rows expose native hyperlink elements for platform destinations rather than `Open` buttons.
34. `Profile Links` rows do not render debug telemetry/meta text beneath platform labels.
35. Sidebar renders only the `Profile Links` panel (no `Quick Stats` panel).

## 3. Data Contract Adjustments
1. Extend Last.fm payload with section data:
   - `sections.profileTotals = { scrobbles, artists, lovedTracks }`
   - `sections.topArtists[] = { id, title, imageUrl, countLabel, url }`
   - `sections.topAlbums[] = { id, title, subtitle, imageUrl, countLabel, url }`
2. Discord payload profile fields extended/used:
   - `profile.statusText`
   - `profile.bio` (user override first, Lanyard/fallback second)
   - `profile.avatarUrl`
   - `profile.bannerUrl` (user-provided override first)
   - `profile.decorationUrl` (Lanyard decoration asset or override)
3. Recent-track item metadata should encode artist + relative time when available.
4. Add local config override contract:
   - `DISCORD_PROFILE_OVERRIDES = { bannerUrl, bio, decorationUrl }`
5. Extend Steam recent activity item payload fields:
   - `items[].imageUrl`
   - `items[].artworkUrl` (resolved final artwork URL for renderer use)
   - `items[].appId`
   - `items[].hoursOnRecord`
   - `items[].lastPlayed`
6. Steam + Discord profile fields used for link-rail status dots:
   - `profile.statusText`
   - `profile.statusKey` (Discord)

## 4. Renderer Contract
1. Discord and Twitter renderer output is suppressed from main showcases (no Discord/Twitter showcase articles rendered).
2. Steam renderer must output a Steam-style Recent Activity block containing only:
   - recent activity header with total 2-week hours
   - recent game rows with artwork + title + hours on record + last played
   - no in-showcase presence or level indicators.
3. Last.fm renderer must output compact stacked sections:
   - Profile totals row (Scrobbles / Artists / Loved Tracks) above recent list
   - Recent Songs list/table (many entries)
   - Top Artists card grid
   - Top Albums card grid
4. Last.fm renderer must omit the standard showcase head strip and profile intro block to reduce clutter.
5. Top Artists and Top Albums grids each render max 8 entries in a fixed 4-column layout (2 rows).
6. Artist/album cards include count overlays in bottom-left.
7. Existing freshness/source chips and explicit `Open Original` actions remain for non-Last.fm showcases.
8. Page layout uses a two-column content shell:
   - left rail: profile card then sidebar panel (`Profile Links`)
   - right rail: social showcases feed
9. `Profile Links` rows for Steam and Discord include an inline online-status dot (green online, grey offline) beside platform label.
10. Status dots render as small circles with no outline and only a subtle online bloom effect.
11. Main profile hero renderer must omit the handle/URL line and center-align username + bio copy.
12. Main profile hero renderer must not render `Main Profile` label text.
13. Top utility strip container (title + refresh status + refresh button) is removed from page markup.
14. Showcase shell styles must render frosted-glass backgrounds with texture while retaining platform-specific accent tinting.
15. Frosted-glass texture must use gaussian-blurred layered overlays to introduce non-uniform variation across each showcase surface.
16. The `os-stage` background must render the specified MP4 as a fixed full-viewport layer behind all social hub content.
17. Main profile hero avatar renderer must use the locked Josie asset path and must not switch to live Steam avatar images.
18. Showcases renderer must prepend a static Josie description showcase before all live social showcases.
19. Social hub content shell applies `2rem` top padding above profile rail and showcase feed.
20. CSS container surfaces across hero, sidebar panels/rows/stats, showcase shells, activity shells, and Last.fm section blocks use white frosted-glass backgrounds.
21. Post-loader stage supports vertical scroll for long showcase content.
22. Last.fm recent list renderer outputs up to 30 entries and does not apply a scroll container.
23. Last.fm recent list rows use thin white separators without card-style row borders.
24. Last.fm profile totals row renders above the `Recent Tracks` heading in a single horizontal row.
25. Showcase shell and nested frosted surfaces use dimmer glass tokens and subtler highlight overlays to reduce glare and improve text legibility.
26. Sidebar `Profile Links` use native anchors for platform destinations and do not rely on button-only interaction for opening links.

## 5. Anti-Patterns (DO NOT)
| Do Not | Do Instead | Why |
| --- | --- | --- |
| Ignore explicit user-provided Discord banner/bio overrides | prefer override values before live fallback | matches locked user-provided branding requirement |
| Render Discord or Twitter showcase cards in main feed | suppress Discord/Twitter showcase cards and keep those platforms surfaced in sidebar/profile links | matches latest request to remove those feed cards |
| Keep Last.fm as one simple table only | render recent + top artists + top albums sections | matches requested site-like density |
| Render Last.fm inside a generic showcase label/head box | render Last.fm sections directly without showcase head/meta strip | matches user-requested minimal structure |
| Leave container corner radius inconsistent across panels/cards | enforce a single slight radius token across primary container surfaces | keeps the container system visually cohesive |
| Use fluid auto-fill Last.fm top grids | use fixed 4-column grid and cap to 8 entries | enforces requested 2x4 monthly layout |
| Keep profile hero full-width above content | place profile hero in a left rail with sidebar stacked below | matches requested profile positioning/layout |
| Render Steam profile URL line under hero username | omit handle/URL line from hero copy | matches latest main-profile cleanup request |
| Left-align hero username/bio copy | center-align username and bio under avatar | matches requested profile text alignment |
| Keep `Main Profile` label text above hero content | remove the label text and heading row from hero | matches latest request to remove hero top text |
| Keep top utility container and controls | remove utility container and all children from top of page | matches latest request to remove the top container |
| Keep square/outlined status indicators | render small circular dots with no borders and subtle online glow only | matches latest status-indicator styling request |
| Use opaque flat showcase backgrounds | use translucent frosted-glass layers with subtle texture and platform accent tinting | matches latest glass-effect styling request |
| Use uniform flat overlays for showcase glass | use gaussian-blurred multi-layer texture overlays on the shared showcase shell | matches latest non-uniform frosted glass requirement |
| Keep gradient-only static page background | use the specified WebM as the primary post-loader background layer | matches latest background-source request |
| Continue binding main hero avatar to live Steam avatar payload | render the hero avatar from the locked Josie static asset path | matches latest explicit avatar override request |
| Append new description text inside existing cards only | prepend a dedicated top showcase containing the exact Josie description text | matches latest top-showcase request |
| Leave social-hub content flush to top | apply `padding-top: 2rem` to social hub content wrapper | matches latest spacing request |
| Keep dark/tinted container backgrounds while only showcases are frosted | apply white frosted-glass styling to all social-hub container surfaces | matches latest global white frosted request |
| Keep recent tracks in an internally scrolling box | render all 30 tracks directly in page flow with no internal scrollbar | matches latest Last.fm list behavior request |
| Place `Recent Tracks` title above totals | render totals row first, then the `Recent Tracks` title | matches latest Last.fm heading order request |
| Stack Last.fm totals vertically on desktop | keep totals in one horizontal row (three columns) | matches screenshot parity request |
| Keep frosted-glass luminance so high that text legibility drops | dim showcase/inner glass layers and rebalance contrast while preserving platform tint | addresses latest readability requirement |
| Require a separate `Open` button in Profile Links | render native hyperlink elements for profile destinations | matches latest request for direct link behavior |
| Show freshness/source/no-showcase debug strings under Profile Links | render clean link rows without debug meta text | matches latest request to remove debug text from Profile Links |
| Keep Quick Stats container in the sidebar | remove Quick Stats panel and keep only Profile Links in sidebar | matches latest request to remove Quick Stats container |
| Keep Steam status/level chips inside showcase | remove in-showcase status/level and keep Steam card focused on recent activity only | matches latest Steam showcase simplification request |
| Omit Steam/Discord online indicator from Profile Links | render binary status dots beside Steam + Discord labels in sidebar | matches latest status-placement requirement |
| Omit profile counters from Last.fm card | render scrobbles/artists/loved totals above recent tracks | matches requested parity with Last.fm profile header |
| Hide count metrics in hover-only UI | keep scrobble/play overlays always visible | requested explicit visual treatment |
| Drop fallback when API keys/data unavailable | keep deterministic fallback and prior-payload carry-forward | resilience and non-breaking UX |
| Re-add Spotify/SoundCloud showcase cards | keep them excluded from main feed | requirement remains locked |

## 6. Error Handling Matrix
| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Lanyard request fails | network/non-200/invalid payload | keep last known Discord payload | profile card with fallback identity/status |
| Lanyard has no bio/description | empty bio/custom status | retain override or previous non-empty bio | show default profile description text |
| User-provided Discord banner URL invalid | non-resolving/empty URL | fall back to gradient banner | card remains readable and styled |
| Discord decoration URL missing/invalid | empty URL or failed image | keep avatar visible with no decoration layer | no broken-image artifacts on profile picture |
| Last.fm API unavailable | missing key/timeout/invalid response | run extractor fallback | render cached/seed sections |
| Last.fm section partially missing | one of recent/artists/albums empty | render available sections and keep others from prior payload | maintain full layout continuity |
| Last.fm totals unavailable | totals missing from API/extractor | keep prior totals if present | show deterministic `--` placeholders |
| Artwork URL invalid | broken image | show card fallback placeholder style | keep count overlays and text readable |

## 7. Test Case Specifications
### Integration
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-DS-001 | Discord payload fetch | Lanyard fields populate name/avatar/status/activity when available |
| IT-DS-002 | Discord overrides | user-provided `banner + bio` supersede fallback/lanyard bio content |
| IT-DS-003 | Discord showcase suppression | no Discord profile card article is rendered in main showcases |
| IT-TW-001 | Twitter showcase suppression | no Twitter feed showcase article is rendered in main showcases |
| IT-ST-001 | Steam showcase scope | Steam card includes recent activity only (no in-showcase presence/level chips) |
| IT-ST-002 | Steam recent layout | Steam recent list rows render artwork, title, hours-on-record, and last-played text |
| IT-ST-003 | Steam artwork resolution | each recent game row resolves artwork from live capsule source or deterministic app-id artwork fallback |
| IT-SB-001 | Profile Links status indicators | Steam + Discord rows show small circular green/grey dots with no outline and subtle online glow |
| IT-HR-001 | Hero copy layout | main profile username + bio are centered under avatar and no handle/URL line is rendered |
| IT-HR-002 | Steam seed hero bio | initial/fallback Steam hero bio renders exactly `Ëšâ‚Šâ€§ê’°áƒ â™¡ à»’ê’± â€§â‚ŠËš` |
| IT-HR-003 | Hero top label removal | `Main Profile` label text is not rendered in hero |
| IT-LYT-002 | Utility strip removal | top social-hub utility container and controls are absent from DOM |
| IT-GL-001 | Showcase glass treatment | each showcase renders with translucent frosted background + subtle texture overlay |
| IT-GL-002 | Platform tint preservation | Steam/Last.fm showcase accent palettes remain distinct after frosted-glass restyle |
| IT-GL-003 | Gaussian texture layer | showcase shell pseudo-layer uses gaussian blur and non-uniform texture treatment across all showcase variants |
| IT-BG-001 | Page background source | `os-stage` contains a full-viewport background video using `2026-01-28 17-41-15.mp4` |
| IT-HR-004 | Hero avatar source lock | main profile avatar image source resolves to `/avatars/josie-main-profile.jpg` |
| IT-JO-001 | Josie top showcase | first showcase in `#social-hub-showcases` is a static Josie description showcase containing `I'm just here, lol.` |
| IT-LYT-003 | Content top padding | `.social-hub-content` computes to `padding-top: 2rem` |
| IT-GL-004 | Global white frosted containers | hero, sidebar containers, showcases, activity blocks, and Last.fm section containers render white frosted-glass surfaces |
| IT-GL-005 | Frosted brightness/readability balance | showcase and nested frosted layers render dimmer than prior pass and text remains clearly readable |
| IT-SB-002 | Profile links are native anchors | each platform entry in `Profile Links` is rendered as an `<a>` hyperlink without requiring an `Open` button click |
| IT-SB-003 | Profile links debug text removal | no freshness/source/no-showcase debug meta text is rendered under Profile Links rows |
| IT-SB-004 | Profile links typography | Profile Links text size is increased versus prior baseline |
| IT-SB-005 | Quick Stats removal | no `Quick Stats` panel is rendered in the sidebar |
| IT-LYT-004 | Page scrollability | post-loader stage is vertically scrollable when content exceeds viewport |
| IT-LF-001 | Last.fm API path | recent/top artists/top albums populate sections |
| IT-LF-002 | Last.fm extractor fallback | sections still render with partial/cached data |
| IT-LF-003 | Recent songs metadata | rows show one right-side metric label (scrobbles/recency) with no extra row metadata columns |
| IT-LF-004 | Count overlays | artist/album cards show bottom-left play/scrobble badge |
| IT-LF-005 | Profile totals row | scrobbles/artists/loved tracks render above recent list |
| IT-LF-006 | Last.fm minimal chrome | no generic Last.fm showcase head/profile intro appears above sections |
| IT-LF-007 | Last.fm top grids | top artists and top albums each render up to 8 cards in 4 columns x 2 rows |
| IT-LF-008 | Last.fm recent count | recent tracks section renders up to 30 rows |
| IT-LF-009 | Last.fm list scrolling | recent tracks list has no internal scrollbar (`overflow: visible`) |
| IT-LF-010 | Last.fm row separators | each recent track row is separated by a thin white divider line only |
| IT-EX-001 | Exclusion policy | no Twitter/Discord/Spotify/SoundCloud showcase blocks rendered |
| IT-UI-001 | Container corner radius policy | primary post-loader social hub containers render with a slight, consistent border radius |
| IT-LYT-001 | Left rail layout | profile card is left-floated and `Profile Links` renders directly below it |
| IT-BLD-001 | Build | `npm run build` passes |

### Regression
| Test ID | Area | Verification |
| --- | --- | --- |
| RG-001 | BIOS/loader continuity | boot flow unchanged |
| RG-002 | Refresh behavior | auto refresh remains operational without visible top utility controls |
| RG-003 | Sidebar links | all site open actions still work |

## 8. References
1. `windose-os/src/ames-corner/social-hub/data-sources.js`
2. `windose-os/src/ames-corner/social-hub/render.js`
3. `windose-os/public/ames-corner.css`
4. `docs/ames-corner-live-social-showcase-spec.cgd.md`

