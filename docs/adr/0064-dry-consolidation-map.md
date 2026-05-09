# 0064 DRY Consolidation Map

## Status

Accepted.

## Context

The scraper feature accumulated state encoding, settings, inference orchestration, strategy recipes, extraction, and exports.

## Decision

Keep canonical schemas in `types.ts`. Move state/share/settings helpers out of `ScraperBuilder.tsx`. Move known page-shape inference recipes out of `inference.ts`.

## Consequences

UI code becomes easier to scan, and strategy changes can happen without touching React rendering.

## Alternatives Considered

Extracting every tiny helper was rejected because it would scatter a still-small app.
