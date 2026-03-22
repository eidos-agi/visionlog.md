# Decision

**Date:** 2026-03-22
**Status:** Decided
**ADR:** ADR-001

## Decision

Build only features scoring ≥30: blocked_reason field (TASK-0027), open questions construct (TASK-0028), and defaults_check (already built, on-demand only). Keep source_research_id and visionlog_goal_id as-is. Do not build guardrail_inject at boot, full visionlog_boot, sop_list per task, or the Initiative layer.

## Rationale

Token cost measurements show a clear split: metadata fields (score 38) and small typed fields (35) deliver high governance value at near-zero cost. Features that fire every session or every task (full boot: 155k tokens/20 sessions; sop per task: 497k tokens/100 tasks) cost more than the work they govern at realistic scale. guardrail_inject at boot scores 24 — real governance value but poor frequency/cost ratio; better built as on-demand injection when a task type warrants it. The Initiative layer (15) fails GUARD-001 composability and duplicates traceability already delivered by existing metadata fields. The two lowest-scoring patterns (full boot and sop-per-task) should not be built in their current form — a lightweight selective boot is the right alternative and is a separate design problem.
