"""Vision subcommands: view, set."""

from __future__ import annotations

from typing import Annotated, Optional

import typer

from .._logic import vision as _vision


def register(app: typer.Typer) -> None:
    @app.command("vision-view")
    def cmd_vision_view(
        project_id: Annotated[
            Optional[str], typer.Option(help="Project ID. Default: auto-resolved.")
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """View the project vision."""
        from ._app import emit

        result = _vision.vision_view(project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("vision-set")
    def cmd_vision_set(
        title: Annotated[str, typer.Option(help="Vision title.")],
        body: Annotated[str, typer.Option(help="Vision body markdown.")],
        project_id: Annotated[
            Optional[str], typer.Option(help="Project ID. Default: auto-resolved.")
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Set or update the project vision document."""
        from ._app import emit

        result = _vision.vision_set(title=title, body=body, project_id=project_id)
        emit(result, json_mode=json_)
