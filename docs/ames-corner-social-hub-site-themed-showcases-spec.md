# Ame's Corner Site-Themed Showcases Spec (Implementation)

## 1. Scope
Refine the existing Steam-style scroll page so it more closely matches Steam profile composition and introduces site-specific showcase styling.

In scope:
1. Preserve BIOS and loader unchanged.
2. Keep social-only post-loader runtime.
3. Increase showcase density to resemble a Steam profile with many showcase blocks.
4. Apply per-platform visual language for each showcase:
   - Steam, X/Twitter, Discord, Last.fm, Spotify, SoundCloud.
5. Keep each showcase mapped to one social platform and its data.

Out of scope:
1. Non-Ame routes.
2. Reintroducing old OS shell UX.
3. Data source contract changes beyond presentation.

## 2. Locked Decisions
1. Overall page remains Steam-profile style (dark, layered, scrollable).
2. Showcase count increases by splitting each social into multiple showcase blocks:
   - Profile Overview showcase
   - Activity/Posts showcase
   - Media showcase where applicable (embed-enabled platforms)
3. Each platform showcase uses platform-specific accents/texture direction.
4. Existing live+fallback payload behavior stays intact.

## 3. Layout Contract
1. Stage scroll:
   - `#os-stage` is vertical scroll container.
2. Page composition:
   - Sticky utility strip
   - Profile hero
   - Two-column content area:
     - Main column: stacked showcases (high count)
     - Sidebar column: links, quick stats, profile pointers
3. Responsive behavior:
   - Desktop: two-column content
   - Tablet/mobile: single-column stack

## 4. Showcase Contract
For each `siteId`:
1. `overview` block renders identity + key stats.
2. `activity` block renders recent posts/items.
3. `media` block renders embed where present (Spotify/SoundCloud), otherwise optional.
4. All blocks retain:
   - freshness chip
   - source chip
   - explicit `Open Original` action

## 5. Site Visual Mapping
1. Steam: deep navy/steel, subtle cyan highlights.
2. X/Twitter: dark graphite with blue accent.
3. Discord: blurple/indigo gradients.
4. Last.fm: charcoal with crimson accents.
5. Spotify: dark green/black neon.
6. SoundCloud: black/orange gradient.

Implementation note:
- Use class-based site variants (e.g. `.steam-showcase--spotify`) with CSS variable overrides.

## 6. Anti-Patterns (DO NOT)
| Do Not | Do Instead | Why |
| --- | --- | --- |
| Use one generic style for all site showcases | apply per-site themed variants | matches user requirement |
| Keep only six total blocks | split into multiple showcase modules per site | matches “ton of showcases” direction |
| Break data bindings while adding variants | preserve existing payload-driven rendering | prevents functional regressions |
| Force outbound navigation for viewing content | keep explicit click actions only | in-page-first behavior |
| Make sidebar required for mobile usability | collapse sidebar below main on small viewports | responsive accessibility |

## 7. Error Handling Matrix
| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Missing platform payload | undefined site payload | render static seeded showcase blocks | preserve layout continuity |
| Missing embed URL | no embed field | omit media showcase iframe | keep overview/activity blocks |
| Invalid showcase variant class | CSS miss | base showcase style remains | no runtime break |
| Sidebar render data missing | null summary | show default counters/labels | avoid empty right rail |
| Overflow regression | stage not scrollable in QA | enforce `#os-stage { overflow-y: auto; }` | preserve page usability |

## 8. Test Case Specifications
### Integration
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-ST-001 | BIOS -> loader -> ready | Steam-style profile page appears |
| IT-ST-002 | Showcase count check | > 6 showcase blocks rendered (target 12+) |
| IT-ST-003 | Site variant check | each site block has site-specific class and visual variant |
| IT-ST-004 | Scroll check | stage scrolls top-to-bottom on desktop and mobile |
| IT-ST-005 | Sidebar check | desktop sidebar present; mobile collapse behavior valid |
| IT-ST-006 | Refresh control | global refresh button state transitions remain correct |
| IT-ST-007 | Build | `npm run build` passes |
| IT-ST-008 | Entry parity | root/public html files match |

### Regression
| Test ID | Area | Verification |
| --- | --- | --- |
| RG-ST-001 | Data pipeline | live+fallback updates still render |
| RG-ST-002 | Embed behavior | Spotify/SoundCloud embeds still load in-page |
| RG-ST-003 | Action links | open-original/item actions still work |

## 9. References
1. `windose-os/ames-corner.html`
2. `windose-os/public/ames-corner.html`
3. `windose-os/public/ames-corner.css`
4. `windose-os/src/ames-corner/main.js`
5. `windose-os/src/ames-corner/social-hub/render.js`
6. `docs/ames-corner-social-hub-site-themed-showcases-spec.cgd.md`
