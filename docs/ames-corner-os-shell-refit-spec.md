# Ames Corner OS Shell Refit Spec (Implementation)

## 1. Scope
Replace post-BIOS terminal/build runtime in Ame's Corner with a loader + modern fake OS shell flow.

## 2. Goals

| Goal | Requirement |
| --- | --- |
| Flow replacement | BIOS -> Soft Accept/Deny gate (8s auto-continue) -> 8s loader -> OS desktop |
| Visual direction | Hospital-like white/dull, rounded, clean UX |
| Legacy runtime retirement | Remove normal-path terminal/build/diary/visualizer command UX |
| OS shell core | Centered taskbar, rounded start menu, desktop icon system, top-right date/time |
| App bundle v1 | Recycle Bin, File Explorer, Notes, Settings, About System |
| Background motion | Subtle always-on visualizer integrated into OS background |

## 3. Runtime Contract
- `windose-os/ames-corner.html` defines BIOS stage, loader stage, and OS stage.
- `windose-os/src/ames-corner/main.js` owns runtime state machine:
  - `bios`, `bios-off`, `os-loader`, `os-ready`, `teardown`
- BIOS gate behavior:
  - `Accept` -> continue immediately
  - `Deny` -> reload site
  - 8s timeout -> auto-continue
- OS persistence keys:
  - `ames_corner_os_icon_layout_v1`
  - `ames_corner_os_notes_v1`
  - `ames_corner_os_settings_v1`

## 4. Error Handling Matrix

| Error Type | Detection | Response | Fallback |
| --- | --- | --- | --- |
| Missing stage nodes | null selector | abort stage init safely | keep page stable |
| BIOS input bridge failure | focus/selection throws | swallow and continue | timeout auto-continue remains |
| Storage parse failure | JSON parse error | ignore corrupted value | use defaults |
| Visualizer frame overload | frame budget breach | adaptive quality downgrade | keep low-tier animation |
| Window drag bounds overflow | position out of viewport | clamp into viewport | retain usability |
| Timer/RAF teardown race | `pagehide` during async | clear timers/listeners/RAF | no orphan loops |

## 5. Test Case Specifications

### Unit Checks
| Test ID | Input | Expected |
| --- | --- | --- |
| TC-OS-001 | BIOS decision `Accept` | transitions to loader |
| TC-OS-002 | BIOS decision `Deny` | page reload invoked |
| TC-OS-003 | no BIOS input for 8s | auto-continue to loader |
| TC-OS-004 | notes textarea change | value persisted to localStorage |
| TC-OS-005 | icon drag release | snapped + clamped position persisted |
| TC-OS-006 | settings motion toggle | visualizer pause/resume reflects value |

### Integration Checks
| Test ID | Flow | Verification |
| --- | --- | --- |
| IT-OS-001 | full boot | BIOS -> loader -> OS reaches stable desktop |
| IT-OS-002 | start menu launch | app opens and focuses window |
| IT-OS-003 | taskbar app click | existing window focuses instead of duplicate |
| IT-OS-004 | power restart | loader reruns and OS returns |
| IT-OS-005 | mobile tap/drag | icons can be selected/opened/repositioned |

## 6. Anti-Patterns (DO NOT)

| Do Not | Do Instead | Why |
| --- | --- | --- |
| Keep post-BIOS terminal visible | switch directly to loader/OS path | contract requires replacement |
| Apply CRT stack to OS stage | confine CRT styling to BIOS stage only | readability and visual direction |
| Save settings without validation | sanitize and clamp loaded values | avoid corrupted UX state |
| Recreate windows on every focus | maintain single instance per app | predictable desktop behavior |
| Allow unrestricted icon movement | snap + clamp to viewport bounds | mobile and desktop usability |

## 7. Deep Links
- `windose-os/ames-corner.html`
- `windose-os/public/ames-corner.css`
- `windose-os/src/ames-corner/main.js`
- `docs/ames-corner-os-shell-refit-spec.cgd.md`
