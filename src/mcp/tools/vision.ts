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
