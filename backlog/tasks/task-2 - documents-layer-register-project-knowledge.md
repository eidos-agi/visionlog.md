---
id: TASK-2
title: "Documents layer — register project knowledge so visionlog_guide can inject it"
status: To Do
assignee: []
created_date: '2026-03-19'
labels: [mcp, core, schema]
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
visionlog has a clean schema for governance artifacts: goals, guardrails, SOPs, ADRs, decisions. But it has no layer for *project knowledge* — the prose documents that explain the why, the user journey, the failure modes, the prior research.

These documents exist in every real project. They contain the richest context for an AI agent. But because they aren't registered anywhere, `visionlog_guide` can't surface them, and agents don't know to read them.

**Why this matters — what actually happened:**
On 2026-03-19, manyhats had these knowledge documents sitting in docs/:
- `USER-JOURNEY.md` — 5 phases of the hat-switching experience, design implications per phase
- `FAILURE-MODES.md` — 3 documented failure categories with real incidents
- `ORIGIN.md` — research, prior art, conversation history
- `ADR-001-RDP-ONE-CLICK.md` — 23 failed attempts and the accepted solution
- `CASE-STUDY-AIC-GREENMARK.md` — real data-boundary incident

None of these were in visionlog. `visionlog_guide` returned goals and guardrails but not "read FAILURE-MODES.md before touching MCP config." That's a gap that will cause repeated work: every agent session on manyhats has to rediscover these documents or miss them entirely.

**The fix: a `documents` type in visionlog**

A registered document entry looks like:

```yaml
id: DOC-001
type: document
title: "User Journey — The Hat Experience"
path: "../docs/USER-JOURNEY.md"
inject_on: [session_start, goal_execution]
summary: "5-phase map of the hat-switching experience. Read before any UX work."
```

`visionlog_guide` then includes registered documents in its output: "Before working on transitions, read DOC-001 (User Journey)."

The document itself isn't stored in visionlog — just a pointer and injection rule. The content stays where it lives.
<!-- SECTION:DESCRIPTION:END -->

## Why

An AI agent's coherence is only as good as the context it starts with. Goals and guardrails capture *what* and *don't do this*. Project knowledge documents capture *why things are the way they are* — the decisions, the failures, the user insight that informed the architecture. Without them, every agent session starts blind to the project's history.

**Specific failure prevented:** Without DOC registration, an agent working on manyhats transitions would implement something that USER-JOURNEY.md already proved doesn't work — repeating 23 failed RDP experiments, or implementing an MCP scoping approach that FAILURE-MODES.md explains why it fails.

## Acceptance Criteria

- [ ] `document` type added to visionlog schema
- [ ] `visionlog_document_register` MCP tool: registers a doc with path, summary, inject_on rules
- [ ] `visionlog_document_list` MCP tool: lists registered docs
- [ ] `visionlog_guide` output includes relevant registered documents based on current goal context
- [ ] `visionlog_boot` includes docs with `inject_on: session_start`
- [ ] Paths are relative to project root (portable across machines)
