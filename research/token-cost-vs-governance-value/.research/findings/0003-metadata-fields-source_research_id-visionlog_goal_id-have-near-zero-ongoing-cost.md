---
id: '0003'
title: >-
  Metadata fields (source_research_id, visionlog_goal_id) have near-zero ongoing
  cost
status: open
evidence: HIGH
sources: 1
created: '2026-03-22'
---

## Claim

Cross-reference fields written once at creation time cost ~5 tokens each and add zero overhead to subsequent reads unless explicitly fetched. They are the highest value/cost ratio features in the trilogy — they add auditability with negligible token burn.

## Supporting Evidence

> **Evidence: [HIGH]** — Field is part of frontmatter — only parsed when the specific file is read, not surfaced automatically (2026-03-22), retrieved 2026-03-22

## Caveats

None identified yet.
