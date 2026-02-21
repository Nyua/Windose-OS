# CRT Shader Authenticity Spec (Implementation)

## 1. Scope
Replace the current single-layer scanline overlay in `windose-os/src/App.vue` with a physically-motivated CRT post-processing stack that is closer to late consumer Trinitron/shadow-mask behavior.

This spec applies to the main desktop runtime only (not `public/ames-corner.*`).

## 2. Goals

| Goal | Requirement |
| --- | --- |
| Authentic raster feel | Visible scanline structure, phosphor triads, beam sweep, low-frequency brightness flutter |
| Analog instability | Sub-pixel jitter, rolling sync interference bar, noise modulation |
| Tube geometry | Subtle curvature/warping and edge vignetting |
| Usability | Preserve readability and pointer interaction; effect must remain toggleable |

## 3. Runtime Contract
- Keep existing settings keys:
  - `crtEnabled` toggles the entire CRT pipeline.
  - `crtIntensity` controls the master overlay opacity (range `0.0` to `1.0`).
- Introduce a requestAnimationFrame-driven CRT controller in `App.vue`.
- The controller updates CSS variables on the app root every frame.
- When `crtEnabled` becomes false:
  - cancel animation frame loop
  - restore neutral CRT variables
- On unmount:
  - always cancel animation frame loop
  - clear transient CRT state

## 4. Visual Stack Contract

| Layer | Purpose | Blend/Behavior |
| --- | --- | --- |
| Lens transform/filter | Tube geometry, mild color/contrast drift | Perspective rotate + tiny scale/jitter + brightness/contrast/saturation modulation |
| Shadow mask | RGB triad phosphor structure | `repeating-linear-gradient` RGB stripe mask, screen blend |
| Scanline raster | Electron line structure | High-frequency horizontal repeat pattern, multiply/overlay balance |
| Sweep beam | Beam traversal pass | Vertical moving bright band with gaussian-style pulse |
| Sync roll bar | Analog vertical hold drift artifact | Slow rolling translucent bar from top to bottom |
| Static/noise | RF/grain texture | Fast-stepped pattern animation with frame-varying alpha |
| Vignette/reflection/chroma tint | Glass and edge falloff | Corner darkening + subtle reflection + channel-tinted offset highlights |

## 5. Parameter Model

| Variable Group | Expected Range |
| --- | --- |
| Lens jitter (`x`,`y`) | `-0.55px` to `0.55px` |
| Lens rotation (`x`,`y`) | `-0.95deg` to `0.95deg` |
| Lens scale | `0.995` to `1.012` |
| Brightness/contrast/saturation | brightness `0.86-1.14`, contrast `1.0-1.32`, saturation `0.95-1.18` |
| Scanline alpha | `0.16-0.42` |
| Mask alpha | `0.10-0.34` |
| Noise alpha | `0.05-0.22` |
| Beam alpha | `0.12-0.90` |
| Roll alpha | `0.02-0.22` |

## 6. Mobile Behavior
- Keep the CRT effect enabled on mobile, but attenuate distortion/noise/jitter by ~35% to avoid excessive blur and motion artifacts on small screens.
- Preserve existing mobile layout behavior (`app-root--mobile`) and do not alter viewport scaling logic.

## 7. Error Handling Matrix

| Error Type | Detection | Response | Fallback | Logging |
| --- | --- | --- | --- | --- |
| Root element unavailable | `appRootRef.value === null` during tick | Skip variable write for that frame | Keep previous frame values | none |
| RAF unavailable/cancel race | Loop id invalidated mid-frame | Guard on loop id before scheduling next frame | Stop controller cleanly | none |
| Invalid intensity input | Non-finite `crtIntensity` | Clamp to safe default (`0.35`) | Continue render | none |
| Settings toggle thrash | Rapid `crtEnabled` changes | Idempotent start/stop guards | Last toggle wins | none |
| CSS var not applied | Unexpected style failure | Continue with remaining variables | Visual degradation only | `console.warn` not required |

## 8. Test Case Specifications

### Unit Checks
| Test ID | Component | Input | Expected Output | Edge Cases |
| --- | --- | --- | --- | --- |
| TC-CRT-001 | Toggle watch | `crtEnabled=true` | Controller starts exactly once | Repeated `true` writes |
| TC-CRT-002 | Toggle watch | `crtEnabled=false` | Controller stops and neutral vars restored | Toggle during active frame |
| TC-CRT-003 | Intensity clamp | `crtIntensity=-1`, `2`, `NaN` | Effective opacity clamped to `0..1` with safe default for non-finite | `undefined` setting |
| TC-CRT-004 | RAF tick | Run one simulated frame | All required CSS vars updated | Root unavailable |
| TC-CRT-005 | Unmount cleanup | Trigger `onBeforeUnmount` | RAF canceled, no new frames scheduled | Unmount while disabled |
| TC-CRT-006 | Mobile attenuation | Mobile viewport true | Distortion/noise ranges reduced | Desktop unchanged |

### Integration Checks
| Test ID | Flow | Setup | Verification | Teardown |
| --- | --- | --- | --- | --- |
| IT-CRT-001 | Desktop startup | Load app with defaults | CRT stack visible; scanlines/mask/noise animate | Close page |
| IT-CRT-002 | Runtime toggle | Toggle CRT in Control Panel | Overlay + lens effects disappear/reappear without stale state | Reset setting |
| IT-CRT-003 | Intensity live edit | Sweep `crtIntensity` from `0` to `1` | Overlay strength tracks value smoothly | Reset to default |
| IT-CRT-004 | Boot overlay coexistence | Trigger restart boot sequence | Boot overlay remains readable and functional | Complete boot |

## 9. Anti-Patterns (DO NOT)

| Do Not | Do Instead | Why |
| --- | --- | --- |
| Keep a single static scanline layer | Use multi-layer CRT stack with runtime modulation | Static lines look fake and flat |
| Drive CRT updates with `setInterval` | Use `requestAnimationFrame` | Prevents cadence mismatch and judder |
| Apply high-amplitude jitter/rotation | Keep distortion subtle and clamped | Protect legibility and reduce motion sickness |
| Couple CRT logic to app/game state unrelated to display | Keep CRT controller display-only | Prevents hidden gameplay regressions |
| Leave RAF running while CRT is disabled | Stop loop and reset vars | Avoid unnecessary CPU/GPU usage |
| Add pointer-interactive overlay layers | Keep all CRT layers `pointer-events: none` | Preserve UI input behavior |

## 10. References

| Topic | Location | Section |
| --- | --- | --- |
| Main runtime integration | `windose-os/src/App.vue` | template root + script lifecycle + scoped styles |
| Settings source of truth | `windose-os/src/settings.ts` | `defaultSettings` and `settingsFields` CRT keys |
| Existing CRT microsite reference | `windose-os/public/ames-corner.css` | CRT layer construction patterns |
| Existing CRT runtime reference | `windose-os/public/ames-corner.js` | envelope/pulse modulation patterns |
