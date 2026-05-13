"""governor-migrate — rename `visionlog-md` state to `governor-md` in any project.

Run inside a project directory (looks for `.visionlog/`) or pass `--root` to
sweep a tree of repos. Dry-run by default; pass `--apply` to actually rewrite.

Renames performed per project:
    .visionlog/                  -> .governor/
    .visionlog/config.yaml       -> .governor/config.yaml
        field `project: visionlog.md` -> `project: governor.md` (if present)
    .claude/settings.local.json: mcp__visionlog__ -> mcp__governor__
    .mcp.json:                   visionlog server name + commands -> governor

Files NEVER touched:
    - Markdown content inside .visionlog/ (only the dir is renamed)
    - Files outside the project root
    - References to `vision` standalone (the semantic concept — vision_set,
      vision_view, the `vision.md` file inside the state dir all preserve
      their names; only the `visionlog` brand is replaced)
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Plan:
    project_root: Path
    actions: list[tuple[str, str]]

    def add(self, description: str, detail: str = "") -> None:
        self.actions.append((description, detail))

    def is_empty(self) -> bool:
        return not self.actions


def _safe_sub(content: str, pattern: str, replacement: str) -> tuple[str, int]:
    new_content, n = re.subn(pattern, replacement, content)
    return new_content, n


def plan_for_project(project_root: Path) -> Plan:
    plan = Plan(project_root, [])
    vlog_dir = project_root / ".visionlog"
    gov_dir = project_root / ".governor"

    if vlog_dir.is_dir() and not gov_dir.exists():
        plan.add(f"rename {vlog_dir.name}/ -> {gov_dir.name}/")

    # config.yaml — update project field if it references the brand
    cfg = vlog_dir / "config.yaml" if vlog_dir.is_dir() else None
    if cfg and cfg.is_file():
        content = cfg.read_text()
        if "project: " in content and "visionlog.md" in content:
            plan.add("  config.yaml: set project: governor.md (was visionlog.md)")

    # Claude settings allowlist
    settings = project_root / ".claude" / "settings.local.json"
    if settings.is_file():
        content = settings.read_text()
        _, n = _safe_sub(content, r"mcp__visionlog__", "mcp__governor__")
        if n:
            plan.add(
                f"edit .claude/settings.local.json: {n} mcp__visionlog__ -> mcp__governor__"
            )

    # .mcp.json server name + commands
    mcp_json = project_root / ".mcp.json"
    if mcp_json.is_file():
        content = mcp_json.read_text()
        change_count = 0
        _, n = _safe_sub(content, r'"visionlog"\s*:', '"governor":')
        change_count += n
        _, n = _safe_sub(content, r'"visionlog-md"', '"governor-md"')
        change_count += n
        _, n = _safe_sub(content, r"visionlog_md\.", "governor_md.")
        change_count += n
        _, n = _safe_sub(content, r'"command"\s*:\s*"visionlog"', '"command": "governor"')
        change_count += n
        if change_count:
            plan.add(
                f"edit .mcp.json: {change_count} visionlog identifier(s) -> governor"
            )

    return plan


def apply_plan(plan: Plan) -> None:
    project_root = plan.project_root
    vlog_dir = project_root / ".visionlog"
    gov_dir = project_root / ".governor"

    # 1. Rename .visionlog/ -> .governor/
    if vlog_dir.is_dir() and not gov_dir.exists():
        vlog_dir.rename(gov_dir)

    # 2. Fix config.yaml's project field
    cfg = gov_dir / "config.yaml"
    if cfg.is_file():
        content = cfg.read_text()
        new = re.sub(
            r'(project:\s*["\']?)visionlog\.md(["\']?)',
            r"\1governor.md\2",
            content,
        )
        if new != content:
            cfg.write_text(new)

    # 3. Claude settings allowlist
    settings = project_root / ".claude" / "settings.local.json"
    if settings.is_file():
        content = settings.read_text()
        new, _ = _safe_sub(content, r"mcp__visionlog__", "mcp__governor__")
        if new != content:
            settings.write_text(new)

    # 4. .mcp.json
    mcp_json = project_root / ".mcp.json"
    if mcp_json.is_file():
        content = mcp_json.read_text()
        new = content
        new, _ = _safe_sub(new, r'"visionlog"\s*:', '"governor":')
        new, _ = _safe_sub(new, r'"visionlog-md"', '"governor-md"')
        new, _ = _safe_sub(new, r"visionlog_md\.", "governor_md.")
        new, _ = _safe_sub(new, r'"command"\s*:\s*"visionlog"', '"command": "governor"')
        if new != content:
            mcp_json.write_text(new)


def find_projects(root: Path) -> list[Path]:
    found = []
    for path in root.rglob(".visionlog"):
        if path.is_dir():
            parent = path.parent
            if (parent / ".governor").exists():
                continue
            found.append(parent)
    return sorted(found)


def main() -> int:
    p = argparse.ArgumentParser(
        prog="governor-migrate",
        description="Migrate a project from visionlog-md state to governor-md state.",
    )
    p.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Sweep all projects under this root. Default: just the current directory.",
    )
    p.add_argument(
        "--apply",
        action="store_true",
        help="Actually rewrite. Without this, runs as a dry-run.",
    )
    args = p.parse_args()

    if args.root:
        if not args.root.is_dir():
            print(f"--root {args.root} is not a directory", file=sys.stderr)
            return 2
        projects = find_projects(args.root)
        if not projects:
            print(f"No .visionlog/ directories under {args.root}.")
            return 0
        print(f"Found {len(projects)} project(s) with .visionlog/ under {args.root}.\n")
    else:
        cwd = Path.cwd()
        if not (cwd / ".visionlog").is_dir():
            print(f"No .visionlog/ in {cwd}. Nothing to migrate.")
            print("Use --root to sweep a directory tree.")
            return 0
        projects = [cwd]

    plans = [plan_for_project(p) for p in projects]
    nonempty = [pl for pl in plans if not pl.is_empty()]

    if not nonempty:
        print("Nothing to migrate.")
        return 0

    for plan in nonempty:
        print(f"\n=== {plan.project_root} ===")
        for desc, _ in plan.actions:
            print(f"  • {desc}")

    if not args.apply:
        print(f"\n(dry-run; pass --apply to rewrite {len(nonempty)} project(s))")
        return 0

    for plan in nonempty:
        apply_plan(plan)
        print(f"migrated: {plan.project_root}")

    print(f"\nDone. Migrated {len(nonempty)} project(s).")
    print(
        "Restart any active Claude Code sessions so they pick up the renamed MCP server."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
