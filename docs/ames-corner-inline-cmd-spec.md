# Ames Corner Inline CMD Behavior Spec (Implementation)

## 1. Scope
Align terminal interaction in `ames-corner` closer to Windows Command Prompt usage by placing the active input line inline with command history/output, not as a separate footer bar.

Keep startup phrase whitening restricted to startup phrase lines only.

## 2. Goals
| Goal | Requirement |
| --- | --- |
| Inline command entry | Active prompt/input line lives inside output stream |
| CMD-like flow | Submitted commands become history lines above active prompt |
| Startup white isolation | Only startup phrase lines use white + faint white glow |
| Non-startup color integrity | Manual commands and normal output keep existing pink style |

## 3. Runtime Contract
- `terminal-form` is rendered inside `terminal-output`.
- `terminalPrint` inserts output lines before the active input form.
- `terminalClear` clears output lines but preserves active input form.
- Prompt string stays consistent between editable prompt and echoed command history.

## 4. Test Cases
- `TC-INLINE-001`: startup prints help lines above active prompt.
- `TC-INLINE-002`: submitting command appends echoed line above active prompt.
- `TC-INLINE-003`: `clear` removes printed lines but keeps editable prompt.
- `TC-INLINE-004`: startup lines are white; manual help lines are not white.

## 5. Anti-Patterns
- Do not reintroduce separate bottom input bar.
- Do not globally apply startup white class to all terminal lines.

## 6. References
- `windose-os/public/ames-corner.html`
- `windose-os/public/ames-corner.css`
- `windose-os/public/ames-corner.js`
