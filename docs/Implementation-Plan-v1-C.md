# Project Phase 2: Windose 20 — Web OS Polish & Expansion (Plan C's Implementation Plan v1)

> **Source Document:** Forked from `Project_Phase_2_Implementation_Ready.md`
> **Implementer:** Plan C (Antigravity Agent)
> **Date:** 2026-02-07

## 1. Project Overview
**Goal:** Polish the existing "Windose 20" Web OS, expand desktop applications, and implement improved user authentication and interactive mechanics (Medicine system, Hidden secrets).
**Context:** The application simulates a desktop environment (Web OS) with a specific aesthetic (Needy Streamer Overload inspired).

## 2. Global Requirements & Plan C's Technical Approach
*   **Assets:** Using existing sprites and assets in `public/`.
*   **Security:**
    *   **Implementation:** Using `crypto.subtle.digest` (SHA-256) with a salt for password hashing before storing in `localStorage`.
    *   **Store:** `src/stores/auth.ts` manages user state and persistent sessions.
*   **Visuals:**
    *   **Effects:** Implemented a global overlay in `App.vue` controlled by `medicineStore` for pixelation/blur filters.

## 3. Application Specifications & Implementation Details

### 3.1 JINE App (Chat & Social)
**Core Function:** Chat application requiring user identity.

*   **Authentication Flow:**
    *   **Components:** `JineAuth.vue` (Login/Register) and `JineChat.vue` (Chat Interface).
    *   **Logic:** `Jine.vue` acts as a container, switching components based on `authStore.isAuthenticated`.
    *   **Persistence:** User session persists in `localStorage` but requires login on refresh (ephemeral session, persistent account).
*   **Features:**
    *   **Media Embedding:** Supports Image and YouTube URLs. Checked via regex in `JineChat.vue`.
    *   **Notifications:** `Desktop.vue` watches `jineStore.unreadCount` and adds `notify` class to taskbar/window tabs.
    *   **Store:** `src/stores/jine.ts` handles messages and seeding.

### 3.2 Internet App (Links Hub)
**Core Function:** Desktop shortcut to external social media.

*   **Implementation:** `src/components/InternetApp.vue`.
*   **Links:**
    *   **Tweeter:** Opens `https://x.com/ProbablyLaced` (external).
    *   **Metube:** Opens `https://youtube.com` (external).
    *   **Gaming:** Placeholder/Steam.
    *   **Last.FM/Spotify:** Custom icons/links.

### 3.3 Medicine App (Interactive Mechanic)
**Core Function:** Windows displaying medication info and triggering audiovisual effects.

*   **Implementation:** `src/components/MedicineApp.vue`.
*   **Store:** `src/stores/medicine.ts`.
*   **Medication Data:** Hardcoded list in component matching specs (Depaz, Dyslem, Embian, Magic Smoke).
*   **Effect System:**
    *   **Visuals:** `App.vue` applies CSS filters (`blur`, `contrast`, `repeating-linear-gradient`) to a top-level overlay when `medicineStore.isHigh` is true.
    *   **Audio:** `App.vue` intercepts `playSfx` calls and adjusts `playbackRate` to 0.8x if effect is active.

### 3.4 Sleep App
**Function:** Displays time in UTC+10.

*   **Implementation:** `src/components/SleepApp.vue`.
*   **Logic:** Calculates UTC+10 time using `Date` object and offsets. Includes floating "Zzz" animation.

### 3.5 Hang Out
**Function:** Desktop shortcut.
*   **Implementation:** `Desktop.vue` handles `goout` app type (placeholder "GO OUTSIDE" text for now).

### 3.6 Trash Bin (Secret/Lore)
**Location:** Bottom right of the screen.

*   **Implementation:** `src/components/TrashBin.vue`.
*   **Contents:**
    *   `passwords.txt`: Double-click opens a mock Notepad overlay with the secret password (`angelkawaii2`).
    *   Tooltip: "Never store your passwords in a txt file".
*   **Unlockable:**
    *   `ControlPanel.vue`: Input field accepts `angelkawaii2` to unlock "Ame's Corner" tab.
    *   **Ame's Corner:** Circular avatar icon that triggers an alert (placeholder for Phase 3).

## 4. Implementation Checklist (Status)
1.  [x] **Auth System:** `src/stores/auth.ts` implemented with hashing.
2.  [x] **UI Components:**
    *   [x] Internet (`InternetApp.vue`)
    *   [x] Medicine (`MedicineApp.vue`)
    *   [x] Trash Bin (`TrashBin.vue`)
    *   [x] Sleep (`SleepApp.vue`)
3.  [x] **Audio/Visual Manager:** Implemented in `App.vue` (sound) and CSS overlay (visuals).
4.  [x] **State:** `medicineStore` manages `activeEffect` state.
5.  [x] **Secrets:** Control Panel unlock and `passwords.txt` flow working.
