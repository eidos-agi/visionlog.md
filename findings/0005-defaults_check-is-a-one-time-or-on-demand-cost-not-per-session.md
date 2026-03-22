---
id: '0005'
title: 'defaults_check is a one-time or on-demand cost, not per-session'
status: open
evidence: HIGH
sources: 1
created: '2026-03-22'
---

## Claim

defaults_check should only run on project_init or when explicitly called — not on every session start. As a one-time cost (~500 tokens for fetch + diff output), it is cost-justified. Wired to every session start, it becomes a network call + ~500 tokens burned before every work session with low marginal value after the first run.

## Supporting Evidence

> **Evidence: [HIGH]** — Architectural analysis — defaults only drift when upstream publishes new content, which is rare (2026-03-22), retrieved 2026-03-22

## Caveats

None identified yet.
