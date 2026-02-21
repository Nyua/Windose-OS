---
clarity-gate-version: 2.1
processed-date: 2026-02-06
processed-by: documentation-pipeline
clarity-status: UNCLEAR
hitl-status: PENDING
hitl-pending-count: 2
points-passed: 1-8
document-sha256: f7750440b3e024b5eeca7ece6c4ffe5cd9670b9eeb18f7a3ceb85a72a3de2292
hitl-claims:
  - id: claim-f551c8c4
    text: "Permission to create a fansite is confirmed by direct contact with the developer."
    value: "permission confirmed"
    source: "PENDING: provide written permission, date, and contact details"
    location: "legal-attribution/1"
    round: B
  - id: claim-d6507adf
    text: "The fonts PixelMplus10/PixelMplus12 and DinkieBitmap are open source and redistributable."
    value: "open source + redistributable"
    source: "PENDING: cite font license names/URLs and versions"
    location: "legal-attribution/2"
    round: B
---

# Windose 20 - Strategic Blueprint (Strategic)
Audience: Product, design, engineering, product, design, and engineering teams

## 1. Project Overview
TARGET: Recreate the "Windose 20" operating system from Needy Streamer Overload as a browser-based "Playable Operating System" (POS). TARGET: The app is a resource-management simulation wrapped in a fake desktop UI with a "Yami-Kawaii" (sick-cute) aesthetic.

TARGET: Implementation Implication: The desktop UI and simulation wrapper are primary; anything beyond this scope must be explicitly added to the roadmap.

## 2. Implementation Roadmap
TARGET: Execute in this order. Each phase should be a deployable increment.

Phase 1 - The Shell
- TARGET: Build the Vue 3 + Vite application with Window Manager context.
- TARGET: Implement draggable window logic with z-index sorting.

Phase 2 - The Look
- TARGET: Implement CSS variable system using the color palette.
- TARGET: Import PixelMplus and DinkieBitmap fonts.
- TARGET: Build base WindowFrame component (title bar, close/minimize buttons, bevel borders).
- TARGET: Load all art assets from Sprites-NSO/.
- TARGET: Phase 2 note: Use WacOS as an additional reference for UI fidelity (https://github.com/brandonduong/WacOS).

Phase 3 - The Brain
- TARGET: Set up Pinia store for Stats and Time.
- TARGET: No Next Day logic in Phase 3 (system time only).

Phase 4 - The Apps
- TARGET: Build in this order: Webcam -> JINE -> Stream -> Tweeter -> Go Out -> Internet.

Phase 5 - Polish
- TARGET: Add Howler.js for SFX (mouse clicks, notification chimes).
- TARGET: Add CRT scanline overlay effect.

TARGET: Implementation Implication: The roadmap is the only source of phase ordering; feature requests must be mapped to a phase before implementation.

## 3. Legal and Attribution (User-Provided)
- UNVERIFIED: Permission to create a fansite is confirmed by direct contact with the developer (requires written confirmation). TARGET: The site must clearly credit rights holders and original art assets.
- UNVERIFIED: The fonts PixelMplus10/PixelMplus12 and DinkieBitmap are open source and redistributable (license citation required); they will be credited.
- TARGET: A Credits page will be included inside the Settings menu.

TARGET: Implementation Implication: Add a Credits view in Settings/Control Panel and surface rights attribution text in that view.

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



---

## HITL Verification Record

### Round A: Derived Data Confirmation
- None.

### Round B: True HITL Verification
| # | Claim | Status | Verified By | Date |
| --- | --- | --- | --- | --- |
| 1 | Permission to create a fansite is confirmed by direct contact with the developer. | PENDING |  |  |
| 2 | The fonts PixelMplus10/PixelMplus12 and DinkieBitmap are open source and redistributable. | PENDING |  |  |

<!-- CLARITY_GATE_END -->
Clarity Gate: UNCLEAR | PENDING




