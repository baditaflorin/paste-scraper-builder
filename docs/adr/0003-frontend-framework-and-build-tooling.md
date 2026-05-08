# 0003 Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs a responsive UI, strict TypeScript, a fast static build, and predictable GitHub Pages output.

## Decision

Use React 19, TypeScript strict mode, Vite, Tailwind CSS, Zod, TanStack Query, Lucide React, PapaParse, Vitest, and Playwright.

## Consequences

The build remains static, quick to run locally, and easy to publish by committing `docs/`. The dependency set is mainstream and production-ready.

## Alternatives Considered

Plain TypeScript was considered but would make stateful UI and accessibility more verbose. Next.js was rejected because server features are unnecessary.
