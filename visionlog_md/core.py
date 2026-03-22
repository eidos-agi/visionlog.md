"""VisionCore — business logic for visionlog entities."""

import os
from datetime import date

from .filesystem import VisionFS
from .defaults import BUNDLED_SOPS
from .types import Goal, Decision, Guardrail, Sop, Standard, Vision


class VisionCore:
    def __init__(self, project_root: str):
        self.root = project_root
        self.fs = VisionFS(project_root)

    # ── Lifecycle ─────────────────────────────────────────────────────────

    def init(self, project_name: str, backlog_path: str | None = None) -> None:
        self.fs.init(project_name, backlog_path)
        self.seed_default_sops()

    def seed_default_sops(self) -> None:
        existing = self.list_sops()
        if existing:
            return
        for sop_input in BUNDLED_SOPS:
            self.create_sop(sop_input)

    def is_initialized(self) -> bool:
        return self.fs.is_initialized()

    def get_project_id(self) -> str:
        return self.fs.get_project_id()

    # ── Goals ─────────────────────────────────────────────────────────────

    def create_goal(self, title: str, status: str = "locked", depends_on: list[str] | None = None,
                    unlocks: list[str] | None = None, backlog_tag: str | None = None, body: str | None = None) -> Goal:
        id = self.fs.next_goal_id()
        goal = Goal(
            id=id,
            type="goal",
            title=title,
            status=status,
            date=date.today().isoformat(),
            depends_on=depends_on or [],
            unlocks=unlocks or [],
            backlog_tag=backlog_tag,
            body=body or "## What this achieves\n\n\n\n## Exit Criteria\n\n- [ ] \n\n## Notes\n\n",
        )
        self.fs.save_goal(goal)
        return goal

    def list_goals(self) -> list[Goal]:
        return self.fs.list_goals()

    def get_goal(self, id: str) -> Goal | None:
        return self.fs.find_goal(id)

    def update_goal(self, id: str, **updates) -> Goal:
        goal = self.fs.find_goal(id)
        if not goal:
            raise ValueError(f"Goal {id} not found")
        for k, v in updates.items():
            if hasattr(goal, k):
                setattr(goal, k, v)
        self.fs.save_goal(goal)
        return goal

    def unlockable_goals(self) -> list[Goal]:
        all_goals = self.list_goals()
        complete_ids = {g.id for g in all_goals if g.status == "complete"}
        return [
            g for g in all_goals
            if g.status == "locked"
            and len(g.depends_on) > 0
            and all(dep in complete_ids for dep in g.depends_on)
        ]

    # ── Decisions ─────────────────────────────────────────────────────────

    def create_decision(self, title: str, status: str = "proposed", supersedes: str | None = None,
                        relates_to: list[str] | None = None, source_research_id: str | None = None,
                        body: str | None = None) -> Decision:
        id = self.fs.next_decision_id()
        decision = Decision(
            id=id,
            type="decision",
            title=title,
            status=status,
            date=date.today().isoformat(),
            supersedes=supersedes,
            relates_to=relates_to or [],
            source_research_id=source_research_id,
            body=body or "## Context\n\n\n\n## Decision\n\n\n\n## Consequences\n\n### Positive\n\n- \n\n### Negative\n\n- \n",
        )
        self.fs.save_decision(decision)
        return decision

    def list_decisions(self) -> list[Decision]:
        return self.fs.list_decisions()

    def get_decision(self, id: str) -> Decision | None:
        return self.fs.find_decision(id)

    def update_decision(self, id: str, **updates) -> Decision:
        decision = self.fs.find_decision(id)
        if not decision:
            raise ValueError(f"Decision {id} not found")
        for k, v in updates.items():
            if hasattr(decision, k):
                setattr(decision, k, v)
        self.fs.save_decision(decision)
        return decision

    # ── Guardrails ────────────────────────────────────────────────────────

    def create_guardrail(self, title: str, status: str = "active", adr: str | None = None,
                         body: str | None = None) -> Guardrail:
        id = self.fs.next_guardrail_id()
        guardrail = Guardrail(
            id=id,
            type="guardrail",
            title=title,
            status=status,
            date=date.today().isoformat(),
            adr=adr,
            body=body or "## Rule\n\n\n\n## Why\n\n\n\n## Violation Examples\n\n- \n",
        )
        self.fs.save_guardrail(guardrail)
        return guardrail

    def list_guardrails(self) -> list[Guardrail]:
        return self.fs.list_guardrails()

    def get_guardrail(self, id: str) -> Guardrail | None:
        return self.fs.find_guardrail(id)

    def update_guardrail(self, id: str, **updates) -> Guardrail:
        g = self.fs.find_guardrail(id)
        if not g:
            raise ValueError(f"Guardrail {id} not found")
        for k, v in updates.items():
            if hasattr(g, k):
                setattr(g, k, v)
        self.fs.save_guardrail(g)
        return g

    # ── SOPs ──────────────────────────────────────────────────────────────

    def create_sop(self, title: str = "", status: str = "draft", adr: str | None = None,
                   body: str | None = None, **kwargs) -> Sop:
        # Accept dict-style input for seeding
        if isinstance(title, dict):
            d = title
            title = d.get("title", "")
            status = d.get("status", "draft")
            adr = d.get("adr")
            body = d.get("body")

        id = self.fs.next_sop_id()
        sop = Sop(
            id=id,
            type="sop",
            title=title,
            status=status,
            date=date.today().isoformat(),
            adr=adr,
            body=body or "## When to use this\n\n\n\n## Steps\n\n1. \n\n## Guards\n\n- \n",
        )
        self.fs.save_sop(sop)
        return sop

    def list_sops(self) -> list[Sop]:
        return self.fs.list_sops()

    def get_sop(self, id: str) -> Sop | None:
        return self.fs.find_sop(id)

    def update_sop(self, id: str, **updates) -> Sop:
        sop = self.fs.find_sop(id)
        if not sop:
            raise ValueError(f"SOP {id} not found")
        for k, v in updates.items():
            if hasattr(sop, k):
                setattr(sop, k, v)
        self.fs.save_sop(sop)
        return sop

    # ── Standards ─────────────────────────────────────────────────────────

    def create_standard(self, title: str, status: str = "draft", adr: str | None = None,
                        body: str | None = None) -> Standard:
        id = self.fs.next_standard_id()
        std = Standard(
            id=id,
            type="standard",
            title=title,
            status=status,
            date=date.today().isoformat(),
            adr=adr,
            body=body or "## Rule\n\n\n\n## Rationale\n\n\n\n## Examples\n\n",
        )
        self.fs.save_standard(std)
        return std

    def list_standards(self) -> list[Standard]:
        return self.fs.list_standards()

    # ── Vision ────────────────────────────────────────────────────────────

    def get_vision(self) -> Vision | None:
        return self.fs.load_vision()

    def set_vision(self, title: str, body: str) -> Vision:
        vision = Vision(
            title=title,
            type="vision",
            date=date.today().isoformat(),
            body=body,
        )
        self.fs.save_vision(vision)
        return vision

    # ── Status ────────────────────────────────────────────────────────────

    def status(self) -> dict:
        goals = self.list_goals()
        decisions = self.list_decisions()
        guardrails = self.list_guardrails()
        sops = self.list_sops()
        vision = self.get_vision()

        def count_by(items, key="status"):
            counts = {}
            for item in items:
                s = getattr(item, key)
                counts[s] = counts.get(s, 0) + 1
            return counts

        return {
            "goals": {"total": len(goals), "by_status": count_by(goals)},
            "decisions": {"total": len(decisions), "by_status": count_by(decisions)},
            "guardrails": {"total": len(guardrails), "active": sum(1 for g in guardrails if g.status == "active")},
            "sops": {"total": len(sops), "active": sum(1 for s in sops if s.status == "active")},
            "has_vision": vision is not None,
        }
