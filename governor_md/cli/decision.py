"""Decision (ADR) subcommands."""

from __future__ import annotations

import json
from typing import Annotated, Optional

import typer

from .._logic import decision as _decision


def register(app: typer.Typer) -> None:
    @app.command("decision-create")
    def cmd_decision_create(
        title: Annotated[str, typer.Option(help="Decision title.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[
            Optional[str],
            typer.Option(help="proposed | accepted | rejected | superseded."),
        ] = None,
        supersedes: Annotated[
            Optional[str], typer.Option(help="ADR ID this one supersedes.")
        ] = None,
        relates_to: Annotated[
            Optional[str],
            typer.Option("--relates-to", help="JSON array of related ADR IDs."),
        ] = None,
        source_research_id: Annotated[
            Optional[str], typer.Option(help="Source research project GUID.")
        ] = None,
        body: Annotated[
            Optional[str], typer.Option(help="Optional body markdown.")
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Create a new decision (ADR)."""
        from ._app import emit

        relates: Optional[list[str]] = None
        if relates_to is not None:
            try:
                parsed = json.loads(relates_to)
            except json.JSONDecodeError as e:
                typer.echo(f"--relates-to is not valid JSON: {e}", err=True)
                raise typer.Exit(code=2)
            if not isinstance(parsed, list):
                typer.echo("--relates-to must be a JSON array.", err=True)
                raise typer.Exit(code=2)
            relates = parsed

        result = _decision.decision_create(
            title=title,
            project_id=project_id,
            status=status,
            supersedes=supersedes,
            relates_to=relates,
            source_research_id=source_research_id,
            body=body,
        )
        emit(result, json_mode=json_)

    @app.command("decision-list")
    def cmd_decision_list(
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """List all decisions."""
        from ._app import emit

        result = _decision.decision_list(project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("decision-view")
    def cmd_decision_view(
        decision_id: Annotated[str, typer.Argument(help="Decision ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """View a decision in full detail."""
        from ._app import emit

        result = _decision.decision_view(decision_id=decision_id, project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("decision-update")
    def cmd_decision_update(
        decision_id: Annotated[str, typer.Argument(help="Decision ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[Optional[str], typer.Option(help="New status.")] = None,
        title: Annotated[Optional[str], typer.Option(help="New title.")] = None,
        body: Annotated[Optional[str], typer.Option(help="New body.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Update a decision's fields."""
        from ._app import emit

        result = _decision.decision_update(
            decision_id=decision_id,
            project_id=project_id,
            status=status,
            title=title,
            body=body,
        )
        emit(result, json_mode=json_)
