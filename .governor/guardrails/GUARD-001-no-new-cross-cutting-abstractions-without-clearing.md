---
id: "GUARD-001"
type: "guardrail"
title: "No new cross-cutting abstractions without clearing the composability test"
status: "active"
date: "2026-03-21"
adr: "ADR-001"
---

## Rule

Before adding any new construct to visionlog, research.md, or ike.md schemas, apply this test:

**Does this make the existing job of the tool clearer, or does it add a new job?**

If it adds a new job — stop. Either (a) put the convention in a SOP, (b) build it as a separate optional tool, or (c) run it through research.md to earn the decision before touching a schema.

## Why

The trilogy's strength is focused simplicity. Cross-cutting abstractions feel like improvements but are often methodology prescriptions in disguise. Once in a schema, they are enforced on every user. Once enforced, they are hard to remove. The cost compounds.

This guardrail exists because in a live design session, an AI proposed an "Initiative" layer with genuine merit — and the principle it violated had never been written down. An unwritten principle cannot be enforced.

## Violation Examples

- Adding `initiative_id` as a field on ike.md tasks, visionlog goals, and research.md projects — prescribes a cross-cutting workflow not everyone needs
- Adding a `risk_level` field to guardrails "because it would be useful" — adds a new classification job to what is already a clear construct
- Adding a `confidence_score` to ADRs — imports a research.md concept into visionlog's domain
