# 0044 Confidence Model

## Status

Accepted

## Context

Silent wrongness was the worst v1 failure. The app needs to expose uncertainty for row patterns, fields, and overall inference.

## Decision

Use normalized confidence scores from 0 to 1 with three labels: high at 0.75+, medium at 0.5+, and low below 0.5. Strategy-specific heuristics assign confidence from selector specificity, repeated-row count, matched field density, type recognition, and anomaly penalties.

## Consequences

Users can tell the difference between strong and weak guesses. Exports carry confidence for downstream validation.

## Alternatives Considered

Boolean pass/fail inference was rejected because many real pages are partially inferable and should degrade gracefully.
