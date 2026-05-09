# 0061 Input Pathway Coverage Policy

## Status

Accepted.

## Context

Users arrive with rendered HTML, files, clipboard contents, saved state, and share links.

## Decision

Support pasted HTML, uploaded/dropped HTML, clipboard text, sample HTML, IndexedDB drafts, JSON project imports, and hash share links. URL input stores source metadata for resolving relative links; it does not fetch.

## Consequences

The app stays static and CORS-honest. Multi-file, folder, image, PDF, and direct URL scraping stay out of scope.

## Alternatives Considered

A public proxy was rejected because it would create a runtime backend and introduce abuse/secrets concerns.
