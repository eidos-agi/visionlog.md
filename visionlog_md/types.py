"""Entity types for visionlog."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class Goal:
    id: str
    type: str = "goal"
    title: str = ""
    status: str = "locked"  # locked | available | in-progress | complete
    date: str = ""
    depends_on: list[str] = field(default_factory=list)
    unlocks: list[str] = field(default_factory=list)
    backlog_tag: str | None = None
    body: str = ""
    filePath: str | None = None


@dataclass
class Decision:
    id: str
    type: str = "decision"
    title: str = ""
    status: str = "proposed"  # proposed | accepted | rejected | superseded
    date: str = ""
    supersedes: str | None = None
    relates_to: list[str] = field(default_factory=list)
    source_research_id: str | None = None
    body: str = ""
    filePath: str | None = None


@dataclass
class Guardrail:
    id: str
    type: str = "guardrail"
    title: str = ""
    status: str = "active"  # active | retired
    date: str = ""
    adr: str | None = None
    body: str = ""
    filePath: str | None = None


@dataclass
class Sop:
    id: str
    type: str = "sop"
    title: str = ""
    status: str = "draft"  # draft | active | deprecated
    date: str = ""
    adr: str | None = None
    body: str = ""
    filePath: str | None = None


@dataclass
class Standard:
    id: str
    type: str = "standard"
    title: str = ""
    status: str = "draft"
    date: str = ""
    adr: str | None = None
    body: str = ""
    filePath: str | None = None


@dataclass
class Vision:
    title: str = "Project Vision"
    type: str = "vision"
    date: str = ""
    body: str = ""
    filePath: str | None = None


@dataclass
class VisionlogConfig:
    id: str = ""
    project: str = ""
    backlog_path: str | None = None
    created: str = ""
