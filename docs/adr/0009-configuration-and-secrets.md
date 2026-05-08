# 0009 Configuration And Secrets Management

## Status

Accepted

## Context

The app is static and does not need credentials.

## Decision

Keep public constants in Vite build defines and `public/data/build-meta.json`. Commit `.env.example` only. Ignore `.env*`, private keys, and certificates.

## Consequences

No secrets are present in the frontend or repository. Repository and PayPal URLs are public configuration.

## Alternatives Considered

Runtime config endpoints and encrypted frontend secrets were rejected because they are unnecessary and unsafe for static hosting.
