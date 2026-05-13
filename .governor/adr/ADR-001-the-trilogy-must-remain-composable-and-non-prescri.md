---
id: "ADR-001"
type: "decision"
title: "The trilogy must remain composable and non-prescriptive"
status: "accepted"
date: "2026-03-21"
---

## Context

During a design session, an AI suggested adding an "Initiative" layer — a cross-cutting concept that would unify artifacts from all three trilogy tools under a single ID and lifecycle. The idea had genuine merit for observability and auditability.

The user's response: "we should be careful about becoming too opinionated."

This was not feedback on one feature. It was a design principle. The moment passed without being captured — which is itself the gap the trilogy exists to close.

## Decision

The trilogy tools (research.md, visionlog, ike.md) must remain composable and non-prescriptive. Each tool has one job. No tool should impose a cross-cutting methodology on top of the primitives it provides.

Workflow conventions — like linking all artifacts under an initiative ID — belong in SOPs, not in schemas. A SOP recommends. A schema enforces. Enforcement should be reserved for things that are always true, not things that are useful in some contexts.

The test for any proposed new construct: **does it make the existing job of the tool clearer, or does it add a new job?** If it adds a new job, it belongs in a SOP or in a separate tool.

## Consequences

- Feature proposals that add new cross-cutting abstractions must clear this bar before acceptance
- Linking conventions (e.g., initiative_id) should be documented as optional SOP guidance, not schema requirements
- The trilogy's value is in its simplicity — three focused tools with clear seams, not a framework
