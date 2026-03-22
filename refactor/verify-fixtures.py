"""Replay all golden fixtures against the Python visionlog port."""

import json
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from visionlog_md.core import VisionCore
from visionlog_md.server import (
    project_init, project_set, vision_view, vision_set, visionlog_status,
    visionlog_boot, visionlog_guide,
    goal_create, goal_list, goal_view, goal_update, goal_unlockable,
    guardrail_create, guardrail_list, guardrail_view, guardrail_update, guardrail_inject,
    decision_create, decision_list, decision_view, decision_update,
    sop_create, sop_list, sop_view, sop_update,
    _registry,
)

FIXTURES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures")


def norm(text):
    text = re.sub(r"/var/folders/[^\s]+", "<TMP>", text)
    text = re.sub(r"/tmp/[^\s]+", "<TMP>", text)
    text = re.sub(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "<GUID>", text)
    return text


def verify(tool, fid, actual):
    fp = os.path.join(FIXTURES_DIR, tool, f"{fid}.json")
    if not os.path.exists(fp):
        return None, "SKIP"
    with open(fp) as f:
        fixture = json.load(f)
    expected = fixture["output"]["content"][0]["text"]
    a, e = norm(actual), norm(expected)
    return a == e, (a, e)


def main():
    passed = failed = skipped = 0
    errors = []

    # ═══ RUN 1: Happy path lifecycle ═══
    print("═══ RUN 1: Happy Path ═══\n")

    _registry.clear()
    d = tempfile.mkdtemp(prefix="vl-v1-")
    core = VisionCore(d)
    core.init("test-project", "backlog")
    pid = core.get_project_id()
    _registry[pid] = core

    tests = [
        ("vision_view", "001-no-vision", vision_view(project_id=pid)),
        ("vision_set", "001-set", vision_set(title="North Star", body="## Destination\n\nBuild the best thing.\n\n## Anti-Goals\n\n- Don't build bloatware.", project_id=pid)),
        ("vision_view", "002-with-vision", vision_view(project_id=pid)),
        ("goal_create", "001-available", goal_create(title="Build foundation", status="available", body="The base layer", project_id=pid)),
        ("goal_create", "002-with-deps", goal_create(title="Add features", depends_on=["GOAL-001"], body="Features on top", project_id=pid)),
        ("goal_create", "003-with-backlog-tag", goal_create(title="Ship it", depends_on=["GOAL-002"], backlog_tag="v1.0", body="Release to production", project_id=pid)),
        ("goal_create", "004-minimal", goal_create(title="Stretch goal", project_id=pid)),
        ("goal_list", "001-with-goals", goal_list(project_id=pid)),
        ("goal_view", "001-exists", goal_view(goal_id="GOAL-001", project_id=pid)),
        ("goal_view", "002-not-found", goal_view(goal_id="GOAL-999", project_id=pid)),
        ("goal_update", "001-complete", goal_update(goal_id="GOAL-001", status="complete", project_id=pid)),
        ("goal_unlockable", "001-with-unlockable", goal_unlockable(project_id=pid)),
        ("guardrail_create", "001-with-body", guardrail_create(title="No breaking changes", body="## Rule\n\nNever break the API.\n\n## Why\n\nUsers depend on it.\n\n## Violation Examples\n\n- Removing a field", project_id=pid)),
        ("guardrail_create", "002-minimal", guardrail_create(title="No secrets in code", project_id=pid)),
        ("guardrail_list", "001-with-guardrails", guardrail_list(project_id=pid)),
        ("guardrail_view", "001-exists", guardrail_view(guardrail_id="GUARD-001", project_id=pid)),
        ("guardrail_update", "001-retire", guardrail_update(guardrail_id="GUARD-002", status="retired", project_id=pid)),
        ("decision_create", "001-accepted", decision_create(title="Use PostgreSQL", body="## Context\n\nNeed a database.\n\n## Decision\n\nUse Postgres.\n\n## Consequences\n\n### Positive\n\n- Reliable\n\n### Negative\n\n- Complex setup", status="accepted", project_id=pid)),
        ("decision_create", "002-with-relations", decision_create(title="Defer auth", relates_to=["GOAL-001"], source_research_id="abc-123", project_id=pid)),
        ("decision_list", "001-with-decisions", decision_list(project_id=pid)),
        ("decision_view", "001-exists", decision_view(decision_id="ADR-001", project_id=pid)),
        ("decision_update", "001-accept", decision_update(decision_id="ADR-002", status="accepted", body="## Context\n\nAuth can wait.\n\n## Decision\n\nDefer to Phase 3.", project_id=pid)),
        ("sop_create", "001-active", sop_create(title="Deploy checklist", status="active", body="## When to use this\n\nBefore every deploy.\n\n## Steps\n\n1. Run tests\n2. Check staging\n3. Deploy\n\n## Guards\n\n- Never skip tests", project_id=pid)),
        ("sop_list", "001-with-sops", sop_list(project_id=pid)),
        ("sop_view", "001-exists", sop_view(sop_id="SOP-004", project_id=pid)),
        ("sop_update", "001-deprecate", sop_update(sop_id="SOP-004", status="deprecated", project_id=pid)),
        ("visionlog_status", "001-full", visionlog_status(project_id=pid)),
        # Error cases
        ("goal_update", "002-not-found", goal_update(goal_id="GOAL-999", status="complete", project_id=pid)),
        ("guardrail_update", "002-not-found", guardrail_update(guardrail_id="GUARD-999", status="retired", project_id=pid)),
        ("decision_update", "002-not-found", decision_update(decision_id="ADR-999", status="accepted", project_id=pid)),
        ("sop_update", "002-not-found", sop_update(sop_id="SOP-999", status="active", project_id=pid)),
        # More goals
        ("goal_create", "005-unicode", goal_create(title="データベース移行", body="Japanese goal", project_id=pid)),
        ("goal_create", "006-long-title", goal_create(title="x" * 200, body="Long title", project_id=pid)),
        ("goal_create", "007-with-unlocks", goal_create(title="Unlocks test", unlocks=["GOAL-003"], body="Testing unlocks", project_id=pid)),
        # More guardrails
        ("guardrail_create", "003-with-adr", guardrail_create(title="Soft deletes only", adr="ADR-001", body="## Rule\n\nNo hard deletes.", project_id=pid)),
        # More decisions
        ("decision_create", "003-supersedes", decision_create(title="Switch to DuckDB", supersedes="ADR-001", status="proposed", project_id=pid)),
        # goal_unlockable/002-empty — SKIP: captured against empty project, this run has state
    ]

    for tool, fid, actual in tests:
        ok, detail = verify(tool, fid, actual)
        if ok is None:
            skipped += 1
            print(f"  ~ {tool}/{fid} (fixture not found)")
        elif ok:
            passed += 1
            print(f"  ✓ {tool}/{fid}")
        else:
            failed += 1
            a, e = detail
            errors.append(f"{tool}/{fid}")
            print(f"  ✗ {tool}/{fid}")
            print(f"    exp: {e[:120]}")
            print(f"    act: {a[:120]}")

    # ═══ RUN 2: Edge cases ═══
    print("\n═══ RUN 2: Edge Cases ═══\n")

    _registry.clear()
    d2 = tempfile.mkdtemp(prefix="vl-v2-")
    core2 = VisionCore(d2)
    core2.init("edge-tests")
    pid2 = core2.get_project_id()
    _registry[pid2] = core2

    edge_tests = [
        ("goal_create", "008-unicode", goal_create(title="データベース移行", body="Japanese goal", project_id=pid2)),
        ("goal_create", "009-long-title", goal_create(title="x" * 200, body="Long", project_id=pid2)),
        ("goal_create", "010-default-body", goal_create(title="No body", project_id=pid2)),
        ("goal_create", "011-in-progress", goal_create(title="In progress goal", status="in-progress", project_id=pid2)),
        ("goal_create", "012-complete", goal_create(title="Already complete", status="complete", project_id=pid2)),
        ("goal_create", "013-with-unlocks", goal_create(title="Alpha", unlocks=["GOAL-002"], project_id=pid2)),
    ]

    # Create Beta for goal_update test
    goal_create(title="Beta", depends_on=["GOAL-006"], project_id=pid2)

    edge_tests.extend([
        ("goal_update", "003-update-title-body", goal_update(goal_id="GOAL-001", title="Updated title", body="Updated body", project_id=pid2)),
        ("goal_unlockable", "003-none-ready", goal_unlockable(project_id=pid2)),
        ("guardrail_create", "004-unicode", guardrail_create(title="絶対に削除しない", body="## Rule\n\nNo hard deletes.", project_id=pid2)),
        ("guardrail_create", "005-retired", guardrail_create(title="Old rule", status="retired", project_id=pid2)),
        ("guardrail_update", "003-update-body", guardrail_update(guardrail_id="GUARD-001", body="## Rule\n\nUpdated rule content.", project_id=pid2)),
    ])

    # Decisions
    adr_full = decision_create(title="Full ADR", status="accepted", supersedes="ADR-000",
        relates_to=["GOAL-001", "GUARD-001"], source_research_id="research-uuid-123",
        body="## Context\n\nFull context.\n\n## Decision\n\nDo it.\n\n## Consequences\n\n### Positive\n\n- Good\n\n### Negative\n\n- Bad",
        project_id=pid2)
    edge_tests.append(("decision_create", "004-full", adr_full))

    edge_tests.extend([
        ("decision_create", "005-rejected", decision_create(title="Bad idea", status="rejected", project_id=pid2)),
        ("decision_update", "003-supersede", decision_update(decision_id="ADR-002", status="superseded", project_id=pid2)),
    ])

    # SOPs
    edge_tests.extend([
        ("sop_create", "002-deprecated", sop_create(title="Old process", status="deprecated", body="Don't use this.", project_id=pid2)),
        ("sop_create", "003-with-adr", sop_create(title="With ADR", adr="ADR-001", body="Linked to decision.", project_id=pid2)),
        ("sop_update", "003-activate", sop_update(sop_id="SOP-004", status="active", project_id=pid2)),
    ])

    # Vision overwrite
    vision_set(title="First Vision", body="Original content", project_id=pid2)
    edge_tests.extend([
        ("vision_set", "002-overwrite", vision_set(title="Second Vision", body="Overwritten content", project_id=pid2)),
        ("vision_view", "003-after-overwrite", vision_view(project_id=pid2)),
    ])

    # Status with mixed states
    edge_tests.append(("visionlog_status", "003-mixed", visionlog_status(project_id=pid2)))

    for tool, fid, actual in edge_tests:
        ok, detail = verify(tool, fid, actual)
        if ok is None:
            skipped += 1
            print(f"  ~ {tool}/{fid} (fixture not found)")
        elif ok:
            passed += 1
            print(f"  ✓ {tool}/{fid}")
        else:
            failed += 1
            a, e = detail
            errors.append(f"{tool}/{fid}")
            print(f"  ✗ {tool}/{fid}")
            print(f"    exp: {e[:120]}")
            print(f"    act: {a[:120]}")

    # ═══ Summary ═══
    total = passed + failed + skipped
    print(f"\n{'='*60}")
    print(f"Results: {passed} passed, {failed} failed, {skipped} skipped out of {total}")
    if passed + failed:
        print(f"Pass rate: {passed / (passed + failed) * 100:.1f}%")

    if errors:
        print(f"\nFailed ({len(errors)}):")
        for e in errors:
            print(f"  {e}")

    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
