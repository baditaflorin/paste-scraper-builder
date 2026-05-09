# 0067 State Management Convention

## Status

Accepted.

## Context

The app has local project state, derived inference/preview/export state, persisted drafts, and persisted settings.

## Decision

Keep editable project/settings state in React. Derive inference, preview, CSV, JSON, Python, and Go with `useMemo`. Persist drafts through IndexedDB and settings through `localStorage`.

## Consequences

There is one source of truth for the project. Derived exports do not drift from preview.

## Alternatives Considered

A global store was rejected because there is one feature surface and React state is sufficient.
