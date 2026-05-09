# 0071 Stranger Test Findings And Response

## Status

Accepted.

## Context

Phase 3 requires testing the app as a fresh user with real data and fixing the top issues.

## Decision

Use a private-browser style walkthrough with the Books fixture and a Python.org blog paste. Record findings in `docs/phase3/stranger-test.md`. Fix the top issues before release: README mismatch, old smoke path, and unclear state export/import.

## Consequences

The release can honestly say a stranger can use the app end-to-end for pasted/rendered HTML, with documented limits.

## Alternatives Considered

Skipping the stranger test was rejected because it is the central Phase 3 quality gate.
