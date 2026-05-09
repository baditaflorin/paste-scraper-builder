# 0042 Inference Engine

## Status

Accepted

## Context

V1 required users to select a row and fields manually. Real fixtures show common page shapes that can be inferred from DOM patterns.

## Decision

Add a deterministic browser-side inference engine. It ranks known strategies first: challenge page, table, product cards, quote cards, country cards, Hacker News sibling records, GitHub repository cards, Python/blog listings, arXiv search results, and generic repeated cards. Each strategy produces a row pattern, fields, confidence, reasons, anomalies, and preview rows.

## Consequences

Pasting HTML can produce an immediate useful preview. Generic repeated-card inference remains a fallback, while known shape strategies handle real fixture needs more accurately.

## Alternatives Considered

An ML model was rejected because Mode A has no model dependency and deterministic behavior matters. A backend parser was rejected because Phase 2 must remain Mode A.
