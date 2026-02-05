# ADR-0001: Frontend Framework (Reference)
Date: 2026-02-01
Status: Accepted

## Context
The implementation roadmap allows either React or Vue. Choosing one is required to avoid ambiguous architecture and tooling decisions.

## Decision
Use Vue 3 with Vite. Single-File Components (SFCs) are the default component format.

## Consequences
- Determines component patterns, routing, state integration, and build tooling.
- Impacts developer ergonomics and available UI libraries.

## Open Questions
- None.

## References
| Topic | Location |
|-------|----------|
| ADR Index | docs/Strategic-Blueprint.md#4-architecture-decision-records |
| Framework Usage | docs/Implementation-Spec.md#2-core-architecture-raincandy-processor |
