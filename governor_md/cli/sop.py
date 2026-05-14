"""SOP subcommands."""

from __future__ import annotations

from typing import Annotated, Optional

import typer

from .._logic import sop as _sop


def register(app: typer.Typer) -> None:
    @app.command("sop-create")
    def cmd_sop_create(
        title: Annotated[str, typer.Option(help="SOP title.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[
            Optional[str], typer.Option(help="draft | active | retired.")
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
        """Create a new SOP."""
        from ._app import emit

        result = _sop.sop_create(
            title=title,
            project_id=project_id,
            status=status,
            adr=adr,
            body=body,
        )
        emit(result, json_mode=json_)

    @app.command("sop-list")
    def cmd_sop_list(
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """List all SOPs."""
        from ._app import emit

        result = _sop.sop_list(project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("sop-view")
    def cmd_sop_view(
        sop_id: Annotated[str, typer.Argument(help="SOP ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """View an SOP in full detail."""
        from ._app import emit

        result = _sop.sop_view(sop_id=sop_id, project_id=project_id)
        emit(result, json_mode=json_)

    @app.command("sop-update")
    def cmd_sop_update(
        sop_id: Annotated[str, typer.Argument(help="SOP ID.")],
        project_id: Annotated[Optional[str], typer.Option(help="Project ID.")] = None,
        status: Annotated[Optional[str], typer.Option(help="New status.")] = None,
        title: Annotated[Optional[str], typer.Option(help="New title.")] = None,
        body: Annotated[Optional[str], typer.Option(help="New body.")] = None,
        json_: Annotated[
            bool, typer.Option("--json", "-J", help="JSON output.")
        ] = False,
    ) -> None:
        """Update an SOP's fields."""
        from ._app import emit

        result = _sop.sop_update(
            sop_id=sop_id,
            project_id=project_id,
            status=status,
            title=title,
            body=body,
        )
        emit(result, json_mode=json_)
