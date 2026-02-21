# Ame Corner Transition Spec (Implementation)

## 1. Scope
Rebuild the Ame's Corner transition in `windose-os/src/App.vue` with a shadow-first sequence, frame-driven rapid impact cuts, and same-tab navigation to `/ames-corner.html`.

## 2. Sequence Contract
The transition is timeline-driven with fixed milestones:

| Time (ms) | Event |
| --- | --- |
| 0 | Enter `stepBack` phase, lock desktop input, keep live OS visible with no intro sprite yet |
| 2000 | Stage `shadowFadeIn`: show `corner-intro-Ame` and fade from 0 to 0.75 over 2000ms |
| 4000 | Stage `intro00`: show `corner-intro00` under shadow for 2 rendered frames |
| ~4033 | Stage `pinkFlash`: hide `corner-intro00`, keep shadow, show pink flash for 2 rendered frames |
| ~4066 | Stage `intro0`: show `corner-intro0` for 2 rendered frames |
| ~4099 | Stage `impact`: show `kyouizon_bg_002_w` for 2 rendered frames |
| ~4132 | Stage `final`: show `corner-intro2` and hold for 5000ms, start fast shadow fade-out (300ms), enter `reflection` phase |
| ~9132 | Enter `navigating` phase and call `window.location.assign('/ames-corner.html')` |

### Timing Tuning Note
- All stage timings above are provisional and should be tuned as a full set in a follow-up timing pass.
- Avoid single-point edits to one stage without rebalancing the rest of the sequence.
- Frame-based milestones (`2 frames`) are refresh-rate dependent; approximate times above assume ~60Hz.

## 3. Component Interface Changes

### `windose-os/src/components/ControlPanel.vue`
- Keep existing event-based action flow: emit `launchAmeCorner` when Ame action is clicked and unlocked.

### `windose-os/src/components/Desktop.vue`
- Keep existing pass-through emit for `launchAmeCorner`.

### `windose-os/src/App.vue`
- Keep `@launchAmeCorner` listener.
- Replace intro stage sequence with:
  - `waiting`
  - `shadowFadeIn`
  - `intro00`
  - `pinkFlash`
  - `intro0`
  - `impact`
  - `final`
- Keep transition phase model: `idle`, `stepBack`, `reflection`, `navigating`.
- Keep final destination hardcoded to `/ames-corner.html`.

### `windose-os/src/settings.ts`
- No new settings fields for this transition.
- Keep `ameCornerUrl` backward-compat behavior as non-authoritative for runtime transition flow.

## 4. Visual and Audio Behavior

### Desktop transition visuals
- Shadow sprite: `/ame-corner/corner-intro-Ame.png` is not full-screen.
  - Position baseline: `top: 8%`, `right: 6%`, `width: 42%`.
  - Tunable via CSS vars: `--ame-shadow-top`, `--ame-shadow-right`, `--ame-shadow-width`.
  - Opacity target: `0.75`.
- All non-shadow transition sprites render at full opacity (`1.0`).
- Base stage images:
  - `/ame-corner/corner-intro00.png.png`
  - `/ame-corner/corner-intro0.png`
  - `/ame-corner/kyouizon_bg_002_w.png`
- `/ame-corner/corner-intro2.png` is the final stage image and is held for 5000ms.
- `corner-intro1.png` is intentionally excluded from this flow.
- Pink beat is a CSS 2-frame flash layer above both base and shadow layers.
- Shadow persists through `impact`, then fades out quickly during `final`.
- No pseudo-3D scale/curvature effects are introduced in this flow.
- No procedural knife/crack/scanline overlays are used in the desktop transition sequence.

### Destination microsite flow and visuals
- `/ames-corner.html` runs a deterministic five-state flow:
  - `bios`
  - `biosExit`
  - `resetCycle`
  - `booting`
  - `on`
- Timeline contract:
  - `bios`: ~45000ms command-line prelude.
  - `biosExit`: fade-out handoff.
  - `resetCycle`: ~3000ms CRT power-cycle pulse reset.
  - `booting`: full CRT power-on envelope (dark -> line -> expansion -> settle).
  - `on`: steady Ame OS stage.
- BIOS prelude requirements:
  - full-screen BIOS terminal look.
  - progressive command text output with long pauses.
  - no upbeat/friendly wording.
  - emphasized beats containing exact phrases:
    - `White egret orchard`
    - `My thoughts will follow you into your dreams`
- Reset-cycle requirements:
  - two pulse passes with blackout between.
  - no direct `bios -> on` cut.
  - aggressive flicker/contrast modulation during reset.
- CRT visuals are implemented as a dedicated stack:
  - phosphor/shadow-mask layer
  - high-contrast scanline raster layer
  - sweeping scan beam layer
  - static/noise layer
  - glass reflection/vignette layer
- Scanline + beam behavior is runtime-driven (JS + CSS vars) with nonlinear pulse weighting.
- Scan beam traversal remains visible through full top-to-bottom pass.
- Ame OS stage is a single fixed window shell for interactables (no multi-window desktop behavior).
- Stage layout mirrors main-site composition with left/right sidebars plus center viewport.
- Sidebar logic parity:
  - slot boundaries match main site:
    - `NOON`: 06:00-16:59
    - `DUSK`: 17:00-19:59
    - `NIGHT`: 20:00-05:59
  - slot-change flash timing aligns with main site (~4000ms pulse).
  - asset resolution prefers Ame-specific paths with fallback:
    - primary: `/ame-corner/sidebars/sidebar_{slot}.png`
    - fallback: `/sidebars/sidebar_{slot}.png`

### Destination microsite audio
- On `/ames-corner.html`, play one-shot sting from `/sounds/Audio_horrornoise.wav`.
- Remove melodic ambient loop behavior (`/sounds/desire.wav`) from Ame flow.
- After sting, attempt dark drone/CRT-buzz bed only.
- During `resetCycle`, momentarily duck drone level, then recover at `booting`.
- If autoplay is blocked, remain silent with no prompt.

## 5. Error Handling Matrix

| Error Type | Detection | Response | Fallback | User Impact |
| --- | --- | --- | --- | --- |
| Shadow sprite missing | `img.onerror` on `/ame-corner/corner-intro-Ame.png` | Continue timeline without shadow layer | Base stages still run | Transition still completes |
| Intro00 missing | `img.onerror` on `/ame-corner/corner-intro00.png.png` | Continue timeline without intro00 | Next stage still renders | Transition still completes |
| Intro0 missing | `img.onerror` on `/ame-corner/corner-intro0.png` | Continue timeline without intro0 | Next stage still renders | Transition still completes |
| Impact frame missing | `img.onerror` on `/ame-corner/kyouizon_bg_002_w.png` | Continue timeline without impact frame | Final stage still renders | Transition still completes |
| Final frame missing | `img.onerror` on `/ame-corner/corner-intro2.png` | Continue timeline without final frame | Keep shadow layer behavior and proceed to navigate | Transition still completes |
| Navigation blocked/unexpected | Assignment throws | Log warning | Keep final transition frame visible | User remains on desktop |
| Ambient autoplay blocked | `play()` reject | Ignore error | Silent mode | Page still usable |

## 6. Test Case Specifications

### Unit-level checks
| Test ID | Component | Input | Expected |
| --- | --- | --- | --- |
| TC-AC-001 | ControlPanel | Click Ame button while unlocked | Emits `launchAmeCorner` once |
| TC-AC-002 | ControlPanel | Click Ame button while locked | No emit |
| TC-AC-003 | App trigger guard | Trigger while active | Ignored (single active timeline) |
| TC-AC-004 | App timeline | Start transition | Stage order is `waiting -> shadowFadeIn -> intro00 -> pinkFlash -> intro0 -> impact -> final` |
| TC-AC-005 | App pink flash | Immediately after `intro00` | Pink flash appears for exactly 2 rendered frames |
| TC-AC-006 | App shadow | Through `impact` | Shadow remains visible at 0.75 target |
| TC-AC-007 | App final beat | Immediately after `impact` | `corner-intro2` stays visible for ~5000ms and shadow fades out in ~300ms |
| TC-AC-008 | App navigation | ~5000ms after final begins | Same-tab navigation to `/ames-corner.html` |

### Integration checks
| Test ID | Flow | Setup | Verification |
| --- | --- | --- | --- |
| IT-AC-001 | Unlock + tab visibility | Unlock secret and auth Control Panel | Ame tab appears, action visible |
| IT-AC-002 | Full transition sequence | Click Ame action | 2s delay, shadow fade-in, intro00 (2f), pink flash (2f), intro0 (2f), impact (2f), final 5s hold, navigation |
| IT-AC-003 | No popup regression | Click Ame action | No `window.open` path used |
| IT-AC-004 | Two-frame flash behavior | Observe around post-intro00 transition | Pink flash persists for exactly two rendered frames |
| IT-AC-005 | Legacy overlay regression | Click Ame action | No procedural knife/crack/scanline layers are shown in desktop transition path |
| IT-AC-006 | BIOS prelude duration | Load `/ames-corner.html` from fresh navigation | BIOS command stage remains active for ~45s before reset |
| IT-AC-007 | BIOS narrative emphasis | Observe BIOS log progression | `White egret orchard` and `My thoughts will follow you into your dreams` appear with clear emphasis before OS boot |
| IT-AC-008 | Reset-cycle insertion | Load `/ames-corner.html` | Sequence is `bios -> biosExit -> resetCycle -> booting -> on` with no direct `bios -> on` cut |
| IT-AC-009 | Reset-cycle timing | Observe reset phase | Two visible pulses + blackout complete in ~3000ms |
| IT-AC-010 | Full power-on replay | Observe post-reset transition | Full CRT power-on animation runs after reset |
| IT-AC-011 | Sidebar parity logic | Run across slot boundaries or override time | NOON/DUSK/NIGHT mapping and flash behavior match main-site rules |
| IT-AC-012 | Sidebar asset fallback | Remove `/ame-corner/sidebars/*` assets | Sidebars fall back to `/sidebars/*` without blank panels |
| IT-AC-013 | Single-window OS shell | Reach `on` state | Only one fixed window shell contains interactables; no multi-window desktop behavior |
| IT-AC-014 | Audio policy | Load microsite and inspect requests | No `desire.wav` usage; sting then dark drone/buzz only (or silent if blocked) |

## 7. Anti-Patterns (DO NOT)

| Do Not | Do Instead | Why |
| --- | --- | --- |
| Re-introduce `corner-intro1` into this sequence | Keep stage list fixed to the new seven-stage order | Avoid drift from approved storyboard |
| Drive frame-based cuts with fixed timeout only | Use `requestAnimationFrame` frame counting | Ensures deterministic frame-count transitions |
| Make `corner-intro-Ame` full-screen | Keep positioned shadow sprite with offsets | Preserves intended composition |
| Add pseudo-3D geometric scaling to this flow | Keep stage geometry neutral | Matches locked visual direction |
| Allow repeated clicks to restart transition | Guard with `ameTransitionActive` | Prevents duplicate timers/navigation |
| Switch back to popup/new-tab navigation | Keep same-tab `window.location.assign` | Preserves cinematic handoff |

## 8. References

| Topic | Path | Section |
| --- | --- | --- |
| App transition implementation | `windose-os/src/App.vue` | transition constants, `startAmeCornerTransition`, overlay CSS |
| Event origin | `windose-os/src/components/ControlPanel.vue` | Ame action emit |
| Event pass-through | `windose-os/src/components/Desktop.vue` | `launchAmeCorner` forwarding |
| Secrets gating | `windose-os/src/stores/secrets.ts` | unlock state flags |
