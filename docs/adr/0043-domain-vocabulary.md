# 0043 Domain Vocabulary And UI Language Conventions

## Status

Accepted

## Context

V1 used selector-centric language. Users think in records, fields, confidence, and messy data issues.

## Decision

Use user-facing terms for Phase 2 messages: record pattern, inferred fields, confidence, anomaly, source content, rendered target page, and export provenance. Selector strings remain visible for correction but are no longer the primary explanation.

## Consequences

Warnings become understandable without DOM expertise. Power users can still inspect selectors and reasons.

## Alternatives Considered

Hiding selectors was rejected because this is still a scraper builder and selector correction is part of the workflow.
