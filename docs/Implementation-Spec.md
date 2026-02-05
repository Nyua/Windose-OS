# Windose 20 - Implementation Spec (Implementation)
Audience: AI coding agents and engineers

## 1. Constraints and Global Rules

### 1.1 Viewport
- Aspect Ratio: 4:3 (CRT-style). Centered on wider screens.
- Base Viewport Size: 1436x1080 (content area only). Scales to fit browser when viewportScaleAuto=true; manual scale uses viewportScale.
- Side Fill: Mirror side-bar assets from the sidebars folder at full size (default). Use sidebar_noon for NOON, sidebar_dusk for DUSK, and sidebar_night for NIGHT. Alternative pattern is optional via settings.
- Sidebar Transition Bloom: When TimeSlot changes (sidebars swap), play a highlight-bloom flash on the sidebars only (bright areas intensify and bloom). Fade in over 1.5s then fade out over 2.5s (total 4.0s).
- Pixel Crispness: Apply `image-rendering: pixelated;` and `-webkit-font-smoothing: none;` globally.
- Desktop Wallpaper: Use public/background/bg.png sourced from Sprites-NSO/background/bg.png.
- UI Scale: apply a UI-only scale factor to chrome elements (fonts, scrollbars, inputs) so they stay legible at low viewportScale. Auto mode uses uiScale = clamp(1.0, 1.5, 1 / viewportScale).
- Softness: apply a subtle blur to the main viewport to reduce over-sharpness (configurable).

### 1.2 Color Palette
Use these exact hex values. Reference names are for quick identification.

Window frame styling (Phase 2):
- Window buttons are on the right.
- Window buttons are code-based glyphs for now (focused/unfocused color states). TODO: switch to WacOS sprite-based buttons when assets are sourced.
- No hover states on window buttons.
- Bevel borders are 2px.

| Element | Hex | Notes |
| --- | --- | --- |
| Window Background | #F0F0F0 | Standard Win95 client area |
| Active Title Bar | #BD64F1 | "Ame Purple" |
| Inactive Title Bar | #A5B0CE | Desaturated Periwinkle |
| Bevel Highlight | #FFFFFF | Top/Left borders |
| Bevel Shadow | #808080 | Bottom/Right borders |
| Font Color (Base) | #2B2B2B | Soft Black |

### 1.3 Typography
- Primary UI Font: PixelMplus10 - window titles, menus, buttons.
- Secondary Font: PixelMplus12 - chat logs, JINE messages.
- System/Error Font: DinkieBitmap - BSOD, boot screens.
- Fonts are loaded from local files in the repo (no CDN).

### 1.4 Art Assets
All sprite/image assets are in the `Sprites-NSO/` folder, organized by category.

### 1.5 Reference Images Index
These reference images are used for UI matching and overlays:
- `references-for-design-doc\Noon.png` - Noon desktop lighting reference.
- `references-for-design-doc\Dusk.png` - Dusk overlay reference.
- `references-for-design-doc\Night.png` - Night overlay reference.
- `references-for-design-doc\Webcam.png` - Webcam window reference.
- `references-for-design-doc\Stream.png` - Stream topic list reference (future UI).
- `references-for-design-doc\Jine.png` - JINE window reference.
- `references-for-design-doc\StickerMenu.png` - Sticker grid reference.

## 2. Core Architecture ("Raincandy" Processor)

### 2.1 State Management
Use Pinia for the global store (Vue 3's official state management). Track the following:
- dayOfYear: Integer 1-365 (or 1-366 on leap years). Derived from the local system date.
- timeSlot: Enum - NOON | DUSK | NIGHT. Derived from the local system clock.

TimeSlot boundaries (local time, 24-hour):
- NOON: 06:00-16:59
- DUSK: 17:00-19:59
- NIGHT: 20:00-05:59

#### Time Store Implementation
- **Location:** `src/stores/time.ts`
- **Store name:** `useTimeStore`
- **Computed state:** `dayOfYear`, `timeSlot`
- **Debug overrides:** `timeSlotOverrideEnabled`, `timeSlotOverride` (wired to Control Panel settings)
- **Actions:** `updateTime()` (refresh from system clock), `setTimeSlotOverride(enabled, slot)`

### 2.2 Time-of-Day Rendering
Desktop background and a CSS lighting overlay change per TimeSlot:
- NOON: Standard bright illumination (no overlay). Reference image attached: `references-for-design-doc\Noon.png`
- DUSK: Orange/sunset overlay via `mix-blend-mode: multiply`. Reference image attached: `references-for-design-doc\Dusk.png`
- NIGHT: Dark purple/blue tint. Streaming is ONLY unlocked at Night. Reference image attached: `references-for-design-doc\Night.png`

### 2.3 Window Manager
Implement a custom window-management hook/context that handles:
- Window registry: each window has `id`, `appType`, `x`, `y`, `width`, `height`, `zIndex`, `isMinimized`, `isFocused`, `isOpen`.
- Z-Index: maintain a monotonic `zCounter` starting at 100. On focus or open, assign `zIndex = ++zCounter`.
- Focus Styling: exactly one focused window at a time. Active title bar -> #BD64F1. Inactive -> #A5B0CE.
- Open: if a window of the same `appType` is already open, focus it instead of spawning a duplicate.
- Minimize: sets `isMinimized = true` and hides the window; window stays in registry.
- Minimize target: animate toward the window's taskbar tab center (based on DOM bounding box) when available; fallback to bottom-left if a tab is not found.
- Close: removes the window from registry (or sets `isOpen = false` and removes its taskbar tab).
- Dragging: drag via title bar only. Windows are draggable and may move outside the Desktop bounds.
- Drag bounds rule: no clamping; windows can be partially or fully outside the Desktop area.
- Resizing: windows are dynamically resizable from all edges and corners. Minimum size is the title bar plus content area; no maximum size limit.
- Drag/Resize guard: disable text selection and iframe pointer events while dragging or resizing windows or icons.
- Transitions:
  - Close: no animation; window disappears immediately.
  - Minimize: smooth transition to the window's taskbar tab (MacOS/Windows 11 style).
  - Restore from minimize: smooth transition from taskbar tab to its last position/size.
  - Fullscreen: smooth expand to fill the Desktop area above the taskbar (does not cover taskbar). Taskbar height is configurable (see settings).
  - Restore from fullscreen: smooth transition back to the last non-fullscreen position/size.

## 3. Application Specifications

### Phase 1 Checklist (Concrete)
- Project scaffold: Vue 3 + Vite app boots locally.
- Base layout: 4:3 desktop container centered with side fill.
- Taskbar frame: bottom bar with Start button, quick launch slots, window tabs area, system tray (day + sun/moon).
- Window manager: open/focus/minimize/close, z-ordering, resize, fullscreen above taskbar, transitions.
- Window frame: title bar, buttons, bevel borders, active/inactive colors.
- Desktop icons: draggable, selectable, double-click activation, snap-to-grid, bounds guard, notifications badge.
- Control Panel: password gate (angelkawaii2), settings editor, local storage persistence, warnings on storage failure.
- Settings wiring: all icon/window params editable (except highlight color).
- Placeholder apps: Internet (empty window), Stream (video embed placeholder).
- Boot sequence overlay: BIOS -> Boot Menu -> Startup (first visit + Start Menu triggers).
- Basic assets: hook up Sprites-NSO/ and reference images for layout checks.

### Phase 2 Notes (Concrete)
- Load all fonts from local repo files.
- Use code-based window buttons for now; switch to WacOS sprite-based focused/unfocused states when assets are sourced. Placeholder sprites are in /public/buttons.
- No hover states on window buttons.
- Bevel borders are 2px.
- Side assets from sidebars folder are full size.
- Start Menu uses NSO sprites (start-menu/start_menu.png, start_button.png, start_pressed.png). Start button shows pressed sprite while menu is open.
- No scanline effect in Phase 2.

### 3.1 Desktop and Taskbar
Taskbar (bottom of screen):
- Taskbar background color matches the Start button base color (#D3C1DE from start_button.png).
- Taskbar tabs and tray items use the same 2px bevel treatment as the Start button. Quick launch icons are flat (no bevel).
- Start Menu flyout is anchored to the bottom-left of the playable viewport and sits directly above the taskbar (bottom = taskbarHeight).
- Start Menu flyout slides up from under the Start button when opened and slides back down when closed.
- Start Menu Actions: Restart plays the boot sequence then refreshes the page; Shut Down plays the boot sequence then attempts to close the tab.
- Start Button (bottom-left): Opens system menu -> Shut Down, Restart, Control Panel (Settings).
- Quick Launch Icons: Tweeter, JINE, Task Manager.
- Quick Launch uses sprite buttons from public/quickmenu: button_tweeter.png, button_jine.png, button_task-manager.png.
- Quick Launch buttons darken while pressed (mouse down). They remain darkened while held and return to normal on release or pointer leave.
- Active Windows Area: Rectangular tabs for each open app.
- Taskbar tabs spacing: 10px between tabs.
- Taskbar tabs auto-resize to fit the available tab area. Max width 220px; shrink as more tabs open so the group never overflows the taskbar. Tab titles truncate with ellipsis when space is tight.
- System Tray (bottom-right): Clock showing "DAY <n>" where n = local day-of-year (1-365/366, no padding). Sun/Moon icon for current TimeSlot.

Desktop Shortcuts:
- Stream, Hang Out, Sleep, Medication, Internet, Go Out, Trash Bin, Secret.txt.
- The "Stream" icon has a unique shortcut-arrow overlay.
- Secret.txt is placed slightly right of center on the desktop (custom default position).

Taskbar interactions:
- Volume control lives in the taskbar (slider or icon).
- Start button toggles the Start menu. Clicking outside the menu closes it.
- Taskbar tab click behavior: minimized -> restore + focus; focused -> minimize; unfocused -> focus (bring to front).
- Quick Launch click opens the app (focuses if already open).

#### 3.1.1 Desktop Icons (Borrowed from WacOS)
Behavior model is based on WacOS desktop icon logic. Values marked in Settings are configurable via Control Panel.

Selection and activation:
- Single click selects the icon and shows a highlight background.
- Double click activates the icon's action (launch/open).
- Double click detection window: iconDoubleClickMs between clicks.
- Clicking away clears selection.

Dragging and grid:
- Icons are draggable.
- On drag end, icon snaps to a grid using settings:
  - gridX = iconGridX (default width * 1.2 + iconGridPaddingX)
  - gridY = iconGridY (default height * 0.8 + iconGridPaddingY + iconLabelLineHeight)
  - snapped position = round(position / grid) * grid + iconGridOffset (both x and y)
- Drag bounds rule for icons (if iconClampEnabled = true):
  - TASKBAR_HEIGHT = iconTaskbarHeight
  - If dragged below the taskbar, snap Y to (viewportHeight - iconHeight * 2 - iconClampBottomOffset)
  - If dragged above, snap Y to iconClampTop
  - If dragged beyond left/right, snap X to iconClampLeft or (viewportWidth - iconWidth * 2 - iconClampRightOffset)

Default placement:
- Desktop icons are initially placed in a left column:
  - x = iconDefaultX
  - y = iconDefaultYStep * index + iconDefaultX

Notifications:
- Icons can display a small notification badge in the top-right corner (used for messaging/email).

### 3.1.2 Secret.txt
- Desktop app shortcut named "Secret.txt".
- Default placement: slightly right of center on the desktop (custom default position).
- Opening behavior: opens a window like any other app.
- Access guard: webcam blocks interaction unless webcam is disabled via Control Panel.

### 3.1.3 Task Manager
- Basic Task Manager UI replaces the placeholder.
- Shows a list of open windows with status (Focused/Minimized/Open) and size.
- Read-only in Phase 1 (no close/kill actions yet).

### 3.2 Webcam
- Ame reacts to user intent: close-button hover holds mad frame 1 for the duration of hover; on hover end, show mad frame 2 for ~1s, then revert to the previous sprite. Minimize/close triggers the mad frame 2 flash for ~1s, then revert.
- Display: Shows Ame-chan sprite (randomly selected GIF; stays until window event).
- Reopen Behavior: If closed or minimized, forcefully reopens and randomizes the sprite.
- Secret.txt Guard: If user hovers over Secret.txt, the webcam window moves to cover it, making it un-interactable. User can only access Secret.txt after disabling Ame's webcam via Control Panel.

Reference image for complete webcam: `references-for-design-doc\Webcam.png`

### 3.3 Stream App ("Metube")
Stream window embeds a YouTube iframe using `streamVideoUrl` (editable in Control Panel).
- Autoplay attempt when the window opens.
- No controls; not muted.
- Pause when minimized or unfocused; resume when focused.
- On close, playback stops.
- If URL is empty, show a placeholder prompt.
- If TimeSlot is not NIGHT, show a locked message and do not autoplay.
- If the embed fails to load within 4 seconds, show an in-window error banner with an external link to the original URL.
Future UI reference (deferred): `references-for-design-doc\Stream.png` (Metube topic list).

### 3.4 Go Out
Full-size window displaying "GO OUTSIDE" in very large font using the default UI font, centered and filling most of the window while remaining readable. Comedic/intentional.

### 3.5 JINE (Messaging)
UI layout (match Jine.png):
- Default window size: 500x500.
- Use JINE_background.png as a tiled background for the entire JINE app (repeat to fill any window size).
- Light blue chat bubbles with avatar on left; user replies right-aligned with purple bubble.
- Chat bubble text wraps at ~35 characters per line (max width 35ch) to match reference.
- Read receipts: if a message has been viewed by another user, show a small "Read" label underneath the bubble (visual only for now).
- Future: Read label becomes clickable to show avatars of users who have viewed the message (requires server/user accounts).
- Centered day pill label (Noon placeholder).
- Large white input area with narrow right-side rail and small send button.
- Sticker menu is a collapsible drawer above the text area.
  - Default: closed on app load.
  - Toggle: a thin bar with a centered arrow indicator that slides the panel in/out.
  - Sticker grid uses Sprites-NSO sticker images (see StickerMenu.png for layout).
  - When open, the sticker panel overlays the chat (transparent) rather than pushing it down.
- Text input starts at the send button height and auto-expands as the user types more lines; no fixed composer height.
- Chat scrollbar is simplified: blue track (beam) with a tall pink rectangle thumb; no arrow buttons.

Local storage schema (Phase 1):
- messages: array of { id, author, body, timestamp, isUnread }
- lastReadAt: timestamp
- unreadCount: number
- Notifications: Icon bounces/flashes on the taskbar when a new message arrives.
- Sticker Responses: Users reply with a grid of 8+ stickers (Praise, Love, Scold, etc.).
- Chatroom (Hybrid): Phase 1 uses local-only storage; messages are stored per-user in local storage and only visible on the same device/browser. Not live - on page refresh, a notification pop-up (bottom-right of the interactive area) shows a shortened preview of new messages. Clicking the notification opens the chat. Phase 2 will add server-backed storage for cross-user visibility.

Reference images: `references-for-design-doc\Jine.png`, `references-for-design-doc\StickerMenu.png`

### 3.6 Tweeter
Phase 1: Embed iframe to https://x.com/ProbablyLaced (placeholder). Future: fully usable in-app Twitter clone.
- If the embed fails to load within 4 seconds, show a placeholder with an external link.

### 3.7 Internet
No functionality in Phase 1. Create an empty application component as a placeholder.

### 3.8 Control Panel (Settings)
Settings live under Start Menu -> Control Panel. This menu is password-protected and intended for site developers only.

#### 3.8.1 Access and Auth
- Access requires a developer password.
- Password is checked client-side (non-strong auth, dev-only gate).
- Password is fixed to "angelkawaii2" in Phase 1 and not editable in the UI.

#### 3.8.2 Configurable Parameters (Phase 1)
| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| windowResizable | boolean | true | Enable/disable dynamic window resizing |
| minimizeAnimationMs | number | 180 | Duration for minimize/restore transitions |
| fullscreenAnimationMs | number | 220 | Duration for fullscreen expand/restore |
| windowTransitionEasing | string | "ease-out" | CSS easing for window transitions |
| allowOffscreenWindows | boolean | true | Allow windows to move outside desktop bounds |
| taskbarHeight | number | 50 | Taskbar height in pixels (used for fullscreen and icon guard) |
| viewportWidth | number | 1436 | Playable OS width in pixels (content area, no sidebars) |
| viewportHeight | number | 1080 | Playable OS height in pixels (content area, no sidebars) |
| viewportScaleAuto | boolean | true | Auto-fit scale to browser viewport (uses integer-only if enabled) |
| viewportScale | number | 1 | Manual scale multiplier (used when auto is off) |
| viewportScaleIntegerOnly | boolean | false | Snap scale to nearest integer (1x, 2x, 3x) |
| uiScaleAuto | boolean | true | Auto-scale UI chrome (fonts/scrollbars/inputs) relative to viewportScale |
| taskbarOpacity | number | 1 | Taskbar opacity (0 transparent ? 1 opaque) |
| taskbarBodyVisible | boolean | true | Toggle taskbar background/body visibility (elements remain) |
| quickMenuGap | number | 13 | Quick menu icon gap in px |
| quickMenuOffsetX | number | 15 | Quick menu horizontal offset in px |
| tabOffsetX | number | 15 | Taskbar tabs horizontal offset in px |
| uiScale | number | 1 | Manual UI scale when auto is off |
| viewportSoftness | number | 0.25 | Subtle blur amount in px applied to the main viewport |
| timeSlotOverrideEnabled | boolean | false | Debug: allow overriding TimeSlot in settings |
| timeSlotOverride | string | "NOON" | Debug: TimeSlot override value (NOON/DUSK/NIGHT) |
| webcamEnabled | boolean | true | Enable Ame webcam window + Secret.txt guard |
| streamVideoUrl | string | "" | Stream video URL (embedded video source) |
| bootBlackMs | number | 2000 | Boot sequence black screen duration (ms) |
| bootBiosMs | number | 5000 | Boot BIOS screen duration (ms) |
| bootFadeMs | number | 2000 | Boot screen fade-in duration (ms) |
| iconSnapEnabled | boolean | true | Snap desktop icons to grid on drag end |
| iconGridX | number | 112 | Desktop icon grid X spacing (pixels) |
| iconGridY | number | 100 | Desktop icon grid Y spacing (pixels) |
| iconGridOffset | number | 10 | Desktop icon grid offset (pixels) |
| iconGridPaddingX | number | 16 | Extra X padding used in grid calc (pixels) |
| iconGridPaddingY | number | 16 | Extra Y padding used in grid calc (pixels) |
| iconLabelLineHeight | number | 20 | Label line-height used in grid calc (pixels) |
| iconWidth | number | 80 | Default icon width (pixels) |
| iconHeight | number | 80 | Default icon height (pixels) |
| iconTaskbarHeight | number | 50 | Taskbar height used for icon drag guard (pixels) |
| iconClampEnabled | boolean | true | Clamp icon positions within visible desktop area |
| iconClampLeft | number | 0 | Minimum icon X when clamped |
| iconClampTop | number | 0 | Minimum icon Y when clamped |
| iconClampRightOffset | number | 0 | Right edge offset when clamped |
| iconClampBottomOffset | number | 0 | Bottom edge offset when clamped |
| iconDefaultX | number | 10 | Default icon column X position (pixels) |
| iconDefaultYStep | number | 100 | Default icon vertical spacing (pixels) |
| iconDoubleClickMs | number | 300 | Double-click detection window (ms) |
| sfxClickPath | string | "/sounds/mouseclick.wav" | Mouse click SFX file path (public/sounds) |
| sfxNotifyPath | string | "/sounds/@Resources_Audio_piporo.wav" | Notification chime SFX file path (public/sounds) |
| sfxWindowOpenPath | string | "/sounds/window_open.wav" | Window open SFX (public/sounds) |
| sfxWindowClosePath | string | "/sounds/Audio_close.wav" | Window close SFX (public/sounds) |
| sfxWindowMinimizePath | string | "/sounds/execute.wav" | Window minimize SFX (public/sounds) |
| sfxWindowRestorePath | string | "/sounds/execute.wav" | Window restore SFX (public/sounds) |
| sfxWindowFullscreenPath | string | "/sounds/execute.wav" | Window fullscreen SFX (public/sounds) |
| sfxWindowDragPath | string | "/sounds/window_drag.wav" | Window drag start SFX (public/sounds) |
| sfxJineSendPath | string | "/sounds/jine_send_stamp_and_text.wav" | JINE send SFX (public/sounds) |
| sfxVolumeDefault | number | 0.5 | Default SFX volume (0.0-1.0) |
| sfxVolumeMin | number | 0.0 | Minimum SFX volume | 
| sfxVolumeMax | number | 1.0 | Maximum SFX volume |
| sfxEnabled | boolean | true | Master SFX enable/disable toggle |
| crtEnabled | boolean | true | CRT scanline overlay enable/disable |
| crtIntensity | number | 0.35 | CRT scanline intensity (0.0-1.0) |

TimeSlot debug control: Control Panel provides a Default/Noon/Dusk/Night toggle group that writes to timeSlotOverrideEnabled/timeSlotOverride.

#### 3.8.3 Persistence
- Settings persist in local storage (per-browser).
- If local storage is unavailable, fall back to defaults and display a warning in Settings.

#### 3.8.4 Utilities
- Control Panel includes a "Clear Local Storage" button near the top of the settings panel.
- On click: prompt for confirmation; if confirmed, clear `localStorage` and reload the page.

### 3.9 Boot Sequence (Startup/BIOS/Boot Menu)
- Plays on first visit only (local storage flag).
- Re-triggered by Start Menu -> Restart or Shut Down.
- Sequence order: Black screen -> BIOS screen (boot_bios.png + bios_logo.png top-right) -> bootscreen_4_3.png fades in.
- bootscreen_4_3.png remains until the user clicks.
- After click, show setup.png with a textbox that says "please Fullscreen your window to continue."
- When fullscreen is detected, transition to the normal site.
- Default timings: Black 2000ms, BIOS 5000ms, bootscreen fade 2000ms (all configurable via settings).
- Restart: play sequence, then reload the page after fullscreen is achieved.
- Shut Down: play sequence, then attempt to close the tab after fullscreen is achieved.
- All boot visuals render in a 4:3 frame (letterboxed if needed).
- Assets live in public/bootscreen: boot_bios.png, bios_logo.png, bootscreen_4_3.png, setup.png.
- Boot audio sequence (Phase 1):
  - On BIOS screen appearance: play bios_start.mp3, then play bios_sfx.mp3 during the BIOS phase (loop).
  - On BIOS -> bootscreen transition: stop BIOS audio and play Audio_boot.wav.
  - On bootscreen click to proceed: play Audio_Boot_Caution.wav.
- Future: add boot sound effects and transition animations.

## 3.10 Future QOL Backlog
- Time debug expansion: add toggles for dayOfYear/clock display and optional on-screen readout to validate time-driven state transitions.

## 4. Anti-Patterns (DO NOT)

| Don't | Do Instead | Why |
| --- | --- | --- |
| Use smooth image scaling for pixel art | Use `image-rendering: pixelated` and nearest-neighbor scaling | Preserves CRT/pixel aesthetic |
| Clamp windows strictly to desktop bounds | Allow windows to move outside the desktop area | Improves usability and matches intended behavior |
| Recompute z-index with a constant for all windows | Maintain an incrementing topmost z-order counter | Ensures deterministic focus behavior |
| Rely on system fonts if pixel fonts fail to load | Bundle and preload the pixel fonts | Visual fidelity is core to the UI |
| Use global CSS resets that override palette or bevel borders | Use scoped styles and palette variables only | Prevents accidental theme drift |
| Fetch UI sprites from remote URLs at runtime | Load all assets from `Sprites-NSO/` | Reduces latency and avoids broken art |
| Animate window dragging with easing | Use direct pointer tracking for drag | Avoids lag and preserves retro feel |
| Show modern browser scrollbars in app windows | Use custom scrollbars or hide when not needed | Keeps Win95-style illusion intact |
| Animate window close | Close windows immediately with no exit animation | Matches spec: close disappears instantly |
| Store dev password in local storage | Use build-time env var and client-side check | Reduces accidental exposure of the password |

## 5. Test Case Specifications

### Unit Tests
| Test ID | Component | Input | Expected Output | Edge Cases |
| --- | --- | --- | --- | --- |
| TC-001 | TimeSlot mapper | 06:00 local | NOON | 05:59 -> NIGHT |
| TC-002 | TimeSlot mapper | 17:00 local | DUSK | 16:59 -> NOON |
| TC-003 | dayOfYear calc | Jan 1 local | 1 | Leap year Feb 29 |
| TC-004 | Taskbar day display | dayOfYear=42 | "DAY 42" | 365/366 boundaries |
| TC-005 | Window focus | Click inactive window | Active style + top z-order | Multiple windows same z |
| TC-006 | Window drag | Drag to negative coords | Negative positions allowed | Drag near bottom/right |
| TC-007 | Webcam reopen | Close/minimize event | Window reopens + new sprite | Rapid repeated closes |
| TC-008 | Secret.txt guard | Hover secret.txt | Webcam moves to cover | Webcam already covering |
| TC-009 | JINE sticker grid | Open sticker menu | 8+ stickers visible | Missing sticker asset |
| TC-010 | JINE notification | Unread messages on refresh | Pop-up preview appears | No unread messages |
| TC-011 | Asset loader | Missing sprite file | Placeholder shown + log | Multiple missing assets |
| TC-012 | SFX trigger | New message event | Notification chime plays | Audio blocked by browser |
| TC-013 | Taskbar tab | Click focused tab | Window minimizes | Click on minimized tab |
| TC-014 | Z-index counter | Focus two windows | Second has higher zIndex | Rapid focus switching |
| TC-022 | Desktop icon select | Single click icon | Highlight shown | Click away clears |
| TC-023 | Desktop icon double-click | Two clicks within 300ms | Launch action | Slow double click |
| TC-024 | Desktop icon snap | Drag and release | Snaps to grid | Edge near taskbar |
| TC-025 | Desktop icon bounds | Drag beyond viewport | Snaps to visible area | Left/right edges |
| TC-015 | Window resize | Drag resize handle | Width/height update | Minimum size |
| TC-016 | Minimize animation | Minimize window | Smooth transition to taskbar tab center | Rapid minimize/restore |
| TC-017 | Fullscreen animation | Click fullscreen | Smooth expand to desktop | Restore to previous size |
| TC-018 | Settings auth | Enter wrong password | Access denied | Empty input |
| TC-019 | Settings apply | Toggle windowResizable | Resizing enabled/disabled | Refresh page |
| TC-020 | Settings persist | Change minimizeAnimationMs | Value persists | Local storage blocked |
| TC-021 | Settings auth success | Enter "angelkawaii2" | Access granted | Case sensitivity |
| TC-031 | Control Panel clear storage | Click "Clear Local Storage" | localStorage cleared + page reloads | Cancel confirmation |
| TC-032 | Taskbar tab resize | Open 8+ windows | Tabs shrink to fit taskbar without overflow | Long titles |
| TC-026 | Boot first visit | Clear local storage | Boot sequence plays once | Refresh skips sequence |
| TC-027 | Boot click gate | Reach bootscreen | Requires click to proceed | Accidental click |
| TC-028 | Boot fullscreen gate | Setup screen visible | Requires fullscreen to proceed | F11 vs. API fullscreen |
| TC-029 | Restart boot | Click Restart | Boot sequence plays then reloads after fullscreen | Active windows cleared |
| TC-030 | Shutdown boot | Click Shut Down | Boot sequence plays then close attempt after fullscreen | window.close blocked |

### Integration Tests
| Test ID | Flow | Setup | Verification | Teardown |
| --- | --- | --- | --- | --- |
| IT-001 | App boot + overlay | System time set to 21:00 | NIGHT overlay + Stream enabled | Reset clock |
| IT-002 | Window manager | Open 3 apps | Taskbar tabs reflect order + focus | Close all windows |
| IT-003 | Webcam blocking | Open secret.txt window | Webcam auto-blocks | Disable webcam via Control Panel |
| IT-004 | JINE refresh loop | Post message, reload | Notification preview + open chat | Clear local storage |
| IT-005 | Taskbar day rollover | Simulate day change | "DAY <n>" increments | Reset date |

## 6. Error Handling Matrix

### External Service Errors
| Error Type | Detection | Response | Fallback | Logging | Alert |
| --- | --- | --- | --- | --- | --- |
| YouTube embed blocked | iframe load timeout (~4s) or blocked event | Show in-window error banner | Link-out button | WARN | No |
| Twitter embed blocked | iframe load timeout (~4s) | Show placeholder timeline | Link-out button | WARN | No |
| Font file load failure | font-face load event error | Switch to bundled bitmap fallback | System font last resort | ERROR | No |
| Sprite asset missing | image onerror | Replace with placeholder sprite | Continue rendering | WARN | No |
| Audio load/play blocked | play() rejected | Suppress SFX and show silent icon | Continue without sound | WARN | No |

### User-Facing Errors
| Error Type | User Message | Code | Recovery Action |
| --- | --- | --- | --- |
| Embedded content blocked | "Content blocked by browser. Open externally?" | UI-EMBED-001 | Provide external link |
| Missing art asset | "Asset missing. Using placeholder." | UI-ASSET-404 | Continue with placeholder |
| Audio disabled | "Sound disabled by browser settings." | UI-AUDIO-403 | Toggle mute icon |
| Settings locked | "Incorrect password." | UI-SETTINGS-401 | Retry password |
| Settings storage unavailable | "Settings could not be saved." | UI-SETTINGS-503 | Use defaults |

## 7. References

### Strategic Deep Links
| Topic | Location | Anchor |
| --- | --- | --- |
| Strategic Blueprint | docs/Strategic-Blueprint.md | #windose-20---strategic-blueprint-strategic |
| Implementation Roadmap | docs/Strategic-Blueprint.md | #2-implementation-roadmap |
| Legal and Attribution | docs/Strategic-Blueprint.md | #3-legal-and-attribution-user-provided |

### External References
- https://needystreameroverload.wiki.gg/wiki/Desktop
- https://needystreameroverload.wiki.gg/wiki/Desktop#Taskbar
- https://github.com/lezzthanthree/Needy-Streamer-Overload/releases
- https://github.com/brandonduong/WacOS









## Phase 3 Notes (Concrete)
- Stats: none beyond system-based day/time in this phase.
- Day/time come from system date/time only; no manual Next Day logic.
- No Next Day button or stub in Phase 3.




## Phase 5 Notes (Concrete)
- SFX events: mouse clicks, notifications, JINE send, and window operations (open/close/minimize/restore/fullscreen/drag start).
- Volume control is in the taskbar; default volume is configurable.
- CRT scanline overlay is toggleable in Settings and adjustable for intensity.
- Sound file paths are editable in the password-protected Settings (public/sounds).

## 8. Recent Fixes and Build Notes (For AI Team)

### 8.1 TypeScript Fixes (Feb 4, 2026)
To ensure the project builds successfully, the following TS errors were resolved:
- **`src/App.vue`**: Removed unused `reason` parameter from `ensureWebcamOpen` and `scheduleWebcamReopen`.
- **`src/components/Desktop.vue`**: Fixed property access for `viewportScale` (changed to `props.viewportScale`).
- **`src/components/DesktopIcon.vue`**: Added missing `viewportScale` to `defineProps` interface.

### 8.2 Build and Host Instructions
- **Build**: `npm run build`
- **Host/Preview**: `npm run preview -- --port 5147`
- **Verify**: `curl -I http://localhost:5147` or check in browser.

*Please check these files if you encounter build errors.*









