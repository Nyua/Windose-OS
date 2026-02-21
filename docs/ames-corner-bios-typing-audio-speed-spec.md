# Ames Corner BIOS Typing Audio + Speed Spec (Implementation)

## 1. Scope
Add keyboard typing audio to each character emitted in the BIOS/command console text stream in `windose-os/public/ames-corner.js`, and accelerate the BIOS text sequence to approximately 2x speed.

This scope is limited to the BIOS text typing flow and related console pacing.

## 2. Goals

| Goal | Requirement |
| --- | --- |
| Character feedback | Each character written by `typeBiosStep` triggers a key-click sound attempt |
| Faster sequence | BIOS typing/line pacing and BIOS total target duration run at ~0.5x original timings |
| Stability | Failures to play audio must not break BIOS flow |
| Resource safety | Typing audio must be pooled/reused to avoid creating new audio objects per character |

## 3. Runtime Contract
- Introduce BIOS timing scale constant for console pacing.
- Apply speed scaling to:
  - character delays
  - line hold delays
  - emphasis waits
  - BIOS target duration enforcement
- Add typing audio pool initialized from `/sounds/click.mp3`.
- Trigger typing sound playback inside per-character write loop.
- On `pagehide`, stop/pause typing pool audio to prevent leaks.

## 4. Error Handling Matrix

| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Typing audio blocked by autoplay policy | `play()` promise rejects | Swallow error | BIOS text continues silently |
| Audio source decode/load failure | `play()` throws or never starts | Catch and ignore | BIOS text continues silently |
| Invalid/negative timing | scaled values below 1ms | Clamp to minimum | deterministic pacing remains |
| Pool clip currently playing | reused element selected | rewind + replay | brief overlap truncation acceptable |

## 5. Test Case Specifications

### Unit Checks
| Test ID | Input | Expected |
| --- | --- | --- |
| TC-BIOS-AUD-001 | type one step text | one playback attempt per character |
| TC-BIOS-AUD-002 | failed `play()` | no thrown errors propagate to BIOS loop |
| TC-BIOS-AUD-003 | scaled timing computation | all waits are approx half of previous baseline |
| TC-BIOS-AUD-004 | pagehide teardown | typing clips pause/reset |

### Integration Checks
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-BIOS-AUD-001 | open `/ames-corner.html` | BIOS characters type audibly with click cadence |
| IT-BIOS-AUD-002 | compare sequence duration | BIOS sequence completes around 2x faster than prior |
| IT-BIOS-AUD-003 | blocked audio environment | sequence still completes without runtime errors |

## 6. Anti-Patterns (DO NOT)

| Do Not | Do Instead | Why |
| --- | --- | --- |
| Create new `Audio()` per character | Use prebuilt audio pool | avoid GC churn and dropped playback |
| Let audio exceptions bubble | Catch and ignore | preserve deterministic BIOS flow |
| Scale unrelated state durations | Restrict scaling to BIOS text pacing | avoid altering CRT/state choreography unintentionally |
| Depend on successful audio playback | Treat audio as best-effort | browser policy may block autoplay |

## 7. References
- `windose-os/public/ames-corner.js`
- `windose-os/public/ames-corner.html`
