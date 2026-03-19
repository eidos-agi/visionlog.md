---
id: "ADR-002"
type: "decision"
title: "The Separation — governance is structure, code is substance, they must not blur"
status: "accepted"
date: "2026-03-19"
---

## Context

From Eidos philosophy: The Separation — structure and substance must be kept apart. Structure is the architecture of how things are organized and governed. Substance is the actual content — the code, the data, the work. When they blur, neither is trustworthy.

## Decision

visionlog is pure structure. It holds the governance layer — vision, goals, decisions, guardrails, SOPs — and nothing else. It does not track tasks (that's backlog.md), store code, or make implementation choices. Any tool, prompt, or pattern that causes governance to bleed into implementation, or implementation to define governance, is a violation of The Separation.

## Consequences

### Positive

- Governance is portable — the same visionlog structure works for any project regardless of stack
- Agents can consume governance without understanding implementation details
- Structure evolves independently of substance — you can refine the vision without touching code

### Negative

- Requires discipline to maintain the boundary — the temptation to put "just one implementation note" in a guardrail is real

