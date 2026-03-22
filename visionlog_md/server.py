"""visionlog MCP server — all 27 tools."""

import os
from mcp.server.fastmcp import FastMCP

from .core import VisionCore

INSTRUCTIONS = """visionlog is the static St. Peter for this project.

READ THIS AT THE START OF EVERY SESSION. Before touching any task, any code, any decision.

The trilogy:
- research.md: make decisions with evidence before they become contracts here
- visionlog: records vision, goals, guardrails, SOPs, ADRs — the contracts all execution must honor
- ike.md: executes work within the contracts defined here

GUID workflow: Call project_set with the project path to register it and get its project_id. Pass that project_id to every subsequent tool call. For a new project, call project_init first."""

mcp = FastMCP("visionlog", instructions=INSTRUCTIONS)

# In-memory registry: project_id → VisionCore
_registry: dict[str, VisionCore] = {}
_default_core: VisionCore | None = None


def _resolve(project_id: str | None = None) -> VisionCore:
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


def _find_project_root(start_dir: str) -> str | None:
    d = start_dir
    for _ in range(10):
        if os.path.exists(os.path.join(d, ".visionlog/config.yaml")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            break
        d = parent
    return None


# ── Project tools ─────────────────────────────────────────────────────────


@mcp.tool()
def project_init(project_name: str, path: str | None = None, backlog_path: str | None = None) -> str:
    """Initialize visionlog in a project directory. Pass 'path' to target a specific directory; omit to use the server's default (cwd at startup). After init, call project_set with the same path to register it for this session."""
    abs_path = os.path.abspath(path) if path else None
    if abs_path:
        core = VisionCore(abs_path)
    else:
        core = _resolve()
    core.init(project_name, backlog_path)
    pid = core.get_project_id()
    if abs_path:
        _registry[pid] = core
    return f'Initialized visionlog for "{project_name}" at {core.root}\nproject_id: {pid}\n\nCall project_set with the same path to register it for this session.'


@mcp.tool()
def project_set(path: str) -> str:
    """Register a project by its filesystem path and return its UUID. Call this once per project at the start of a multi-project session, then pass the returned project_id to all subsequent tool calls targeting that project. The project must have been initialized with project_init first."""
    abs_path = os.path.abspath(path)
    root = _find_project_root(abs_path) or abs_path
    config_path = os.path.join(root, ".visionlog/config.yaml")
    if not os.path.exists(config_path):
        return f"Error: No .visionlog/config.yaml found at {root}. Call project_init in that directory first."
    core = VisionCore(root)
    pid = core.get_project_id()
    if not pid:
        return f"Error: .visionlog/config.yaml at {root} has no 'id' field. Re-run project_init to generate one."
    # Remove stale entries for this root
    for existing_id, existing_core in list(_registry.items()):
        if existing_core.root == root and existing_id != pid:
            del _registry[existing_id]
    _registry[pid] = core
    return f"Registered project at {root}\nproject_id: {pid}\n\nPass this project_id to all visionlog tool calls targeting this project."


# ── Vision tools ──────────────────────────────────────────────────────────


@mcp.tool()
def vision_view(project_id: str | None = None) -> str:
    """View the project vision — the destination, north star, anti-goals, and success criteria."""
    core = _resolve(project_id)
    vision = core.get_vision()
    if not vision:
        return "No vision document found."
    return f"# {vision.title}\n\n{vision.body}"


@mcp.tool()
def vision_set(title: str, body: str, project_id: str | None = None) -> str:
    """Set or update the project vision document."""
    core = _resolve(project_id)
    core.set_vision(title, body)
    return f"Vision updated: {title}"


@mcp.tool()
def visionlog_status(project_id: str | None = None) -> str:
    """Overview of all visionlog content: goals, decisions, guardrails, SOPs, vision."""
    core = _resolve(project_id)
    status = core.status()
    goal_line = " ".join(f"{s}:{n}" for s, n in status["goals"]["by_status"].items())
    decision_line = " ".join(f"{s}:{n}" for s, n in status["decisions"]["by_status"].items())
    lines = [
        f"Goals ({status['goals']['total']}): {goal_line or 'none'}",
        f"Decisions ({status['decisions']['total']}): {decision_line or 'none'}",
        f"Guardrails: {status['guardrails']['active']} active / {status['guardrails']['total']} total",
        f"SOPs: {status['sops']['active']} active / {status['sops']['total']} total",
        f"Vision: {'set' if status['has_vision'] else 'not set'}",
    ]
    return "\n".join(lines)


@mcp.tool()
def visionlog_boot(project_id: str | None = None) -> str:
    """Lightweight session start. Returns guardrail names, goal statuses, SOP triggers, and tooling state."""
    core = _resolve(project_id)
    lines = []
    vision = core.get_vision()
    if vision and vision.title:
        lines.append(f"**Vision:** {vision.title}")
    guards = [g for g in core.list_guardrails() if g.status == "active"]
    if guards:
        lines.append("")
        lines.append(f"**Guardrails ({len(guards)})** — call guardrail_view before any action that might violate:")
        for g in guards:
            lines.append(f"  - {g.id}: {g.title}")
    goals = core.list_goals()
    if goals:
        counts = {}
        for g in goals:
            counts[g.status] = counts.get(g.status, 0) + 1
        active = [g for g in goals if g.status == "in-progress"]
        available = [g for g in goals if g.status == "available"]
        lines.append("")
        status_parts = [f"{n} {s}" for s, n in counts.items()]
        lines.append(f"**Goals ({len(goals)}):** {', '.join(status_parts)}")
        if active:
            lines.append(f"  Active: {', '.join(f'{g.id}: {g.title}' for g in active)}")
        if available:
            lines.append(f"  Ready: {', '.join(f'{g.id}: {g.title}' for g in available)}")
    else:
        lines.append("")
        lines.append("**Goals:** none — create goals before working")
    sops = [s for s in core.list_sops() if s.status == "active"]
    if sops:
        lines.append("")
        lines.append(f"**SOPs ({len(sops)}):**")
        for s in sops:
            body_lines = (s.body or "").split("\n")
            trigger = next((l.strip() for l in body_lines if l.strip().lower().startswith("when ")), None)
            lines.append(f"  - {s.id}: {s.title}{f' — {trigger}' if trigger else ''}")
    decisions = core.list_decisions()
    accepted = [d for d in decisions if d.status == "accepted"]
    if accepted:
        lines.append("")
        lines.append(f"**ADRs:** {len(accepted)} accepted — call decision_list for details")
    backlog_exists = any(os.path.exists(os.path.join(core.root, p)) for p in ["backlog", ".backlog", "backlog.md"])
    ike_exists = os.path.exists(os.path.join(core.root, ".ike"))
    research_exists = any(os.path.exists(os.path.join(core.root, p)) for p in [".research", "research"])
    lines.append("")
    tools = []
    if ike_exists:
        tools.append("ike.md ✓")
    if backlog_exists:
        tools.append("backlog.md ✓")
    if research_exists:
        tools.append("research.md ✓")
    lines.append(f"**Trilogy:** {' | '.join(tools)}" if tools else "**Trilogy:** no task tracking initialized")
    return "\n".join(lines)


@mcp.tool()
def visionlog_guide(project_id: str | None = None) -> str:
    """Full strategic context: vision, key decisions, and goal map."""
    core = _resolve(project_id)
    sections = []
    missing = []
    sections.append("""## Eidos Principles (the foundation this tool is built on)

**The Kernel**: Guardrails are immutable conscience, not preferences. They are the project's alignment layer. Treat them as such.

**The Separation**: Governance is structure. Code is substance. They must not blur. visionlog holds structure only — never implementation details.

**PERCEIVE before ACT**: You are in the perception phase right now. visionlog_guide gives you meaning and direction. visionlog_boot gives you constraints and state. Both are required before any action.

**Vision is sticky, goals are dealt**: The vision is this project's identity — it does not drift. Goals are the current hand being played. If a goal seems to contradict the vision, surface the conflict. Do not silently update either.""")

    vision = core.get_vision()
    if vision and vision.body and vision.body.strip():
        sections.append(f"# {vision.title}\n\n{vision.body.strip()}")
    else:
        missing.append("`vision_set` — define why this project exists, its destination, and anti-goals")

    decisions = [d for d in core.list_decisions() if d.status == "accepted"]
    with_body = [d for d in decisions if d.body and d.body.strip() and "## Context\n\n\n" not in d.body]
    if with_body:
        blocks = [f"### {d.id}: {d.title}\n{d.body.strip()}" for d in with_body]
        sections.append("## Key Decisions (the reasoning behind the architecture)\n\n" + "\n\n".join(blocks))
    elif decisions:
        items = "\n".join(f"- **{d.id}**: {d.title}" for d in decisions)
        sections.append(f"## Key Decisions\n{items}\n\n_Bodies not yet written. Call `decision_view <id>` or `decision_update` to add context._")
    else:
        missing.append("`decision_create` — record the key architectural choices and why they were made")

    goals = core.list_goals()
    if goals:
        by_status = {}
        for g in goals:
            by_status.setdefault(g.status, []).append(g)
        order = ["in-progress", "available", "locked", "complete"]
        goal_lines = []
        for s in order:
            for g in by_status.get(s, []):
                deps = f" (needs: {', '.join(g.depends_on)})" if g.depends_on else ""
                goal_lines.append(f"- [{s}] **{g.id}**: {g.title}{deps}")
        sections.append("## Goal Map\n\n" + "\n".join(goal_lines))
    else:
        missing.append("`goal_create` — define the goal DAG so agents know what 'done' looks like")

    if missing:
        items = "\n".join(f"- {m}" for m in missing)
        sections.append(f"## ⚠ Governance gaps — fill these to give agents full context\n\n{items}")

    return "\n\n---\n\n".join(sections)


# ── Goal tools ────────────────────────────────────────────────────────────


@mcp.tool()
def goal_create(title: str, project_id: str | None = None, status: str | None = None,
                depends_on: list[str] | None = None, unlocks: list[str] | None = None,
                backlog_tag: str | None = None, body: str | None = None) -> str:
    """Create a new goal in the vision DAG."""
    core = _resolve(project_id)
    goal = core.create_goal(title, status=status or "locked", depends_on=depends_on,
                            unlocks=unlocks, backlog_tag=backlog_tag, body=body)
    return f"Created {goal.id}: {goal.title} [{goal.status}]"


@mcp.tool()
def goal_list(project_id: str | None = None) -> str:
    """List all goals with their statuses."""
    core = _resolve(project_id)
    goals = core.list_goals()
    if not goals:
        return "No goals defined yet."
    return "\n".join(f"[{g.status}] **{g.id}**: {g.title}" for g in goals)


@mcp.tool()
def goal_view(goal_id: str, project_id: str | None = None) -> str:
    """View a goal in full detail."""
    core = _resolve(project_id)
    g = core.get_goal(goal_id)
    if not g:
        return f"Goal {goal_id} not found."
    deps = ", ".join(g.depends_on) if g.depends_on else "none"
    unlocks = ", ".join(g.unlocks) if g.unlocks else "none"
    return f"## {g.id}: {g.title}\n\n**Status:** {g.status}\n**Depends on:** {deps}\n**Unlocks:** {unlocks}\n\n{g.body}"


@mcp.tool()
def goal_update(goal_id: str, project_id: str | None = None, status: str | None = None,
                title: str | None = None, body: str | None = None,
                depends_on: list[str] | None = None, unlocks: list[str] | None = None) -> str:
    """Update a goal's fields."""
    core = _resolve(project_id)
    updates = {}
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


@mcp.tool()
def goal_unlockable(project_id: str | None = None) -> str:
    """List goals whose dependencies are all complete — ready to unlock."""
    core = _resolve(project_id)
    goals = core.unlockable_goals()
    if not goals:
        return "No goals ready to unlock."
    return "\n".join(f"{g.id}: {g.title}" for g in goals)


# ── Guardrail tools ───────────────────────────────────────────────────────


@mcp.tool()
def guardrail_create(title: str, project_id: str | None = None, status: str | None = None,
                     adr: str | None = None, body: str | None = None) -> str:
    """Create a new guardrail — a constraint the system must never violate."""
    core = _resolve(project_id)
    g = core.create_guardrail(title, status=status or "active", adr=adr, body=body)
    return f"Created {g.id}: {g.title} [{g.status}]"


@mcp.tool()
def guardrail_list(project_id: str | None = None) -> str:
    """List all guardrails."""
    core = _resolve(project_id)
    guards = core.list_guardrails()
    if not guards:
        return "No guardrails defined."
    return "\n".join(f"[{g.status}] **{g.id}**: {g.title}" for g in guards)


@mcp.tool()
def guardrail_view(guardrail_id: str, project_id: str | None = None) -> str:
    """View a guardrail in full detail."""
    core = _resolve(project_id)
    g = core.get_guardrail(guardrail_id)
    if not g:
        return f"Guardrail {guardrail_id} not found."
    return f"## {g.id}: {g.title}\n\n**Status:** {g.status}\n\n{g.body}"


@mcp.tool()
def guardrail_update(guardrail_id: str, project_id: str | None = None, status: str | None = None,
                     title: str | None = None, body: str | None = None) -> str:
    """Update a guardrail's fields."""
    core = _resolve(project_id)
    updates = {}
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


@mcp.tool()
def guardrail_inject(project_id: str | None = None) -> str:
    """Return active guardrails formatted for system prompt injection."""
    core = _resolve(project_id)
    guards = [g for g in core.list_guardrails() if g.status == "active"]
    if not guards:
        return "No active guardrails."
    return "\n\n---\n\n".join(f"**{g.id}: {g.title}**\n{g.body}" for g in guards)


# ── Decision tools ────────────────────────────────────────────────────────


@mcp.tool()
def decision_create(title: str, project_id: str | None = None, status: str | None = None,
                    supersedes: str | None = None, relates_to: list[str] | None = None,
                    source_research_id: str | None = None, body: str | None = None) -> str:
    """Create a new decision (ADR)."""
    core = _resolve(project_id)
    d = core.create_decision(title, status=status or "proposed", supersedes=supersedes,
                             relates_to=relates_to, source_research_id=source_research_id, body=body)
    return f"Created {d.id}: {d.title} [{d.status}]"


@mcp.tool()
def decision_list(project_id: str | None = None) -> str:
    """List all decisions."""
    core = _resolve(project_id)
    decisions = core.list_decisions()
    if not decisions:
        return "No decisions recorded."
    return "\n".join(f"[{d.status}] **{d.id}**: {d.title}" for d in decisions)


@mcp.tool()
def decision_view(decision_id: str, project_id: str | None = None) -> str:
    """View a decision in full detail."""
    core = _resolve(project_id)
    d = core.get_decision(decision_id)
    if not d:
        return f"Decision {decision_id} not found."
    return f"## {d.id}: {d.title}\n\n**Status:** {d.status}\n\n{d.body}"


@mcp.tool()
def decision_update(decision_id: str, project_id: str | None = None, status: str | None = None,
                    title: str | None = None, body: str | None = None) -> str:
    """Update a decision's fields."""
    core = _resolve(project_id)
    updates = {}
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


# ── SOP tools ─────────────────────────────────────────────────────────────


@mcp.tool()
def sop_create(title: str, project_id: str | None = None, status: str | None = None,
               adr: str | None = None, body: str | None = None) -> str:
    """Create a new SOP (Standard Operating Procedure)."""
    core = _resolve(project_id)
    s = core.create_sop(title=title, status=status or "draft", adr=adr, body=body)
    return f"Created {s.id}: {s.title} [{s.status}]"


@mcp.tool()
def sop_list(project_id: str | None = None) -> str:
    """List all SOPs."""
    core = _resolve(project_id)
    sops = core.list_sops()
    if not sops:
        return "No SOPs defined."
    return "\n".join(f"[{s.status}] **{s.id}**: {s.title}" for s in sops)


@mcp.tool()
def sop_view(sop_id: str, project_id: str | None = None) -> str:
    """View an SOP in full detail."""
    core = _resolve(project_id)
    s = core.get_sop(sop_id)
    if not s:
        return f"SOP {sop_id} not found."
    return f"## {s.id}: {s.title}\n\n**Status:** {s.status}\n\n{s.body}"


@mcp.tool()
def sop_update(sop_id: str, project_id: str | None = None, status: str | None = None,
               title: str | None = None, body: str | None = None) -> str:
    """Update an SOP's fields."""
    core = _resolve(project_id)
    updates = {}
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


def main():
    mcp.run()
