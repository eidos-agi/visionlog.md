---
id: "ADR-006"
type: "decision"
title: "CLI-first, razor-thin MCP across all *-md packages"
status: "accepted"
date: "2026-05-14"
---

## Context

Four Eidos packages — `telos-md`, `research-md`, `governor-md`, and `docket-md` — each shipped as fat MCP servers. Tool counts: 9, 20, 25, 34 respectively. **88 MCP tools total**, all pre-loaded into every Claude session prompt regardless of whether any were used.

Three things were getting expensive:

1. **Prompt tax.** Every new subcommand pays prompt-cost in every session forever. The MCP tool list is loaded eagerly at session start. With 88 tools across four packages, a session sees a wall of nearly-identical-looking verbs (`goal_create`, `goal_list`, `goal_view`, …) before any work begins.

2. **Discovery friction.** Agents had to read 88 tool descriptions to find the right one. There was no progressive reveal — the surface was flat and wide.

3. **Wrong shape for the job.** MCP's strongest case is non-local service integration (a remote API, a complex stateful tool). The trilogy + telos are local Python packages. They don't need MCP's wire protocol — they need a CLI. MCP-as-only-interface meant every consumer had to be an MCP host. A `bash` session couldn't use any of these tools.

The pattern the team converges on naturally: `git`, `kubectl`, `aws`, `gh`. One binary, subcommands, `--help` is the discovery surface, JSON output is available everywhere.

## Decision

Each `*-md` package ships as a **real Typer CLI**. The MCP server becomes a **razor-thin wrapper** with a single `help` tool that returns the command tree.

Specifically:

- **One binary per package** (`telos-md`, `research-md`, `governor`, `docket-md`). Subcommands are the work surface: `governor goal create --title "..." --json`.
- **`<binary> mcp serve`** is the subcommand the MCP host invokes. The MCP server is no longer a separate entry point; it is one subcommand among many.
- **One MCP tool per package: `help`.** Description is *aggressively* explicit: *"REQUIRED at session start: returns the full \<pkg\> command tree."* Optional `subcommand=<name>` argument returns that subcommand's `--help` for drill-down inside MCP without leaving for Bash.
- **`--json` on every subcommand.** Pure-logic functions return `dict | list | str`; the Typer command formats — default human-readable, `--json` machine-readable.
- **No backwards-compat MCP aliases.** Old tool names (`mcp__governor__goal_create` etc.) are cut clean. Per `feedback_no_codename_brand_splits_at_solo_scale`, two names = forever friction at solo scale. Each package ships a `*-migrate` script that atomically collapses consumer `.claude/settings.local.json` allowlists.

## Consequences

**Prompt tax drops ~95%.** 88 MCP tool descriptions → 4. Consumer allowlists go from ~38 entries to ~8 (4 `help` tools + 4 `Bash(...)` patterns).

**Discovery becomes progressive.** Session start: `mcp__<pkg>__help` returns a curated surface. Drill in via `help(subcommand=...)` for the verb's full `--help`. Or jump straight to Bash: `<pkg> <subcommand> --help`.

**Any environment can use these tools.** A Bash shell, a CI runner, a non-MCP agent — anywhere `pip install` works.

**Internal refactor is two-stage per package** to keep tests green throughout:

- **Stage A**: extract pure logic from `server.py` into `_logic/<category>.py`. Tests stay green; server.py just shims into `_logic/`.
- **Stage B**: add `cli/` with Typer commands; replace `server.py` with `mcp_server.py` (single `help` tool); update `pyproject.toml` scripts; extend the package's migrate script; bump version.

**Subprocess latency in tight loops** (e.g. `telos tick` firing every iteration in a 200-tick Ralph loop) is a known trade-off. ~80ms cold-start per invocation. Deferred mitigation: a `<binary> serve --port` daemon mode with a thin client; defer until measured pain.

**Order of conversion** (reverse blast-radius): telos-md → research-md → governor-md → docket-md. Each gates the next; if the shape needs revision, fewer packages are downstream.

**This ADR is canonical for the trilogy + telos.** Other Eidos packages (`railguey`, `clawdflare`, `cept`, etc.) inherit the principle but are out of scope for this ADR. They will follow in a subsequent decision after the trilogy validates the shape.

## Status

- **telos-md v0.4.0** — landed 2026-05-13. Pattern validated end-to-end (CLI round-trip, MCP help tool, migrate sweep, PyPI publish).
- **research-md v0.5.0** — landed 2026-05-14. Same shape; one twist: CLI subprocesses are stateless, so each invocation auto-registers the project from CWD via a `boot_from_cwd()` callback. Pattern applies to governor + docket.
- **governor-md** — in progress (this ADR).
- **docket-md** — pending.
