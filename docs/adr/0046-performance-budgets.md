# 0046 Performance Budgets And Measurement Plan

## Status

Accepted

## Context

Large HTML pages can make re-parsing and extraction noticeable. Phase 2 requires performance honesty.

## Decision

Measure analysis time for every fixture and record results under `docs/perf/phase2-substance.md`. Target median paste-to-preview below 1 second, p95 below 3 seconds, and worst case below 5 seconds. Cache analysis by stable HTML/source hash where possible and avoid re-analysis when only field labels change.

## Consequences

Performance work is fixture-driven and visible in the postmortem. Inputs over the documented size budget are recoverable warnings rather than silent freezes.

## Alternatives Considered

Moving all parsing to a Web Worker was deferred because DOMParser and selector evaluation compatibility in workers is uneven; this can be revisited if fixture timing exceeds the budget.
