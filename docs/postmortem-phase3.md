# Phase 3 Postmortem

## Audit Grids

| Audit           | Before                                               | After                                                                             |
| --------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Input pathways  | paste/sample only were truly obvious                 | 9 green, 0 yellow, 0 red, 4 out of scope                                          |
| Output pathways | CSV/Python/Go only                                   | 9 green, 0 yellow, 0 red, 3 out of scope                                          |
| Controls        | old controls worked; new state controls undocumented | 21 green, 0 yellow, 0 red                                                         |
| Feature claims  | README under-described current app                   | README updated to shipped behavior                                                |
| Codebase health | two large modules and UI-owned state codec           | state codec extracted; large inference/UI modules remain as accepted Phase 4 debt |

## Half-Baked Triage

| Feature                | Outcome             | Rationale                                                            |
| ---------------------- | ------------------- | -------------------------------------------------------------------- |
| Settings               | finished            | Both settings persist and change behavior.                           |
| JSON state             | finished            | Export/import round-trip is tested.                                  |
| Share link             | finished            | Small projects can be hash-shared; large states get a JSON fallback. |
| URL fetch              | hidden/out of scope | CORS and backend avoidance are core constraints.                     |
| Batch/image/PDF inputs | hidden/out of scope | Not part of paste-rendered-HTML v1-v3.                               |

## Codebase Health

| Metric                      | Before | After |
| --------------------------- | -----: | ----: |
| Real fixture tests          |     10 |    10 |
| Synthetic edge tests        |      0 |     5 |
| Project state codec tests   |      0 |     2 |
| TODO/FIXME/XXX/HACK         |      0 |     0 |
| `any` / `ts-ignore`         |  0 / 0 | 0 / 0 |
| Source files over 300 lines |      3 |     3 |

The state codec split reduced UI coupling. `ScraperBuilder.tsx`, `inference.ts`, and `selectorEngine.ts` are still large; this is accepted debt because the app is now tested and usable, and a deeper split should be done carefully.

## Stranger Test

Top issues found and addressed:

1. Old smoke test asserted a click-first workflow. Updated to the inferred workflow.
2. README omitted shipped input/output paths. Updated.
3. JSON/share state needed explicit documentation. Added to README, audits, and ADRs.

## Documentation-Reality Fixes

README now documents auto-detection, upload/drop/clipboard, source URL behavior, CSV provenance, JSON round-trip, share links, version/commit display, and limitations.

## Surprises

The app became meaningfully more usable once the sample followed the same inferred path as real data. The test suite also became a strong guardrail, but real HTML parsing makes tests slower than typical unit tests.

## Phase 4 Candidates

1. Execute generated Python/Go code in integration tests.
2. Move inference into a Web Worker with cancellation.
3. Split page-shape inference strategies into smaller modules.
4. Add import/export migration tests for future schema versions.
5. Add table-header-driven generic table inference.

## Honest Take

Yes, a stranger can now use it for its intended work: paste or upload rendered HTML, get an inferred table, correct selectors, export data/code, save, share, and restore. Still no for people expecting a hosted crawler, URL fetcher, batch scraper, or PDF/image extractor. Those are deliberately outside the product.
