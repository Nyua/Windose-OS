---
clarity-gate-version: 2.1
processed-date: 2026-02-18
processed-by: documentation-pipeline
clarity-status: CLEAR
hitl-status: REVIEWED
hitl-pending-count: 0
points-passed: 1-9
document-sha256: 00c85ee0d35d4059fe5ac94d7be3d54e7acf920fb7459ca5f02cff857fd7bdc2
hitl-claims: []
---

# Ame Corner Transition Spec (CGD)

Source: `docs/ame-corner-transition-spec.md`

## Clarity Review Summary
- The implementation is decision-complete for sequence timing, event ownership, fallback behavior, and destination handoff.
- Intro sequencing is explicit as a shadow-first seven-stage flow: `waiting -> shadowFadeIn -> intro00 -> pinkFlash -> intro0 -> impact -> final`.
- `corner-intro-Ame` is explicitly modeled as a positioned sprite layer above base frames rather than a full-screen overlay.
- Frame-count cuts are explicitly constrained to `requestAnimationFrame` handoff logic (2-frame beats for intro/pink/impact cuts).
- `corner-intro1` is intentionally excluded from this approved sequence.
- Opacity policy is explicit: shadow stays reduced (`0.75`), all other transition sprites render at full opacity.
- Final stage behavior is explicit: `corner-intro2` is held for 5000ms before navigation.
- Destination microsite contract is explicit: intensified scanline overlays and a louder layered CRT buzz bed under ambient loop.
- Destination microsite now includes a clearly visible slow downward scanline beam and synchronized CRT warp pulses.
- Beam/warp motion model is now explicitly runtime-driven with nonlinear center-weighted distortion pulses to avoid artificial looping artifacts.
- Destination microsite startup behavior is explicit: CRT power-on sequence (dark -> center-line flare -> expansion -> stable raster) on initial page load.
- Destination microsite boot flow is explicit: slow BIOS prelude first, then full-screen CRT scene handoff with continuous full-pass beam traversal.
- BIOS narrative contract now explicitly includes long pacing and emphasized lines for `White egret orchard` and `My thoughts will follow you into your dreams`.
- Destination microsite state machine is explicit: `bios -> biosExit -> resetCycle -> booting -> on`.
- Audio contract is explicit: no melodic `desire.wav` loop in Ame flow; sting then dark drone/buzz or silent fallback.
- Sidebar parity contract is explicit: main-site slot rules with Ame-specific asset preference and `/sidebars/*` fallback.
- Timing values are explicitly marked as provisional with a required full-sequence tuning pass.
- Runtime behavior is deterministic via explicit phase model and fixed time points.

## Verification Notes (9 Points)
1. Hypothesis vs Fact Labeling: Pass. Claims are implementation requirements, not projections.
2. Uncertainty Markers: Pass. No forward-looking market/business claims requiring hedging.
3. Assumption Visibility: Pass. Asset fallback and autoplay limitations are explicit.
4. Authoritative-looking Unvalidated Data: Pass. No unverified metrics/tables presented as measured outcomes.
5. Data Consistency: Pass. Timeline and phase constants are internally consistent with frame-driven cut stages and final hold.
6. Implicit Causation: Pass. No unsupported causation assertions.
7. Future State as Present: Pass. Spec language is prescriptive and scoped to current implementation.
8. Temporal Coherence: Pass. Process date aligns with current context.
9. Externally Verifiable Claims: Pass. No external factual claims that require independent verification.

## HITL Verification Record

### Round A: Derived Data Confirmation
- No externally sourced claims required confirmation.

### Round B: True HITL Verification
- No claims required HITL truth verification for this implementation spec.

<!-- CLARITY_GATE_END -->
Clarity Gate: CLEAR | REVIEWED
