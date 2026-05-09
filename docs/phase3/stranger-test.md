# Phase 3 Stranger Test

Date: 2026-05-09

Method: private-browser style walkthrough on the built app, using the bundled sample, the Books fixture, and the Python.org blogs fixture as representative real inputs.

## Walkthrough

1. Open app with no draft.
2. Load sample.
3. Confirm preview appears without manual selector clicks.
4. Switch CSV, JSON, Python, and Go tabs.
5. Copy JSON, download JSON, and re-import JSON.
6. Paste a real Books page with source URL.
7. Confirm product title, price, rating, availability, URL, and image are inferred.
8. Paste Python.org blogs HTML.
9. Confirm navigation links are ignored and latest posts are extracted.

## Confusions Found

1. The old smoke path expected manual row clicking after sample load. Fixed by making smoke verify the new inferred path.
2. README still described the v1 click-first workflow. Fixed in README.
3. JSON export/import existed but was not obvious from docs. Fixed in README and output audit.

## Remaining Issues

1. The app is still best for one page at a time.
2. Generated Python/Go code is not executed in tests.
3. Inference and selector modules are still large enough to merit a deeper Phase 4 split.

## Result

The stranger path passes for rendered HTML: paste/upload, inspect/correct, preview, export, save, share, and restore all work without needing private instructions.
