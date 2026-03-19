---
id: TASK-1
title: "visionlog_scan — surface backlog gaps from project docs"
status: To Do
assignee: []
created_date: '2026-03-19'
labels: [mcp, core]
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
visionlog's job is to keep an AI agent coherent to a project's vision. But right now it only reads what was explicitly put into it — goals, guardrails, SOPs. It doesn't know that `docs/USER-JOURNEY.md`, `docs/FAILURE-MODES.md`, or `VISION.md` exist, and it can't surface insights from them.

**Why this matters — what actually happened:**
On 2026-03-19, working on manyhats, an agent manually read USER-JOURNEY.md and FAILURE-MODES.md and discovered 9 backlog tasks that weren't obvious from the code or existing visionlog content:
- The drift state concept (first-class undeclared hat UX)
- The entry checklist ritual (transition.entry.checklist existed but was never surfaced)
- The MCP cross-context destruction failure mode (documented, not actioned)
- The shell integration gap (no `manyhats setup` command despite the shell function being required)

None of those came from the goals or guardrails. They came from reading prose documents that had been written but never connected to the backlog. An agent that doesn't read those documents will miss them — every session.

**The fix: `visionlog_scan`**

A new MCP tool that:
1. Discovers prose documents in the project (docs/, README, VISION.md, ADRs, any *.md not in visionlog/)
2. Reads them and asks: "what backlog-worthy insights are here that haven't been captured as goals or tasks?"
3. Returns a list of candidate tasks with suggested titles and which document they came from
4. Does NOT auto-create — returns candidates for human/agent review

This is the difference between a governance layer that's a static record and one that actively finds diamonds in the rough.
<!-- SECTION:DESCRIPTION:END -->

## Why

The current model requires humans to manually bridge between project knowledge (docs) and project governance (visionlog). That bridge fails silently — every session starts without the insights that live in prose. `visionlog_scan` makes the bridge automatic.

**Specific failure prevented:** An agent working on manyhats would have missed 9 valid tasks on every session if the docs hadn't been manually read. At scale (50 projects), this is a massive coherence leak.

## Acceptance Criteria

- [ ] `visionlog_scan` MCP tool implemented
- [ ] Discovers *.md files outside the visionlog/ directory
- [ ] Returns candidate tasks with: title, source doc, why it's backlog-worthy
- [ ] Deduplicates against existing goals (don't re-surface things already in visionlog)
- [ ] Works without LLM API call (structural scan) OR with one (deeper semantic scan)
- [ ] `visionlog_guide` references `visionlog_scan` when project has unscanned docs
