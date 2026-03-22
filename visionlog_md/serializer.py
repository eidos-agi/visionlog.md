"""Serialize visionlog entities to markdown with JSON-quoted frontmatter.

IMPORTANT: visionlog uses JSON.stringify() for frontmatter values, NOT YAML.
This means strings are double-quoted ("value"), arrays use JSON syntax (["a", "b"]),
and the config file has no --- delimiters. This differs from ike.md and research.md
which use gray-matter/YAML style. Standardization is planned for after the port.
"""

import json
from .types import Goal, Decision, Guardrail, Sop, Standard, Vision, VisionlogConfig


def _frontmatter(pairs: dict) -> str:
    """Build frontmatter block with JSON-quoted values, matching TS serializer."""
    lines = ["---"]
    for key, val in pairs.items():
        if val is None:
            continue
        if isinstance(val, list):
            if len(val) == 0:
                lines.append(f"{key}: []")
            else:
                items = ", ".join(json.dumps(v) for v in val)
                lines.append(f"{key}: [{items}]")
        else:
            lines.append(f"{key}: {json.dumps(val)}")
    lines.append("---")
    return "\n".join(lines)


def serialize_goal(goal: Goal) -> str:
    pairs = {
        "id": goal.id,
        "type": goal.type,
        "title": goal.title,
        "status": goal.status,
        "date": goal.date,
        "depends_on": goal.depends_on,
        "unlocks": goal.unlocks,
    }
    if goal.backlog_tag:
        pairs["backlog_tag"] = goal.backlog_tag
    return f"{_frontmatter(pairs)}\n\n{goal.body}\n"


def serialize_decision(decision: Decision) -> str:
    pairs = {
        "id": decision.id,
        "type": decision.type,
        "title": decision.title,
        "status": decision.status,
        "date": decision.date,
    }
    if decision.supersedes:
        pairs["supersedes"] = decision.supersedes
    if decision.relates_to:
        pairs["relates_to"] = decision.relates_to
    if decision.source_research_id:
        pairs["source_research_id"] = decision.source_research_id
    return f"{_frontmatter(pairs)}\n\n{decision.body}\n"


def serialize_guardrail(g: Guardrail) -> str:
    pairs = {
        "id": g.id,
        "type": g.type,
        "title": g.title,
        "status": g.status,
        "date": g.date,
    }
    if g.adr:
        pairs["adr"] = g.adr
    return f"{_frontmatter(pairs)}\n\n{g.body}\n"


def serialize_sop(sop: Sop) -> str:
    pairs = {
        "id": sop.id,
        "type": sop.type,
        "title": sop.title,
        "status": sop.status,
        "date": sop.date,
    }
    if sop.adr:
        pairs["adr"] = sop.adr
    return f"{_frontmatter(pairs)}\n\n{sop.body}\n"


def serialize_standard(std: Standard) -> str:
    pairs = {
        "id": std.id,
        "type": std.type,
        "title": std.title,
        "status": std.status,
        "date": std.date,
    }
    if std.adr:
        pairs["adr"] = std.adr
    return f"{_frontmatter(pairs)}\n\n{std.body}\n"


def serialize_vision(v: Vision) -> str:
    pairs = {
        "title": v.title,
        "type": v.type,
        "date": v.date,
    }
    return f"{_frontmatter(pairs)}\n\n{v.body}\n"


def serialize_config(config: VisionlogConfig) -> str:
    lines = [
        f'id: {json.dumps(config.id or "")}',
        f'project: {json.dumps(config.project)}',
        f'created: {json.dumps(config.created)}',
    ]
    if config.backlog_path:
        lines.append(f'backlog_path: {json.dumps(config.backlog_path)}')
    return "\n".join(lines) + "\n"
