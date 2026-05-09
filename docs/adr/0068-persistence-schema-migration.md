# 0068 Persistence Schema And Migration Policy

## Status

Accepted.

## Context

Projects are saved in IndexedDB, shared in URL hashes, and exported as JSON.

## Decision

Use `ScraperProject` as the canonical persisted schema. Validate every loaded draft/share/import with zod. Store `schemaVersion`; if validation fails, reject the state and keep user input intact.

## Consequences

Old invalid state fails safely instead of corrupting the active project. Future breaking changes must add explicit migration before bumping schema.

## Alternatives Considered

Blind JSON parse was rejected because it would make broken state look valid.
