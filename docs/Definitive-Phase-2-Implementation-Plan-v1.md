# Definitive Phase 2 Implementation Plan (v1) - Windose 20

## 1. Title + Metadata
- Document type: `Implementation (Canonical Synthesis)`
- Date: `2026-02-07`
- Source docs:
  - `docs/Project_Phase_2_Implementation_Ready.md`
  - `docs/Implementation-Plan-v1-A.md`
  - `docs/Implementation-Plan-v1-B.md`
  - `docs/Plan C's implamentation plan v1.md`
- Supporting ADRs:
  - `docs/adr/ADR-0004-jine-scope.md`
  - `docs/adr/ADR-0005-attribution-and-credits.md`
- Target app: `windose-os`
- Release mode: `Big Bang`
- implementation execution profile:
  - Deterministic: all architecture and interface decisions are locked.
  - Repo-grounded: current-state claims are validated against code paths.
  - Conflict-explicit: each source conflict has chosen/rejected rationale.
  - Machine-actionable: no unresolved "TBD" decisions in this document.

## 2. Current Baseline (Repo Grounding)
This baseline reflects current repository state and corrects stale/partial claims in source plans.

| Area | Current State (Verified) | Evidence | Phase 2 Gap |
|---|---|---|---|
| Core shell/UI | Windowing/taskbar/start menu/control panel/credits are present. | `windose-os/src/App.vue`, `windose-os/src/components/Taskbar.vue`, `windose-os/src/components/StartMenu.vue`, `windose-os/src/components/ControlPanel.vue`, `windose-os/src/components/Credits.vue` | Expand from Phase 1 shell to Phase 2 feature-complete behaviors. |
| JINE auth/store | Local account/session with salted SHA-256 hash in localStorage; no cloud backend. | `windose-os/src/stores/auth.ts`, `windose-os/src/stores/jine.ts` | Migrate auth/messages/profile to Firebase. |
| JINE UI | Auth and chat split exists; embeds currently image + YouTube modal path; no Twitter/X embed model. | `windose-os/src/components/Jine.vue`, `windose-os/src/components/JineAuth.vue`, `windose-os/src/components/JineChat.vue` | Add confirm password, disclaimer, cloud sync, Twitter/X embeds, unread since last session from cloud timestamps. |
| Internet app | Dedicated component exists but includes placeholder destinations (Goggle/MySpace) and alert fallback. | `windose-os/src/components/InternetApp.vue` | Replace with final lore links list and deterministic external-open behavior. |
| Medicine app/store | UI + store exist; one active effect with simple fade window; no formal intro/sustain/fade phase model. | `windose-os/src/components/MedicineApp.vue`, `windose-os/src/stores/medicine.ts`, `windose-os/src/App.vue` | Add phase timeline, trigger timing near end of take sequence, stronger A/V orchestration contract. |
| Sleep app | UTC+10 display is already implemented. | `windose-os/src/components/SleepApp.vue` | Keep behavior; align copy/labels with spec and test it. |
| Desktop icons/type wiring | Icons include `hangout`, `sleep`, `medication`, `trash`; `openApp` does not handle `hangout`. `goout` placeholder window is wired. | `windose-os/src/components/Desktop.vue`, `windose-os/src/types.ts` | Add canonical `hangout` app type and compatibility path for `goout`. |
| Trash + secrets | `passwords.txt` and tooltip exist; secrets store exists but is not integrated into Trash/Control Panel flow. | `windose-os/src/components/TrashBin.vue`, `windose-os/src/stores/secrets.ts`, `windose-os/src/components/ControlPanel.vue` | Wire file-open unlock state to Ame tab visibility and destination launch. |
| Settings contract | Includes `creditsBackgroundImage` and many shell settings; no `hangOutUrl`, `ameCornerUrl`, or JINE feature flags. | `windose-os/src/settings.ts` | Add Phase 2 settings fields required for configurable links and feature flags. |
| Firebase | No Firebase init/auth/firestore modules currently present. | `windose-os/src` module inventory | Add Firebase layer and env-based configuration contract. |

Phase intent: replace placeholder/incomplete behaviors with production-ready Phase 2 flows while preserving Phase 1 desktop shell stability.

## 3. Phase 2 Scope and Non-Scope
### In Scope
- JINE: auth + identity + media embedding + cloud-backed shared messages.
- Internet links hub with lore naming and final destinations.
- Medicine app + centralized visual/audio effect orchestration.
- Sleep app timezone behavior (UTC+10 cities label).
- Hang Out external link behavior using configurable settings value.
- Trash Bin secret flow + `passwords.txt` + Control Panel "Ame's corner" unlock.

### Out of Scope
- Multi-room chat and moderation platform.
- Per-med fully unique effect stacks beyond baseline timeline (prepared for future extension).
- Backend services outside Firebase Auth/Firestore/Profile needs for Phase 2.

## 4. Conflict Resolution Matrix
### Major Domain Arbitration
| Domain | Chosen Source | Rejected Source(s) | Reason |
|---|---|---|---|
| Architecture target state | `Implementation-Plan-v1-A.md` | Plan B/Plan C local-first end states | Plan A provides the only decision-complete cloud target aligned with Phase 2 checklist item for secure auth backend. |
| Baseline status reporting | Repo truth + Plan B partial baseline shape | Plan C "mostly complete" framing where contradicted | Repo shows several placeholders and missing integrations, so baseline must be code-validated rather than estimated complete. |
| JINE scope | Plan A cloud shared channel model | Local-only persistence as final model | `docs/Project_Phase_2_Implementation_Ready.md` requires improved auth/identity and cross-session behavior that is better satisfied by cloud-backed feed. |
| Security implementation direction | Plan A (Firebase Auth, no app-side password persistence) | Plan B/Plan C local salted hash as final architecture | Local salted hash is acceptable as current baseline but not selected as Phase 2 end-state. |
| Component integration approach | Plan B file-touch realism + existing repo component names | Plan A renaming assumptions where they diverge from current naming | Existing components (`InternetApp.vue`, `MedicineApp.vue`, etc.) should be evolved in-place for lower migration risk. |
| Hang Out behavior | Plan A configurable URL via settings | Hardcoded placeholder URL approaches | User intent and maintainability favor editable link values in Control Panel settings. |
| Release strategy | Plan A big-bang milestones | Incremental ad hoc rollout framing | Big-bang is explicitly selected default and supported by milestone checkpoints. |
| Testing style | Plan A breadth + Plan B checklist specificity | Plan C checklist-only scope | Plan A covers unit/integration/e2e depth; Plan B contributes practical pass/fail scenarios. |

### Section-Level Source Merge Map (What to Keep From Which Doc)
| Section Group | Primary Source | Secondary Source | Selection Reason |
|---|---|---|---|
| Locked architecture + cloud contracts | Plan A | Project Phase 2 doc | Most complete, explicit decisions with backend/data contracts. |
| File-level touchpoints + dependency ordering | Plan B | Repo inventory | Plan B plan is strongest at concrete module touch lists. |
| Baseline feature existence notes | Plan C (validated only) | Repo inventory | Useful only where current code confirms the claim. |
| Corrections and conflict cleanup | Repo truth | Project Phase 2 doc | Avoids stale assumptions and ensures deterministic implementation path. |

## 5. Locked Architecture Decisions
1. Auth provider: `Firebase Authentication (Email/Password)`.
2. Password handling: no plaintext passwords in app state/local storage; Firebase handles secure password storage.
3. JINE message backend: `Firebase Cloud Firestore`, single shared global channel for Phase 2.
4. Profile model: `profiles/{uid}` document with display name and selected avatar.
5. External links: always open with `target="_blank"` and `rel="noopener noreferrer"`.
6. Effects orchestration: centralized store/composable, one active medication effect at a time.
7. Feature links: `hangOutUrl` and `ameCornerUrl` are settings-managed and editable via Control Panel.
8. Compatibility: `goout` remains temporary alias while `hangout` becomes canonical app type.

## 6. Public Interfaces / Type Additions
### `windose-os/src/types.ts`
- Update `WindowAppType`:
  - Add canonical `'hangout'`.
  - Keep `'goout'` as deprecated compatibility alias until migration removal.
  - Preserve `'medication' | 'sleep' | 'trash'` existing entries.

### `windose-os/src/settings.ts`
- Add settings schema/default fields:
  - `hangOutUrl: string`
  - `ameCornerUrl: string`
  - `jineAuthEnabled: boolean` default `true`
  - `jineEmbedYouTubeEnabled: boolean` default `true`
  - `jineEmbedTwitterEnabled: boolean` default `true`

### JINE contracts (cloud-ready model)
- `JineMessage` target fields:
  - `id`, `authorUid`, `authorName`, `authorAvatar`, `kind`, `body`, `createdAt`, `editedAt?`, `embeds[]`
- `JineEmbed` normalized objects:
  - `{ type: 'youtube', videoId, url }`
  - `{ type: 'twitter', tweetId, url }`
- `JineProfile` target:
  - `uid`, `displayName`, `avatarId`, `createdAt`, `updatedAt`

### Medicine effect state contract
- `effectActive: boolean`
- `effectId: string | null`
- `phase: 'intro' | 'sustain' | 'fade' | 'idle'`
- `startedAt: number | null`
- `endsAt: number | null`

### Trash/secrets contract
- `TrashFileEntry`:
  - `name`, `locked`, `type`, `content?`
- Unlock state:
  - `passwordsTxtSeen`, `amesCornerUnlocked`

## 7. Data Contracts (Firebase)
### Auth
- Firebase Email/Password auth is required for JINE identity operations.

### Firestore Collections
- `profiles/{uid}`:
  - `{ displayName, avatarId, createdAt, updatedAt }`
- `jine_messages/{messageId}`:
  - `{ authorUid, authorName, authorAvatar, kind, body, embeds, createdAt, editedAt? }`

### Rules Baseline
- Authenticated users can read/write `jine_messages`.
- Users can read profiles and update their own `profiles/{uid}`.
- No anonymous writes.

### Environment Contract
- Firebase config loaded only from Vite env keys:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
- Never hardcode credentials in source files.

## 8. Component/Module Implementation Map
### New Modules
- `windose-os/src/firebase.ts`
- `windose-os/src/jineCloud.ts`
- `windose-os/src/embeds.ts`
- `windose-os/src/stores/effects.ts` (or equivalent centralized effects module)

### Existing Modules to Modify
- `windose-os/src/App.vue`
- `windose-os/src/components/Desktop.vue`
- `windose-os/src/components/ControlPanel.vue`
- `windose-os/src/components/TrashBin.vue`
- `windose-os/src/components/Jine.vue`
- `windose-os/src/components/JineAuth.vue`
- `windose-os/src/components/JineChat.vue`
- `windose-os/src/components/InternetApp.vue`
- `windose-os/src/components/MedicineApp.vue`
- `windose-os/src/components/SleepApp.vue`
- `windose-os/src/settings.ts`
- `windose-os/src/types.ts`
- `windose-os/src/stores/medicine.ts`
- `windose-os/src/stores/jine.ts` (migrate to cloud sync path)
- `windose-os/src/stores/secrets.ts` (wire to UI flows)

### Dependency Ordering
1. Foundation contracts: update `types.ts`, `settings.ts`, and compatibility mapping.
2. Firebase bootstrap: implement `firebase.ts`, env validation, and auth/firestore wrappers.
3. JINE migration: auth flow updates, cloud message sync, embed parser integration.
4. Links/features: Internet hub final links and Hang Out settings-driven external open.
5. Secrets flow: Trash open event -> secrets unlock -> Control Panel Ame tab gating -> Ame URL launch.
6. Medicine engine: phase timeline + A/V overlay orchestration + non-overlap guard.
7. Full regression and release readiness verification.

## 9. Feature-by-Feature Implementation Spec
### JINE
- First write/send interaction requires authentication when not signed in.
- New account flow fields: username, avatar, password, confirm password.
- Returning flow: prefill known profile context; allow logout and new account path.
- Include exact disclaimer text once in auth flow:
  - `"This site is mostly for fun. Your passwords are secure, but you are heavily encouraged to make a 'for fun' password."`
- Parse/persist/render embeds for YouTube and Twitter/X links.
- Compute unseen message notifications using last session read timestamp and cloud message timestamps.

### Internet App
- Replace placeholders with lore list:
  - Tweeter, Metube, Gaming, Last.FM, Spotify.
- All destinations open in new tab.
- Last.FM and Spotify use dedicated icon slots in component config.
- Remove alert-based fallback for listed supported links.

### Medicine App
- Four medicines with source-exact effects/side effects/notes from `docs/Project_Phase_2_Implementation_Ready.md`.
- "Take" action runs timeline and starts effect near end of consumption sequence.
- Effect lifecycle: intro -> sustain -> fade over approximately 60 seconds total.
- Baseline visuals: pixelation/overlay distortion.
- Baseline audio: slowed playback + reverb-like treatment; gradual restore during fade.
- Guard: while effect active, overlapping trigger attempts are blocked.

### Sleep App
- Show current UTC+10 time with cities label:
  - Canberra, Melbourne, Sydney.
- Keep existing animated presentation unless it conflicts with correctness.

### Hang Out
- Desktop Hang Out entry opens `settings.hangOutUrl` in a new tab.
- `goout` compatibility alias maps to same behavior during migration window.

### Trash Bin + Ame's Corner
- File-browser style list includes locked zip entries and readable `passwords.txt`.
- Hover hint remains:
  - `"Never store your passwords in a txt file"`
- `passwords.txt` content remains:
  - `Control Panel: "angelkawaii2"`
- Opening `passwords.txt` sets secrets unlock state.
- Control Panel "Ame's corner" tab is shown only when unlock flag is true.
- Clicking Ame profile icon opens `settings.ameCornerUrl` in a new tab.

## 10. Anti-Patterns (Do Not)
| Do Not | Do Instead | Why |
|---|---|---|
| Keep local salted hash auth as final Phase 2 architecture | Use Firebase Auth as locked target | Avoid dual-source auth drift and unresolved trust model. |
| Hardcode external URLs in component code | Read `hangOutUrl`/`ameCornerUrl` from settings | Keeps destinations editable without code edits. |
| Treat placeholder links as "complete" | Implement exact lore links list from source spec | Prevents mismatch against required user-facing behavior. |
| Start medicine effects immediately on click | Trigger near end of consumption sequence | Matches source behavior expectation and animation timing. |
| Allow concurrent medication effects | Enforce one active effect policy | Prevents unstable A/V stacking and inconsistent recovery. |
| Keep Ame tab always visible after control panel auth | Gate tab by secret unlock state | Preserves intended discovery flow via Trash Bin. |
| Parse embeds inline ad hoc in chat component | Use centralized parser contract (`embeds.ts`) | Ensures deterministic parsing and easier tests. |

## 11. Error Handling Matrix
| Error Type | Detection | User Response | Fallback | Logging/Telemetry |
|---|---|---|---|---|
| Firebase env missing | Required `VITE_FIREBASE_*` absent at startup | Show non-blocking setup warning in JINE auth area | Disable cloud write actions and keep UI readable | Console error with missing key names |
| Firebase auth failure | Auth SDK returns credential error | Show clear auth error message | Keep user in auth form, no partial login state | Error code + operation context |
| Firestore permission denied | Write/read rejected by rules | Show "permission denied" message | Retry after auth refresh | Error code + uid presence state |
| Network timeout/offline on JINE send | SDK/network error or offline event | Mark message as failed to send | Retry queue on reconnect | Warning with retry count |
| Invalid embed URL | Parser returns unsupported result | Show validation message before send | Send as plain text only if user confirms | Parser failure reason |
| Popup blocked for external links | `window.open` returns null | Show prompt to allow popups | Offer copyable URL fallback action | Warning with link type |
| Medicine overlap trigger attempted | `effectActive` true when Take clicked | Show temporary disabled/blocked feedback | Ignore second trigger | Debug event counter |
| Secrets unlock state persistence error | localStorage write throws | Show non-fatal warning toast | Keep in-memory state for session only | Storage failure warning |

## 12. Testing Plan and Acceptance Scenarios
### Unit Tests
- Embed parser:
  - valid/invalid YouTube URLs
  - valid/invalid Twitter/X URLs
  - unsupported links rejected deterministically
- Medicine effect state:
  - phase transitions
  - 60s timing boundaries
  - non-overlap guard
- Sleep time formatter:
  - UTC+10 correctness across local timezone differences
- Secrets reducer/store:
  - `markPasswordsSeen()` unlock behavior
  - persistence load/save behavior

### Integration Tests
- JINE auth gate required before send.
- New user profile creation writes profile doc.
- Returning user restores identity and unread indicators.
- Internet + Hang Out external launches use settings values.
- Trash open -> secrets unlock -> Control Panel Ame tab visibility.

### E2E / Manual Acceptance
- First-time user: JINE auth -> send text -> send YouTube embed -> send Twitter embed.
- Medicine flow: full cycle intro/sustain/fade and full A/V recovery.
- Settings-driven URL updates reflected without source edits.
- Existing Phase 1 shell/taskbar/start/menu/window behavior unchanged.

### Synthesis QA Test Cases
- `TC-DOC-01`: Every major decision has chosen/rejected source and reason.
- `TC-DOC-02`: No unresolved architecture conflicts remain.
- `TC-DOC-03`: Interface/type additions are unique and consistent.
- `TC-DOC-04`: Every Phase 2 source requirement maps to implementation steps.
- `TC-DOC-05`: Anti-patterns, tests, and error matrix are implementation-grade.
- `TC-DOC-06`: Source/repo deep links included for major claims.
- `TC-DOC-07`: Assumptions and defaults explicitly locked.
- `TC-DOC-08`: No unresolved "TBD" decision points in execution path.

## 13. Big-Bang Release Milestones
1. Foundation contracts complete:
   - type/settings updates, compatibility mapping, env contract.
2. Firebase foundation complete:
   - auth/firestore init and basic security rules.
3. JINE migration complete:
   - auth UX updates, cloud sync, embed parsing.
4. Desktop feature completeness:
   - Internet links, Hang Out URL behavior, Trash/Ame flow.
5. Medicine engine complete:
   - phase state machine, timing, A/V integration.
6. Final regression + release candidate:
   - all tests green, acceptance checklist passed, docs aligned.

### Pre-Ship Reminder (Release Blocker)
- [ ] Configure Firebase production env values (`VITE_FIREBASE_*`) in deployment environment.
- [ ] Enable Firebase Email/Password Auth and confirm Firestore rules are deployed.
- [ ] Run live JINE auth + message send/read smoke test against the target Firebase project.
- [ ] Do not ship if app shows: `"Firebase auth is not configured. Add VITE_FIREBASE_* env values."`

## 14. Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Firebase config missing/misconfigured | JINE cloud features blocked | Feature flag and setup checklist with explicit env validation. |
| Embed/CSP restrictions | Embedded media fails in iframe | Fallback to safe external open and clear user message. |
| Popup blockers | Link flows appear broken | Detect blocked open and provide manual open fallback. |
| Effect performance on low-end devices | Frame drops/audio artifacts | Cap filter intensity and update cadence, maintain single active effect. |
| Big-bang integration complexity | Late-stage regressions | Milestone gates and full regression sweep before release candidate. |

## 15. Definition of Done
- All Phase 2 requirements in `docs/Project_Phase_2_Implementation_Ready.md` are implemented or explicitly deferred with rationale.
- No plaintext password storage remains in app/local storage for Phase 2 auth path.
- JINE identity is preserved across sessions with cloud-backed shared messages.
- Internet, Hang Out, Trash, and Ame destination flows are settings-driven and functional.
- Medicine effect lifecycle is stable, non-overlapping, and returns system state to normal.
- Build succeeds and test matrix in this document passes.

## 16. Assumptions and Defaults
1. Firebase credentials are provided through `VITE_FIREBASE_*` env vars.
2. Shared JINE in Phase 2 uses one global conversation channel.
3. External links open in new tabs by default for reliability.
4. Existing Control Panel password remains `angelkawaii2` unless changed in a separate request.
5. `ameCornerUrl` remains settings-configurable until final canonical destination is fixed.
6. This document is authoritative for implementation implementation sequencing and conflict decisions.
