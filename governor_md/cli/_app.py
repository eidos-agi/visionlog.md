"""Typer root + shared output formatter for governor."""

from __future__ import annotations

import json as _json

import typer

app = typer.Typer(
    name="governor",
    help="governor — the static St. Peter. Vision, goals, guardrails, SOPs, ADRs.",
    no_args_is_help=True,
    add_completion=False,
)


@app.callback()
def _root_callback() -> None:
    """Auto-register any governor project rooted at or above CWD before each command."""
    from .._logic._session import boot_from_cwd

    boot_from_cwd()


def emit(result, *, json_mode: bool) -> None:
    """Print a result. JSON mode dumps; otherwise the original string is preserved."""
    if json_mode:
        typer.echo(_json.dumps(result, indent=2, default=str))
        return
    if isinstance(result, str):
        typer.echo(result)
    elif isinstance(result, (dict, list)):
        typer.echo(_json.dumps(result, indent=2, default=str))
    else:
        typer.echo(str(result))


def _wire() -> None:
    from . import decision as _decision_cmd
    from . import goal as _goal_cmd
    from . import guardrail as _guardrail_cmd
    from . import mcp as _mcp_cmd
    from . import project as _project_cmd
    from . import session as _session_cmd
    from . import sop as _sop_cmd
    from . import vision as _vision_cmd

    _project_cmd.register(app)
    _session_cmd.register(app)
    _vision_cmd.register(app)
    _goal_cmd.register(app)
    _guardrail_cmd.register(app)
    _decision_cmd.register(app)
    _sop_cmd.register(app)
    app.add_typer(_mcp_cmd.app, name="mcp", help="MCP server operations.")


_wire()


def main() -> None:
    """Console-script entry point (``governor``)."""
    app()
