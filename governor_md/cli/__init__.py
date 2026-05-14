"""governor Typer CLI surface.

``governor <subcommand> [--json] [opts]`` — everything is here. The MCP
server (``governor_md.mcp_server``) exposes a single ``help`` tool that
introspects this Typer app.
"""

from ._app import app, main

__all__ = ["app", "main"]
