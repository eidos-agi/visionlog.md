import { z } from "zod";
import type { VisionCore } from "../../core/visionlog.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const sopStatusSchema = z.enum(["draft", "active", "deprecated"]);

export function registerSopTools(server: McpServer, core: VisionCore) {
	server.tool(
		"sop_list",
		"List all Standard Operating Procedures.",
		{ status: sopStatusSchema.optional().describe("Filter by status") },
		async ({ status }) => {
			let sops = await core.listSops();
			if (status) sops = sops.filter((s) => s.status === status);
			const lines = sops.map((s) => {
				const adr = s.adr ? ` [${s.adr}]` : "";
				return `${s.id}${adr} [${s.status}] ${s.title}`;
			});
			return { content: [{ type: "text" as const, text: lines.join("\n") || "No SOPs found." }] };
		},
	);

	server.tool(
		"sop_view",
		"View a Standard Operating Procedure in full.",
		{ id: z.string().describe("SOP ID (e.g. SOP-001)") },
		async ({ id }) => {
			const sops = await core.listSops();
			const sop = sops.find((s) => s.id === id.toUpperCase());
			if (!sop) return { content: [{ type: "text" as const, text: `SOP ${id} not found.` }] };
			const text = [
				`# ${sop.id}: ${sop.title}`,
				`**Status**: ${sop.status}  |  **Date**: ${sop.date}`,
				sop.adr ? `**ADR**: ${sop.adr}` : null,
				"",
				sop.body,
			]
				.filter((l) => l !== null)
				.join("\n");
			return { content: [{ type: "text" as const, text }] };
		},
	);

	server.tool(
		"sop_create",
		"Create a new Standard Operating Procedure.",
		{
			title: z.string().describe("Short title"),
			status: sopStatusSchema.optional().describe("Default: draft"),
			adr: z.string().optional().describe("ADR-xxx this SOP implements"),
			body: z.string().optional().describe("Markdown body with ## When to use this, ## Steps, ## Guards"),
		},
		async ({ title, status, adr, body }) => {
			const sop = await core.createSop({
				title,
				status: status as "draft" | "active" | "deprecated" | undefined,
				adr,
				body,
			});
			return { content: [{ type: "text" as const, text: `Created ${sop.id}: ${sop.title} [${sop.status}]` }] };
		},
	);
}
