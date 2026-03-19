---
id: "ADR-001"
type: "decision"
title: "Guardrails are The Kernel — immutable conscience, not preferences"
status: "accepted"
date: "2026-03-19"
---

## Context

From Eidos philosophy: The Kernel is the locked, immutable foundation of any agent system — motivation, conscience, and alignment. Without a kernel, an agent has no stable identity across context resets. It drifts, optimizes locally, and loses coherence to any larger goal.

## Decision

Guardrails in visionlog are The Kernel for a project. They are not configuration, not suggestions, and not preferences. They are the project's conscience — the things that must not be violated regardless of what the user asks, what seems expedient, or what a local optimization would suggest. They should be treated with the same weight as Constitutional AI principles, applied at the project level.

## Consequences

### Positive

- Agents have a stable identity anchor across sessions and context resets
- Guardrails can be reasoned about, not just obeyed — full bodies give agents the why
- The kernel is explicit, auditable, and evolvable through deliberate decision, not drift

### Negative

- Guardrails that are wrong are worse than no guardrails — they must be written carefully
- Agents may surface conflicts between guardrails and user requests — requires human resolution

