"""Goal CRUD."""

from __future__ import annotations

from ._session import resolve


def goal_create(
    title: str,
    project_id: str | None = None,
    status: str | None = None,
    depends_on: list[str] | None = None,
    unlocks: list[str] | None = None,
    backlog_tag: str | None = None,
    body: str | None = None,
) -> str:
    """Create a new goal in the vision DAG."""
    core = resolve(project_id)
    g = core.create_goal(
        title,
        status=status or "locked",
        depends_on=depends_on,
        unlocks=unlocks,
        backlog_tag=backlog_tag,
        body=body,
    )
    return f"Created {g.id}: {g.title} [{g.status}]"


def goal_list(project_id: str | None = None) -> str:
    """List all goals with their statuses."""
    core = resolve(project_id)
    goals = core.list_goals()
    if not goals:
        return "No goals defined yet."
    return "\n".join(f"[{g.status}] **{g.id}**: {g.title}" for g in goals)


def goal_view(goal_id: str, project_id: str | None = None) -> str:
    """View a goal in full detail."""
    core = resolve(project_id)
    g = core.get_goal(goal_id)
    if not g:
        return f"Goal {goal_id} not found."
    deps = ", ".join(g.depends_on) if g.depends_on else "none"
    unlocks = ", ".join(g.unlocks) if g.unlocks else "none"
    return (
        f"## {g.id}: {g.title}\n\n"
        f"**Status:** {g.status}\n**Depends on:** {deps}\n**Unlocks:** {unlocks}\n\n"
        f"{g.body}"
    )


def goal_update(
    goal_id: str,
    project_id: str | None = None,
    status: str | None = None,
    title: str | None = None,
    body: str | None = None,
    depends_on: list[str] | None = None,
    unlocks: list[str] | None = None,
) -> str:
    """Update a goal's fields."""
    core = resolve(project_id)
    updates: dict = {}
    if status is not None:
        updates["status"] = status
    if title is not None:
        updates["title"] = title
    if body is not None:
        updates["body"] = body
    if depends_on is not None:
        updates["depends_on"] = depends_on
    if unlocks is not None:
        updates["unlocks"] = unlocks
    try:
        g = core.update_goal(goal_id, **updates)
        return f"Updated {g.id}: {g.title} → {g.status}"
    except ValueError as e:
        return f"Error: {e}"


def goal_unlockable(project_id: str | None = None) -> str:
    """List goals whose dependencies are all complete — ready to unlock."""
    core = resolve(project_id)
    goals = core.unlockable_goals()
    if not goals:
        return "No goals ready to unlock."
    return "\n".join(f"{g.id}: {g.title}" for g in goals)
