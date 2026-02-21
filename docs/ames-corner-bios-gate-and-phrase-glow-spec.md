# Ames Corner BIOS Decision Gate + Phrase Glow Spec (Implementation)

## 1. Scope
Implement an end-of-BIOS Accept/Deny gate in `ames-corner` and constrain white glowing text to exactly the two specified phrase lines:
- `White Egrets Orchard`
- `My thoughts will follow you into dreams`

Also keep terminal interaction inline in output stream (CMD-like flow).

## 2. Goals
| Goal | Requirement |
| --- | --- |
| BIOS gate | Prompt user at BIOS end for `Accept` or `Deny` |
| Continue on Accept | `Accept` advances to bios-exit/reset/boot/on flow |
| Restart on Deny | `Deny` reloads the page and restarts sequence |
| Phrase-only white glow | Only the two phrase lines render white with faint glow |
| No collateral whitening | Other BIOS and terminal lines remain pink palette |
| CMD-like line usage | Active input line remains inline with output history |

## 3. Runtime Contract
- BIOS prompt appears in BIOS screen with a PowerShell-style prompt line.
- Keyboard capture supports typing, backspace, and enter while gate is active.
- Invalid input prints corrective message and re-prompts.
- Prompt listener must be cleaned up on pagehide/teardown.

## 4. Test Cases
- `TC-BIOS-GATE-001`: Enter `Accept` -> sequence proceeds.
- `TC-BIOS-GATE-002`: Enter `Deny` -> page reload triggered.
- `TC-BIOS-GATE-003`: Enter invalid string -> error line + new prompt.
- `TC-BIOS-GATE-004`: verify only phrase lines use `.bios-phrase` styling.
- `TC-BIOS-GATE-005`: terminal still accepts commands inline after boot.

## 5. Anti-Patterns
- Do not color all emphasized BIOS text white.
- Do not allow unresolved key listeners after teardown.
- Do not move active command input back to detached footer bar.

## 6. References
- `windose-os/public/ames-corner.js`
- `windose-os/public/ames-corner.css`
- `windose-os/public/ames-corner.html`
