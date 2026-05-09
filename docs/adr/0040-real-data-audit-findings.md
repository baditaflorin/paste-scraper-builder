# 0040 Real-Data Audit Findings And Substance Success Metrics

## Status

Accepted

## Context

The v1 app worked on the curated demo but required manual selector configuration for real pages. The Phase 2 audit in `docs/phase2-substance/realdata-audit.md` identified 10 real-world HTML fixtures covering clean, messy, broken, adversarial, and large inputs.

## Decision

Use the 10 real-data fixtures in `test/fixtures/realdata/` as the Phase 2 grading rubric. Phase 2 passes when at least 7 of 10 fixtures produce a useful inferred preview without manual selector picking and all 10 produce deterministic, non-crashing outcomes.

## Consequences

Substance work is judged by real pages rather than synthetic examples. Expected JSON files describe desired properties instead of exact brittle rows where pages naturally change.

## Alternatives Considered

Using only synthetic fixtures was rejected because it would preserve the v1 toy failure mode. Exact snapshots for every row were rejected because live pages change and the goal is domain behavior, not byte-for-byte website cloning.
