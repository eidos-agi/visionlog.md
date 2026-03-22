---
title: sop_list before every task
verdict: provisional
---

## What It Is

Agent reads all SOPs before starting any task. Ensures no SOP is violated during execution.

## Validation Checklist

- [ ] Full bodies per task = 497,000 tokens over 100 tasks — governance overhead far exceeds the work it governs in most scenarios: N

## Scoring
## Scores

| Criterion | Score |
|-----------|-------|
| Governance value (prevents bad decisions or lost context, 0–10) | 5/10 |
| Token cost per invocation (lower is better — inverted, 0–10) | 1/10 |
| Invocation frequency penalty (how often it runs × cost — lower is better, inverted, 0–10) | 1/10 |
| Composability (fits existing primitives without adding new abstractions, 0–10) | 5/10 |
| **Total** | **12** |

**Notes:** 497,000 tokens over 100 tasks. Worst pattern in the trilogy. SOPs don't change between tasks — per-task firing is pure waste. Titles-only at session start is the correct alternative.
