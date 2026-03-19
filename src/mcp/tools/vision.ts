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

			// 1. Guardrails
			const guards = (await core.listGuardrails()).filter((g) => g.status === "active");
			if (guards.length) {
				sections.push(
					"## Guardrails (MUST be respected at all times)\n" +
					guards.map((g) => `- **${g.id}**: ${g.title}`).join("\n"),
				);
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
