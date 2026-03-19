import { existsSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { VisionCore } from "../../core/visionlog.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerVisionTools(server: McpServer, core: VisionCore) {
	server.tool(
		"vision_view",
		"View the project vision — the destination, north star, anti-goals, and success criteria.",
		{},
		async () => {
			const vision = await core.getVision();
			if (!vision) return { content: [{ type: "text" as const, text: "No vision document found." }] };
			return { content: [{ type: "text" as const, text: `# ${vision.title}\n\n${vision.body}` }] };
		},
	);

	server.tool(
		"vision_set",
		"Set or update the project vision document.",
		{
			title: z.string().describe("Vision document title"),
			body: z.string().describe("Markdown body"),
		},
		async ({ title, body }) => {
			await core.setVision(title, body);
			return { content: [{ type: "text" as const, text: `Vision updated: ${title}` }] };
		},
	);

	server.tool(
		"visionlog_status",
		"Overview of all visionlog content: goals, decisions, guardrails, SOPs, vision.",
		{},
		async () => {
			const status = await core.status();
			const goalLine = Object.entries(status.goals.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
			const decisionLine = Object.entries(status.decisions.by_status).map(([s, n]) => `${s}:${n}`).join(" ");
			const lines = [
				`Goals (${status.goals.total}): ${goalLine || "none"}`,
				`Decisions (${status.decisions.total}): ${decisionLine || "none"}`,
				`Guardrails: ${status.guardrails.active} active / ${status.guardrails.total} total`,
				`SOPs: ${status.sops.active} active / ${status.sops.total} total`,
				`Vision: ${status.has_vision ? "set" : "not set"}`,
			];
			return { content: [{ type: "text" as const, text: lines.join("\n") }] };
		},
	);

	server.tool(
		"visionlog_boot",
		"Call this at the start of every session. Returns active guardrails, current goal state, and a situational report — including whether backlog.md is initialized. One call orients the agent completely.",
		{},
		async () => {
			const sections: string[] = [];

			// 1. Guardrails — full body so agent can reason, not just comply
			const guards = (await core.listGuardrails()).filter((g) => g.status === "active");
			if (guards.length) {
				const guardBlocks = guards.map((g) => {
					const body = g.body?.trim() ? `\n${g.body.trim()}` : "";
					return `### ${g.id}: ${g.title}${body}`;
				});
				sections.push("## Guardrails (MUST be respected at all times)\n\n" + guardBlocks.join("\n\n"));
			}

			// 2. Active goal
			const goals = await core.listGoals();
			const active = goals.filter((g) => g.status === "in-progress");
			const available = goals.filter((g) => g.status === "available");
			if (active.length) {
				const g = active[0];
				const body = g.body?.trim() ? `\n\n${g.body.trim()}` : "";
				sections.push(`## Active Goal\n**${g.id}**: ${g.title}${body}`);
			} else if (available.length) {
				sections.push(
					`## No Active Goal\nAvailable to start:\n` +
					available.map((g) => `- ${g.id}: ${g.title}`).join("\n") +
					`\n\nAsk the user which goal to advance before starting work.`,
				);
			} else {
				sections.push("## No Goals\nNo goals defined. Run `visionlog_init` or create goals before working.");
			}

			// 3. Backlog.md check
			const projectRoot = (core as any).fs?.root ?? "";
			const backlogExists =
				existsSync(join(projectRoot, "backlog")) ||
				existsSync(join(projectRoot, ".backlog")) ||
				existsSync(join(projectRoot, "backlog.md"));
			if (!backlogExists) {
				sections.push(
					"## ⚠ backlog.md NOT initialized\n" +
					"GUARD-003 requires all work to be tracked in a backlog.md task. " +
					"Run `backlog init` in this project before starting any work.",
				);
			} else {
				sections.push("## backlog.md ✓\nConfirm there is an active task before writing code. Create one with `task_create` if needed.");
			}

			return { content: [{ type: "text" as const, text: sections.join("\n\n") }] };
		},
	);

	server.tool(
		"visionlog_guide",
		"Call this at the start of every session, alongside visionlog_boot. Returns the full strategic context: vision, key decisions, and goal map — the Who/What/When/Where/Why of this project. visionlog_boot gives you constraints and state. This gives you meaning and direction. Both are required to work effectively.",
		{},
		async () => {
			const sections: string[] = [];
			const missing: string[] = [];

			// Why this exists
			const vision = await core.getVision();
			if (vision?.body?.trim()) {
				sections.push(`# ${vision.title}\n\n${vision.body.trim()}`);
			} else {
				missing.push("`vision_set` — define why this project exists, its destination, and anti-goals");
			}

			// How key decisions were made — only show decisions with real bodies
			const decisions = (await core.listDecisions()).filter((d) => d.status === "accepted");
			const decisionsWithBody = decisions.filter((d) => d.body?.trim() && !d.body.includes("## Context\n\n\n"));
			if (decisionsWithBody.length) {
				const decisionBlocks = decisionsWithBody.map((d) => `### ${d.id}: ${d.title}\n${d.body!.trim()}`);
				sections.push("## Key Decisions (the reasoning behind the architecture)\n\n" + decisionBlocks.join("\n\n"));
			} else if (decisions.length) {
				sections.push(`## Key Decisions\n${decisions.map((d) => `- **${d.id}**: ${d.title}`).join("\n")}\n\n_Bodies not yet written. Call \`decision_view <id>\` or \`decision_update\` to add context._`);
			} else {
				missing.push("`decision_create` — record the key architectural choices and why they were made");
			}

			// Where we are in the goal map
			const goals = await core.listGoals();
			if (goals.length) {
				const byStatus: Record<string, typeof goals> = {};
				for (const g of goals) (byStatus[g.status] ??= []).push(g);
				const order = ["in-progress", "available", "locked", "complete"];
				const goalLines = order.flatMap((s) =>
					(byStatus[s] ?? []).map((g) => {
						const deps = g.depends_on.length ? ` (needs: ${g.depends_on.join(", ")})` : "";
						return `- [${s}] **${g.id}**: ${g.title}${deps}`;
					}),
				);
				sections.push("## Goal Map\n\n" + goalLines.join("\n"));
			} else {
				missing.push("`goal_create` — define the goal DAG so agents know what 'done' looks like");
			}

			// Surface what needs to be defined
			if (missing.length) {
				sections.push("## ⚠ Governance gaps — fill these to give agents full context\n\n" + missing.map((m) => `- ${m}`).join("\n"));
			}

			return { content: [{ type: "text" as const, text: sections.join("\n\n---\n\n") }] };
		},
	);

	server.tool(
		"visionlog_init",
		"Initialize visionlog in the current project.",
		{
			project_name: z.string().describe("Project name"),
			backlog_path: z.string().optional().describe("Relative path to backlog directory"),
		},
		async ({ project_name, backlog_path }) => {
			await core.init(project_name, backlog_path);
			return {
				content: [{ type: "text" as const, text: `Initialized visionlog for "${project_name}"` }],
			};
		},
	);
}
