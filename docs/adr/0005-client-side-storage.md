# 0005 Client-Side Storage Strategy

## Status

Accepted

## Context

Users benefit from recovering their last pasted HTML and selector configuration after reload.

## Decision

Use IndexedDB through the `idb` package for project snapshots. Keep only a single local draft in v1. Avoid cloud sync and accounts.

## Consequences

The app is offline-friendly and private by default. Users control exports locally.

## Alternatives Considered

`localStorage` was rejected because pasted HTML can exceed comfortable synchronous storage sizes. OPFS was rejected because structured document snapshots are simpler in IndexedDB.
