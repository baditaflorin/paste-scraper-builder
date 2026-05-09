# 0066 Error Handling Convention

## Status

Accepted.

## Context

The app has no backend logs for user-facing failures. Errors need to be understandable at the point of action.

## Decision

Use domain messages with what, why, and next step for inference. UI actions report success/failure through the status toast. Fatal React errors stay in `ErrorBoundary`.

## Consequences

No raw stack traces appear in normal flows. Challenge pages, partial input, clipboard denial, invalid JSON, and oversized share URLs all tell the user what to do next.

## Alternatives Considered

Throwing errors to a global toast was rejected because it loses source-specific recovery guidance.
