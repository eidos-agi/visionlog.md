---
id: '0004'
title: blocked_reason field adds ~10 tokens only when a task is actually blocked
status: open
evidence: HIGH
sources: 1
created: '2026-03-22'
---

## Claim

blocked_reason is a write-time field on ike.md tasks. It adds ~10 tokens to the task file and zero overhead to normal task reads. At a 15% block rate over 100 tasks, total overhead is ~150 tokens. The governance value (named, typed blockers vs. freeform notes) is high relative to this cost.

## Supporting Evidence

> **Evidence: [HIGH]** — Field analysis — frontmatter field, not injected into context automatically (2026-03-22), retrieved 2026-03-22

## Caveats

None identified yet.
