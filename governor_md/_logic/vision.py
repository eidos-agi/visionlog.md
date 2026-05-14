"""Vision: view, set."""

from __future__ import annotations

from ._session import resolve


def vision_view(project_id: str | None = None) -> str:
    """View the project vision."""
    core = resolve(project_id)
    vision = core.get_vision()
    if not vision:
        return "No vision document found."
    return f"# {vision.title}\n\n{vision.body}"


def vision_set(title: str, body: str, project_id: str | None = None) -> str:
    """Set or update the project vision document."""
    core = resolve(project_id)
    core.set_vision(title, body)
    return f"Vision updated: {title}"
