---
title: "visionlog.md — The Governance Layer"
type: "vision"
date: "2026-03-21"
---

visionlog is the governance layer for AI-assisted projects. It holds the contracts that all execution must honor: vision, goals, guardrails, SOPs, and ADRs.

## What it is

A place for decisions that have been earned, goals that have been committed to, and rules that must not be broken. It is the static layer — the part of the system that changes slowly and deliberately, because governance that changes fast is not governance.

## What it is not

visionlog is not an orchestrator. It does not run agents, schedule work, or manage tasks. It does not tell you how to work — only what you have committed to and what you must not do.

## Design philosophy

**Composable, not prescriptive.**

visionlog gives you primitives — goals, guardrails, SOPs, ADRs — and stays out of the way. It does not impose a methodology. It does not require you to use all of its constructs. It does not add cross-cutting concepts that prescribe how you organize work at a level above the tools.

The right test for any new feature: does it make the existing job of the tool clearer, or does it add a new job? New jobs belong elsewhere.

**Opinions go in SOPs, not in schemas.**

If a workflow pattern is valuable — like linking execution back to a research decision — that belongs in a SOP that recommends a convention. It does not belong in a required schema field that forces the convention on everyone.

**Contracts must be earned.**

No guardrail, ADR, or SOP should be created without a reason. The reason must be recorded. A contract without a recorded rationale is noise, not governance.

## The trilogy

visionlog is the middle layer of a three-tool trilogy:

- **research.md** — earn decisions with evidence before committing
- **visionlog** — record what was decided and what must not be violated
- **ike.md** — execute within those contracts

The flow is one-way by design: research feeds visionlog, visionlog feeds ike. Each tool has one job. None of them reach into the others' domain.
