---
clarity-gate-version: 2.1
processed-date: 2026-02-24
processed-by: documentation-pipeline
clarity-status: CLEAR
hitl-status: REVIEWED
hitl-pending-count: 0
points-passed: 1-9
document-sha256: pending-recompute
hitl-claims: []
---

# Ames Corner OS Shell Refit Spec (CGD)

Source: `docs/ames-corner-os-shell-refit-spec.md`

## Clarity Review Summary
- Scope is explicitly upgraded to a full ground-up rebuild for menus, icons, and buttons in Ame's Corner.
- Legacy behavior contracts are preserved and explicit: ferro intro choreography, replay gating, reduced-motion bypass, and final alpha scaling.
- Theme contract remains canonical and decision-complete: runtime class is `theme-chrome`, legacy values are coerced.
- Markup-level rebuild requirements are explicit for start menu entries, desktop icon shells, and taskbar icon shells.
- Test cases cover both visual reconstruction and interaction non-regression.

## Verification Notes (9 Points)
1. Hypothesis vs Fact Labeling: Pass. Document is implementation-prescriptive.
2. Uncertainty Marker Enforcement: Pass. No unresolved projections requiring hedging.
3. Assumption Visibility: Pass. Scope boundaries and compatibility assumptions are explicit.
4. Authoritative-looking Unvalidated Data: Pass. No unsupported external metrics.
5. Data Consistency: Pass. Runtime, style, markup, and icon contracts are aligned.
6. Implicit Causation: Pass. No unsupported causal claims.
7. Future State as Present: Pass. Statements are concrete implementation requirements.
8. Temporal Coherence: Pass. Process date aligned with current session date.
9. Externally Verifiable Claims: Pass. No external truth-claims requiring citation.

## HITL Verification Record

### Round A: Derived Data Confirmation
- No external-source numerical claims require manual source confirmation.

### Round B: True HITL Verification
- No unresolved claim entries; document is implementation-internal and review-complete.

<!-- CLARITY_GATE_END -->
Clarity Gate: CLEAR | REVIEWED
