# 0001 Deployment Mode

## Status

Accepted

## Context

Paste Scraper Builder receives rendered HTML from the user by paste. The app does not need to fetch target sites, store shared state, hold secrets, or run scheduled jobs.

## Decision

Use Mode A: Pure GitHub Pages. The runtime is a static React/Vite app served from `main` branch `/docs`.

## Consequences

The app has no backend, no runtime secrets, and no CORS dependency for target pages. Parsing, selector picking, preview extraction, CSV generation, local persistence, and scraper code generation run in the browser.

## Alternatives Considered

Mode B was unnecessary because there is no shared data pipeline. Mode C was rejected because a runtime API would add operational and security surface without improving v1 functionality.
