# Ames Corner Startup Phrase Tone Spec (Implementation)

## 1. Scope
Set terminal startup phrases in `ames-corner` to flat white with a very faint white glow while leaving normal runtime command/output styling unchanged.

## 2. Goals
| Goal | Requirement |
| --- | --- |
| Startup phrase color | Startup lines render white (`#ffffff`) |
| Glow quality | Startup lines have subtle/faint white glow only |
| Scope control | Only auto-start terminal phrases are affected |
| Existing behavior | Command system and content routes remain unchanged |

## 3. Runtime Contract
- Add a startup tone style class for terminal lines.
- Startup session text (`terminal online.` and auto-help lines) uses startup tone.
- Manual `help` command remains current non-startup style.

## 4. Test Cases
- `TC-STARTUP-001`: load page through terminal activation and verify startup lines use startup class.
- `TC-STARTUP-002`: run manual `help` and verify output is not forced to startup class.
- `TC-STARTUP-003`: verify command routing unchanged after styling change.

## 5. Anti-Patterns
- Do not globally recolor all terminal lines to white.
- Do not increase glow to blur-heavy neon bloom.

## 6. References
- `windose-os/public/ames-corner.js`
- `windose-os/public/ames-corner.css`
