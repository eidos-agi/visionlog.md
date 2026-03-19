---
id: "GUARD-003"
type: "guardrail"
title: "Always work inside a backlog task — no freeform coding outside of a tracked task"
status: "active"
date: "2026-03-19"
---

## Rule

Before writing code or making changes, confirm there is an active backlog.md task for the work. Use the backlog MCP (`task_create`, `task_start`) to create and start one if it doesn't exist. Freeform coding outside of a tracked backlog.md task is not allowed — even for "quick fixes."

## Why

Vision sets direction. backlog.md captures the work. The backlog MCP is the standard — not sticky notes, not comments, not mental tracking. If an agent codes without a backlog task, the work is invisible: no audit trail, no scope boundary, no way to know if the work serves the active goal. The task is not bureaucracy; it's the contract between the agent and the human about what's being done and why.

## Violation Examples

- Starting to refactor a module because it "looks messy" without a backlog task
- Fixing a bug inline while working on something else without creating a task for the fix
- Adding a feature that wasn't in the plan because it seemed useful
- Tracking work in a todo comment or mental note instead of backlog.md
