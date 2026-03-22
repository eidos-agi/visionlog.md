---
id: '0006'
title: Initiative layer imposes cross-session query overhead with no bounded cost
status: open
evidence: MODERATE
sources: 1
created: '2026-03-22'
---

## Claim

An Initiative layer requires querying artifacts across all three tools to build context. Unlike metadata fields (write-once), initiative_id lookups require reading linked files to be useful. The overhead grows with project size and is unbounded. Additionally it violates GUARD-001 (composability) which was established in this same session.

## Supporting Evidence

> **Evidence: [MODERATE]** — Architectural analysis + ADR-001 in visionlog.md visionlog (2026-03-22), retrieved 2026-03-22

## Caveats

None identified yet.
