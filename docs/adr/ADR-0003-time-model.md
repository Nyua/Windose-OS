# ADR-0003: Time Model
Date: 2026-02-01
Status: Accepted

## Context
The spec includes Day 1-30 as an in-game counter, TimeSlot derived from the user's system clock, and a taskbar "DAY <n>" display described as day of year. These definitions conflict and will affect gameplay logic and UI.

## Decision
Use the system clock for both TimeSlot and Day. The taskbar "DAY <n>" displays the local day-of-year.

## Consequences
- Determines how time progression affects unlocks (Streaming at Night) and visual overlays.
- Affects testing and reproducibility of time-based behaviors.

## Open Questions
- None.
