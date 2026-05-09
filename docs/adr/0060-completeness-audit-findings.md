# 0060 Completeness Audit Findings And Phase 3 Metrics

## Status

Accepted.

## Context

Phase 3 asks whether a stranger can use the public GitHub Pages app on their own data without help. The Phase 3 audits live in `docs/phase3/`.

## Decision

Treat paste/upload/clipboard/share/restore/export as the primary completeness boundary. A feature is shipped only when it works on real HTML or is explicitly out of scope.

## Consequences

README claims must match tests and shipped UI. The gate is format, lint, fixture tests, build, and Playwright smoke.

## Alternatives Considered

Adding a backend was rejected because Mode A remains sufficient and CORS avoidance is a product constraint.
