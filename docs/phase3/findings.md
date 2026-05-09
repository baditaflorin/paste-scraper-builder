# Phase 3 Findings

## Top 5 Usability Gaps

1. README still describes the old click-first workflow and does not mention auto-inference.
2. File upload, clipboard, JSON state, and share links work but are not documented.
3. URL input needs explicit framing as source metadata, not a fetcher.
4. The smoke test only covered the old manual sample flow; it now verifies the inferred stranger path.
5. Large app internals are inspectable only with `?debug=1`; this is fine for support but should remain intentionally hidden by default.

## Top 5 Half-Baked Features

| Feature          | Decision          | Rationale                                                                 |
| ---------------- | ----------------- | ------------------------------------------------------------------------- |
| URL fetch        | delete from scope | Paste-driven design intentionally sidesteps CORS; fetching would mislead. |
| Multi-file batch | hide/out of scope | Current product builds one scraper recipe at a time.                      |
| Image/PDF import | hide/out of scope | Not rendered HTML and not promised.                                       |
| Settings         | finish            | Two settings now persist and visibly change behavior.                     |
| JSON/share state | finish            | Needed for real users to resume and share work.                           |

## Top 5 Codebase Pain Points

1. `ScraperBuilder.tsx` is too broad.
2. `inference.ts` is too broad.
3. Fixture tests are realistic but slow because large HTML pages exercise browser parsing.
4. Export metadata has similar concepts across CSV and codegen.
5. Playwright smoke uses production build and is slower than unit checks, but it catches real integration mismatches.

## Top 5 Documentation-Reality Mismatches

1. README omits auto-detection.
2. README omits upload/drop/clipboard.
3. README omits JSON state export/import.
4. README omits share link.
5. README lacks an honest limitations section.

## Fully Usable Means

1. A stranger can paste or upload rendered HTML and get a first preview without clicking selectors.
2. They can correct row/field selectors with the picker when the guess is wrong.
3. They can export CSV with provenance or a plain table, and copy/download Python or Go code.
4. They can save, reload, share, and re-import the project state.
5. They see confidence/anomaly messages before exporting uncertain results.

## Phase 3 Success Metrics

1. 10/10 real fixtures covered by automated inference tests.
2. 0 red rows in claimed input/output/control audits.
3. 0 TODO/FIXME/XXX/HACK markers.
4. 0 `any` and 0 `// @ts-ignore`.
5. Full local gate passes: format, lint, unit tests, build, Playwright smoke.

## Out Of Scope

No backend, no URL scraping proxy, no auth, no accounts, no cloud sync, no batch job runner, no image/PDF extraction, no visual polish pass.
