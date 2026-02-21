# Project Phase 2: Windose 20 — Web OS Polish & Expansion

> **Source Document:** Derived from `Project phase 2.docx`
> **Target Audience:** product, design, and engineering teams
> **Date:** 2026-02-07

## 1. Project Overview
**Goal:** Polish the existing "Windose 20" Web OS, expand desktop applications, and implement improved user authentication and interactive mechanics (Medicine system, Hidden secrets).
**Context:** The application simulates a desktop environment (Web OS) with a specific aesthetic (likely *Needy Streamer Overload* inspired).

## 2. Global Requirements
*   **Assets:** Prioritize using existing sprites and assets. Do not create placeholders if the correct asset exists in the codebase.
*   **Security:**
    *   **CRITICAL:** User passwords must be stored securely (hashed/salted). **NO PLAIN TEXT STORAGE**, even though it is a "fun" site.
    *   See *Authentication* section for specific warnings.
*   **Visuals:** High emphasis on polish and specific animation triggers.

## 3. Application Specifications

### 3.1 JINE App (Chat & Social)
**Core Function:** Chat application requiring user identity. Image for reference: references-for-design-doc\Password.png

*   **Authentication Flow:**
    *   **Trigger:** When a user attempts to type in JINE for the first time.
    *   **New User:** Prompt to "Sign In" or "Create Profile".
        *   Fields: Username, Profile Picture (Selection), Password, Confirm Password.
    *   **Returning User:** Login screen.
        *   Should pre-fill Username/PFP if recognized (Local Storage/Cookies).
        *   Must include **Logout Button** and **New Account Button**.
    *   **Disclaimer:** Display warning: *"This site is mostly for fun. Your passwords are secure, but you are heavily encouraged to make a ‘for fun’ password."*
*   **Features:**
    *   **Media Embedding:** Users must be able to embed YouTube videos and Twitter/X links directly in chat.
    *   **Notifications:** Notify returning users of new messages since they left.
    *   **Identity:** Preserved user identity across sessions.

### 3.2 Internet App (Links Hub)
**Core Function:** Desktop shortcut to external social media, themed to fit the lore. Image for reference: references-for-design-doc\Internet.gif

*   **Links & Naming Convention:**
    *   **Twitter/X:** "Tweeter"
    *   **YouTube:** "Metube"
    *   **Steam:** "Gaming"
    *   **Last.FM:** "Last.FM" (Custom Icon)
    *   **Spotify:** "Spotify" (Custom Icon)
*   **Reference:** See original doc for layout image.

### 3.3 Medicine App (Interactive Mechanic)
**Core Function:** Windows displaying medication info and triggering audiovisual effects. Image for reference: references-for-design-doc\Medicine.gif

*   **UI Layout:** Window showing Name, Effects, Side Effects, and "Ame’s Notes".
*   **Medication Data:**
    1.  **Depaz (1mg)**
        *   *Effects:* Calms the user down.
        *   *Side Effects:* Makes the user kinda floppy.
        *   *Note:* "Everything just feels more manageable when I take some. Makes me feel kinda floaty if I take too many though."
    2.  **Dyslem Pills**
        *   *Effects:* Stops coughs.
        *   *Side Effects:* Makes you feel all sorts of things.
        *   *Note:* "A streamer’s voice is their lifeline! But don’t take too many or bad shit will happem."
    3.  **Embian**
        *   *Effects:* Helps you conk out.
        *   *Side Effects:* Your brain goes all funny.
        *   *Note:* "Good for when I just want to forget everything and sleep. I go bonkers if I take too many."
    4.  **Magic Smoke**
        *   *Effects:* Makes you feel super relaxed.
        *   *Side Effects:* Fun :3
        *   *Note:* "For when I want to bury everything that hurts me and makes me sad deep down."

*   **Effect System (Complex):**
    *   **Trigger:** Effects start playing *after* Ame's consumption animation is almost complete (preferable 2 frames before end).
    *   **Duration:** ~1 minute total (Intro -> Sustain -> Fade Out).
    *   **Visuals:**
        *   *Current Default:* Screen pixelation.
        *   *Future:* Unique effects per med.
        *   *Webcam:* Defaults back to previous state after effect ends.
    *   **Audio:**
        *   *Current Default:* Slowed + Reverb.
        *   *Fade:* Slowly return to normal audio levels/speed.

### 3.4 Sleep App
*   **Function:** Displays time in specific timezones.
*   **Zones:** UTC+10:00 (Canberra, Melbourne, Sydney).
*   **Status:** Graphics TBD.

### 3.5 Hang Out
*   **Function:** Desktop shortcut.
*   **Action:** Opens a link to the creator's Discord account.

### 3.6 Trash Bin (Secret/Lore) Image for reference: references-for-design-doc\Trash-Bin.png
**Location:** Bottom right of the screen.

*   **Interaction:** Opens a "File Browser" style window.
*   **Contents:**
    *   Multiple "zipped" (inaccessible) files with random names.
    *   **Target File:** `passwords.txt` (Unzipped/Readable).
*   **Hover Event:** Tooltip/Prompt reads: *"Never store your passwords in a txt file"*.
*   **Content of `passwords.txt`:**
    ```text
    Control Panel: "angelkawaii2"
    ```
*   **Unlockable:**
    *   Using the password allows access to **Control Panel**.
    *   **New Tab in Control Panel:** "Ame’s corner".
    *   **Content:** Single Ame PFP icon.
    *   **Action:** Clicking the icon leads to the *Next Major Part of the Website*.

## 4. Implementation Checklist for Agents
1.  [ ] **Auth System:** Set up secure backend/firebase/local-auth solution for JINE.
2.  [ ] **UI Components:** Build "Internet", "Medicine", and "Trash Bin" window components.
3.  [ ] **Audio/Visual Manager:** Create a global manager for handling the "Medicine" effects (pixelation shader, audio playback rate control).
4.  [ ] **State:** Implement global state for "Effect Active" to prevent overlapping triggers.
5.  [ ] **Secrets:** Implement the Control Panel logic and the `passwords.txt` discovery flow.
