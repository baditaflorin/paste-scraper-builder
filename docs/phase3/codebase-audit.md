# Phase 3 Codebase Health Audit

## Measurements Before Phase 3 Health Work

| Metric                            |                                  Result | Notes                                                                                 |
| --------------------------------- | --------------------------------------: | ------------------------------------------------------------------------------------- |
| TypeScript source files           |                                      19 | `src/features/scraper/` owns the main feature.                                        |
| Files over 300 lines              |                                       3 | `ScraperBuilder.tsx` 827, `inference.ts` 907, `selectorEngine.ts` 418.                |
| `TODO` / `FIXME` / `XXX` / `HACK` |                                       0 | No unresolved markers found.                                                          |
| `any`                             |                                       0 | None found in source.                                                                 |
| `// @ts-ignore`                   |                                       0 | None found.                                                                           |
| Production `console.*`            |                                       1 | `ErrorBoundary` logs fatal render failures; accepted as a crash-diagnostics boundary. |
| Dead feature flags                |                                       0 | No dormant flags found.                                                               |
| Core fixture tests                | 10 real inputs + 5 synthetic edge cases | `inference.realdata.test.ts`.                                                         |

## DRY Findings

1. State JSON encoding/decoding, project validation, and share/import behavior live inside `ScraperBuilder.tsx`; this should move to a state codec module.
2. Inference strategy definitions make `inference.ts` responsible for orchestration and every page-shape recipe; split strategy construction from orchestration.
3. Export metadata is duplicated conceptually across CSV and codegen; accepted for now because output languages need different code structures, but schema constants should remain shared.

## SOLID Findings

1. `ScraperBuilder.tsx` currently owns UI state, persistence glue, input import, sharing, export selection, and rendering. Split helpers first; keep UI composition in the component.
2. `inference.ts` owns shape recognition plus orchestration. Split page-shape strategies into `inferenceStrategies.ts`.
3. `selectorEngine.ts` still combines selector inference and extraction. Accepted for Phase 3 because both concerns are DOM-selector domain primitives and covered by tests.

## Test Coverage Holes

1. Playwright smoke covers sample inference and export tabs, but not file upload or share-link import.
2. IndexedDB migration is schema-validated but lacks a focused unit test.
3. Generated Python/Go code is string-tested, not executed against fixtures.

## Measurements After Phase 3 Health Work

| Metric                             |    Result | Notes                                                                                      |
| ---------------------------------- | --------: | ------------------------------------------------------------------------------------------ |
| Project state codec tests          |         2 | Hash and JSON round-trip are covered.                                                      |
| `ScraperBuilder.tsx` state helpers | extracted | State JSON, hash import/export, settings, and confidence labels live in `projectState.ts`. |
| TODO / FIXME / XXX / HACK          |         0 | Unchanged.                                                                                 |
| `any` / `ts-ignore`                |     0 / 0 | Unchanged.                                                                                 |

Remaining accepted debt: `ScraperBuilder.tsx`, `inference.ts`, and `selectorEngine.ts` still exceed 300 lines. They are tested and documented as Phase 4 split candidates.
