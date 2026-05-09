# 0047 Error Taxonomy And Messaging Guidelines

## Status

Accepted

## Context

V1 warnings were brief and sometimes selector-centric. Phase 2 errors must be actionable.

## Decision

Every user-facing error or warning must contain what happened, why it matters, and what to do next. Errors are classified as `recoverable`, `low_confidence`, `partial_input`, `challenge_page`, `too_large`, or `fatal`.

## Consequences

Challenge pages and partial pages do not masquerade as valid extraction results. Fatal states should be rare and must preserve user work when possible.

## Alternatives Considered

Developer-style stack messages were rejected for production UI.
