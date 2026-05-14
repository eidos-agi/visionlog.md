"""Session-level introspection: status, boot, guide."""

from __future__ import annotations

import os

from ._session import resolve


def governor_status(project_id: str | None = None) -> str:
    """Overview of all governor content."""
    core = resolve(project_id)
    status = core.status()
    goal_line = " ".join(f"{s}:{n}" for s, n in status["goals"]["by_status"].items())
    decision_line = " ".join(
        f"{s}:{n}" for s, n in status["decisions"]["by_status"].items()
    )
    lines = [
        f"Goals ({status['goals']['total']}): {goal_line or 'none'}",
        f"Decisions ({status['decisions']['total']}): {decision_line or 'none'}",
        f"Guardrails: {status['guardrails']['active']} active / {status['guardrails']['total']} total",
        f"SOPs: {status['sops']['active']} active / {status['sops']['total']} total",
        f"Vision: {'set' if status['has_vision'] else 'not set'}",
    ]
    return "\n".join(lines)


def governor_boot(project_id: str | None = None) -> str:
    """Lightweight session start. Guardrails, goals, SOP triggers, tooling state."""
    core = resolve(project_id)
    lines = []
    vision = core.get_vision()
    if vision and vision.title:
        lines.append(f"**Vision:** {vision.title}")
    guards = [g for g in core.list_guardrails() if g.status == "active"]
    if guards:
        lines.append("")
        lines.append(
            f"**Guardrails ({len(guards)})** — call guardrail_view before any action that might violate:"
        )
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
            lines.append(
                f"  Ready: {', '.join(f'{g.id}: {g.title}' for g in available)}"
            )
    else:
        lines.append("")
        lines.append("**Goals:** none — create goals before working")
    sops = [s for s in core.list_sops() if s.status == "active"]
    if sops:
        lines.append("")
        lines.append(f"**SOPs ({len(sops)}):**")
        for s in sops:
            body_lines = (s.body or "").split("\n")
            trigger = next(
                (
                    line.strip()
                    for line in body_lines
                    if line.strip().lower().startswith("when ")
                ),
                None,
            )
            lines.append(f"  - {s.id}: {s.title}{f' — {trigger}' if trigger else ''}")
    decisions = core.list_decisions()
    accepted = [d for d in decisions if d.status == "accepted"]
    if accepted:
        lines.append("")
        lines.append(
            f"**ADRs:** {len(accepted)} accepted — call decision_list for details"
        )
    backlog_exists = any(
        os.path.exists(os.path.join(core.root, p))
        for p in ["backlog", ".backlog", "backlog.md"]
    )
    docket_exists = os.path.exists(os.path.join(core.root, ".docket"))
    research_exists = any(
        os.path.exists(os.path.join(core.root, p)) for p in [".research", "research"]
    )
    lines.append("")
    tools = []
    if docket_exists:
        tools.append("docket.md ✓")
    if backlog_exists:
        tools.append("backlog.md ✓")
    if research_exists:
        tools.append("research.md ✓")
    lines.append(
        f"**Trilogy:** {' | '.join(tools)}"
        if tools
        else "**Trilogy:** no task tracking initialized"
    )
    return "\n".join(lines)


def governor_guide(project_id: str | None = None) -> str:
    """Full strategic context: vision, key decisions, goal map."""
    core = resolve(project_id)
    sections = []
    missing = []
    sections.append("""## Eidos Principles (the foundation this tool is built on)

**The Kernel**: Guardrails are immutable conscience, not preferences. They are the project's alignment layer. Treat them as such.

**The Separation**: Governance is structure. Code is substance. They must not blur. governor holds structure only — never implementation details.

**PERCEIVE before ACT**: You are in the perception phase right now. governor_guide gives you meaning and direction. governor_boot gives you constraints and state. Both are required before any action.

**Vision is sticky, goals are dealt**: The vision is this project's identity — it does not drift. Goals are the current hand being played. If a goal seems to contradict the vision, surface the conflict. Do not silently update either.""")

    vision = core.get_vision()
    if vision and vision.body and vision.body.strip():
        sections.append(f"# {vision.title}\n\n{vision.body.strip()}")
    else:
        missing.append(
            "`vision_set` — define why this project exists, its destination, and anti-goals"
        )

    decisions = [d for d in core.list_decisions() if d.status == "accepted"]
    with_body = [
        d
        for d in decisions
        if d.body and d.body.strip() and "## Context\n\n\n" not in d.body
    ]
    if with_body:
        blocks = [f"### {d.id}: {d.title}\n{d.body.strip()}" for d in with_body]
        sections.append(
            "## Key Decisions (the reasoning behind the architecture)\n\n"
            + "\n\n".join(blocks)
        )
    elif decisions:
        items = "\n".join(f"- **{d.id}**: {d.title}" for d in decisions)
        sections.append(
            f"## Key Decisions\n{items}\n\n_Bodies not yet written. Call `decision_view <id>` or `decision_update` to add context._"
        )
    else:
        missing.append(
            "`decision_create` — record the key architectural choices and why they were made"
        )

    goals = core.list_goals()
    if goals:
        by_status: dict[str, list] = {}
        for g in goals:
            by_status.setdefault(g.status, []).append(g)
        # Known order first, then any other statuses encountered (proposed, blocked, etc.)
        known = ["in-progress", "available", "locked", "complete"]
        order = known + [s for s in by_status if s not in known]
        goal_lines = []
        for s in order:
            for g in by_status.get(s, []):
                deps = f" (needs: {', '.join(g.depends_on)})" if g.depends_on else ""
                goal_lines.append(f"- [{s}] **{g.id}**: {g.title}{deps}")
        sections.append("## Goal Map\n\n" + "\n".join(goal_lines))
    else:
        missing.append(
            "`goal_create` — define the goal DAG so agents know what 'done' looks like"
        )

    if missing:
        items = "\n".join(f"- {m}" for m in missing)
        sections.append(
            f"## ⚠ Governance gaps — fill these to give agents full context\n\n{items}"
        )

    return "\n\n---\n\n".join(sections)
