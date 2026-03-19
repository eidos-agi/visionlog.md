---
id: "SOP-001"
type: "sop"
title: "Session Start — orient before acting"
status: "draft"
date: "2026-03-19"
---

## When to use this

Every session, before writing any code or making any changes. This is not optional.

## Steps

1. Call `guardrail_inject` — load active guardrails into context. Read them. They are constraints, not suggestions.
2. Call `visionlog_status` — see the current goal DAG. Know which goal is in-progress.
3. Call `goal_view <active-goal-id>` — read the exit criteria. That's your definition of done.
4. Check backlog.md — confirm there is an active task for the work you are about to do. If not, create one with `task_create` before starting.
5. If backlog.md is not initialized in this project, that is a violation of GUARD-003. Initialize it before doing anything else.

## Guards

- Do not skip step 4. "I'll track it later" is not acceptable.
- If guardrails conflict with the user's request, surface the conflict — don't silently override.
- If no goal is in-progress, ask the user which goal to advance before starting work.
