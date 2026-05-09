# 0062 Output Pathway Coverage Policy

## Status

Accepted.

## Context

Users need to take extracted data, scraper code, and project state out of the app.

## Decision

Ship CSV, JSON project state, Python code, Go code, copy-to-clipboard, downloads, and hash share links. CSV provenance is setting-controlled.

## Consequences

JSON is the canonical round-trip state. CSV/code exports carry enough metadata for reproducibility.

## Alternatives Considered

Print/PDF, embed, and API/curl outputs were rejected because they are not central to a static selector builder.
