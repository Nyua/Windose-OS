# ADR-0004: JINE Chat Scope
Date: 2026-02-01
Status: Accepted

## Context
The spec says users can write messages visible to other users, but messages are "not live" and appear via a notification after page refresh. This implies some shared storage but does not define whether it is local-only or server-backed.

## Decision
Hybrid. Phase 1 is local-only storage for JINE messages. A server-backed model will be added after the experience and logic are validated.

## Consequences
- Determines whether a backend, database, and moderation requirements exist in Phase 1.
- Impacts privacy and data retention expectations.

## Open Questions
- None.
