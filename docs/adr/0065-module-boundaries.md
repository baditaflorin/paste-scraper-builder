# 0065 Module Boundaries And Dependency Direction

## Status

Accepted.

## Context

The app is a static browser app with a single domain feature.

## Decision

Use one-way dependencies: UI components import domain helpers; domain helpers import primitive DOM/normalization/type utilities; primitive modules do not import React.

## Consequences

`ScraperBuilder.tsx` remains the composition layer. Inference, state codecs, CSV, codegen, storage, and selector extraction stay testable without rendering React.

## Alternatives Considered

A full application/domain infrastructure layer was rejected as too heavy for this repo.
