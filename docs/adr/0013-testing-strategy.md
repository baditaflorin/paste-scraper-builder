# 0013 Testing Strategy

## Status

Accepted

## Context

Selector generation, extraction, and code export need confidence. The UI also needs a happy-path browser check.

## Decision

Use Vitest for logic and component tests, and Playwright for one headless smoke test against the built Pages output. `make test`, `make build`, and `make smoke` are used by local hooks.

## Consequences

The highest-risk logic is testable without browser automation, while the smoke test proves the bundled app loads and extracts sample data.

## Alternatives Considered

Full visual regression was rejected for v1 because the UI is compact and not asset-heavy.
