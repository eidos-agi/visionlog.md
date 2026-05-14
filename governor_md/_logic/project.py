"""Project lifecycle logic: init, set."""

from __future__ import annotations

import os

from ..core import VisionCore
from ._session import get_registry, register, resolve


def project_init(
    project_name: str, path: str | None = None, backlog_path: str | None = None
) -> str:
    """Initialize governor in a project directory."""
    abs_path = os.path.abspath(path) if path else None
    if abs_path:
        core = VisionCore(abs_path)
    else:
        core = resolve()
    core.init(project_name, backlog_path)
    pid = core.get_project_id()
    if abs_path:
        get_registry()[pid] = core
    return (
        f'Initialized governor for "{project_name}" at {core.root}\n'
        f"project_id: {pid}\n\n"
        "Call project_set with the same path to register it for this session."
    )


def project_set(path: str) -> str:
    """Register a project by its filesystem path and return its UUID."""
    try:
        root, pid = register(path)
    except FileNotFoundError as e:
        return f"Error: {e}"
    except ValueError as e:
        return f"Error: {e}"
    return (
        f"Registered project at {root}\nproject_id: {pid}\n\n"
        "Pass this project_id to all governor tool calls targeting this project."
    )
