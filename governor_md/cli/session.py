"""Session subcommands: status, boot, guide."""

from __future__ import annotations

from typing import Annotated, Optional

import typer

from .._logic import session as _session


def register(app: typer.Typer) -> None:
    @app.command("status")
    def cmd_status(
        project_id: Annotated[
            Optional[str],
            typer.Option(help="Project ID. Default: auto-resolved from CWD."),
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Overview of all governor content."""
        from ._app import emit

        result = _session.governor_status(project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("boot")
    def cmd_boot(
        project_id: Annotated[
            Optional[str],
            typer.Option(help="Project ID. Default: auto-resolved from CWD."),
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Lightweight session start: guardrails, goals, SOPs, tooling state."""
        from ._app import emit

        result = _session.governor_boot(project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("guide")
    def cmd_guide(
        project_id: Annotated[
            Optional[str],
            typer.Option(help="Project ID. Default: auto-resolved from CWD."),
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Full strategic context: vision, key decisions, goal map."""
        from ._app import emit

        result = _session.governor_guide(project_id=project_id)
        emit(result, json_mode=json_)
