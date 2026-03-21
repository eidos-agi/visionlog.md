---
id: "ADR-006"
type: "decision"
title: "GUID handshake — multi-project targeting via explicit UUID registration"
status: "accepted"
date: "2026-03-19"
---

## Context

visionlog's MCP server resolves the active project from cwd at startup:

```ts
const projectRoot = (await findProjectRoot(cwd())) ?? cwd();
const core = new VisionCore(projectRoot);
```

Every tool call operates on that single `core`. If the agent is working across multiple projects in one session — which is the primary use case for a cross-cutting governance layer — all writes go to whichever project cwd happened to resolve to at server startup. Wrong-project writes are silent.

This was identified by studying research.md (github.com/eidos-agi/research.md), which solved an identical problem for research projects. The root cause is the same: cwd is set by the user's editor/terminal, not by the agent. It cannot be trusted for project targeting in multi-project sessions.

The specific failure mode experienced: working in `claude-resume-duet/`, needing to govern `visionlog.md/` itself, and being unable to target the second project via MCP tools — forced to write files directly.

## Decision

**Adopt the GUID handshake pattern from research.md.**

1. `visionlog init` generates a UUID and stores it in `visionlog/config.yaml` as `id`
2. A new `visionlog_register` tool takes a filesystem path, reads the config UUID, and registers a `VisionCore` for that project in process-memory (`Map<uuid, VisionCore>`)
3. All data-mutating MCP tools accept an optional `project_id` parameter (the UUID)
4. When `project_id` is provided, the tool resolves the registered core for that UUID
5. When `project_id` is absent, the tool falls back to the cwd-detected default (backward compatible)
6. When `project_id` is provided but not registered, the tool returns an instructional hard error

**Why UUID over path:**
A path can be constructed from convention — the agent might guess right. A UUID requires reading `config.yaml`, proving the agent has seen the current project config before operating. Wrong-project writes become structurally harder, not just unlikely.

**Why optional not required:**
The common case (single project per session, cwd is correct) should have zero friction. The GUID is the escape hatch for multi-project sessions, not the mandatory tax on every call.

## Consequences

### Positive
- Cross-project governance is now possible in a single session
- An agent working on N projects registers each once, then targets by UUID
- Wrong-project writes in multi-project sessions are eliminated
- Backward compatible — existing single-project usage unchanged

### Negative
- Agents in multi-project sessions must call `visionlog_register` once per project before using project_id
- Existing `config.yaml` files without `id` will auto-generate one on first `init` call (or on next init — existing projects are unaffected by the optional param being absent)
- The UUID is in-process memory only — it must be re-registered each session (intentional, same as research.md)
