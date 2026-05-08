# 0006 WASM Modules

## Status

Accepted

## Context

The core parser can use browser DOM APIs and does not require a heavy native parser.

## Decision

Use no WASM modules in v1.

## Consequences

The app avoids COOP/COEP complications on GitHub Pages and keeps the first-load asset budget smaller.

## Alternatives Considered

DuckDB-WASM, sql.js, and parser WASM modules were unnecessary for pasted HTML extraction.
