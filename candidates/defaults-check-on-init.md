---
title: defaults_check on init
verdict: provisional
---

## What It Is

Fetches remote defaults manifest and diffs against local SOPs on every project_init. Ensures projects start with current governance content.

## Validation Checklist

- [x] On-demand only (~500 tokens once at project init or explicit call) — not wired to every session start: Y

## Scoring
## Scores

| Criterion | Score |
|-----------|-------|
| Governance value (prevents bad decisions or lost context, 0–10) | 6/10 |
| Token cost per invocation (lower is better — inverted, 0–10) | 7/10 |
| Invocation frequency penalty (how often it runs × cost — lower is better, inverted, 0–10) | 9/10 |
| Composability (fits existing primitives without adding new abstractions, 0–10) | 8/10 |
| **Total** | **30** |

**Notes:** ~500 tokens on-demand only. Scored as on-demand — wiring to every session start would drop frequency score to 3.
