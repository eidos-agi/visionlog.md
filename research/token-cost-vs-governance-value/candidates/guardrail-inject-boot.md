---
title: guardrail_inject at session start
verdict: provisional
---

## What It Is

Automatically surfaces all active guardrails into context at the start of every session. Every agent working on the project sees the constraints before touching anything.

## Validation Checklist

- [x] At mature scale ~2,000 tokens/session = 40,000 tokens over 20 sessions — cost justified only if per-session violation risk is real: Y

## Scoring
## Scores

| Criterion | Score |
|-----------|-------|
| Governance value (prevents bad decisions or lost context, 0–10) | 8/10 |
| Token cost per invocation (lower is better — inverted, 0–10) | 5/10 |
| Invocation frequency penalty (how often it runs × cost — lower is better, inverted, 0–10) | 4/10 |
| Composability (fits existing primitives without adding new abstractions, 0–10) | 7/10 |
| **Total** | **24** |

**Notes:** 40,000 tokens over 20 sessions at mature scale. High governance value but poor frequency/cost ratio. Better pattern: inject on-demand when task type warrants it.
