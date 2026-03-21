---
id: "SOP-002"
type: "sop"
title: "The Vision Challenge — validate goals against the vision before executing"
status: "active"
adr: "ADR-005"
date: "2026-03-19"
---

## When to use this

After any batch of goals is created — especially goals that came from a bug report, UX critique, or technical audit. Before any goal is moved to `in-progress`. This is not optional.

## Steps

1. **Read the vision** (`vision_view`). Hold the *promise*, not the words.

2. **Read the goals** (`goal_list`). For each goal, ask:
   - Is this a destination, or a fix?
   - Would completing this make someone proud, or just less embarrassed?
   - Does the title describe where you're going, or what you're patching?

3. **Find the missing goals.** Read the vision again and ask: *"What does this vision promise that no goal currently covers?"* The gap is almost always the most important goal. In claude-resume-duet, "Resume in one action" was entirely absent — and it was the whole point.

4. **Separate vision goals from implementation tasks.**
   - Vision goals belong in visionlog as goals
   - Implementation tasks (score colors, row highlights, column fixes) belong in the backlog as tasks *under* a vision goal
   - A goal that starts with "fix", "add", or "improve" is probably a task. Challenge it.

5. **Rewrite or replace** any goals that fail the challenge. Don't soften them — replace them with the real goal they were pointing at.

## Guards

- If all goals are roughly the same size and effort, something is wrong — vision goals vary wildly in scope
- If completing all goals wouldn't make you proud of the product, the goals are wrong
- A goal list that reads like a sprint backlog is a sprint backlog, not a vision

## Origin

Discovered in practice, not in theory. See ADR-005.
