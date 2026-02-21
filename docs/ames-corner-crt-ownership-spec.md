# Ames Corner CRT Ownership Spec (Implementation)

## 1. Scope
Move CRT rendering ownership fully to `windose-os/public/ames-corner.*` and remove CRT rendering from `windose-os/src/App.vue`.

This change must produce one active CRT implementation path only:
- enabled: `ames-corner.html`
- disabled: main `windose-os` desktop runtime

## 2. Goals

| Goal | Requirement |
| --- | --- |
| Single ownership | CRT logic exists only in `ames-corner` files |
| Main app cleanup | Remove CRT overlay stack, CRT RAF controller, and CRT lens modulation from `App.vue` |
| Authentic presentation | `ames-corner` uses the new multi-layer authentic CRT stack (mask, scanline, beam, roll, noise, vignette, reflection, chromatic aberration) |
| Legacy removal | Delete previous `ames-corner` CRT power-overlay/path-specific legacy layer code |
| Stability | Preserve BIOS -> reset-cycle -> booting -> on flow and audio behavior |

## 3. Runtime Contract
- `App.vue` must not:
  - render `.crt-stack`
  - update CRT CSS variables in `requestAnimationFrame`
  - toggle CRT lens transforms via `crtEnabled`
- `ames-corner.html` must render a single CRT stack inside `.crt-glass`.
- `ames-corner.js` must drive CRT CSS variables every frame while visual controller is active.
- State progression remains:
  - `bios` -> `bios-exit` -> `reset-cycle` -> `booting` -> `on`

## 4. Visual Stack Contract

| Layer | Purpose | Notes |
| --- | --- | --- |
| Shadow mask | Phosphor triad simulation | RGB repeating stripe mask |
| Scanlines | Raster line structure | High-frequency horizontal raster pattern |
| Beam | Active electron sweep band | Fast vertical sweep with gaussian pulse |
| Roll | Vertical sync drift | Slow moving translucent bar |
| Noise | Static/grain | Fast stepped animation |
| Vignette | Tube edge falloff | Darkened corners + mild top/bottom shaping |
| Reflection | Glass sheen | Angle highlight and corner reflection |
| Chromatic aberration | Channel offset | Subtle red/blue edge split |

## 5. Parameter Model

| Group | Bounds |
| --- | --- |
| Lens jitter | `-0.6px` to `0.6px` |
| Lens rotation | `-1deg` to `1deg` |
| Lens scale | `0.994` to `1.014` |
| Beam alpha | `0.08` to `0.92` |
| Scanline alpha | `0.14` to `0.44` |
| Noise alpha | `0.03` to `0.24` |
| Roll alpha | `0.02` to `0.25` |
| Vignette alpha | `0.44` to `0.72` |
| Reflection alpha | `0.08` to `0.44` |

## 6. Error Handling Matrix

| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Missing root node | `!root` or `!cssRoot` | Skip flow startup | Static document remains visible |
| RAF race during teardown | `teardownStarted` true mid-frame | Stop scheduling new frames | Current frame remains painted |
| Invalid numeric math | Non-finite value computed | Clamp before setting var | Use bounded neutral values |
| State timing overrun | elapsed exceeds stage duration | Clamp stage progress `0..1` | Move state machine forward safely |

## 7. Test Case Specifications

### Unit Checks
| Test ID | Input | Expected |
| --- | --- | --- |
| TC-CRT-OWN-001 | Load main app (`/`) | No `.crt-stack` rendered in `App.vue` |
| TC-CRT-OWN-002 | Start `ames-corner` visual loop | All CRT CSS vars update over time |
| TC-CRT-OWN-003 | Enter `reset-cycle` | CRT intensity pipeline reduces and recovers per state gain |
| TC-CRT-OWN-004 | Enter `booting` and exceed power duration | state transitions to `on` |
| TC-CRT-OWN-005 | Trigger `pagehide` | RAF cancels and timers clear |

### Integration Checks
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-CRT-OWN-001 | Open `/` | desktop renders with no CRT overlays/effects |
| IT-CRT-OWN-002 | Open `/ames-corner.html` | authentic CRT stack visible and animated |
| IT-CRT-OWN-003 | Full boot path | BIOS and stage transitions still complete |
| IT-CRT-OWN-004 | Audio boot->drone | Sting and drone behavior unchanged |

## 8. Anti-Patterns (DO NOT)

| Do Not | Do Instead | Why |
| --- | --- | --- |
| Keep CRT code active in both `App.vue` and `ames-corner` | Enforce single CRT owner (`ames-corner`) | Prevent visual drift and duplicated maintenance |
| Preserve legacy power-overlay DOM while adding new stack | Replace with one canonical CRT stack | Avoid layer conflicts and unpredictable blending |
| Leave obsolete CSS vars in active loops | Remove dead vars and dead writes | Reduce debugging noise |
| Tie CRT teardown to non-visual events only | Always stop on `pagehide` and teardown guards | Prevent RAF/timer leaks |
| Exceed jitter/rotation bounds for effect strength | Clamp motion and gain aggressively | Preserve readability and reduce artifact fatigue |

## 9. References
- `windose-os/src/App.vue`
- `windose-os/public/ames-corner.html`
- `windose-os/public/ames-corner.css`
- `windose-os/public/ames-corner.js`
