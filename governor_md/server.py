"""governor MCP server — thin shim over ``governor_md._logic``.

Stage A (CLI-first refactor): all tool bodies have moved to ``_logic/``;
this file imports them and registers them with FastMCP. Stage B will
collapse the surface to a single ``help`` tool (see ADR-006).
"""

from __future__ import annotations

from mcp.server.fastmcp import FastMCP

from ._logic.decision import (
    decision_create,
    decision_list,
    decision_update,
    decision_view,
)
from ._logic.goal import (
    goal_create,
    goal_list,
    goal_unlockable,
    goal_update,
    goal_view,
)
from ._logic.guardrail import (
    guardrail_create,
    guardrail_inject,
    guardrail_list,
    guardrail_update,
    guardrail_view,
)
from ._logic.project import project_init, project_set
from ._logic.session import governor_boot, governor_guide, governor_status
from ._logic.sop import sop_create, sop_list, sop_update, sop_view
from ._logic.vision import vision_set, vision_view

INSTRUCTIONS = """governor is the static St. Peter for this project.

READ THIS AT THE START OF EVERY SESSION. Before touching any task, any code, any decision.

The trilogy:
- research.md: make decisions with evidence before they become contracts here
- governor: records vision, goals, guardrails, SOPs, ADRs — the contracts all execution must honor
- ike.md: executes work within the contracts defined here

GUID workflow: Call project_set with the project path to register it and get its project_id. Pass that project_id to every subsequent tool call. For a new project, call project_init first."""

mcp = FastMCP("governor", instructions=INSTRUCTIONS)


for fn in (
    project_init,
    project_set,
    vision_view,
    vision_set,
    governor_status,
    governor_boot,
    governor_guide,
    goal_create,
    goal_list,
    goal_view,
    goal_update,
    goal_unlockable,
    guardrail_create,
    guardrail_list,
    guardrail_view,
    guardrail_update,
    guardrail_inject,
    decision_create,
    decision_list,
    decision_view,
    decision_update,
    sop_create,
    sop_list,
    sop_view,
    sop_update,
):
    mcp.tool()(fn)


def main():
    mcp.run()
