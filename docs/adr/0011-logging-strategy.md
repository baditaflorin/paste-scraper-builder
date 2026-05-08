# 0011 Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs. Browser console noise should be minimal in production.

## Decision

Use console output only for unexpected client errors during development. Production UI errors surface through the app toast and error boundary.

## Consequences

Users get visible recovery paths and production builds avoid routine console chatter.

## Alternatives Considered

Remote log collection was rejected because it would create privacy and operations concerns.
