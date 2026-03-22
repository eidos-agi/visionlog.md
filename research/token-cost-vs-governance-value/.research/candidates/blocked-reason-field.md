---
title: blocked_reason field on ike.md tasks
verdict: provisional
---

## What It Is

Structured reason field when a task is blocked. Replaces freeform notes with a typed signal that tooling can act on.

## Validation Checklist

- [x] ~10 tokens only when blocked (~15% of tasks = 150 tokens per 100 tasks) — negligible cost, high-signal primitive: Y

## Scoring
## Scores

| Criterion | Score |
|-----------|-------|
| Governance value (prevents bad decisions or lost context, 0–10) | 7/10 |
| Token cost per invocation (lower is better — inverted, 0–10) | 10/10 |
| Invocation frequency penalty (how often it runs × cost — lower is better, inverted, 0–10) | 9/10 |
| Composability (fits existing primitives without adding new abstractions, 0–10) | 9/10 |
| **Total** | **35** |

**Notes:** ~150 tokens total per 100 tasks. Named blockers enable tooling to act; freeform notes do not.
