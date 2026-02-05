# Windose 20 - Strategic Blueprint (Strategic)
Audience: Product, design, engineering, AI coding agents

## 1. Project Overview
Recreate the "Windose 20" operating system from Needy Streamer Overload as a browser-based "Playable Operating System" (POS). The app is a resource-management simulation wrapped in a fake desktop UI with a "Yami-Kawaii" (sick-cute) aesthetic.

Implementation Implication: The desktop UI and simulation wrapper are primary; anything beyond this scope must be explicitly added to the roadmap.

## 2. Implementation Roadmap
Execute in this order. Each phase should be a deployable increment.

Phase 1 - The Shell
- Build the Vue 3 + Vite application with Window Manager context.
- Implement draggable window logic with z-index sorting.

Phase 2 - The Look
- Implement CSS variable system using the color palette.
- Import PixelMplus and DinkieBitmap fonts.
- Build base WindowFrame component (title bar, close/minimize buttons, bevel borders).
- Load all art assets from Sprites-NSO/.
- Phase 2 note: Use WacOS as an additional reference for UI fidelity (https://github.com/brandonduong/WacOS).

Phase 3 - The Brain
- Set up Pinia store for Stats and Time.
- No Next Day logic in Phase 3 (system time only).

Phase 4 - The Apps
- Build in this order: Webcam -> JINE -> Stream -> Tweeter -> Go Out -> Internet.

Phase 5 - Polish
- Add Howler.js for SFX (mouse clicks, notification chimes).
- Add CRT scanline overlay effect.

Implementation Implication: The roadmap is the only source of phase ordering; feature requests must be mapped to a phase before implementation.

## 3. Legal and Attribution (User-Provided)
- Permission to create a fansite is confirmed by direct contact with the developer. The site must clearly credit rights holders and original art assets.
- The fonts PixelMplus10/PixelMplus12 and DinkieBitmap are open source and redistributable; they will be credited.
- A Credits page will be included inside the Settings menu.

Implementation Implication: Add a Credits view in Settings/Control Panel and surface rights attribution text in that view.

## 4. Architecture Decision Records
| ADR | Topic | Status |
| --- | --- | --- |
| ADR-0001 | Frontend framework (React vs Vue) | Accepted |
| ADR-0002 | State management (Pinia) | Accepted |
| ADR-0003 | Time model (system clock vs in-game day/time) | Accepted |
| ADR-0004 | JINE chat scope (local-only vs multi-user backend) | Accepted |
| ADR-0005 | Attribution and Credits placement | Accepted |

## 5. References

### Implementation Deep Links
| Topic | Location | Anchor |
| --- | --- | --- |
| Constraints and Global Rules | docs/Implementation-Spec.md | #1-constraints-and-global-rules |
| Core Architecture | docs/Implementation-Spec.md | #2-core-architecture-raincandy-processor |
| Application Specifications | docs/Implementation-Spec.md | #3-application-specifications |
| Anti-Patterns | docs/Implementation-Spec.md | #4-anti-patterns-do-not |
| Test Cases | docs/Implementation-Spec.md | #5-test-case-specifications |
| Error Handling | docs/Implementation-Spec.md | #6-error-handling-matrix |

### ADRs
| ADR | Location | Anchor |
| --- | --- | --- |
| ADR-0001 | docs/adr/ADR-0001-frontend-framework.md | #adr-0001-frontend-framework |
| ADR-0002 | docs/adr/ADR-0002-state-management.md | #adr-0002-state-management |
| ADR-0003 | docs/adr/ADR-0003-time-model.md | #adr-0003-time-model |
| ADR-0004 | docs/adr/ADR-0004-jine-scope.md | #adr-0004-jine-chat-scope |
| ADR-0005 | docs/adr/ADR-0005-attribution-and-credits.md | #adr-0005-attribution-and-credits |

### External References
- https://needystreameroverload.wiki.gg/wiki/Desktop
- https://needystreameroverload.wiki.gg/wiki/Desktop#Taskbar
- https://github.com/lezzthanthree/Needy-Streamer-Overload/releases
- https://github.com/brandonduong/WacOS

