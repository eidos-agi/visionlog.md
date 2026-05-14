"""Guardrail CRUD + injection."""

from __future__ import annotations

from ._session import resolve


def guardrail_create(
    title: str,
    project_id: str | None = None,
    status: str | None = None,
    adr: str | None = None,
    body: str | None = None,
) -> str:
    """Create a new guardrail."""
    core = resolve(project_id)
    g = core.create_guardrail(title, status=status or "active", adr=adr, body=body)
    return f"Created {g.id}: {g.title} [{g.status}]"


def guardrail_list(project_id: str | None = None) -> str:
    """List all guardrails."""
    core = resolve(project_id)
    guards = core.list_guardrails()
    if not guards:
        return "No guardrails defined."
    return "\n".join(f"[{g.status}] **{g.id}**: {g.title}" for g in guards)


def guardrail_view(guardrail_id: str, project_id: str | None = None) -> str:
    """View a guardrail in full detail."""
    core = resolve(project_id)
    g = core.get_guardrail(guardrail_id)
    if not g:
        return f"Guardrail {guardrail_id} not found."
    return f"## {g.id}: {g.title}\n\n**Status:** {g.status}\n\n{g.body}"


def guardrail_update(
    guardrail_id: str,
    project_id: str | None = None,
    status: str | None = None,
    title: str | None = None,
    body: str | None = None,
) -> str:
    """Update a guardrail's fields."""
    core = resolve(project_id)
    updates: dict = {}
    if status is not None:
        updates["status"] = status
    if title is not None:
        updates["title"] = title
    if body is not None:
        updates["body"] = body
    try:
        g = core.update_guardrail(guardrail_id, **updates)
        return f"Updated {g.id}: {g.title} → {g.status}"
    except ValueError as e:
        return f"Error: {e}"


def guardrail_inject(project_id: str | None = None) -> str:
    """Return active guardrails formatted for system prompt injection."""
    core = resolve(project_id)
    guards = [g for g in core.list_guardrails() if g.status == "active"]
    if not guards:
        return "No active guardrails."
    return "\n\n---\n\n".join(f"**{g.id}: {g.title}**\n{g.body}" for g in guards)
