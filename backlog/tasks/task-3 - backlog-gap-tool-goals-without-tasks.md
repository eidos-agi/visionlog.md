---
id: TASK-3
title: "visionlog_backlog_gap — find goals with no corresponding backlog tasks"
status: To Do
assignee: []
created_date: '2026-03-19'
labels: [mcp, backlog-integration]
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
visionlog knows the goal DAG. The config.yaml knows the `backlog_path`. But the two systems never talk to each other. A goal can be `in-progress` with zero backlog tasks, and nothing surfaces that contradiction.

**Why this matters — what actually happened:**
On 2026-03-19, manyhats had:
- GOAL-002: "Professional Hats — generated technical configs" — status: `in-progress`
- Backlog: 1 task (TASK-1, also In Progress, about GOAL-001)
- Reality: GOAL-002 was actually complete — `manyhats wear` works — but nobody had created a task for it, marked it done, or updated the goal status

The project was lying about its own state. An agent starting a session would see GOAL-002 in-progress and try to implement the wear command — which already existed.

**The fix: `visionlog_backlog_gap`**

A tool that:
1. Reads all goals with status `in-progress` or `available`
2. Reads the backlog tasks directory
3. Looks for goals with no matching tasks (by title similarity or explicit goal reference in task body)
4. Returns: "GOAL-002 is in-progress but has no backlog tasks" → agent should either create tasks or mark the goal done

This is a coherence check, not enforcement. It surfaces the gap; the agent decides what to do.

**Bonus: goal-task linking**
Tasks should be able to declare which goal they serve (e.g., `goal: GOAL-002`). `visionlog_backlog_gap` uses this for exact matching when available, fuzzy matching otherwise.
<!-- SECTION:DESCRIPTION:END -->

## Why

A goal DAG without corresponding tasks is a governance artifact, not an execution plan. The value of visionlog is that it keeps agents coherent — but an agent that reads "GOAL-002 in-progress" and doesn't know whether tasks exist for it will either duplicate work or assume it needs to start from scratch.

**Specific failure prevented:** On manyhats, GOAL-002 showed as `in-progress` with no tasks. Without this tool, every session risks an agent attempting to re-implement the wear command. With it, the agent immediately knows: "GOAL-002 has no tasks but the feature ships — mark it done."

This also prevents the inverse: a goal marked `complete` that has open tasks still being worked on.

## Acceptance Criteria

- [ ] `visionlog_backlog_gap` MCP tool reads goals + backlog tasks
- [ ] Returns goals with status in-progress/available that have no tasks
- [ ] Returns goals marked complete that still have open tasks
- [ ] Tasks can declare `goal: GOAL-NNN` for exact linking
- [ ] `visionlog_guide` calls this tool and surfaces gaps in its output
- [ ] Works when backlog_path is set in config.yaml; graceful no-op when not set
