---
id: "ADR-005"
type: "decision"
title: "Goals need a Vision Challenge step before execution — programmers write bug lists, not vision goals"
status: "accepted"
date: "2026-03-19"
---

## Context

Observed in the wild during claude-resume-duet initialization: 6 goals were created directly from a UX critique. Every one was technically correct — real problems, real fixes. But every one was defensive: fix what's broken, polish what exists. None advanced the vision.

The vision said: *"Never lose context again. Know what to work on next. Resume in one action."*

The goals said: *"Fix the project column. Add score colors. Highlight the selected row."*

When challenged ("think big picture like a human who wants to win and be proud"), the goals transformed entirely. The work didn't change — the *meaning* of the work did. Old GOAL-001 ("fix project column") became "Never lose context again." A goal that was entirely missing — "Resume in one action" — was the most important one.

The root cause: **visionlog has no friction between goal creation and execution.** Nothing prompts the agent to stop and ask whether the goals actually serve the vision. Goals flow directly from whatever context the agent just read (a bug report, a critique, a spec) rather than from the vision itself.

A secondary failure: programmers given a goal-creation tool will create programmer goals. The tool needs to actively push back.

## Decision

**Visionlog must surface a Vision Challenge step after goal creation, before any goal moves to in-progress.**

Specifically:

1. **`visionlog_guide` and `get_task_execution_guide`-equivalent** should include an explicit prompt: "Before executing, read the vision. Does each goal serve the vision's core promise, or is it a task dressed as a goal?"

2. **Goal creation UX** should distinguish between vision goals (destinations) and implementation tasks. A goal that starts with "fix", "add", or "improve" should trigger a prompt: "Is this a goal or a task?"

3. **The missing goal check**: After goals are listed, surface the question: "What does the vision promise that no goal currently covers?" The gap is often the most important goal.

4. **`visionlog_boot`** should inject the vision AND the goals together, with the explicit framing: "These goals should serve this vision — if they don't, surface the conflict before acting."

## Consequences

### Positive

- Goals created in visionlog will more often be vision-level, not patch-level
- Agents using visionlog will be prompted to think like product owners, not bug fixers
- The tool becomes a genuine thinking aid, not just an organizational layer
- The "missing goal" gap — goals that cover what exists but not what the vision promises — gets surfaced before execution begins

### Negative

- Adds friction to goal creation — intentional, but will feel slow to programmers who want to move fast
- Requires the vision to be well-written for the challenge to work — garbage vision produces garbage goals regardless
