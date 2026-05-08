# 0014 Error Handling Conventions

## Status

Accepted

## Context

Invalid HTML, empty selectors, and clipboard/download failures should not crash the app.

## Decision

Represent recoverable failures as typed UI messages. Use Zod for persisted project validation. Wrap React rendering with an error boundary.

## Consequences

Users see clear errors and can continue editing. Invalid local drafts are discarded rather than partially restored.

## Alternatives Considered

Throwing errors into the console was rejected because production users need visible feedback.
