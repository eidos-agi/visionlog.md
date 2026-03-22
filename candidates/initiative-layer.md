---
title: Initiative layer
verdict: provisional
---

## What It Is

Cross-cutting concept unifying artifacts from all three tools under a single initiative_id and lifecycle. Provides strategic observability but prescribes a cross-cutting methodology.

## Validation Checklist

- [ ] Violates GUARD-001 (composability) — traceability it provides is already partially covered by existing metadata fields: N

## Scoring
## Scores

| Criterion | Score |
|-----------|-------|
| Governance value (prevents bad decisions or lost context, 0–10) | 6/10 |
| Token cost per invocation (lower is better — inverted, 0–10) | 4/10 |
| Invocation frequency penalty (how often it runs × cost — lower is better, inverted, 0–10) | 4/10 |
| Composability (fits existing primitives without adding new abstractions, 0–10) | 1/10 |
| **Total** | **15** |

**Notes:** Fails composability test (GUARD-001). Cross-tool query overhead unbounded. Traceability value already partially delivered by source_research_id and visionlog_goal_id at near-zero cost.
