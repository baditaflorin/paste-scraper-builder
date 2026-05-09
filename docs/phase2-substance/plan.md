# Phase 2 Substance Plan

This plan is ranked by user impact on the 10 real-data inputs in `realdata-audit.md`. The work deepens the existing paste, picker, preview, CSV, Python, and Go surface area. It does not add a backend or new product surface.

## Selected Substance Items

| Rank | Catalog | Substance Item                       | User Impact                                                                                          |
| ---: | ------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------- |
|    1 | 8       | Useful first guess on first input    | Turns paste into immediate preview instead of blank configuration.                                   |
|    2 | 6       | Auto-detect structure                | Finds cards, tables, search results, and interstitials before user clicks.                           |
|    3 | 7       | Auto-classify fields                 | Names title, URL, price, author, date, count, tag/list, and text fields.                             |
|    4 | 16      | Confidence scores on every inference | Stops weak guesses from looking authoritative.                                                       |
|    5 | 13      | Recognize common shapes              | Handles products, quotes, countries, HN, tables, repos, blogs, arXiv, and challenge pages.           |
|    6 | 9       | Format normalization by default      | Produces useful values rather than raw DOM text.                                                     |
|    7 | 18      | Surface anomalies                    | Calls out blank-heavy fields, partial rows, footnote noise, challenge pages, and mixed values.       |
|    8 | 32      | Actionable errors                    | Every failure has what/why/now-what language.                                                        |
|    9 | 35      | Deterministic outputs                | Same fixture input produces byte-identical output.                                                   |
|   10 | 38      | Output provenance                    | CSV/code exports include version, schema, source, row pattern, and field confidence.                 |
|   11 | 14      | Domain-aware export                  | Exports carry metadata useful downstream, not only scraped values.                                   |
|   12 | 15      | Domain conventions baked in          | Prefer semantic tags, main content, tables, absolute URLs, and normalized text.                      |
|   13 | 11      | Domain vocabulary in UI              | Use "record pattern", "field", "confidence", and "anomaly" rather than selector jargon alone.        |
|   14 | 12      | Domain-aware validation              | Warn on missing currency, relative URLs, suspicious dates, empty columns, and challenge pages.       |
|   15 | 17      | Suggest fixes                        | Tell users when to pick a wider row, paste rendered target content, or verify low-confidence fields. |
|   16 | 19      | Explain decisions                    | Store and show reasons for inferred records/fields.                                                  |
|   17 | 1       | Fuzz parser                          | Real fixtures plus synthetic empty, huge, malformed, encoding, and structural cases must not crash.  |
|   18 | 2       | Encoding and format variants         | Normalize BOM, NBSP, CRLF, smart quotes, RTL text, and whitespace.                                   |
|   19 | 3       | Huge inputs                          | Define size budgets and test 1x, 5x, and 10x synthetic scale.                                        |
|   20 | 4       | Partial inputs                       | Detect likely truncation and degrade with warnings.                                                  |
|   21 | 5       | Adversarial input                    | Detect broken tags, challenge pages, scripts, and structurally weird HTML.                           |
|   22 | 24      | Enumerate reachable states           | Document and test loading, inferred, low-confidence, empty, partial, too-large, and fatal states.    |
|   23 | 25      | No stuck states                      | Every warning/error state has a next action.                                                         |
|   24 | 27      | Concurrency safety                   | New input supersedes stale inference/save work.                                                      |
|   25 | 28      | Profile real-data inputs             | Record before/after fixture timing and hot paths.                                                    |
|   26 | 31      | Cache expensive things               | Avoid re-parsing unchanged HTML and re-deriving unchanged preview.                                   |
|   27 | 33      | Validate at boundaries               | Zod schemas for persisted and inferred project state.                                                |
|   28 | 34      | Recoverable vs fatal explicit        | Bad input keeps work intact and surfaces recovery.                                                   |
|   29 | 37      | Debug overlay                        | `?debug=1` exposes inference state, confidence, anomalies, and timings.                              |
|   30 | 22      | Stable IDs everywhere                | Inferred records/fields get deterministic IDs derived from selectors and names.                      |

## Expected Fixture Pass Definition

An input passes Phase 2 Substance when it produces either:

1. A useful inferred preview with a row pattern, at least two relevant fields, confidence, and no silent anomalies.
2. A deliberate, actionable no-preview state when the input is a challenge, empty, truncated, or not a repeated-record page.

## Implementation Order

1. Commit real-data fixtures and expected properties.
2. Write Phase 2 ADRs 0040-0049.
3. Add inference data model, confidence model, normalization, anomaly messages, and deterministic IDs.
4. Wire inference into the existing paste flow without adding a new workflow.
5. Add provenance to CSV/Python/Go exports.
6. Add fixture tests, fuzz tests, determinism tests, and performance measurements.
7. Update audit pass-rate trend and write the Phase 2 postmortem.
