"""Parse visionlog markdown files with JSON-quoted frontmatter.

The frontmatter uses JSON.stringify() for values (double-quoted strings,
JSON arrays). We parse using gray-matter-compatible logic but handle
JSON values specifically.
"""

import json
import re
from datetime import date

import yaml

from .types import Goal, Decision, Guardrail, Sop, Standard, Vision, VisionlogConfig


def _parse_date(raw) -> str:
    if not raw:
        return date.today().isoformat()
    if hasattr(raw, "isoformat"):
        return raw.isoformat()
    return str(raw)


def _parse_string_array(raw) -> list[str]:
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(x) for x in raw]
    if isinstance(raw, str):
        return [s.strip() for s in raw.split(",") if s.strip()]
    return []


def _parse_frontmatter(content: str) -> tuple[dict, str]:
    """Parse frontmatter from markdown content. Handles both YAML and JSON-quoted values."""
    if content.startswith("---\n"):
        try:
            end = content.index("\n---\n", 4)
        except ValueError:
            # Try \n--- at end of file
            if content.rstrip().endswith("\n---"):
                end = content.rstrip().rindex("\n---")
            else:
                return {}, content
        fm_str = content[4:end]
        body = content[end + 5:]
        data = yaml.safe_load(fm_str) or {}
        # Convert date objects back to strings
        for k, v in data.items():
            if hasattr(v, "isoformat"):
                data[k] = v.isoformat()
        return data, body.strip()
    return {}, content.strip()


def parse_goal(content: str, file_path: str | None = None) -> Goal:
    data, body = _parse_frontmatter(content)
    return Goal(
        id=str(data.get("id", "")),
        type="goal",
        title=str(data.get("title", "")),
        status=data.get("status", "locked"),
        date=_parse_date(data.get("date")),
        depends_on=_parse_string_array(data.get("depends_on")),
        unlocks=_parse_string_array(data.get("unlocks")),
        backlog_tag=str(data["backlog_tag"]) if data.get("backlog_tag") else None,
        body=body,
        filePath=file_path,
    )


def parse_decision(content: str, file_path: str | None = None) -> Decision:
    data, body = _parse_frontmatter(content)
    return Decision(
        id=str(data.get("id", "")),
        type="decision",
        title=str(data.get("title", "")),
        status=data.get("status", "proposed"),
        date=_parse_date(data.get("date")),
        supersedes=str(data["supersedes"]) if data.get("supersedes") else None,
        relates_to=_parse_string_array(data.get("relates_to")),
        source_research_id=str(data["source_research_id"]) if data.get("source_research_id") else None,
        body=body,
        filePath=file_path,
    )


def parse_guardrail(content: str, file_path: str | None = None) -> Guardrail:
    data, body = _parse_frontmatter(content)
    return Guardrail(
        id=str(data.get("id", "")),
        type="guardrail",
        title=str(data.get("title", "")),
        status=data.get("status", "active"),
        date=_parse_date(data.get("date")),
        adr=str(data["adr"]) if data.get("adr") else None,
        body=body,
        filePath=file_path,
    )


def parse_sop(content: str, file_path: str | None = None) -> Sop:
    data, body = _parse_frontmatter(content)
    return Sop(
        id=str(data.get("id", "")),
        type="sop",
        title=str(data.get("title", "")),
        status=data.get("status", "draft"),
        date=_parse_date(data.get("date")),
        adr=str(data["adr"]) if data.get("adr") else None,
        body=body,
        filePath=file_path,
    )


def parse_standard(content: str, file_path: str | None = None) -> Standard:
    data, body = _parse_frontmatter(content)
    return Standard(
        id=str(data.get("id", "")),
        type="standard",
        title=str(data.get("title", "")),
        status=data.get("status", "draft"),
        date=_parse_date(data.get("date")),
        adr=str(data["adr"]) if data.get("adr") else None,
        body=body,
        filePath=file_path,
    )


def parse_vision(content: str, file_path: str | None = None) -> Vision:
    data, body = _parse_frontmatter(content)
    return Vision(
        title=str(data.get("title", "Project Vision")),
        type="vision",
        date=_parse_date(data.get("date")),
        body=body,
        filePath=file_path,
    )


def parse_config(yaml_content: str) -> VisionlogConfig:
    # Config may or may not have --- delimiters
    normalized = yaml_content.strip()
    if normalized.startswith("---"):
        data, _ = _parse_frontmatter(normalized)
    else:
        data = yaml.safe_load(normalized) or {}
        for k, v in data.items():
            if hasattr(v, "isoformat"):
                data[k] = v.isoformat()
    return VisionlogConfig(
        id=str(data.get("id", "")),
        project=str(data.get("project", "")),
        backlog_path=str(data["backlog_path"]) if data.get("backlog_path") else None,
        created=_parse_date(data.get("created")),
    )
