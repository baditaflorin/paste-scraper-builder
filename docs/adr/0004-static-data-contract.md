# 0004 Static Data Contract

## Status

Accepted

## Context

Mode A has no shared application data. The only static data needed is build metadata and optional sample HTML fixtures.

## Decision

Expose build metadata at `/paste-scraper-builder/data/build-meta.json`. It contains app name, version, build commit, generated time, repository URL, and PayPal URL. Sample HTML is bundled in TypeScript source to keep v1 deterministic.

## Consequences

The UI can show version and commit without a backend. No freshness guarantees are needed beyond the build timestamp.

## Alternatives Considered

External JSON artifacts and GitHub Releases were rejected because there is no data pipeline.
