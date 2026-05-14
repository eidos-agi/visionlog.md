"""Decision (ADR) CRUD."""

from __future__ import annotations

from ._session import resolve


def decision_create(
    title: str,
    project_id: str | None = None,
    status: str | None = None,
    supersedes: str | None = None,
    relates_to: list[str] | None = None,
    source_research_id: str | None = None,
    body: str | None = None,
) -> str:
    """Create a new decision (ADR)."""
    core = resolve(project_id)
    d = core.create_decision(
        title,
        status=status or "proposed",
        supersedes=supersedes,
        relates_to=relates_to,
        source_research_id=source_research_id,
        body=body,
    )
    return f"Created {d.id}: {d.title} [{d.status}]"


def decision_list(project_id: str | None = None) -> str:
    """List all decisions."""
    core = resolve(project_id)
    decisions = core.list_decisions()
    if not decisions:
        return "No decisions recorded."
    return "\n".join(f"[{d.status}] **{d.id}**: {d.title}" for d in decisions)


def decision_view(decision_id: str, project_id: str | None = None) -> str:
    """View a decision in full detail."""
    core = resolve(project_id)
    d = core.get_decision(decision_id)
    if not d:
        return f"Decision {decision_id} not found."
    return f"## {d.id}: {d.title}\n\n**Status:** {d.status}\n\n{d.body}"


def decision_update(
    decision_id: str,
    project_id: str | None = None,
    status: str | None = None,
    title: str | None = None,
    body: str | None = None,
) -> str:
    """Update a decision's fields."""
    core = resolve(project_id)
    updates: dict = {}
    if status is not None:
        updates["status"] = status
    if title is not None:
        updates["title"] = title
    if body is not None:
        updates["body"] = body
    try:
        d = core.update_decision(decision_id, **updates)
        return f"Updated {d.id}: {d.title} → {d.status}"
    except ValueError as e:
        return f"Error: {e}"
