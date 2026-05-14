"""Goal subcommands: create, list, view, update, unlockable."""

from __future__ import annotations

import json
from typing import Annotated, Optional

import typer

from .._logic import goal as _goal


def _parse_str_list(raw: Optional[str], flag: str) -> Optional[list[str]]:
    if raw is None:
        return None
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        typer.echo(f"{flag} is not valid JSON: {e}", err=True)
        raise typer.Exit(code=2)
    if not isinstance(parsed, list):
        typer.echo(f"{flag} must be a JSON array of strings.", err=True)
        raise typer.Exit(code=2)
    return parsed


def register(app: typer.Typer) -> None:
    @app.command("goal-create")
    def cmd_goal_create(
        title: Annotated[str, typer.Option(help="Goal title.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[
            Optional[str],
            typer.Option(help="locked | available | in-progress | complete."),
        ] = None,
        depends_on: Annotated[
            Optional[str],
            typer.Option("--depends-on", help="JSON array of goal IDs."),
        ] = None,
        unlocks: Annotated[
            Optional[str],
            typer.Option("--unlocks", help="JSON array of goal IDs."),
        ] = None,
        backlog_tag: Annotated[
            Optional[str], typer.Option(help="Optional backlog tag.")
        ] = None,
        body: Annotated[
            Optional[str], typer.Option(help="Optional body markdown.")
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Create a new goal in the vision DAG."""
        from ._app import emit

        result = _goal.goal_create(
            title=title,
            project_id=project_id,
            status=status,
            depends_on=_parse_str_list(depends_on, "--depends-on"),
            unlocks=_parse_str_list(unlocks, "--unlocks"),
            backlog_tag=backlog_tag,
            body=body,
        )
        emit(result, json_mode=json_)

    @app.command("goal-list")
    def cmd_goal_list(
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """List all goals with their statuses."""
        from ._app import emit

        result = _goal.goal_list(project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("goal-view")
    def cmd_goal_view(
        goal_id: Annotated[str, typer.Argument(help="Goal ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """View a goal in full detail."""
        from ._app import emit

        result = _goal.goal_view(goal_id=goal_id, project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("goal-update")
    def cmd_goal_update(
        goal_id: Annotated[str, typer.Argument(help="Goal ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[Optional[str], typer.Option(help="New status.")] = None,
        title: Annotated[Optional[str], typer.Option(help="New title.")] = None,
        body: Annotated[Optional[str], typer.Option(help="New body.")] = None,
        depends_on: Annotated[
            Optional[str],
            typer.Option("--depends-on", help="JSON array of goal IDs."),
        ] = None,
        unlocks: Annotated[
            Optional[str],
            typer.Option("--unlocks", help="JSON array of goal IDs."),
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Update a goal's fields."""
        from ._app import emit

        result = _goal.goal_update(
            goal_id=goal_id,
            project_id=project_id,
            status=status,
            title=title,
            body=body,
            depends_on=_parse_str_list(depends_on, "--depends-on"),
            unlocks=_parse_str_list(unlocks, "--unlocks"),
        )
        emit(result, json_mode=json_)

    @app.command("goal-unlockable")
    def cmd_goal_unlockable(
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """List goals whose dependencies are all complete — ready to unlock."""
        from ._app import emit

        result = _goal.goal_unlockable(project_id=project_id)
        emit(result, json_mode=json_)
