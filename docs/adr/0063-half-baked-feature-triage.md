# 0063 Half-Baked Feature Triage

## Status

Accepted.

## Context

Half-built controls are worse than absent controls because they teach users not to trust the app.

## Decision

Finish settings, JSON state, share links, upload, drag-drop, and clipboard. Keep URL fetch, batch jobs, image/PDF import, accounts, and cloud sync out of scope.

## Consequences

Every visible production control has an end-to-end handler. Unsupported features are not exposed in the UI.

## Alternatives Considered

Leaving disabled placeholders was rejected because Phase 3 is about completeness, not roadmap theater.
