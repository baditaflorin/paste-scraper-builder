# 0012 Metrics And Observability

## Status

Accepted

## Context

The project can succeed without measuring user behavior.

## Decision

Use no analytics in v1. Manual smoke tests and public Pages availability are the only operational checks.

## Consequences

No PII or behavioral telemetry is collected. Product decisions rely on issues, stars, and direct feedback.

## Alternatives Considered

Plausible and a custom beacon were considered but rejected for v1 to keep privacy simple.
