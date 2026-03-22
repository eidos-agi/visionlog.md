/**
 * Golden fixture capture for visionlog TypeScript → Python migration.
 * Run with: bun refactor/capture-fixtures.ts
 */

import { VisionCore } from "../src/core/visionlog.ts";
import { ProjectRegistry } from "../src/mcp/registry.ts";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const FIXTURES_DIR = join(import.meta.dir, "fixtures");

function saveFixture(toolName: string, fixtureId: string, input: any, output: any) {
	const dir = join(FIXTURES_DIR, toolName);
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, `${fixtureId}.json`),
		JSON.stringify({ tool: toolName, fixture_id: fixtureId, input, output, source_language: "typescript", captured_at: new Date().toISOString().split("T")[0] }, null, 2) + "\n"
	);
}

// Build a server + registry, then call tools via the registry/core directly
// (MCP SDK McpServer doesn't expose tool handlers easily — we bypass the transport)

async function main() {
	// ── Project init + set ──────────────────────────────────────────────────
	const d1 = mkdtempSync(join(tmpdir(), "vl-fix-"));
	const core1 = new VisionCore(d1);
	await core1.init("test-project", "backlog");
	const id1 = await core1.getProjectId();

	const reg = new ProjectRegistry(core1);
	const regResult = await reg.register(d1);

	saveFixture("project_init", "001-happy-path", { project_name: "test-project", path: d1 }, {
		content: [{ type: "text", text: `Initialized visionlog for "test-project" at ${d1}\nproject_id: ${id1}\n\nCall project_set with the same path to register it for this session.` }]
	});

	saveFixture("project_set", "001-happy-path", { path: d1 }, {
		content: [{ type: "text", text: `Registered project at ${regResult.path}\nproject_id: ${regResult.id}\n\nPass this project_id to all visionlog tool calls targeting this project.` }]
	});

	// Project set error
	try {
		await reg.register("/nonexistent/path");
	} catch (err: any) {
		saveFixture("project_set", "002-not-found", { path: "/nonexistent/path" }, {
			content: [{ type: "text", text: `Error: ${err.message}` }], isError: true
		});
	}

	// ── Vision ──────────────────────────────────────────────────────────────
	// vision_view (no vision yet)
	const noVision = await core1.getVision();
	saveFixture("vision_view", "001-no-vision", { project_id: id1 }, {
		content: [{ type: "text", text: "No vision document found." }]
	});

	// vision_set
	await core1.setVision("North Star", "## Destination\n\nBuild the best thing.\n\n## Anti-Goals\n\n- Don't build bloatware.");
	saveFixture("vision_set", "001-set", { title: "North Star", body: "## Destination\n\nBuild the best thing.\n\n## Anti-Goals\n\n- Don't build bloatware.", project_id: id1 }, {
		content: [{ type: "text", text: "Vision updated: North Star" }]
	});

	// vision_view (with vision)
	const vision = await core1.getVision();
	saveFixture("vision_view", "002-with-vision", { project_id: id1 }, {
		content: [{ type: "text", text: `# ${vision!.title}\n\n${vision!.body}` }]
	});

	// ── Goals ───────────────────────────────────────────────────────────────
	const g1 = await core1.createGoal({ title: "Build foundation", status: "available", body: "The base layer" });
	saveFixture("goal_create", "001-available", { title: "Build foundation", status: "available", body: "The base layer", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${g1.id}: ${g1.title} [${g1.status}]` }]
	});

	const g2 = await core1.createGoal({ title: "Add features", depends_on: [g1.id], body: "Features on top" });
	saveFixture("goal_create", "002-with-deps", { title: "Add features", depends_on: [g1.id], body: "Features on top", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${g2.id}: ${g2.title} [${g2.status}]` }]
	});

	const g3 = await core1.createGoal({ title: "Ship it", depends_on: [g2.id], unlocks: [], backlog_tag: "v1.0", body: "Release to production" });
	saveFixture("goal_create", "003-with-backlog-tag", { title: "Ship it", depends_on: [g2.id], backlog_tag: "v1.0", body: "Release to production", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${g3.id}: ${g3.title} [${g3.status}]` }]
	});

	// goal_create minimal (default body)
	const g4 = await core1.createGoal({ title: "Stretch goal" });
	saveFixture("goal_create", "004-minimal", { title: "Stretch goal", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${g4.id}: ${g4.title} [${g4.status}]` }]
	});

	// goal_list
	const goals = await core1.listGoals();
	const goalLines = goals.map(g => `[${g.status}] **${g.id}**: ${g.title}`);
	saveFixture("goal_list", "001-with-goals", { project_id: id1 }, {
		content: [{ type: "text", text: goalLines.join("\n") }]
	});

	// goal_view
	const gView = await core1.getGoal(g1.id);
	saveFixture("goal_view", "001-exists", { goal_id: g1.id, project_id: id1 }, {
		content: [{ type: "text", text: `## ${gView!.id}: ${gView!.title}\n\n**Status:** ${gView!.status}\n**Depends on:** ${gView!.depends_on.length ? gView!.depends_on.join(", ") : "none"}\n**Unlocks:** ${gView!.unlocks.length ? gView!.unlocks.join(", ") : "none"}\n\n${gView!.body}` }]
	});

	// goal_view not found
	const gNotFound = await core1.getGoal("GOAL-999");
	saveFixture("goal_view", "002-not-found", { goal_id: "GOAL-999", project_id: id1 }, {
		content: [{ type: "text", text: "Goal GOAL-999 not found." }]
	});

	// goal_update
	const gUpdated = await core1.updateGoal(g1.id, { status: "complete" });
	saveFixture("goal_update", "001-complete", { goal_id: g1.id, status: "complete", project_id: id1 }, {
		content: [{ type: "text", text: `Updated ${gUpdated.id}: ${gUpdated.title} → ${gUpdated.status}` }]
	});

	// goal_unlockable (g2 should now be unlockable since g1 is complete)
	const unlockable = await core1.unlockableGoals();
	saveFixture("goal_unlockable", "001-with-unlockable", { project_id: id1 }, {
		content: [{ type: "text", text: unlockable.length ? unlockable.map(g => `${g.id}: ${g.title}`).join("\n") : "No goals ready to unlock." }]
	});

	// ── Guardrails ──────────────────────────────────────────────────────────
	const guard1 = await core1.createGuardrail({ title: "No breaking changes", body: "## Rule\n\nNever break the API.\n\n## Why\n\nUsers depend on it.\n\n## Violation Examples\n\n- Removing a field" });
	saveFixture("guardrail_create", "001-with-body", { title: "No breaking changes", body: "## Rule\n\nNever break the API.\n\n## Why\n\nUsers depend on it.\n\n## Violation Examples\n\n- Removing a field", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${guard1.id}: ${guard1.title} [${guard1.status}]` }]
	});

	const guard2 = await core1.createGuardrail({ title: "No secrets in code" });
	saveFixture("guardrail_create", "002-minimal", { title: "No secrets in code", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${guard2.id}: ${guard2.title} [${guard2.status}]` }]
	});

	// guardrail_list
	const guards = await core1.listGuardrails();
	saveFixture("guardrail_list", "001-with-guardrails", { project_id: id1 }, {
		content: [{ type: "text", text: guards.map(g => `[${g.status}] **${g.id}**: ${g.title}`).join("\n") }]
	});

	// guardrail_view
	saveFixture("guardrail_view", "001-exists", { guardrail_id: guard1.id, project_id: id1 }, {
		content: [{ type: "text", text: `## ${guard1.id}: ${guard1.title}\n\n**Status:** ${guard1.status}\n\n${guard1.body}` }]
	});

	// guardrail_update
	const guardUpdated = await core1.updateGuardrail(guard2.id, { status: "retired" });
	saveFixture("guardrail_update", "001-retire", { guardrail_id: guard2.id, status: "retired", project_id: id1 }, {
		content: [{ type: "text", text: `Updated ${guardUpdated.id}: ${guardUpdated.title} → ${guardUpdated.status}` }]
	});

	// guardrail_inject (view for injecting into system prompt)
	saveFixture("guardrail_inject", "001-inject", { project_id: id1 }, {
		content: [{ type: "text", text: guards.filter(g => g.status === "active").map(g => `**${g.id}: ${g.title}**\n${g.body}`).join("\n\n---\n\n") }]
	});

	// ── Decisions (ADR) ─────────────────────────────────────────────────────
	const adr1 = await core1.createDecision({ title: "Use PostgreSQL", body: "## Context\n\nNeed a database.\n\n## Decision\n\nUse Postgres.\n\n## Consequences\n\n### Positive\n\n- Reliable\n\n### Negative\n\n- Complex setup", status: "accepted" });
	saveFixture("decision_create", "001-accepted", { title: "Use PostgreSQL", body: "## Context\n\nNeed a database.\n\n## Decision\n\nUse Postgres.\n\n## Consequences\n\n### Positive\n\n- Reliable\n\n### Negative\n\n- Complex setup", status: "accepted", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${adr1.id}: ${adr1.title} [${adr1.status}]` }]
	});

	const adr2 = await core1.createDecision({ title: "Defer auth", relates_to: [g1.id], source_research_id: "abc-123" });
	saveFixture("decision_create", "002-with-relations", { title: "Defer auth", relates_to: [g1.id], source_research_id: "abc-123", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${adr2.id}: ${adr2.title} [${adr2.status}]` }]
	});

	// decision_list
	const decisions = await core1.listDecisions();
	saveFixture("decision_list", "001-with-decisions", { project_id: id1 }, {
		content: [{ type: "text", text: decisions.map(d => `[${d.status}] **${d.id}**: ${d.title}`).join("\n") }]
	});

	// decision_view
	saveFixture("decision_view", "001-exists", { decision_id: adr1.id, project_id: id1 }, {
		content: [{ type: "text", text: `## ${adr1.id}: ${adr1.title}\n\n**Status:** ${adr1.status}\n\n${adr1.body}` }]
	});

	// decision_update
	const adrUpdated = await core1.updateDecision(adr2.id, { status: "accepted", body: "## Context\n\nAuth can wait.\n\n## Decision\n\nDefer to Phase 3." });
	saveFixture("decision_update", "001-accept", { decision_id: adr2.id, status: "accepted", body: "## Context\n\nAuth can wait.\n\n## Decision\n\nDefer to Phase 3.", project_id: id1 }, {
		content: [{ type: "text", text: `Updated ${adrUpdated.id}: ${adrUpdated.title} → ${adrUpdated.status}` }]
	});

	// ── SOPs ────────────────────────────────────────────────────────────────
	// Note: 3 default SOPs were created during init. Create one more.
	const sop1 = await core1.createSop({ title: "Deploy checklist", status: "active", body: "## When to use this\n\nBefore every deploy.\n\n## Steps\n\n1. Run tests\n2. Check staging\n3. Deploy\n\n## Guards\n\n- Never skip tests" });
	saveFixture("sop_create", "001-active", { title: "Deploy checklist", status: "active", body: "## When to use this\n\nBefore every deploy.\n\n## Steps\n\n1. Run tests\n2. Check staging\n3. Deploy\n\n## Guards\n\n- Never skip tests", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${sop1.id}: ${sop1.title} [${sop1.status}]` }]
	});

	// sop_list
	const sops = await core1.listSops();
	saveFixture("sop_list", "001-with-sops", { project_id: id1 }, {
		content: [{ type: "text", text: sops.map(s => `[${s.status}] **${s.id}**: ${s.title}`).join("\n") }]
	});

	// sop_view
	saveFixture("sop_view", "001-exists", { sop_id: sop1.id, project_id: id1 }, {
		content: [{ type: "text", text: `## ${sop1.id}: ${sop1.title}\n\n**Status:** ${sop1.status}\n\n${sop1.body}` }]
	});

	// sop_update
	const sopUpdated = await core1.updateSop(sop1.id, { status: "deprecated" });
	saveFixture("sop_update", "001-deprecate", { sop_id: sop1.id, status: "deprecated", project_id: id1 }, {
		content: [{ type: "text", text: `Updated ${sopUpdated.id}: ${sopUpdated.title} → ${sopUpdated.status}` }]
	});

	// ── visionlog_status ────────────────────────────────────────────────────
	const status = await core1.status();
	const goalLine = Object.entries(status.goals.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
	const decisionLine = Object.entries(status.decisions.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
	const statusLines = [
		`Goals (${status.goals.total}): ${goalLine || "none"}`,
		`Decisions (${status.decisions.total}): ${decisionLine || "none"}`,
		`Guardrails: ${status.guardrails.active} active / ${status.guardrails.total} total`,
		`SOPs: ${status.sops.active} active / ${status.sops.total} total`,
		`Vision: ${status.has_vision ? "set" : "not set"}`,
	];
	saveFixture("visionlog_status", "001-full", { project_id: id1 }, {
		content: [{ type: "text", text: statusLines.join("\n") }]
	});

	// ── Error cases ─────────────────────────────────────────────────────────
	try {
		await core1.updateGoal("GOAL-999", { status: "complete" });
	} catch (err: any) {
		saveFixture("goal_update", "002-not-found", { goal_id: "GOAL-999", status: "complete", project_id: id1 }, {
			content: [{ type: "text", text: `Error: ${err.message}` }], isError: true
		});
	}

	try {
		await core1.updateGuardrail("GUARD-999", { status: "retired" });
	} catch (err: any) {
		saveFixture("guardrail_update", "002-not-found", { guardrail_id: "GUARD-999", status: "retired", project_id: id1 }, {
			content: [{ type: "text", text: `Error: ${err.message}` }], isError: true
		});
	}

	try {
		await core1.updateDecision("ADR-999", { status: "accepted" });
	} catch (err: any) {
		saveFixture("decision_update", "002-not-found", { decision_id: "ADR-999", status: "accepted", project_id: id1 }, {
			content: [{ type: "text", text: `Error: ${err.message}` }], isError: true
		});
	}

	try {
		await core1.updateSop("SOP-999", { status: "active" });
	} catch (err: any) {
		saveFixture("sop_update", "002-not-found", { sop_id: "SOP-999", status: "active", project_id: id1 }, {
			content: [{ type: "text", text: `Error: ${err.message}` }], isError: true
		});
	}

	// ── Second project (empty) for edge cases ───────────────────────────────
	const d2 = mkdtempSync(join(tmpdir(), "vl-empty-"));
	const core2 = new VisionCore(d2);
	await core2.init("empty-project");
	const id2 = await core2.getProjectId();

	// Empty lists
	const emptyGoals = await core2.listGoals();
	saveFixture("goal_list", "002-empty", { project_id: id2 }, {
		content: [{ type: "text", text: "No goals defined yet." }]
	});

	const emptyDecisions = await core2.listDecisions();
	saveFixture("decision_list", "002-empty", { project_id: id2 }, {
		content: [{ type: "text", text: "No decisions recorded." }]
	});

	const emptyGuards = await core2.listGuardrails();
	saveFixture("guardrail_list", "002-empty", { project_id: id2 }, {
		content: [{ type: "text", text: "No guardrails defined." }]
	});

	// goal_unlockable with nothing
	const noUnlockable = await core2.unlockableGoals();
	saveFixture("goal_unlockable", "002-empty", { project_id: id2 }, {
		content: [{ type: "text", text: "No goals ready to unlock." }]
	});

	// visionlog_status on empty
	const emptyStatus = await core2.status();
	const emptyGoalLine = Object.entries(emptyStatus.goals.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
	const emptyDecisionLine = Object.entries(emptyStatus.decisions.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
	saveFixture("visionlog_status", "002-empty", { project_id: id2 }, {
		content: [{ type: "text", text: [
			`Goals (${emptyStatus.goals.total}): ${emptyGoalLine || "none"}`,
			`Decisions (${emptyStatus.decisions.total}): ${emptyDecisionLine || "none"}`,
			`Guardrails: ${emptyStatus.guardrails.active} active / ${emptyStatus.guardrails.total} total`,
			`SOPs: ${emptyStatus.sops.active} active / ${emptyStatus.sops.total} total`,
			`Vision: ${emptyStatus.has_vision ? "set" : "not set"}`,
		].join("\n") }]
	});

	// ── Unicode / edge case goals ───────────────────────────────────────────
	const gUnicode = await core1.createGoal({ title: "データベース移行", body: "Japanese goal" });
	saveFixture("goal_create", "005-unicode", { title: "データベース移行", body: "Japanese goal", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${gUnicode.id}: ${gUnicode.title} [${gUnicode.status}]` }]
	});

	const gLong = await core1.createGoal({ title: "x".repeat(200), body: "Long title" });
	saveFixture("goal_create", "006-long-title", { title: "x".repeat(200), body: "Long title", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${gLong.id}: ${gLong.title} [${gLong.status}]` }]
	});

	// Goal with unlocks
	const g5 = await core1.createGoal({ title: "Unlocks test", unlocks: [g3.id], body: "Testing unlocks" });
	saveFixture("goal_create", "007-with-unlocks", { title: "Unlocks test", unlocks: [g3.id], body: "Testing unlocks", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${g5.id}: ${g5.title} [${g5.status}]` }]
	});

	// Guardrail with ADR reference
	const guard3 = await core1.createGuardrail({ title: "Soft deletes only", adr: adr1.id, body: "## Rule\n\nNo hard deletes." });
	saveFixture("guardrail_create", "003-with-adr", { title: "Soft deletes only", adr: adr1.id, body: "## Rule\n\nNo hard deletes.", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${guard3.id}: ${guard3.title} [${guard3.status}]` }]
	});

	// Decision supersede
	const adr3 = await core1.createDecision({ title: "Switch to DuckDB", supersedes: adr1.id, status: "proposed" });
	saveFixture("decision_create", "003-supersedes", { title: "Switch to DuckDB", supersedes: adr1.id, status: "proposed", project_id: id1 }, {
		content: [{ type: "text", text: `Created ${adr3.id}: ${adr3.title} [${adr3.status}]` }]
	});

	// ── Count fixtures ──────────────────────────────────────────────────────
	let total = 0;
	for (const dir of readdirSync(FIXTURES_DIR)) {
		const p = join(FIXTURES_DIR, dir);
		if (!existsSync(p)) continue;
		try {
			const files = readdirSync(p).filter(f => f.endsWith(".json"));
			total += files.length;
			console.log(`  ${dir}: ${files.length} fixtures`);
		} catch {}
	}
	console.log(`\nTotal: ${total} golden fixtures captured`);
}

main().catch(err => { console.error(err); process.exit(1); });
