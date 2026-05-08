# Paste Scraper Builder

![Deployment](https://img.shields.io/badge/deployment-GitHub%20Pages-0f766e)
![Version](https://img.shields.io/badge/version-0.1.0-1d4ed8)
![Mode](https://img.shields.io/badge/mode-static%20client--side-b45309)

Live site: https://baditaflorin.github.io/paste-scraper-builder/

Repository: https://github.com/baditaflorin/paste-scraper-builder

Support: https://www.paypal.com/paypalme/florinbadita

Paste Scraper Builder turns rendered HTML into repeatable scraper recipes: paste a page, click a repeated row/container, click fields, preview the extracted table, then download CSV or copy Python/Go scraper code.

![Paste Scraper Builder demo](docs/demo.png)

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

Paste Scraper Builder is Mode A: Pure GitHub Pages. It has no runtime backend, no hosted scraping service, and no secrets. Pasted HTML is parsed in the browser, selector rules are stored in IndexedDB, and exports are generated client-side.

```mermaid
flowchart LR
  User["User browser"] --> Pages["GitHub Pages static app"]
  Pages --> IndexedDB["IndexedDB draft"]
  Pages --> Exports["CSV / Python / Go exports"]
  Pages --> GitHub["Public GitHub commit metadata"]
```

Architecture notes: docs/architecture.md

ADRs: docs/adr/

Deploy guide: docs/deploy.md

Privacy: docs/privacy.md

## Repository Hygiene

GitHub Pages publishes from `main` branch `/docs`. The built Pages directory is intentionally committed. Local hooks live in `.githooks/` and are wired with `make install-hooks`.
