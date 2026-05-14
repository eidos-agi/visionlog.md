"""Project lifecycle subcommands: init, set."""

from __future__ import annotations

from typing import Annotated, Optional

import typer

from .._logic import project as _project


def register(app: typer.Typer) -> None:
    @app.command("project-init")
    def cmd_project_init(
        project_name: Annotated[str, typer.Option(help="The project's display name.")],
        path: Annotated[
            Optional[str],
            typer.Option(help="Target directory. Default: current directory."),
        ] = None,
        backlog_path: Annotated[
            Optional[str], typer.Option(help="Optional path to a backlog file.")
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Initialize governor in a project directory."""
        from ._app import emit

        result = _project.project_init(
            project_name=project_name, path=path, backlog_path=backlog_path
        )
        emit(result, json_mode=json_)

    @app.command("project-set")
    def cmd_project_set(
        path: Annotated[
            str, typer.Argument(help="Path to the governor-managed project.")
        ],
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Register a project by path and return its project_id."""
        from ._app import emit

        result = _project.project_set(path)
        emit(result, json_mode=json_)
