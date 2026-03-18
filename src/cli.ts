#!/usr/bin/env bun
import { Command } from "commander";
import { cwd } from "node:process";
import { VisionCore, findProjectRoot } from "./core/visionlog.ts";

const program = new Command();

program
	.name("visionlog")
	.description("Vision, goals, ADRs, guardrails, SOPs — the governance layer for AI-assisted projects")
	.version("0.1.0");

// ─── Helper: resolve core ─────────────────────────────────────────────────────

async function getCore(): Promise<VisionCore> {
	const root = (await findProjectRoot(cwd())) ?? cwd();
	return new VisionCore(root);
}

// ─── init ─────────────────────────────────────────────────────────────────────

program
	.command("init <project-name>")
	.description("Initialize visionlog in the current project")
	.option("--backlog-path <path>", "Relative path to backlog/ directory")
	.action(async (projectName: string, opts: { backlogPath?: string }) => {
		const core = new VisionCore(cwd());
		await core.init(projectName, opts.backlogPath);
		console.log(`Initialized visionlog for "${projectName}"`);
	});

// ─── status ──────────────────────────────────────────────────────────────────

program
	.command("status")
	.description("Show overview of goals, decisions, guardrails, and SOPs")
	.action(async () => {
		const core = await getCore();
		const s = await core.status();
		const goalLine = Object.entries(s.goals.by_status)
			.map(([st, n]) => `${st}:${n}`)
			.join(" ");
		console.log(`Goals (${s.goals.total}): ${goalLine || "none"}`);
		console.log(
			`Decisions (${s.decisions.total}): ${Object.entries(s.decisions.by_status)
				.map(([st, n]) => `${st}:${n}`)
				.join(" ") || "none"}`,
		);
		console.log(`Guardrails: ${s.guardrails.active} active / ${s.guardrails.total} total`);
		console.log(`SOPs: ${s.sops.active} active / ${s.sops.total} total`);
		console.log(`Vision: ${s.has_vision ? "set" : "not set"}`);
	});

// ─── goal ────────────────────────────────────────────────────────────────────

const goalCmd = program.command("goal").description("Manage goals");

goalCmd
	.command("list")
	.description("List all goals")
	.option("--status <status>", "Filter by status")
	.action(async (opts: { status?: string }) => {
		const core = await getCore();
		let goals = await core.listGoals();
		if (opts.status) goals = goals.filter((g) => g.status === opts.status);
		for (const g of goals) {
			const deps = g.depends_on.length ? ` (needs: ${g.depends_on.join(", ")})` : "";
			console.log(`${g.id} [${g.status}] ${g.title}${deps}`);
		}
	});

goalCmd
	.command("create <title>")
	.description("Create a new goal")
	.option("--status <status>", "Initial status (default: locked)")
	.option("--depends-on <ids>", "Comma-separated dependency IDs")
	.option("--unlocks <ids>", "Comma-separated IDs this unlocks")
	.option("--backlog-tag <tag>", "backlog.md milestone or label")
	.action(async (title: string, opts: { status?: string; dependsOn?: string; unlocks?: string; backlogTag?: string }) => {
		const core = await getCore();
		const goal = await core.createGoal({
			title,
			status: opts.status as "locked" | "available" | "in-progress" | "complete" | undefined,
			depends_on: opts.dependsOn?.split(",").map((s) => s.trim()),
			unlocks: opts.unlocks?.split(",").map((s) => s.trim()),
			backlog_tag: opts.backlogTag,
		});
		console.log(`Created ${goal.id}: ${goal.title} [${goal.status}]`);
	});

goalCmd
	.command("update <id>")
	.description("Update a goal's status")
	.option("--status <status>", "New status")
	.action(async (id: string, opts: { status?: string }) => {
		const core = await getCore();
		const goal = await core.updateGoal(id, {
			status: opts.status as "locked" | "available" | "in-progress" | "complete" | undefined,
		});
		console.log(`Updated ${goal.id}: ${goal.title} [${goal.status}]`);
	});

goalCmd
	.command("unlockable")
	.description("List goals whose dependencies are all complete")
	.action(async () => {
		const core = await getCore();
		const goals = await core.unlockableGoals();
		if (!goals.length) {
			console.log("No goals ready to unlock.");
			return;
		}
		console.log("Ready to unlock:");
		for (const g of goals) console.log(`  ${g.id} ${g.title}`);
	});

// ─── decision ─────────────────────────────────────────────────────────────────

const decisionCmd = program.command("decision").alias("adr").description("Manage architectural decisions");

decisionCmd
	.command("list")
	.description("List all decisions")
	.option("--status <status>", "Filter by status")
	.action(async (opts: { status?: string }) => {
		const core = await getCore();
		let decisions = await core.listDecisions();
		if (opts.status) decisions = decisions.filter((d) => d.status === opts.status);
		for (const d of decisions) {
			const sup = d.supersedes ? ` (supersedes ${d.supersedes})` : "";
			console.log(`${d.id} [${d.status}] ${d.title}${sup}`);
		}
	});

decisionCmd
	.command("create <title>")
	.description("Record a new architectural decision")
	.option("--status <status>", "Initial status (default: proposed)")
	.option("--supersedes <id>", "ADR this supersedes")
	.action(async (title: string, opts: { status?: string; supersedes?: string }) => {
		const core = await getCore();
		const d = await core.createDecision({
			title,
			status: opts.status as "proposed" | "accepted" | "rejected" | "superseded" | undefined,
			supersedes: opts.supersedes,
		});
		console.log(`Created ${d.id}: ${d.title} [${d.status}]`);
		console.log(`Edit: ${d.filePath}`);
	});

decisionCmd
	.command("accept <id>")
	.description("Mark a decision as accepted")
	.action(async (id: string) => {
		const core = await getCore();
		const d = await core.updateDecision(id, { status: "accepted" });
		console.log(`Accepted ${d.id}: ${d.title}`);
	});

// ─── guardrail ───────────────────────────────────────────────────────────────

const guardrailCmd = program.command("guardrail").description("Manage guardrails");

guardrailCmd
	.command("list")
	.description("List active guardrails")
	.action(async () => {
		const core = await getCore();
		const guards = (await core.listGuardrails()).filter((g) => g.status === "active");
		for (const g of guards) {
			const adr = g.adr ? ` [${g.adr}]` : "";
			console.log(`${g.id}${adr} ${g.title}`);
		}
	});

guardrailCmd
	.command("create <title>")
	.description("Create a new guardrail")
	.option("--adr <id>", "ADR that established this guardrail")
	.action(async (title: string, opts: { adr?: string }) => {
		const core = await getCore();
		const g = await core.createGuardrail({ title, adr: opts.adr });
		console.log(`Created ${g.id}: ${g.title}`);
	});

// ─── sop ─────────────────────────────────────────────────────────────────────

const sopCmd = program.command("sop").description("Manage Standard Operating Procedures");

sopCmd
	.command("list")
	.description("List SOPs")
	.action(async () => {
		const core = await getCore();
		const sops = await core.listSops();
		for (const s of sops) console.log(`${s.id} [${s.status}] ${s.title}`);
	});

sopCmd
	.command("create <title>")
	.description("Create a new SOP")
	.option("--adr <id>", "ADR this SOP implements")
	.action(async (title: string, opts: { adr?: string }) => {
		const core = await getCore();
		const sop = await core.createSop({ title, adr: opts.adr });
		console.log(`Created ${sop.id}: ${sop.title}`);
	});

// ─── vision ──────────────────────────────────────────────────────────────────

const visionCmd = program.command("vision").description("Manage the project vision document");

visionCmd
	.command("view")
	.description("View the project vision")
	.action(async () => {
		const core = await getCore();
		const v = await core.getVision();
		if (!v) {
			console.log("No vision document found.");
			return;
		}
		console.log(`# ${v.title}\n\n${v.body}`);
	});

// ─── mcp ─────────────────────────────────────────────────────────────────────

const mcpCmd = program.command("mcp").description("MCP server commands");

mcpCmd
	.command("start")
	.description("Start the MCP server (stdio transport)")
	.action(async () => {
		const { startMcpServer } = await import("./mcp/server.ts");
		await startMcpServer();
	});

program.parse();
