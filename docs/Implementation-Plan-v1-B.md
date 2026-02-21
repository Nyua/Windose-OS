# Plan B Implementation Plan V1
## Windose 20 - Phase 2 Implementation

> **Document Type:** Implementation Plan
> **Source:** `Project_Phase_2_Implementation_Ready.md`
> **Date:** 2026-02-07
> **Status:** Ready for Implementation

---

## Executive Summary

Phase 2 adds polish and expands the Windose 20 Web OS with improved authentication, interactive mechanics (Medicine effects), and hidden secrets/lore (Trash Bin → Ame's Corner unlock). The codebase already has many foundational components in place - this plan focuses on enhancements and missing features.

---

## Current State Analysis

| Feature | Status | What Exists | What's Missing |
|---------|--------|-------------|----------------|
| JINE Auth | 80% | `auth.ts` with SHA-256 hashing, `JineAuth.vue` UI | Confirm password, disclaimer |
| Medicine Effects | 60% | `medicine.ts` store, intensity decay | Phase system, per-med visuals, audio integration |
| Internet App | 50% | Basic links hub (4 links) | Gaming, Last.FM, Spotify links |
| Trash Bin | 70% | File browser, passwords.txt | Secrets store integration |
| Control Panel | 90% | Ame's Corner tab exists | Conditional unlock based on secret |
| Sleep App | 100% | `SleepApp.vue` with UTC+10 clock | None - fully implemented |
| Hang Out | 0% | Icon exists | Discord link functionality |

---

## Architecture Overview

### Technology Stack
- **Framework:** Vue 3 (Composition API)
- **State Management:** Pinia
- **Build Tool:** Vite + TypeScript
- **Storage:** localStorage for persistence

### Key Directories
```
windose-os/
├── src/
│   ├── components/     # Vue components (apps, windows, UI)
│   ├── stores/         # Pinia stores (auth, jine, medicine, time)
│   ├── types.ts        # TypeScript type definitions
│   ├── settings.ts     # Configuration schema
│   └── App.vue         # Root component
└── public/
    ├── icons/          # Desktop & app icons
    ├── avatars/        # User profile pictures
    ├── sounds/         # Audio assets
    └── stickers/       # JINE stickers
```

---

## Implementation Tasks

### Task 1: Secrets System (NEW)

**Priority:** High (blocks Task 4 and Task 5)

**Create:** `src/stores/secrets.ts`

```typescript
// State to track:
// - passwordsTxtSeen: boolean
// - amesCornerUnlocked: boolean
// Persist to localStorage: 'windose_secrets_v1'
```

**Purpose:** Manages unlock state for hidden content. When user opens `passwords.txt` in Trash Bin, it unlocks Ame's Corner in Control Panel.

---

### Task 2: JINE Authentication Enhancements

**Priority:** Medium

**Files to Modify:**
- `src/components/JineAuth.vue`

**Changes Required:**

1. **Add Confirm Password Field**
   - New input field below password (registration only)
   - Validation: `password !== confirmPassword` → show error "Passwords do not match"
   - Location: After line 62 in current file

2. **Add Disclaimer Text**
   ```html
   <div class="disclaimer">
     This site is mostly for fun. Your passwords are secure,
     but you are heavily encouraged to make a "for fun" password.
   </div>
   ```

3. **Add Twitter/X Embed Support** (in `JineChat.vue` if exists, or `Jine.vue`)
   - Detect `x.com` and `twitter.com` URLs in messages
   - Render as clickable links or embed previews

**Security Note:** Auth store already uses SHA-256 with salt - no changes needed to `auth.ts`.

---

### Task 3: Medicine Effect System Enhancement

**Priority:** High

**Files to Modify:**
- `src/stores/medicine.ts`
- `src/App.vue`
- `src/components/MedicineApp.vue`

**Changes Required:**

#### 3a. Add Phase System to `medicine.ts`

```typescript
type EffectPhase = 'intro' | 'sustain' | 'fadeout';

interface ActiveEffect {
    type: MedicineType;
    startTime: number;
    duration: number;      // 60000ms (1 minute)
    intensity: number;     // 0 to 1
    phase: EffectPhase;    // NEW
}
```

**Phase Timing:**
- `intro`: 0-5 seconds (intensity ramps from 0 → 1)
- `sustain`: 5s to 50s (intensity = 1.0)
- `fadeout`: 50s to 60s (intensity ramps from 1 → 0)

#### 3b. Per-Medication Visual Effects

| Medication | CSS Filter | Overlay Color |
|------------|------------|---------------|
| Depaz | `blur(1px) saturate(0.8)` | Blue tint `rgba(100,100,255,0.1)` |
| Dyslem | `blur(0.5px) hue-rotate(10deg)` | Warm tint `rgba(255,200,100,0.1)` |
| Embian | `blur(2px) brightness(0.9)` | Purple `rgba(50,0,80,0.2)` |
| Magic Smoke | `blur(3px) saturate(1.5) contrast(1.1)` | Rainbow shift + glitch animation |

#### 3c. Audio Modulation in `App.vue`

- During effect: Slow playback rate to 0.7x
- During fadeout: Gradually return to 1.0x
- Apply to all audio elements (SFX, background music)

#### 3d. Effect Trigger Timing

Per spec: "Effects start playing after Ame's consumption animation is almost complete (2 frames before end)"

```typescript
// In MedicineApp.vue take() function:
async function take(id: MedicineType) {
    isConsuming.value = true;
    // Wait for animation minus 2 frames (~33ms at 60fps)
    await delay(ANIMATION_DURATION - 33);
    store.takeMedicine(id);  // Trigger effect here
    await delay(33);
    isConsuming.value = false;
}
```

---

### Task 4: Trash Bin Secret Integration

**Priority:** High

**Files to Modify:**
- `src/components/TrashBin.vue`

**Changes Required:**

1. Import and use secrets store:
   ```typescript
   import { useSecretsStore } from '../stores/secrets';
   const secrets = useSecretsStore();
   ```

2. Call `secrets.markPasswordsSeen()` when `passwords.txt` is opened:
   ```typescript
   function openFile(name: string) {
       if (name === 'passwords.txt') {
           secrets.markPasswordsSeen();  // ADD THIS
           openDoc.value = { ... };
       }
   }
   ```

3. Ensure tooltip is visible: `title="Never store your passwords in a txt file"`

---

### Task 5: Control Panel - Conditional Ame's Corner

**Priority:** High (depends on Task 1)

**Files to Modify:**
- `src/components/ControlPanel.vue`

**Changes Required:**

1. Import secrets store:
   ```typescript
   import { useSecretsStore } from '../stores/secrets';
   const secrets = useSecretsStore();
   ```

2. Make Ame's Corner tab conditional (line 12):
   ```html
   <!-- BEFORE -->
   <button class="tab-btn" ... @click="activeTab = 'ame'">Ame's Corner</button>

   <!-- AFTER -->
   <button v-if="secrets.amesCornerUnlocked" class="tab-btn" ... @click="activeTab = 'ame'">Ame's Corner</button>
   ```

3. Update `openSecret()` function to emit event for opening SecretApp:
   ```typescript
   const emit = defineEmits<{
       // ... existing emits
       (e: 'openSecret'): void;
   }>();

   function openSecret() {
       emit('openSecret');
   }
   ```

---

### Task 6: New Secret App Component

**Priority:** Medium

**Create:** `src/components/SecretApp.vue`

**Purpose:** Portal to external website, unlocked via Ame's Corner

**Design:**
- Dark/mysterious aesthetic (black background, subtle glow effects)
- Teaser text: "The next chapter awaits..."
- Central button linking to external site
- Glitch/static animation effects for atmosphere

**Template Structure:**
```html
<template>
    <div class="secret-app">
        <div class="glitch-overlay"></div>
        <div class="content">
            <div class="title">You found me.</div>
            <div class="subtitle">The next chapter awaits...</div>
            <button class="portal-btn" @click="openPortal">
                Enter
            </button>
        </div>
    </div>
</template>
```

**Integration Required:**
- Add to `Desktop.vue` window rendering
- Add `'secret-portal'` to `WindowAppType` in `types.ts`
- Handle `openSecret` event in `App.vue` to open this window

---

### Task 7: Internet App Expansion

**Priority:** Low

**Files to Modify:**
- `src/components/InternetApp.vue`

**Add Links:**

| Display Name | URL | Icon |
|--------------|-----|------|
| Tweeter | `https://x.com/ProbablyLaced` | Existing |
| Metube | `https://youtube.com/@CHANNEL` | Existing placeholder |
| Gaming | `https://store.steampowered.com/...` | Need `steam.png` |
| Last.FM | `https://last.fm/user/...` | Need `lastfm.png` |
| Spotify | `https://open.spotify.com/...` | Need `spotify.png` |

**Assets Needed:**
- `public/icons/steam.png`
- `public/icons/lastfm.png`
- `public/icons/spotify.png`

---

### Task 8: Hang Out Discord Shortcut

**Priority:** Low

**Files to Modify:**
- `src/components/Desktop.vue`

**Change:** When "Hang Out" icon is activated, open Discord link instead of a window.

```typescript
function openApp(id: string) {
    if (id === 'hangout') {
        window.open('https://discord.gg/PLACEHOLDER', '_blank');
        return;
    }
    // ... rest of function
}
```

**Note:** Discord URL to be provided by user.

---

### Task 9: Types Update

**Priority:** High (blocks Task 6)

**Files to Modify:**
- `src/types.ts`

**Add to WindowAppType:**
```typescript
type WindowAppType =
    | 'webcam'
    | 'jine'
    | 'stream'
    | 'tweeter'
    | 'goout'
    | 'internet'
    | 'controlpanel'
    | 'credits'
    | 'secret'
    | 'task'
    | 'medication'
    | 'sleep'
    | 'trash'
    | 'secret-portal';  // ADD THIS
```

---

## Implementation Order

```
Phase 2.1: Foundation & Secrets
├── Task 1: Create secrets.ts store
├── Task 9: Add 'secret-portal' to types.ts
├── Task 4: Integrate secrets with TrashBin.vue
├── Task 5: Make ControlPanel Ame's tab conditional
└── Task 6: Create SecretApp.vue

Phase 2.2: JINE Polish
└── Task 2: Add confirm password + disclaimer

Phase 2.3: Medicine System
└── Task 3: Full medicine effect system
    ├── 3a: Phase system in store
    ├── 3b: Per-med visual effects
    ├── 3c: Audio modulation
    └── 3d: Trigger timing

Phase 2.4: Quick Wins
├── Task 7: Expand InternetApp links
└── Task 8: Hang Out → Discord link
```

---

## Dependencies Graph

```
Task 1 (secrets.ts)
    ├── Task 4 (TrashBin integration)
    └── Task 5 (ControlPanel conditional)
            └── Task 6 (SecretApp) ← Task 9 (types.ts)

Task 3 (Medicine) - Independent

Task 2 (JINE Auth) - Independent

Task 7 (Internet) - Independent

Task 8 (Hang Out) - Independent
```

---

## Verification Checklist

### Auth & Security
- [ ] Register with mismatched passwords → shows "Passwords do not match" error
- [ ] Check localStorage `windose_auth_v1` → password is hashed, not plaintext
- [ ] Disclaimer text visible on registration form

### Medicine Effects
- [ ] Take Depaz → blue-tinted blur effect for 1 minute
- [ ] Take Magic Smoke → rainbow glitch effect
- [ ] Audio slows to 0.7x during effect
- [ ] Effect fades out smoothly in last 10 seconds
- [ ] Cannot stack effects (new effect replaces current)

### Secrets Flow
- [ ] Fresh start: Ame's Corner tab NOT visible in Control Panel
- [ ] Open Trash Bin → double-click passwords.txt
- [ ] See tooltip: "Never store your passwords in a txt file"
- [ ] After viewing passwords.txt → Ame's Corner tab appears
- [ ] Click Ame's icon → SecretApp window opens
- [ ] SecretApp links to external site

### Internet App
- [ ] All 5 links visible with icons
- [ ] Each link opens correct external site in new tab

### Hang Out
- [ ] Clicking icon opens Discord in new tab (no window opens)

---

## Files Summary

| File | Action | Task |
|------|--------|------|
| `src/stores/secrets.ts` | CREATE | 1 |
| `src/components/SecretApp.vue` | CREATE | 6 |
| `src/types.ts` | MODIFY | 9 |
| `src/stores/medicine.ts` | MODIFY | 3a |
| `src/components/JineAuth.vue` | MODIFY | 2 |
| `src/components/TrashBin.vue` | MODIFY | 4 |
| `src/components/ControlPanel.vue` | MODIFY | 5 |
| `src/components/InternetApp.vue` | MODIFY | 7 |
| `src/components/Desktop.vue` | MODIFY | 6, 8 |
| `src/App.vue` | MODIFY | 3b, 3c, 6 |
| `public/icons/steam.png` | CREATE | 7 |
| `public/icons/lastfm.png` | CREATE | 7 |
| `public/icons/spotify.png` | CREATE | 7 |

---

## Notes & Decisions

1. **Sleep App:** Already complete - no changes needed
2. **Auth Security:** Already using SHA-256 with salt - meets requirements
3. **Discord URL:** Placeholder `https://discord.gg/PLACEHOLDER` - user to provide
4. **Secret Portal URL:** Placeholder - user to provide external site URL
5. **Icon Assets:** Steam, Last.FM, Spotify icons need to be created/sourced

---

## Appendix: Existing Code References

### Auth Store (Secure)
`src/stores/auth.ts:47-53` - SHA-256 hashing with salt

### Medicine Store (Base)
`src/stores/medicine.ts` - Has `ActiveEffect`, `takeMedicine()`, `checkExpiry()`

### Window Types
`src/types.ts` - `WindowAppType` union, `WindowState` interface

### Desktop Apps Array
`src/components/Desktop.vue:132+` - `desktopApps` array defines icons

### Control Panel Password
`src/components/ControlPanel.vue:106` - Hardcoded `'angelkawaii2'`
