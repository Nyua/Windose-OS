# ADR-0002: State Management
Date: 2026-02-01
Status: Accepted

## Context
The implementation roadmap allows either Redux Toolkit or Zustand for global state. The store will manage Day and TimeSlot at minimum, with future expansion likely.

## Decision
Use Redux Toolkit for global state management.

## Consequences
- Affects store structure, middleware usage, testing patterns, and devtools integration.
- Impacts how time progression and window management state are modeled.

## Open Questions
- None.
