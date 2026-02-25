# Ame's Corner Social Hub Steam-Style Scroll Spec (Implementation)

## 1. Scope
Rework the post-loader Ame's Corner social hub from a fixed dashboard into a Steam-profile-style long page.

In scope:
1. Keep BIOS + loader behavior unchanged.
2. Keep post-loader experience as social-only (no legacy OS shell).
3. Convert social layout to a large scrollable profile page.
4. Mirror Steam profile structure:
   - Profile header/hero.
   - Vertical showcase sections.
5. Use all social targets as showcase content:
   - X/Twitter, Steam, Discord, Last.fm, Spotify, SoundCloud.
6. Preserve live+fallback data strategy and existing refresh cadence.

Out of scope:
1. Changes to non-Ame routes.
2. Reintroducing taskbar/start/windows desktop shell.
3. New framework/tooling changes.

## 2. Locked Decisions
1. BIOS + loader remain intact.
2. Post-loader is a single long scrollable page.
3. Structure should read like a Steam profile page.
4. Showcase sections represent socials and their content.
5. Spotify and SoundCloud embeds remain in-page.
6. Explicit outbound actions remain optional.

## 3. Runtime Contract
1. HTML roots:
   - `windose-os/ames-corner.html`
   - `windose-os/public/ames-corner.html`
2. Runtime:
   - `windose-os/src/ames-corner/main.js`
   - `windose-os/src/ames-corner/social-hub/render.js`
3. Styles:
   - `windose-os/public/ames-corner.css`

## 4. Layout Contract
1. Stage scroll model:
   - `#os-stage` becomes the scrolling container (`overflow-y: auto`).
   - Body remains locked; scroll happens within stage.
2. Steam-style page sections:
   - Top utility strip (title + refresh metadata/action).
   - Profile hero block with avatar, handle, summary stats.
   - Showcase stack (`6` sections; one per social).
3. Showcase section anatomy:
   - Header row: platform title, freshness + source chips, open action.
   - Left summary pane: identity + stats.
   - Right content pane: recent items list.
   - Embed pane for Spotify/SoundCloud where available.
4. Responsiveness:
   - Desktop: wide two-column internals within each showcase.
   - Mobile: single-column showcase internals.
   - Page remains scrollable at all sizes.

## 5. Data/Interaction Contract
1. Reuse current `SocialPayload` contract.
2. Render order for showcases is fixed by site config list.
3. Refresh button behavior:
   - `Refreshing...` while global refresh is running.
   - Returns to `Refresh All` when complete.
4. Item buttons and open buttons:
   - open in new tab via explicit action.
5. Fallback states:
   - preserve current source/freshness badges and carry-forward behavior.

## 6. Anti-Patterns (DO NOT)
| Do Not | Do Instead | Why |
| --- | --- | --- |
| Keep fixed 3x2 dashboard grid | Use vertical showcase stack | Matches Steam-profile ask |
| Force users to leave page for core content | Keep data + embeds in-page | Matches all-socials-in-one-place goal |
| Put scroll on body with fixed clipping conflicts | Scroll `#os-stage` directly | Predictable BIOS/loader + stage behavior |
| Remove fallback behavior while redesigning | Preserve live+fallback logic | Avoids regression under extraction failures |
| Reintroduce legacy shell widgets | Keep social-only post-loader stage | Scope lock from prior rebuild |

## 7. Error Handling Matrix
| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Renderer selector mismatch | missing root/containers | no-op render cycle | keep app alive; next refresh can recover |
| Showcase payload missing | undefined payload | render seed/static card block | maintain section continuity |
| Stage overflow misconfigured | no stage scroll in QA | force `#os-stage` overflow-y auto | preserve usability |
| Embed url missing | missing embed field | skip iframe block | keep item list + open action |
| Refresh race | concurrent manual + interval | keep existing in-flight guard | stable UI state |

## 8. Test Case Specifications
### Integration
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-SS-001 | BIOS -> loader -> handoff | social profile page loads; no old shell controls |
| IT-SS-002 | Desktop viewport | page scrolls vertically with hero + 6 showcases |
| IT-SS-003 | Mobile viewport | page scrolls; showcases collapse to single-column internals |
| IT-SS-004 | Refresh action | label + disabled state transition works |
| IT-SS-005 | Embeds | Spotify and SoundCloud iframe sections render when URLs exist |
| IT-SS-006 | Links | Open Original + item links open by explicit action only |
| IT-SS-007 | Build | `npm run build` passes |
| IT-SS-008 | Entry parity | root/public `ames-corner.html` are in sync |

### Regression
| Test ID | Area | Verification |
| --- | --- | --- |
| RG-SS-001 | BIOS/loader | unchanged behavior/timing progression |
| RG-SS-002 | Data orchestration | per-site refresh cadence still active |
| RG-SS-003 | Badge semantics | freshness/source chip classes preserved |

## 9. References
1. `windose-os/ames-corner.html`
2. `windose-os/public/ames-corner.html`
3. `windose-os/public/ames-corner.css`
4. `windose-os/src/ames-corner/main.js`
5. `windose-os/src/ames-corner/social-hub/render.js`
6. `windose-os/src/ames-corner/social-hub/state.js`
7. `windose-os/src/ames-corner/social-hub/data-sources.js`
8. `docs/ames-corner-social-hub-steam-scroll-spec.cgd.md`
