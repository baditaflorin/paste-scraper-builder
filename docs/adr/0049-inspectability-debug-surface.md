# 0049 Inspectability And Debug Surface

## Status

Accepted

## Context

Power users and maintainers need to understand why the inference engine made a choice.

## Decision

Support `?debug=1` to show inference status, strategy, confidence, anomalies, field reasons, and timing. The debug surface is read-only and uses existing page state.

## Consequences

Support and future Phase 3 work can diagnose fixture failures without adding telemetry or a backend.

## Alternatives Considered

Remote logging was rejected because v1 and Phase 2 intentionally collect no analytics.
