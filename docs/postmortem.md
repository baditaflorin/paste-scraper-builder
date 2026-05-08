# Postmortem

## Built

Paste Scraper Builder v0.1.0 is a static GitHub Pages app that accepts pasted rendered HTML, renders it in an iframe selector picker, previews extracted rows, stores one local IndexedDB draft, exports CSV in-browser, and generates Python/Go scraper code.

Live site: https://baditaflorin.github.io/paste-scraper-builder/

Repository: https://github.com/baditaflorin/paste-scraper-builder

## Deployment Mode In Hindsight

Mode A was the correct choice. The paste-driven workflow means the browser already owns the HTML, so CORS, secrets, queues, and a scraping backend would add risk without helping v1.

## What Worked

The iframe picker kept the interaction close to the rendered page. Browser DOM APIs were enough for parsing and preview extraction. Committing `docs/` made Pages publishing simple and compatible with the no-GitHub-Actions constraint.

## What Did Not

Using `docs/` for both documentation and Pages output required a careful build cleanup script so ADRs are not deleted. The first smoke run also exposed a useful picker issue: clicking inside a card selected the child price node instead of the repeated card, so row picking now scores repeated ancestors.

## Surprises

The local disk was full during build because npm cache had grown very large. Cleaning cache freed enough space to finish verification.

## Accepted Tech Debt

The selector inference is practical, not magical. It handles common classes, attributes, tables, lists, and repeated cards, but complex pages may still need manual selector edits. The app keeps one local draft instead of a project library.

## Next Improvements

1. Add multi-field bulk picking from a selected row.
2. Add import/export for scraper recipes as JSON.
3. Add selector robustness scoring with warnings for brittle nth-of-type selectors.

## Time

Estimated: 4 to 6 hours.

Actual: about 4 hours including repository setup, Pages configuration, implementation, tests, smoke verification, and documentation.
