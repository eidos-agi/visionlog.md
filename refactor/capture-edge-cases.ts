/**
 * Extended fixture capture — edge cases, error paths, boundary conditions.
 * Run with: bun refactor/capture-edge-cases.ts
 */

import { VisionCore } from "../src/core/visionlog.ts";
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
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

async function main() {
	const d = mkdtempSync(join(tmpdir(), "vl-edge-"));
	const core = new VisionCore(d);
	await core.init("edge-tests");
	const pid = await core.getProjectId();

	// ── Goal edge cases ──────────────────────────────────────────────────

	// Unicode title
	const gUni = await core.createGoal({ title: "データベース移行", body: "Japanese goal" });
	saveFixture("goal_create", "008-unicode", { title: "データベース移行", body: "Japanese goal", project_id: pid }, {
		content: [{ type: "text", text: `Created ${gUni.id}: ${gUni.title} [${gUni.status}]` }]
	});

	// Long title
	const gLong = await core.createGoal({ title: "x".repeat(200), body: "Long" });
	saveFixture("goal_create", "009-long-title", { title: "x".repeat(200), body: "Long", project_id: pid }, {
		content: [{ type: "text", text: `Created ${gLong.id}: ${gLong.title} [${gLong.status}]` }]
	});

	// Empty body (default body)
	const gEmpty = await core.createGoal({ title: "No body" });
	saveFixture("goal_create", "010-default-body", { title: "No body", project_id: pid }, {
		content: [{ type: "text", text: `Created ${gEmpty.id}: ${gEmpty.title} [${gEmpty.status}]` }]
	});

	// Goal with all statuses
	const gIP = await core.createGoal({ title: "In progress goal", status: "in-progress" });
	saveFixture("goal_create", "011-in-progress", { title: "In progress goal", status: "in-progress", project_id: pid }, {
		content: [{ type: "text", text: `Created ${gIP.id}: ${gIP.title} [${gIP.status}]` }]
	});

	const gComp = await core.createGoal({ title: "Already complete", status: "complete" });
	saveFixture("goal_create", "012-complete", { title: "Already complete", status: "complete", project_id: pid }, {
		content: [{ type: "text", text: `Created ${gComp.id}: ${gComp.title} [${gComp.status}]` }]
	});

	// Goal with mutual deps + unlocks
	const gA = await core.createGoal({ title: "Alpha", unlocks: ["GOAL-002"] });
	const gB = await core.createGoal({ title: "Beta", depends_on: [gA.id], unlocks: [] });
	saveFixture("goal_create", "013-with-unlocks", { title: "Alpha", unlocks: ["GOAL-002"], project_id: pid }, {
		content: [{ type: "text", text: `Created ${gA.id}: ${gA.title} [${gA.status}]` }]
	});

	// Goal update: change title + body
	const gUpd = await core.updateGoal(gUni.id, { title: "Updated title", body: "Updated body" });
	saveFixture("goal_update", "003-update-title-body", { goal_id: gUni.id, title: "Updated title", body: "Updated body", project_id: pid }, {
		content: [{ type: "text", text: `Updated ${gUpd.id}: ${gUpd.title} → ${gUpd.status}` }]
	});

	// goal_unlockable on empty (no deps met)
	const noUnlock = await core.unlockableGoals();
	saveFixture("goal_unlockable", "003-none-ready", { project_id: pid }, {
		content: [{ type: "text", text: noUnlock.length ? noUnlock.map(g => `${g.id}: ${g.title}`).join("\n") : "No goals ready to unlock." }]
	});

	// ── Guardrail edge cases ─────────────────────────────────────────────

	// Unicode guardrail
	const guardUni = await core.createGuardrail({ title: "絶対に削除しない", body: "## Rule\n\nNo hard deletes." });
	saveFixture("guardrail_create", "004-unicode", { title: "絶対に削除しない", body: "## Rule\n\nNo hard deletes.", project_id: pid }, {
		content: [{ type: "text", text: `Created ${guardUni.id}: ${guardUni.title} [${guardUni.status}]` }]
	});

	// Guardrail with retired status from creation
	const guardRetired = await core.createGuardrail({ title: "Old rule", status: "retired" });
	saveFixture("guardrail_create", "005-retired", { title: "Old rule", status: "retired", project_id: pid }, {
		content: [{ type: "text", text: `Created ${guardRetired.id}: ${guardRetired.title} [${guardRetired.status}]` }]
	});

	// Guardrail update: change body
	const guardUpdBody = await core.updateGuardrail(guardUni.id, { body: "## Rule\n\nUpdated rule content." });
	saveFixture("guardrail_update", "003-update-body", { guardrail_id: guardUni.id, body: "## Rule\n\nUpdated rule content.", project_id: pid }, {
		content: [{ type: "text", text: `Updated ${guardUpdBody.id}: ${guardUpdBody.title} → ${guardUpdBody.status}` }]
	});

	// ── Decision edge cases ──────────────────────────────────────────────

	// Decision with all optional fields
	const adrFull = await core.createDecision({
		title: "Full ADR",
		status: "accepted",
		supersedes: "ADR-000",
		relates_to: ["GOAL-001", "GUARD-001"],
		source_research_id: "research-uuid-123",
		body: "## Context\n\nFull context.\n\n## Decision\n\nDo it.\n\n## Consequences\n\n### Positive\n\n- Good\n\n### Negative\n\n- Bad",
	});
	saveFixture("decision_create", "004-full", {
		title: "Full ADR", status: "accepted", supersedes: "ADR-000",
		relates_to: ["GOAL-001", "GUARD-001"], source_research_id: "research-uuid-123",
		body: "## Context\n\nFull context.\n\n## Decision\n\nDo it.\n\n## Consequences\n\n### Positive\n\n- Good\n\n### Negative\n\n- Bad",
		project_id: pid
	}, {
		content: [{ type: "text", text: `Created ${adrFull.id}: ${adrFull.title} [${adrFull.status}]` }]
	});

	// Decision rejected
	const adrReject = await core.createDecision({ title: "Bad idea", status: "rejected" });
	saveFixture("decision_create", "005-rejected", { title: "Bad idea", status: "rejected", project_id: pid }, {
		content: [{ type: "text", text: `Created ${adrReject.id}: ${adrReject.title} [${adrReject.status}]` }]
	});

	// Decision update: change to superseded
	const adrSup = await core.updateDecision(adrReject.id, { status: "superseded" });
	saveFixture("decision_update", "003-supersede", { decision_id: adrReject.id, status: "superseded", project_id: pid }, {
		content: [{ type: "text", text: `Updated ${adrSup.id}: ${adrSup.title} → ${adrSup.status}` }]
	});

	// ── SOP edge cases ───────────────────────────────────────────────────

	// SOP deprecated from creation
	const sopDep = await core.createSop({ title: "Old process", status: "deprecated", body: "Don't use this." });
	saveFixture("sop_create", "002-deprecated", { title: "Old process", status: "deprecated", body: "Don't use this.", project_id: pid }, {
		content: [{ type: "text", text: `Created ${sopDep.id}: ${sopDep.title} [${sopDep.status}]` }]
	});

	// SOP with ADR reference
	const sopAdr = await core.createSop({ title: "With ADR", adr: adrFull.id, body: "Linked to decision." });
	saveFixture("sop_create", "003-with-adr", { title: "With ADR", adr: adrFull.id, body: "Linked to decision.", project_id: pid }, {
		content: [{ type: "text", text: `Created ${sopAdr.id}: ${sopAdr.title} [${sopAdr.status}]` }]
	});

	// SOP update: activate
	const sopAct = await core.updateSop(sopDep.id, { status: "active" });
	saveFixture("sop_update", "003-activate", { sop_id: sopDep.id, status: "active", project_id: pid }, {
		content: [{ type: "text", text: `Updated ${sopAct.id}: ${sopAct.title} → ${sopAct.status}` }]
	});

	// ── Vision edge cases ────────────────────────────────────────────────

	// Set vision then overwrite
	await core.setVision("First Vision", "Original content");
	await core.setVision("Second Vision", "Overwritten content");
	const v = await core.getVision();
	saveFixture("vision_set", "002-overwrite", { title: "Second Vision", body: "Overwritten content", project_id: pid }, {
		content: [{ type: "text", text: "Vision updated: Second Vision" }]
	});
	saveFixture("vision_view", "003-after-overwrite", { project_id: pid }, {
		content: [{ type: "text", text: `# ${v!.title}\n\n${v!.body}` }]
	});

	// ── Empty project lists ──────────────────────────────────────────────
	const d2 = mkdtempSync(join(tmpdir(), "vl-empty2-"));
	const core2 = new VisionCore(d2);
	await core2.init("truly-empty");
	// Don't seed SOPs for this one — manually init without seeding
	// Actually core.init() seeds SOPs... so we get the 3 bundled ones
	// That's correct behavior — empty project still has 3 SOPs

	const sops2 = await core2.listSops();
	saveFixture("sop_list", "002-default-sops-only", { project_id: "empty" }, {
		content: [{ type: "text", text: sops2.map(s => `[${s.status}] **${s.id}**: ${s.title}`).join("\n") }]
	});

	// ── Status with mixed states ─────────────────────────────────────────
	const status = await core.status();
	const goalLine = Object.entries(status.goals.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
	const decisionLine = Object.entries(status.decisions.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
	saveFixture("visionlog_status", "003-mixed", { project_id: pid }, {
		content: [{ type: "text", text: [
			`Goals (${status.goals.total}): ${goalLine || "none"}`,
			`Decisions (${status.decisions.total}): ${decisionLine || "none"}`,
			`Guardrails: ${status.guardrails.active} active / ${status.guardrails.total} total`,
			`SOPs: ${status.sops.active} active / ${status.sops.total} total`,
			`Vision: ${status.has_vision ? "set" : "not set"}`,
		].join("\n") }]
	});

	// ── Re-init (should preserve UUID) ───────────────────────────────────
	const pidBefore = await core.getProjectId();
	await core.init("re-init-test");
	const pidAfter = await core.getProjectId();
	saveFixture("project_init", "002-re-init-preserves-id", { project_name: "re-init-test", path: d }, {
		content: [{ type: "text", text: pidBefore === pidAfter ? "Re-init preserved UUID" : `UUID changed: ${pidBefore} → ${pidAfter}` }]
	});

	// Count
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
