---
clarity-gate-version: 2.1
processed-date: 2026-02-24
processed-by: codex + user direction
clarity-status: CLEAR
hitl-status: REVIEWED
hitl-pending-count: 0
points-passed: 1-9
document-sha256: pending-recompute
hitl-claims: []
---

# Ame's Corner Live Social Showcase Spec (CGD)

Source: `docs/ames-corner-live-social-showcase-spec.md`

## Clarity Review Summary
1. Scope now explicitly captures Discord+Twitter showcase suppression, Steam recent-activity-only presentation, required Steam row artwork, and Last.fm section expansion.
2. Data-source priority and fallback behavior are explicit and testable, including Discord override precedence for non-showcase usage.
3. Rendering contract is concrete for Steam recent-activity formatting with no in-showcase status/level chips and Last.fm multi-section compact layout, including profile totals row and headless/minimal presentation.
4. UI constraints now explicitly include slight, consistent container corner radius across post-loader social hub surfaces, reduced Last.fm clutter, fixed 4x2 monthly top grids for artists/albums, and a left-floated profile rail composition.
5. Layout contract clearly places profile card first in the left rail with sidebar panels directly beneath and showcases on the right, plus Steam/Discord small circular no-outline status dots in `Profile Links`.
6. Main profile hero requirements are explicit: centered username/bio, no handle line, no `Main Profile` top label text, and deterministic Steam seed/fallback bio string.
7. Top utility strip removal is explicit: title/refresh timestamp/refresh button are removed from the social hub DOM.
8. Showcase visual contract now explicitly requires frosted-glass surfaces (semi-transparent + textured) while keeping platform accent palettes intact.
9. Background contract is explicit: post-loader stage uses the specified MP4 as a fixed full-viewport layer behind content.
10. Error matrix coverage remains valid for partial-data scenarios, invalid override assets, and non-breaking fallback composition.
11. Main profile avatar contract is explicit: hero image source is locked to `/avatars/josie-main-profile.jpg` instead of live Steam avatar payloads.
12. Showcase visual contract now locks gaussian-blurred, non-uniform frosted-glass texture overlays at the shared showcase shell level for all showcase variants.
13. Renderer/layout contract now includes a static first showcase for Josie description text (`I'm just here, lol.`) plus `2rem` top padding on the social hub content shell.
14. Visual contract now expands white frosted-glass treatment to all social-hub container surfaces (hero, sidebar, showcases, activity shells, and Last.fm section containers).
15. Last.fm contract now requires 30 visible recent tracks in page flow (no inner list scrollbar), totals row above `Recent Tracks`, and white divider-only track separation.
16. Layout contract now explicitly requires post-loader stage vertical scrolling when content exceeds viewport height.
17. Readability contract now explicitly requires dimmer frosted-glass luminance (reduced whitening/glare) while preserving platform tint identity and clear text contrast.
18. Sidebar profile-destination interaction is now locked to native hyperlinks rather than button-only open actions.
19. Sidebar profile-link rows no longer include debug telemetry/meta strings (freshness/source/no-showcase).
20. Sidebar `Quick Stats` container is removed; sidebar now renders `Profile Links` only.
21. Profile-link text sizing is increased slightly for readability.

## Verification Notes (9 Points)
1. Hypothesis vs Fact Labeling: Pass. Statements are implementation requirements.
2. Uncertainty Marker Enforcement: Pass. Private/partial data limits are explicitly qualified.
3. Assumption Visibility: Pass. API-key and availability assumptions are documented.
4. Authoritative-looking Unvalidated Data: Pass. No fabricated metrics are asserted as facts.
5. Data Consistency: Pass. Source priorities align with renderer and fallback contracts.
6. Implicit Causation: Pass. No unsupported causal claims.
7. Future State as Present: Pass. Document states intended implementation state.
8. Temporal Coherence: Pass. Processed date is current.
9. Externally Verifiable Claims: Pass. External dependency constraints are acknowledged.

## HITL Verification Record

### Round A: Derived Data Confirmation
1. No externally quoted statistics require citation in this implementation spec.

### Round B: True HITL Verification
1. No pending HITL claims.

<!-- CLARITY_GATE_END -->
Clarity Gate: CLEAR | REVIEWED
