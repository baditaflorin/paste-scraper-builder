# 0015 Deployment Topology

## Status

Accepted

## Context

Mode A deployment has no containers, servers, nginx, TLS config, or runtime processes.

## Decision

Serve the static app from GitHub Pages at `https://baditaflorin.github.io/paste-scraper-builder/`.

## Consequences

Operations are limited to building, committing, pushing, and rolling back with git. GitHub provides TLS.

## Alternatives Considered

Docker Compose and nginx were rejected because there is no runtime API.
