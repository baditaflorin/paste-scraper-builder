# 0002 Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The v1 app needs a small but clear separation between UI, extraction logic, generated exports, and persistence.

## Decision

Use feature modules under `src/features/` and shared utilities under `src/lib/`. The scraper feature owns paste state, selector picking, extraction previews, CSV export, and Python/Go generation. The status feature owns repository metadata display.

## Consequences

The extraction engine can be tested without React. UI components stay focused on controls and rendering.

## Alternatives Considered

A single-file app was rejected because selector and export logic needs unit coverage. A backend package boundary was rejected because Mode A has no server.
