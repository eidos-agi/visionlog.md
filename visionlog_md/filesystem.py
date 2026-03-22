"""File system operations for visionlog entities."""

import os
import re
import uuid
from datetime import date

from .constants import DIRECTORIES, FILES, ID_PREFIXES
from .parser import parse_config, parse_goal, parse_decision, parse_guardrail, parse_sop, parse_standard, parse_vision
from .serializer import serialize_config, serialize_goal, serialize_decision, serialize_guardrail, serialize_sop, serialize_standard, serialize_vision
from .types import Goal, Decision, Guardrail, Sop, Standard, Vision, VisionlogConfig


class VisionFS:
    def __init__(self, root: str):
        self.root = root

    def is_initialized(self) -> bool:
        return os.path.exists(os.path.join(self.root, FILES["CONFIG"]))

    def load_config(self) -> VisionlogConfig:
        path = os.path.join(self.root, FILES["CONFIG"])
        with open(path) as f:
            return parse_config(f.read())

    def save_config(self, config: VisionlogConfig) -> None:
        path = os.path.join(self.root, FILES["CONFIG"])
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(serialize_config(config))

    def init(self, project_name: str, backlog_path: str | None = None) -> None:
        for d in DIRECTORIES.values():
            os.makedirs(os.path.join(self.root, d), exist_ok=True)

        # Preserve existing UUID on re-init
        existing_id = ""
        try:
            existing = self.load_config()
            if existing.id:
                existing_id = existing.id
        except Exception:
            pass

        config = VisionlogConfig(
            id=existing_id or str(uuid.uuid4()),
            project=project_name,
            backlog_path=backlog_path,
            created=date.today().isoformat(),
        )
        self.save_config(config)

    def get_project_id(self) -> str:
        config = self.load_config()
        if config.id:
            return config.id
        # Migrate legacy: write id on first read
        new_id = str(uuid.uuid4())
        config.id = new_id
        self.save_config(config)
        return new_id

    # ── ID generation ─────────────────────────────────────────────────────

    def _next_id(self, directory: str, prefix: str) -> str:
        full_dir = os.path.join(self.root, directory)
        try:
            files = os.listdir(full_dir)
        except FileNotFoundError:
            files = []
        nums = []
        pattern = re.compile(rf"^{prefix}-(\d+)", re.IGNORECASE)
        for f in files:
            m = pattern.match(f)
            if m:
                nums.append(int(m.group(1)))
        next_num = max(nums) + 1 if nums else 1
        return f"{prefix}-{str(next_num).zfill(3)}"

    def next_goal_id(self) -> str:
        return self._next_id(DIRECTORIES["GOALS"], ID_PREFIXES["goal"])

    def next_decision_id(self) -> str:
        return self._next_id(DIRECTORIES["DECISIONS"], ID_PREFIXES["decision"])

    def next_guardrail_id(self) -> str:
        return self._next_id(DIRECTORIES["GUARDRAILS"], ID_PREFIXES["guardrail"])

    def next_sop_id(self) -> str:
        return self._next_id(DIRECTORIES["SOPS"], ID_PREFIXES["sop"])

    def next_standard_id(self) -> str:
        return self._next_id(DIRECTORIES["STANDARDS"], ID_PREFIXES["standard"])

    # ── Slugify ───────────────────────────────────────────────────────────

    @staticmethod
    def _slugify(title: str) -> str:
        return re.sub(r"[^a-z0-9]+", "-", title.lower())[:50]

    # ── Goals ─────────────────────────────────────────────────────────────

    def _goal_filename(self, goal: Goal) -> str:
        slug = self._slugify(goal.title)
        return f"{goal.id}-{slug}.md"

    def save_goal(self, goal: Goal) -> str:
        filename = os.path.basename(goal.filePath) if goal.filePath else self._goal_filename(goal)
        path = os.path.join(self.root, DIRECTORIES["GOALS"], filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(serialize_goal(goal))
        return path

    def load_goal(self, filename: str) -> Goal:
        path = os.path.join(self.root, DIRECTORIES["GOALS"], filename)
        with open(path) as f:
            return parse_goal(f.read(), path)

    def list_goals(self) -> list[Goal]:
        d = os.path.join(self.root, DIRECTORIES["GOALS"])
        try:
            files = sorted(f for f in os.listdir(d) if f.endswith(".md"))
        except FileNotFoundError:
            return []
        return [self.load_goal(f) for f in files]

    def find_goal(self, id: str) -> Goal | None:
        goals = self.list_goals()
        return next((g for g in goals if g.id == id.upper()), None)

    # ── Decisions ─────────────────────────────────────────────────────────

    def _decision_filename(self, d: Decision) -> str:
        slug = self._slugify(d.title)
        return f"{d.id}-{slug}.md"

    def save_decision(self, decision: Decision) -> str:
        filename = os.path.basename(decision.filePath) if decision.filePath else self._decision_filename(decision)
        path = os.path.join(self.root, DIRECTORIES["DECISIONS"], filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(serialize_decision(decision))
        return path

    def load_decision(self, filename: str) -> Decision:
        path = os.path.join(self.root, DIRECTORIES["DECISIONS"], filename)
        with open(path) as f:
            return parse_decision(f.read(), path)

    def list_decisions(self) -> list[Decision]:
        d = os.path.join(self.root, DIRECTORIES["DECISIONS"])
        try:
            files = sorted(f for f in os.listdir(d) if f.endswith(".md"))
        except FileNotFoundError:
            return []
        return [self.load_decision(f) for f in files]

    def find_decision(self, id: str) -> Decision | None:
        decisions = self.list_decisions()
        return next((d for d in decisions if d.id == id.upper()), None)

    # ── Guardrails ────────────────────────────────────────────────────────

    def _guardrail_filename(self, g: Guardrail) -> str:
        slug = self._slugify(g.title)
        return f"{g.id}-{slug}.md"

    def save_guardrail(self, guardrail: Guardrail) -> str:
        filename = os.path.basename(guardrail.filePath) if guardrail.filePath else self._guardrail_filename(guardrail)
        path = os.path.join(self.root, DIRECTORIES["GUARDRAILS"], filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(serialize_guardrail(guardrail))
        return path

    def load_guardrail(self, filename: str) -> Guardrail:
        path = os.path.join(self.root, DIRECTORIES["GUARDRAILS"], filename)
        with open(path) as f:
            return parse_guardrail(f.read(), path)

    def list_guardrails(self) -> list[Guardrail]:
        d = os.path.join(self.root, DIRECTORIES["GUARDRAILS"])
        try:
            files = sorted(f for f in os.listdir(d) if f.endswith(".md"))
        except FileNotFoundError:
            return []
        return [self.load_guardrail(f) for f in files]

    def find_guardrail(self, id: str) -> Guardrail | None:
        guards = self.list_guardrails()
        return next((g for g in guards if g.id == id.upper()), None)

    # ── SOPs ──────────────────────────────────────────────────────────────

    def _sop_filename(self, sop: Sop) -> str:
        slug = self._slugify(sop.title)
        return f"{sop.id}-{slug}.md"

    def save_sop(self, sop: Sop) -> str:
        filename = os.path.basename(sop.filePath) if sop.filePath else self._sop_filename(sop)
        path = os.path.join(self.root, DIRECTORIES["SOPS"], filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(serialize_sop(sop))
        return path

    def load_sop(self, filename: str) -> Sop:
        path = os.path.join(self.root, DIRECTORIES["SOPS"], filename)
        with open(path) as f:
            return parse_sop(f.read(), path)

    def list_sops(self) -> list[Sop]:
        d = os.path.join(self.root, DIRECTORIES["SOPS"])
        try:
            files = sorted(f for f in os.listdir(d) if f.endswith(".md"))
        except FileNotFoundError:
            return []
        return [self.load_sop(f) for f in files]

    def find_sop(self, id: str) -> Sop | None:
        sops = self.list_sops()
        return next((s for s in sops if s.id == id.upper()), None)

    # ── Standards ─────────────────────────────────────────────────────────

    def save_standard(self, std: Standard) -> str:
        slug = self._slugify(std.title)
        filename = os.path.basename(std.filePath) if std.filePath else f"{std.id}-{slug}.md"
        path = os.path.join(self.root, DIRECTORIES["STANDARDS"], filename)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(serialize_standard(std))
        return path

    def load_standard(self, filename: str) -> Standard:
        path = os.path.join(self.root, DIRECTORIES["STANDARDS"], filename)
        with open(path) as f:
            return parse_standard(f.read(), path)

    def list_standards(self) -> list[Standard]:
        d = os.path.join(self.root, DIRECTORIES["STANDARDS"])
        try:
            files = sorted(f for f in os.listdir(d) if f.endswith(".md"))
        except FileNotFoundError:
            return []
        return [self.load_standard(f) for f in files]

    # ── Vision ────────────────────────────────────────────────────────────

    def load_vision(self) -> Vision | None:
        path = os.path.join(self.root, FILES["VISION"])
        try:
            with open(path) as f:
                return parse_vision(f.read(), path)
        except FileNotFoundError:
            return None

    def save_vision(self, vision: Vision) -> None:
        path = os.path.join(self.root, FILES["VISION"])
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(serialize_vision(vision))
