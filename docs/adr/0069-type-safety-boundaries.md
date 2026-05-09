# 0069 Type Safety At Boundaries

## Status

Accepted.

## Context

External input enters through pasted HTML, files, URL hashes, IndexedDB, and browser APIs.

## Decision

Use zod for project state boundaries, typed inference/export structures for domain data, and no `any` or `ts-ignore` in source.

## Consequences

Invalid JSON state is rejected. The codebase remains strict TypeScript without unsafe escape hatches.

## Alternatives Considered

Manual shape checks were rejected because zod already exists in the stack and keeps schemas reusable.
