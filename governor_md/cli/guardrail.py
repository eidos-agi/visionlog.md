"""Guardrail subcommands: create, list, view, update, inject."""

from __future__ import annotations

from typing import Annotated, Optional

import typer

from .._logic import guardrail as _guardrail


def register(app: typer.Typer) -> None:
    @app.command("guardrail-create")
    def cmd_guardrail_create(
        title: Annotated[str, typer.Option(help="Guardrail title.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[
            Optional[str], typer.Option(help="active | retired | proposed.")
        ] = None,
        adr: Annotated[
            Optional[str], typer.Option(help="Optional ADR reference.")
        ] = None,
        body: Annotated[
            Optional[str], typer.Option(help="Optional body markdown.")
        ] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Create a new guardrail."""
        from ._app import emit

        result = _guardrail.guardrail_create(
            title=title,
            project_id=project_id,
            status=status,
            adr=adr,
            body=body,
        )
        emit(result, json_mode=json_)

    @app.command("guardrail-list")
    def cmd_guardrail_list(
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """List all guardrails."""
        from ._app import emit

        result = _guardrail.guardrail_list(project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("guardrail-view")
    def cmd_guardrail_view(
        guardrail_id: Annotated[str, typer.Argument(help="Guardrail ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """View a guardrail in full detail."""
        from ._app import emit

        result = _guardrail.guardrail_view(
            guardrail_id=guardrail_id, project_id=project_id
        )
        emit(result, json_mode=json_)

    @app.command("guardrail-update")
    def cmd_guardrail_update(
        guardrail_id: Annotated[str, typer.Argument(help="Guardrail ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[Optional[str], typer.Option(help="New status.")] = None,
        title: Annotated[Optional[str], typer.Option(help="New title.")] = None,
        body: Annotated[Optional[str], typer.Option(help="New body.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Update a guardrail's fields."""
        from ._app import emit

        result = _guardrail.guardrail_update(
            guardrail_id=guardrail_id,
            project_id=project_id,
            status=status,
            title=title,
            body=body,
        )
        emit(result, json_mode=json_)

    @app.command("guardrail-inject")
    def cmd_guardrail_inject(
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Return active guardrails formatted for system prompt injection."""
        from ._app import emit

        result = _guardrail.guardrail_inject(project_id=project_id)
        emit(result, json_mode=json_)
