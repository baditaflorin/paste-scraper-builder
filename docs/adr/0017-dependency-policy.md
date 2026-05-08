# 0017 Dependency Policy

## Status

Accepted

## Context

The app needs reliable client-side extraction and UI libraries without bloating the first load.

## Decision

Prefer mainstream, actively maintained packages. Keep dependencies browser-safe and secret-free. Avoid adding libraries for tiny helpers unless they improve correctness, accessibility, or testability.

## Consequences

The asset budget remains manageable and audits are simple.

## Alternatives Considered

Hand-rolling CSV generation and IndexedDB wrappers was rejected in favor of PapaParse and idb.
