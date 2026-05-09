# 0041 Input Robustness And Normalization Policy

## Status

Accepted

## Context

Users paste rendered/source HTML that may contain BOMs, NBSPs, CRLFs, scripts, challenge pages, partial markup, footnotes, hidden text, and large DOMs.

## Decision

Normalize pasted HTML at the boundary: strip BOM, normalize CRLF to LF, convert NBSP to spaces in extracted values, collapse whitespace, remove unsafe executable elements for picker rendering, and preserve enough raw markup for deterministic parsing. Detect challenge/interstitial pages and likely truncation as recoverable states.

## Consequences

The parser becomes more predictable and user-facing failures are described in domain terms. HTML repair by the browser parser is allowed, but repaired partial input must be flagged when the source looks truncated.

## Alternatives Considered

Rejecting malformed HTML was rejected because paste-driven workflows often involve partial DOM fragments. Executing pasted scripts was rejected for safety.
