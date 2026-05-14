"""Razor-thin MCP server for governor.

Exposes ONE tool: ``help``. Every other operation happens via the CLI
(``governor boot``, ``governor goal create``, etc.). This is the
CLI-first / razor-thin-MCP shape — see ADR-006.

Discovery flow:
  1. Agent calls ``mcp__governor__help()`` — gets the full command tree.
  2. Agent calls ``mcp__governor__help(subcommand="goal-create")`` —
     gets the specific subcommand's --help output.
  3. Agent invokes the actual work via Bash:
     ``governor goal-create --title "..." --json``.
"""

from __future__ import annotations

import asyncio
import io
import sys

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

server = Server("governor")


HELP_DESCRIPTION = (
    "REQUIRED at session start for any governor work: returns the full "
    "governor command tree. Call with no args for the top-level surface, "
    "or with subcommand='<name>' for that subcommand's full --help. All "
    "real work happens via Bash: `governor <subcommand> [--json] [opts]`. "
    "Start every session with `governor boot` for guardrails + state. "
    "This MCP server is razor-thin by design."
)


HELP_TOOL = Tool(
    name="help",
    description=HELP_DESCRIPTION,
    inputSchema={
        "type": "object",
        "properties": {
            "subcommand": {
                "type": "string",
                "description": (
                    "Optional subcommand name (e.g. 'boot', 'goal-create', "
                    "'guardrail-inject'). When set, returns that subcommand's "
                    "full --help. When omitted, returns the top-level command "
                    "tree."
                ),
            },
        },
    },
)


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [HELP_TOOL]


def _capture_help(argv: list[str]) -> str:
    from .cli import app

    buf = io.StringIO()
    real_stdout = sys.stdout
    sys.stdout = buf
    try:
        try:
            app(argv, standalone_mode=False)
        except SystemExit:
            pass
        except Exception as e:
            return f"error rendering help: {type(e).__name__}: {e}"
    finally:
        sys.stdout = real_stdout
    return buf.getvalue()


def _build_top_level_help() -> str:
    return "\n".join(
        [
            "governor — The static St. Peter. Vision, goals, guardrails, SOPs, ADRs.",
            "",
            "USAGE:  governor <subcommand> [--json] [options]",
            "",
            "SESSION START (run these first, every session):",
            "  governor boot                            # guardrails + goal state + SOPs + trilogy",
            "  governor guide                           # full strategic context: vision + ADRs + goal map",
            "  governor status                          # one-line overview",
            "",
            "PROJECT LIFECYCLE:",
            "  governor project-init                    # initialize a new project",
            "  governor project-set <path>              # register an existing project; returns project_id",
            "",
            "VISION:",
            "  governor vision-view                     # read the project vision",
            "  governor vision-set                      # set/update the vision",
            "",
            "GOALS (the DAG of what 'done' looks like):",
            "  governor goal-create                     # create a new goal",
            "  governor goal-list                       # list all goals with statuses",
            "  governor goal-view <id>                  # full goal detail",
            "  governor goal-update <id>                # update fields",
            "  governor goal-unlockable                 # which goals are ready to unlock",
            "",
            "GUARDRAILS (immutable conscience — never violate):",
            "  governor guardrail-create                # add a new constraint",
            "  governor guardrail-list                  # list all guardrails",
            "  governor guardrail-view <id>             # full guardrail detail",
            "  governor guardrail-update <id>           # update fields",
            "  governor guardrail-inject                # format active guardrails for system prompt",
            "",
            "DECISIONS (ADRs — the architectural record):",
            "  governor decision-create                 # record a new ADR",
            "  governor decision-list                   # list all decisions",
            "  governor decision-view <id>              # full ADR detail",
            "  governor decision-update <id>            # update fields",
            "",
            "SOPS (recommended procedures):",
            "  governor sop-create                      # add a new SOP",
            "  governor sop-list                        # list all SOPs",
            "  governor sop-view <id>                   # full SOP detail",
            "  governor sop-update <id>                 # update fields",
            "",
            "MCP:",
            "  governor mcp serve                       # boots this MCP server (you're talking to it now)",
            "",
            "DRILL IN:    governor <subcommand> --help    "
            "OR    mcp__governor__help(subcommand='<name>')",
            "JSON MODE:   add --json to any subcommand for machine-readable output",
        ]
    )


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name != "help":
        return [TextContent(type="text", text=f"unknown tool: {name!r}")]
    sub = (arguments or {}).get("subcommand")
    if sub:
        text = _capture_help([sub, "--help"])
        if not text.strip():
            text = f"no help available for subcommand {sub!r}"
        return [TextContent(type="text", text=text)]
    return [TextContent(type="text", text=_build_top_level_help())]


async def _main() -> None:
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream, write_stream, server.create_initialization_options()
        )


def run() -> None:
    """Entry point used by ``governor mcp serve``."""
    try:
        asyncio.run(_main())
    except KeyboardInterrupt:
        sys.exit(0)
