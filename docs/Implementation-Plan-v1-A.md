# Implementation Plan A (v1) - Windose 20 Phase 2

## Summary
Create a new decision-complete implementation document at `docs/Implementation-Plan-v1-A.md` that operationalizes `docs/Project_Phase_2_Implementation_Ready.md` against the current `windose-os` codebase.
This document is implementation-ready (no unresolved engineering decisions) and aligned with selected defaults:

- Auth architecture: **Firebase Auth**
- JINE scope: **Shared cloud chat**
- Link behavior: **Open external links in new tab**
- Medicine trigger: **Take-button timeline**
- Secrets links: **Configurable via settings**
- Delivery strategy: **Big-bang release**

## Deliverable
Add a new document: `docs/Implementation-Plan-v1-A.md` with the following exact structure and content intent.

## Document Structure (exact sections)

1. **Title + Metadata**
- Title: `# Implementation Plan A (v1) - Windose 20 Phase 2`
- Date, source doc link, target app (`windose-os`), and release mode (`Big Bang`).

2. **Current Baseline (Repo Grounding)**
- State what exists now:
  - Phase 1 shell/window/taskbar/start menu/control panel/credits are present.
  - `Jine.vue` and `jine.ts` are local-storage based.
  - `Stream.vue` embeds YouTube only.
  - `Internet` window is still generic placeholder (no dedicated component).
  - Desktop has icon IDs for `hangout`, `sleep`, `medication`, `trash` but open handlers/types for these are not fully wired.
- State that this phase replaces placeholder behavior with production-ready flows.

3. **Phase 2 Scope and Non-Scope**
- In scope:
  - JINE auth + identity + media embedding + cloud-backed messages.
  - Internet links hub.
  - Medicine app + global A/V effect manager.
  - Sleep timezone app.
  - Hang Out link behavior.
  - Trash Bin secret flow + `passwords.txt` + Control Panel "Ame's corner".
- Out of scope:
  - Multi-room chat moderation platform.
  - Unique per-med effect variants beyond default baseline (deferred but prepared).
  - Any backend beyond Firebase services needed for auth/chat/profile.

4. **Architecture Decisions (locked)**
- **Auth**: Firebase Authentication (Email/Password).
- **Password security**: no password persisted in local state; rely on Firebase secure hashing/salting.
- **JINE messages**: Firebase Cloud Firestore shared feed (single global channel for Phase 2).
- **User profile**: Firestore profile document keyed by `uid` with display name + selected avatar.
- **External links**: open in new tab with `target="_blank"` and `rel="noopener noreferrer"`.
- **Effects orchestration**: centralized effect manager state in Pinia/composable, one active effect at a time.
- **Feature links**: `hangOutUrl` and `ameCornerUrl` added to settings and editable via Control Panel.

5. **Public Interfaces / Type Additions**
Define exact additions expected in code:

- `WindowAppType` in `windose-os/src/types.ts` add:
  - `'medication' | 'sleep' | 'hangout' | 'trash'`
- New settings fields in `windose-os/src/settings.ts`:
  - `hangOutUrl: string`
  - `ameCornerUrl: string`
  - `jineAuthEnabled: boolean` (default `true`)
  - `jineEmbedYouTubeEnabled: boolean` (default `true`)
  - `jineEmbedTwitterEnabled: boolean` (default `true`)
- JINE model expansion (`windose-os/src/jine.ts` replacement/sync layer):
  - `authorUid`, `authorName`, `authorAvatar`, `kind`, `body`, `createdAt`, `editedAt?`, `embeds[]`
- Medicine effect state type:
  - `effectActive`, `effectId`, `phase` (`intro|sustain|fade|idle`), `startedAt`, `endsAt`
- Trash secrets model:
  - file entries (`name`, `locked`, `type`, `content?`) and unlock flags.

6. **Data Contracts (Firebase)**
- **Auth**: Firebase Email/Password.
- **Collections**:
  - `profiles/{uid}`: `{ displayName, avatarId, createdAt, updatedAt }`
  - `jine_messages/{messageId}`: `{ authorUid, authorName, authorAvatar, kind, body, embeds, createdAt }`
- **Embed parsing contract**:
  - URL parser emits normalized embed objects:
    - `{ type: 'youtube', videoId, url }`
    - `{ type: 'twitter', tweetId, url }`
- **Rules baseline**:
  - Authenticated read/write for JINE and own profile updates.
  - No anonymous writes.
- **Env contract**:
  - Firebase config loaded from Vite env (`VITE_FIREBASE_*`), never hardcoded.

7. **Component/Module Plan**
- New components:
  - `components/Internet.vue`
  - `components/Medication.vue`
  - `components/Sleep.vue`
  - `components/TrashBin.vue`
  - `components/JineAuthModal.vue`
- New modules:
  - `src/firebase.ts` (app/auth/firestore init)
  - `src/stores/effects.ts` or `src/effects.ts`
  - `src/jineCloud.ts` (Firestore sync CRUD + listeners)
  - `src/embeds.ts` (YouTube/Twitter URL parsing/render model)
- Existing component updates:
  - `App.vue`:
    - window defaults/title map/open handlers for new app types
    - integrate effect overlay/audio transitions
  - `Desktop.vue`:
    - render branches for new apps
    - hook icon activation for `medication`, `sleep`, `hangout`, `trash`
  - `Jine.vue`:
    - gate input with auth modal
    - render media embeds in message stream
    - use live sync events
  - `ControlPanel.vue`:
    - include `hangOutUrl` and `ameCornerUrl`
    - add "Ame's corner" tab unlock state from Trash flow

8. **Feature-by-Feature Implementation Spec**
- **JINE**:
  - First input attempt triggers auth modal.
  - New account flow: username + avatar + password/confirm.
  - Returning flow preloads profile identity and allows logout/new account.
  - Add in-app disclaimer text exactly once in auth flow.
  - Parse/persist/render YouTube and Twitter/X links as embeds.
  - Notify users on unseen messages since last session timestamp.
- **Internet app**:
  - Lore-themed launcher list: Tweeter, Metube, Gaming, Last.FM, Spotify.
  - All open new tab.
  - Last.FM/Spotify custom icon slots in component.
- **Medicine app**:
  - Four meds with exact text from source doc.
  - "Take" action runs timeline; effect starts near end of consumption sequence.
  - Default effect lasts ~60s total with intro/sustain/fade.
  - Visual: pixelation overlay; Audio: slowdown + reverb, then restore.
  - Block overlapping effect triggers while active.
- **Sleep app**:
  - Display current time for UTC+10 (Canberra/Melbourne/Sydney label).
- **Hang Out**:
  - Opens configurable `hangOutUrl`.
- **Trash Bin + secrets**:
  - File-browser style UI with locked zipped files + readable `passwords.txt`.
  - Hover hint: "Never store your passwords in a txt file".
  - `passwords.txt` shows Control Panel password text.
  - Unlock "Ame's corner" tab in Control Panel.
  - Clicking Ame PFP opens configurable `ameCornerUrl`.

9. **Release Strategy (Big Bang)**
Single release branch with internal milestones:
1. Foundation: Firebase + type/schema + settings contracts.
2. App completeness: Internet/Sleep/HangOut/Trash + routing/types.
3. JINE cloud/auth/embed migration.
4. Medicine effect engine and integration.
5. Full regression pass and final polish.
6. Release candidate + docs update.

10. **Testing Plan and Acceptance Scenarios**
- Unit:
  - embed parser (YouTube/Twitter valid/invalid links)
  - medicine effect state transitions and non-overlap guard
  - timezone formatter correctness (UTC+10)
  - unlock-state reducer for Trash/Ame's corner
- Integration:
  - auth required before JINE send
  - new user profile creation + persisted identity
  - returning user session restore + unread notifications
  - external link launch from Internet/HangOut
  - Trash -> passwords.txt -> Control Panel tab unlock flow
- E2E/manual acceptance:
  - full first-time user flow through JINE auth to message with embed
  - medicine effect full 60s cycle and recovery
  - settings-driven URL changes reflected without code edits
  - no regressions in existing Phase 1 windows/taskbar/start menu behavior

11. **Risks and Mitigations**
- Firebase config absent -> feature flag + clear setup checklist.
- CSP/embed restrictions -> robust fallback to external open.
- Effect performance on low-end devices -> cap filter intensity and animation timing.
- Big-bang integration risk -> enforce milestone checkpoints + full pre-release regression.

12. **Definition of Done**
- All Phase 2 features from `docs/Project_Phase_2_Implementation_Ready.md` implemented or explicitly marked deferred with rationale.
- No plaintext password storage in app/local storage.
- JINE identity preserved across sessions with cloud-backed shared messages.
- Medicine default effect loop stable and non-overlapping.
- Trash secret flow unlocks "Ame's corner" and launches configured destination.
- Build succeeds and documented test matrix passes.

## Assumptions and Defaults
- Firebase project credentials will be provided via `VITE_FIREBASE_*` env vars.
- Shared JINE uses a single global conversation stream in Phase 2.
- External links are opened in new tabs by default for reliability.
- Existing Phase 1 Control Panel password (`angelkawaii2`) remains unchanged unless separately requested.
- "Ame's corner" destination is a URL configured via settings until final destination is known.
