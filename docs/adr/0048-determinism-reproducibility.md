# 0048 Determinism And Reproducibility Guarantees

## Status

Accepted

## Context

The same pasted HTML should produce the same inferred schema, preview, and export every time.

## Decision

Use deterministic ranking, stable IDs derived from selector/name/type, deterministic field ordering, and fixed provenance timestamps based on release metadata rather than wall-clock time. Exports include app version, schema version, source identifier, row pattern, field rules, confidence, and anomalies.

## Consequences

Fixture tests can assert byte-identical outputs. Users can rerun a recipe and compare results reliably.

## Alternatives Considered

Runtime timestamps in every export were rejected because they break byte determinism.
