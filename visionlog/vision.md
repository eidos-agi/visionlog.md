---
title: "visionlog.md"
type: "vision"
date: "2026-03-18"
---

## Destination

A governance layer for AI-assisted projects — not documentation, not a task manager, but the layer that keeps an AI agent coherent to an end goal across sessions, context resets, and team members.

## North Star

**The agent always knows where it is.** Before it writes a line of code, it knows the active goal, the constraints it can't violate, and the decisions already made. visionlog is what makes that possible.

## The Core Insight

Code is easy for AI. Coherence is hard. An agent that doesn't know what "done" looks like will optimize locally and drift globally. visionlog is the answer to: "what does this agent need to stay on track?"

## Anti-Goals

- Not a task manager (that's backlog.md)
- Not a changelog (that's git)
- Not a wiki (too passive — this is injected, not browsed)
- Not heavy — governance that requires maintenance gets ignored

## Goal DAG

```
GOAL-001: Core — schema, parser, serializer, CLI, MCP server
  └── GOAL-002: Dogfooding — visionlog governs itself
      └── GOAL-003: Integration — CLAUDE.md injection, session start sequence
          └── GOAL-004: Ecosystem — governs manyhats, reeves, and other eidos-agi projects
```

## Success Criteria

- An AI agent working on any eidos-agi project gets governance context automatically at session start
- visionlog.md is governed by visionlog.md itself — no exceptions
- manyhats GOAL-001 completes using visionlog as the driver, not despite it
