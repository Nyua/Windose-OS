# Ames Corner OS Shell Refit Spec (Implementation v2)

## 1. Scope
Implement a full Ame's Corner UI rebuild in this pass:
1. Preserve the new ferrofluid intro behavior (drop, bounce, settle) and 50% final alpha transparency change.
2. Preserve canonical theme behavior (`theme-chrome`) with legacy coercion.
3. Recreate all menus, icons, and buttons from the ground up in a Y2K glass/chrome + skeuomorphic visual system.
4. Rebuild surface treatments for system UI controls and menu structures, not just incremental CSS tweaks.

In scope (Ame's Corner shell):
1. Start menu layout and entry visuals.
2. Taskbar controls and app button visuals.
3. Window close control and shell command buttons.
4. Settings controls, timeline transport controls, and inspector action buttons.
5. Desktop icon treatments and all app icon SVG assets used by Ame's Corner shell.

Out of scope:
1. Non-Ame site pages.
2. Functional feature additions unrelated to visual/system-control rebuild.
3. New test framework introduction.

## 2. Goals

| Goal | Requirement |
| --- | --- |
| Full rebuild mandate | Menus, icons, and buttons must be reconstructed with new visual primitives, not minor recolor patches |
| Ferro intro choreography | On first OS-ready entry in a page session, ferro starts above viewport, drops, bounces, and settles centered |
| Intro replay policy | Do not replay on in-app restart; replay only on hard page reload |
| Motion accessibility | If `prefers-reduced-motion: reduce` OR `motionEnabled === false`, skip intro animation and settle instantly |
| Transparency update | Final fragment alpha output is multiplied by `0.5` |
| Theme policy | Canonical runtime class is `theme-chrome`; legacy stored `themeMode` values are coerced |
| Menu consistency | Start menu, power menu, and settings menu controls share the same chrome/skeuomorphic system |
| Icon consistency | Desktop/taskbar/start-entry icons use newly recreated chrome/Y2K SVG assets |
| Input accessibility | Keep `44px+` touch targets and strong `:focus-visible` affordances |

## 3. Runtime Contract
- Entry shells:
  - `windose-os/ames-corner.html`
  - `windose-os/public/ames-corner.html`
- Runtime owner:
  - `windose-os/src/ames-corner/main.js`
- Style owner:
  - `windose-os/public/ames-corner.css`
- Icon assets owner:
  - `windose-os/public/ame-corner/icons/*.svg`

### 3.1 Ferro Intro State (retained)
State object:
- `played: boolean`
- `active: boolean`
- `startedAtMs: number`

Constants:
- `BG_FERRO_INTRO_START_Y = 2.2`
- `BG_FERRO_INTRO_IMPACT_Y = -0.22`
- `BG_FERRO_INTRO_DROP_MS = 540`
- `BG_FERRO_INTRO_BOUNCE_MS = 640`
- `BG_FERRO_INTRO_BOUNCE_AMPLITUDE = 0.24`
- `BG_FERRO_INTRO_BOUNCE_DAMPING = 5.6`
- `BG_FERRO_INTRO_BOUNCE_FREQ = 12.0`

Rules:
1. `enterOsReadyState()` starts intro only once per page session.
2. Reduced-motion and motion-disabled paths settle immediately at center.
3. Intro Y pose is applied in both static and animated render paths.

### 3.2 Ferro Alpha Contract (retained)
Fragment shader contract:
1. `uniform float uAlphaFinalScale;`
2. `baseAlpha = clamp(<existing alpha expression>, 0.32, 0.78)`
3. `alpha = clamp(baseAlpha * uAlphaFinalScale, 0.0, 1.0)`
4. Background ferro material sets `uAlphaFinalScale = 0.5`.

### 3.3 Canonical Theme Contract (retained)
1. Runtime class behavior is canonical `theme-chrome`.
2. Stored `themeMode` remains for compatibility but is normalized to `chrome`.
3. Theme picker radios are removed from settings UI.
4. Settings UI shows static canonical theme label.

### 3.4 Full UI Rebuild Contract (new)
1. Start menu entries must use explicit icon + text structure (`icon`, `title`, `meta` blocks).
2. Desktop icon render path must include dedicated icon-shell wrapper element.
3. Taskbar app render path must include dedicated icon-shell wrapper element.
4. Buttons must use a shared chrome/skeuomorphic surface language (raised, hover, pressed, active).
5. Menus must use layered glass/chrome panel construction with readable text contrast.
6. Existing functional event wiring remains compatible after markup updates.

## 4. UI and Style Contract

### 4.1 Token System
`windose-os/public/ames-corner.css` defines a single token architecture for:
1. Glass shell surfaces.
2. Chrome edge/highlight reflections.
3. Skeuomorphic control face, pressed depth, and inset shadows.
4. Menu panel depth system.

### 4.2 Rebuild Targets
Rebuild selectors/components:
1. Menus:
   - `.os-start-menu`, `.os-start-menu-apps`, `.os-start-menu-power`, `.os-start-entry`
2. Taskbar controls:
   - `.os-taskbar`, `.os-start-button`, `.os-taskbar-app`
3. Window/system controls:
   - `.os-window-close`, `.os-app-button`, shutdown controls
4. Settings and control rows:
   - `.os-setting-row button`, `.os-setting-choice`, settings range track/thumb
5. Timeline and ferro controls:
   - `.os-ferro-jump-controls button`, `.os-ferro-toolbar button`, `.os-ferro-inspector-actions button`
6. Icon surfaces:
   - desktop icon cards and icon asset SVGs used in desktop/taskbar/start entries

### 4.3 Accessibility Constraints
1. Preserve mobile hit-target sizing (`44px+`).
2. Preserve keyboard focus visibility (`:focus-visible`).
3. Maintain clear text/icon contrast across shell controls.

## 5. Error Handling Matrix

| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Missing icon asset | image decode/load warning | keep button/icon shell visible | show fallback initials/empty icon frame |
| Markup mismatch after rebuild | query selector returns null | guard before binding behavior | keep shell interactive without hard crash |
| Legacy theme value in storage | value not `chrome` | coerce on load and persist canonical value | runtime class still forced to `theme-chrome` |
| Reduced-motion API unavailable | `matchMedia` absent | treat as no-reduce | preserve baseline behavior |
| Intro mesh unavailable | `!bgFerroMesh` | skip transform write | continue render loop |

## 6. Test Case Specifications

### Unit Checks
| Test ID | Input | Expected |
| --- | --- | --- |
| TC-OS-REFIT-001 | first `enterOsReadyState()` | intro starts and `played=true` |
| TC-OS-REFIT-002 | second `enterOsReadyState()` same session | intro does not replay |
| TC-OS-REFIT-003 | reduced motion on | intro skipped, mesh Y settles at `0` |
| TC-OS-REFIT-004 | `motionEnabled=false` | intro skipped, mesh Y settles at `0` |
| TC-OS-REFIT-005 | shader alpha compute | alpha equals `clamp(baseAlpha*0.5,0,1)` |
| TC-OS-REFIT-006 | storage `themeMode=dark` | runtime class `theme-chrome`, persisted `chrome` |
| TC-OS-REFIT-007 | start menu markup query | all `.os-start-entry[data-app]` still bind click handlers |
| TC-OS-REFIT-008 | desktop/taskbar build functions | each icon/button includes new wrapper shell node |

### Integration Checks
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-OS-REFIT-001 | BIOS skip -> loader -> OS | ferro drops/bounces/settles in ~1.18s |
| IT-OS-REFIT-002 | open Start menu | rebuilt menu visuals render with icons and metadata blocks |
| IT-OS-REFIT-003 | launch app via start entry | click behavior still opens target window |
| IT-OS-REFIT-004 | desktop + taskbar spot-check | recreated icons appear in desktop, taskbar, and start menu entries |
| IT-OS-REFIT-005 | button interaction pass | pressed/hover/focus states visible for system/settings/timeline controls |
| IT-OS-REFIT-006 | restart flow in same page | intro does not replay |
| IT-OS-REFIT-007 | mobile viewport pass | control sizes remain touch-safe and legible |

## 7. Anti-Patterns (DO NOT)

| Do Not | Do Instead | Why |
| --- | --- | --- |
| Recolor old controls and call it a rebuild | replace button/menu/icon construction and visual primitives | satisfies full-rebuild requirement |
| Keep old icon files with minor tint edits | replace icon SVGs with new chrome/Y2K drawings | clear visual reset |
| Reintroduce `light`/`dark` branch runtime classes | enforce canonical `theme-chrome` | avoids split style maintenance |
| Break start menu event binding during markup changes | keep `.os-start-entry[data-app]` contract | prevents interaction regressions |
| Shrink controls below accessible tap targets | keep 44px+ minimum mobile targets | mobile usability and accessibility |

## 8. Deep Links
- `windose-os/ames-corner.html`
- `windose-os/public/ames-corner.html`
- `windose-os/public/ames-corner.css`
- `windose-os/src/ames-corner/main.js`
- `windose-os/public/ame-corner/icons/about-system.svg`
- `windose-os/public/ame-corner/icons/file-explorer.svg`
- `windose-os/public/ame-corner/icons/notes.svg`
- `windose-os/public/ame-corner/icons/settings.svg`
- `windose-os/public/ame-corner/icons/recycle-bin.svg`
- `windose-os/public/ame-corner/icons/ferro-control.svg`
- `windose-os/public/ame-corner/icons/ferro-timeline.svg`
- `windose-os/public/ame-corner/icons/restart.svg`
- `windose-os/public/ame-corner/icons/shutdown.svg`
- `docs/ames-corner-os-shell-refit-spec.cgd.md`
