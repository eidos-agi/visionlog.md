---
id: "ADR-004"
type: "decision"
title: "Vision is sticky, goals are dealt — the destination does not drift, only the path changes"
status: "accepted"
date: "2026-03-19"
---

## Context

From Eidos philosophy: "Identity is sticky, position is dealt." Applied to projects: the vision is the project's identity — it defines what the project fundamentally is and why it exists. Goals are positions — the current state of play, what's active, what's complete. Positions change constantly. Identity must not.

## Decision

The vision document in visionlog is treated as sticky — it changes only through deliberate decision, not through session drift or feature creep. Goals are dealt like cards: they are created, advanced, completed, and unlocked as the project progresses. An agent may update goal status freely. An agent should never update the vision without explicit human direction. If a goal seems to contradict the vision, that is a signal to surface the conflict — not to silently update either one.

## Consequences

### Positive

- The destination stays stable across sessions, agents, and team members
- Goal churn (completing, creating, reprioritizing) does not erode the project's identity
- Conflicts between goals and vision surface as explicit decisions rather than silent drift

### Negative

- A vision that is wrong from the start will anchor the project incorrectly — getting it right matters

