# 0016 Local Git Hooks

## Status

Accepted

## Context

The project explicitly avoids GitHub Actions and needs local checks.

## Decision

Use plain `.githooks/` wired by `npm run install-hooks` or `make install-hooks`. Hooks run formatting checks, linting, tests, build, smoke tests, Conventional Commit validation, and gitleaks when installed.

## Consequences

Checks stay local and transparent. Developers without gitleaks receive a warning but can still commit.

## Alternatives Considered

Lefthook was considered but plain hooks avoid another tool dependency.
