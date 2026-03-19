---
id: "ADR-003"
type: "decision"
title: "PERCEIVE before ACT — visionlog_boot and visionlog_guide are the perception phase of every agent loop"
status: "accepted"
date: "2026-03-19"
---

## Context

From Eidos philosophy: The Loop — PERCEIVE → DECOMPOSE → SPECIALIZE → ACT → VERIFY → LEARN → RETRY. An agent that skips PERCEIVE and jumps directly to ACT is acting blind. It optimizes for the wrong target, violates constraints it doesn't know about, and produces work that drifts from the destination.

## Decision

`visionlog_boot` and `visionlog_guide` are the formalized PERCEIVE phase for any agent working in a governed project. They are not optional setup steps — they are the first two actions of every loop iteration. The tool descriptions are directive ("call this at the start of every session") because perception is not a preference, it is a precondition for coherent action.

## Consequences

### Positive

- Agents begin every session oriented to the right destination, constraints, and current state
- Context resets between sessions are recovered automatically — perception re-grounds the agent
- The cost of perception is two tool calls; the cost of skipping it is incoherence

### Negative

- Agents that ignore the directives in tool descriptions will still act blind — the tool can invite but not force

