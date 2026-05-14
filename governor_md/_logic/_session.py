"""CLI/server session boot — project registry + path discovery.

The MCP server kept a long-lived in-memory ``project_id → VisionCore`` map;
a fresh CLI subprocess does not. This module provides:

- ``_registry``: the in-memory map (used by both the MCP server and the CLI)
- ``resolve(project_id)``: get the VisionCore for an id (or the default if any)
- ``register(path)``: explicit registration (used by ``project-set``)
- ``boot_from_cwd(path=None)``: idempotent auto-registration from the
  filesystem — called from the Typer root callback so every subcommand sees
  the project rooted at or above CWD.
"""

from __future__ import annotations

import os
from pathlib import Path

from ..core import VisionCore

_registry: dict[str, VisionCore] = {}
_default_core: VisionCore | None = None


def set_default(core: VisionCore | None) -> None:
    global _default_core
    _default_core = core


def get_registry() -> dict[str, VisionCore]:
    return _registry


def resolve(project_id: str | None = None) -> VisionCore:
    if project_id and project_id in _registry:
        return _registry[project_id]
    if project_id:
        raise ValueError(
            f"Unknown project_id '{project_id}'. "
            "This project hasn't been registered in this session. "
            "Call project_set with the project's path to register it."
        )
    if _default_core:
        return _default_core
    raise ValueError(
        "No project registered for this session. "
        "Call project_set with a project path to register it."
    )


def find_project_root(start_dir: str) -> str | None:
    d = start_dir
    for _ in range(10):
        if os.path.exists(os.path.join(d, ".governor/config.yaml")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    return None


def register(path: str) -> tuple[str, str]:
    """Register a project by its filesystem path; return (root, project_id)."""
    abs_path = os.path.abspath(path)
    root = find_project_root(abs_path) or abs_path
    config_path = os.path.join(root, ".governor/config.yaml")
    if not os.path.exists(config_path):
        raise FileNotFoundError(
            f"No .governor/config.yaml found at {root}. "
            "Call project_init in that directory first."
        )
    core = VisionCore(root)
    pid = core.get_project_id()
    if not pid:
        raise ValueError(
            f".governor/config.yaml at {root} has no 'id' field. "
            "Re-run project_init to generate one."
        )
    for existing_id, existing_core in list(_registry.items()):
        if existing_core.root == root and existing_id != pid:
            del _registry[existing_id]
    _registry[pid] = core
    return root, pid


def boot_from_cwd(path: str | None = None) -> None:
    """Walk up from ``path`` (default CWD) and register any .governor project found.

    Also sets the discovered project as the session default so commands that
    take no ``--project-id`` resolve cleanly. Safe to call repeatedly.
    """
    start = Path(path).resolve() if path else Path.cwd()
    root = find_project_root(str(start))
    if not root:
        return
    try:
        _, pid = register(root)
    except Exception:
        return
    set_default(_registry[pid])
