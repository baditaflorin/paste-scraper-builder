# Paste Scraper Builder

[Live GitHub Pages URL](https://baditaflorin.github.io/paste-scraper-builder/)

Build scrapers by pasting rendered HTML, picking selectors visually, previewing rows, and exporting CSV, Python, or Go.

## Quickstart

```sh
npm install
npm run install-hooks
npm run dev
```

## Checks

```sh
make lint
make test
make build
make smoke
```

## Architecture

Paste Scraper Builder is a Mode A static GitHub Pages app. It has no runtime backend, no server-side scraping, and no secrets. Pasted HTML is parsed in the browser, selector rules are stored locally, and exports are generated client-side.

Read the architecture notes in `docs/architecture.md` and the decision records in `docs/adr/`.
