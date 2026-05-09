# Phase 2 Substance Postmortem

## Real-Data Pass Rate

Before: 0/10 inputs produced a useful first preview without manual selector picking.

After: 10/10 fixtures have automated coverage. Nine produce records; the npm challenge page produces an actionable error instead of wrong output.

## Logic Gaps Closed

1. Repeated cards/tables are now inferred for known real shapes.
2. Sibling-row records are supported for Hacker News.
3. Multi-value fields are supported for quote tags and arXiv authors.
4. Values normalize prices, counts, ratings, dates, lists, and URLs.
5. Confidence, anomalies, and provenance now surface in UI and export.

## Smart Behaviors Delivered

1. Paste/upload shows a useful first preview on products, quotes, countries, HN, GitHub Trending, Python blogs, arXiv, and Wikipedia tables.
2. Challenge pages stop with a domain message explaining what happened and how to recover.
3. Partial product HTML extracts available records and warns that input is partial.
4. CSV/code exports include reproducibility metadata.

## Determinism

Pass: all 10 fixture inference outputs are deterministic in the test suite.

## Performance

The full fixture suite passes locally. The initial JS payload is 113 KB gzipped. Largest tested HTML is about 786 KB. Heavy parsing is still synchronous; worker/cancellation support remains a future scale improvement.

## Surprises

GitHub Trending fixture had only 9 repository cards, so the expected row count was corrected to match the real captured page. The v1 smoke test also had to change because the app now previews before the user clicks anything.

## Still Open

1. Execute generated Python/Go code against fixtures.
2. Move large-page inference off the main thread.
3. Add user-managed saved project library.
4. Add richer table-header inference for arbitrary tables.
5. Split inference strategies further.

## Honest Take

It no longer feels like a toy for the target job: a stranger can paste real rendered HTML and usually get a useful first extraction. It is still not a general web automation system, and it should not pretend to fetch protected or heavily scripted pages.
