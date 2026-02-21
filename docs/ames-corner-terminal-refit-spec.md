# Ames Corner Terminal Refit Spec (Implementation)

## 1. Scope
Refit `windose-os/public/ames-corner.*` into a terminal-first experience with pink text, subdued CRT, pure black background, and interactive command-driven navigation.

## 2. Goals

| Goal | Requirement |
| --- | --- |
| BIOS text color | BIOS output text color is `#ca2869` |
| Terminal text color | Terminal command/output text color is `#ca2869` |
| Pure black backdrop | Background and main shell surfaces render as pure black (`#000`) |
| Softer CRT | CRT modulation is significantly reduced in brightness, jitter, and overlay strength |
| Terminal-first UI | Main content is a terminal output + command line with blinking readiness cursor |
| Built-in command discoverability | Auto-print `-help` command list when terminal becomes active |
| Page section access | Commands expose page sections (about/feed/notes/drift/state/logs) |

## 3. Runtime Contract
- `ames-corner.html` renders:
  - BIOS stage
  - terminal stage with `#terminal-output`, `#terminal-form`, `#terminal-input`
  - CRT stack layers
- `ames-corner.js` must:
  - keep BIOS flow and CRT state progression
  - run typing sound per character
  - initialize terminal input handlers once
  - auto-start terminal session at `crt-state-on`
  - execute `-help` automatically without user typing
- Commands supported:
  - `-help`, `help`
  - `sections`, `ls`
  - `open <section>`, `show <section>`, `cat <section>`
  - direct section names: `about`, `feed`, `notes`, `drift`, `state`, `logs`
  - `all`, `clear`, `time`

## 4. Error Handling Matrix

| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Missing terminal nodes | null query selectors | skip terminal output writes | BIOS/CRT flow continues |
| Invalid command | no command match | print unknown command message | suggest `-help` |
| Audio playback block | `play()` rejection | swallow rejection | silent operation |
| Teardown race | `pagehide` while active | remove listeners + cancel loops | clean shutdown |

## 5. Test Case Specifications

### Unit Checks
| Test ID | Input | Expected |
| --- | --- | --- |
| TC-TERM-001 | run `-help` | command list lines emitted |
| TC-TERM-002 | run `open feed` | feed section lines emitted |
| TC-TERM-003 | run unknown command | unknown response + help hint emitted |
| TC-TERM-004 | call `startTerminalSession` twice | second call is no-op |
| TC-TERM-005 | `pagehide` | terminal listeners removed and audio stopped |

### Integration Checks
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-TERM-001 | load `/ames-corner.html` | BIOS text appears in `#ca2869` |
| IT-TERM-002 | transition to terminal | auto `-help` output appears |
| IT-TERM-003 | type commands | section outputs and clear work interactively |
| IT-TERM-004 | visual inspection | black background + reduced CRT intensity |

## 6. Anti-Patterns (DO NOT)

| Do Not | Do Instead | Why |
| --- | --- | --- |
| Keep old panel-heavy layout visible | use terminal-only surface | user requested terminal-first experience |
| Keep aggressive CRT intensities | clamp overlays and modulation lower | readability and comfort |
| Hide command discovery behind manual first command | auto-print `-help` at terminal start | usability requirement |
| Depend on audio success for flow | treat audio as optional | browser autoplay restrictions |

## 7. References
- `windose-os/public/ames-corner.html`
- `windose-os/public/ames-corner.css`
- `windose-os/public/ames-corner.js`
