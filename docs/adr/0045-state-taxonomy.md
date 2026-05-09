# 0045 State Taxonomy And State Machine

## Status

Accepted

## Context

Phase 2 needs intentional states for empty input, inferred data, low-confidence data, challenge pages, partial input, too-large input, and fatal render errors.

## Decision

Document state taxonomy in `docs/phase2-substance/states.md`. In code, model inference as a recoverable analysis result with `status`, `anomalies`, `messages`, and `timing`. New input supersedes stale analysis.

## Consequences

No state should be a dead end. Recoverable issues keep the user's pasted HTML intact and suggest next actions.

## Alternatives Considered

Using thrown exceptions for expected failures was rejected because challenge pages, partial input, and empty input are domain states, not programmer errors.
