# 0010 GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live URL is a first-class deliverable and must work without GitHub Actions.

## Decision

Publish GitHub Pages from `main` branch `/docs`. Vite uses base path `/paste-scraper-builder/` and writes hashed assets into `docs/assets/`. The repo commits the built `docs/` directory. `docs/adr/` and other documentation are preserved by setting Vite `emptyOutDir` to false.

## Consequences

Pages works from day one and every build commit contains deployable static files. Manual rollback is a git revert of the publishing commit.

## Alternatives Considered

A `gh-pages` branch was rejected because it adds a second branch workflow. GitHub Actions deployment was rejected by project constraint.
