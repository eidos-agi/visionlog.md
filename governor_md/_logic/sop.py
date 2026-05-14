"""SOP CRUD."""

from __future__ import annotations

from ._session import resolve


def sop_create(
    title: str,
    project_id: str | None = None,
    status: str | None = None,
    adr: str | None = None,
    body: str | None = None,
) -> str:
    """Create a new SOP."""
    core = resolve(project_id)
    s = core.create_sop(title=title, status=status or "draft", adr=adr, body=body)
    return f"Created {s.id}: {s.title} [{s.status}]"


def sop_list(project_id: str | None = None) -> str:
    """List all SOPs."""
    core = resolve(project_id)
    sops = core.list_sops()
    if not sops:
        return "No SOPs defined."
    return "\n".join(f"[{s.status}] **{s.id}**: {s.title}" for s in sops)


def sop_view(sop_id: str, project_id: str | None = None) -> str:
    """View an SOP in full detail."""
    core = resolve(project_id)
    s = core.get_sop(sop_id)
    if not s:
        return f"SOP {sop_id} not found."
    return f"## {s.id}: {s.title}\n\n**Status:** {s.status}\n\n{s.body}"


def sop_update(
    sop_id: str,
    project_id: str | None = None,
    status: str | None = None,
    title: str | None = None,
    body: str | None = None,
) -> str:
    """Update an SOP's fields."""
    core = resolve(project_id)
    updates: dict = {}
    if status is not None:
        updates["status"] = status
    if title is not None:
        updates["title"] = title
    if body is not None:
        updates["body"] = body
    try:
        s = core.update_sop(sop_id, **updates)
        return f"Updated {s.id}: {s.title} → {s.status}"
    except ValueError as e:
        return f"Error: {e}"
