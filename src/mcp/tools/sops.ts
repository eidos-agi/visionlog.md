import { z } from "zod";
import type { Sop } from "../../types/index.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectRegistry } from "../registry.ts";

const sopStatusSchema = z.enum(["draft", "active", "deprecated"]);
const projectIdParam = z.string().optional().describe("UUID from .visionlog/config.yaml. Required only in multi-project sessions. Call project_set to get a project's UUID.");

export function registerSopTools(server: McpServer, registry: ProjectRegistry) {
	server.tool(
		"sop_list",
		"List all Standard Operating Procedures.",
		{
			status: sopStatusSchema.optional().describe("Filter by status"),
			project_id: projectIdParam,
		},
		async ({ status, project_id }) => {
			const core = registry.resolve(project_id);
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
		{
			id: z.string().describe("SOP ID (e.g. SOP-001)"),
			project_id: projectIdParam,
		},
		async ({ id, project_id }) => {
			const core = registry.resolve(project_id);
			const sop = await core.getSop(id);
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
			project_id: projectIdParam,
		},
		async ({ title, status, adr, body, project_id }) => {
			const core = registry.resolve(project_id);
			const sop = await core.createSop({
				title,
				status: status as Sop["status"] | undefined,
				adr,
				body,
			});
			return { content: [{ type: "text" as const, text: `Created ${sop.id}: ${sop.title} [${sop.status}]` }] };
		},
	);

	server.tool(
		"sop_update",
		"Update a SOP's status, body, or linked ADR.",
		{
			id: z.string().describe("SOP ID (e.g. SOP-001)"),
			status: sopStatusSchema.optional(),
			title: z.string().optional(),
			adr: z.string().optional(),
			body: z.string().optional(),
			project_id: projectIdParam,
		},
		async ({ id, project_id, ...updates }) => {
			const core = registry.resolve(project_id);
			const sop = await core.updateSop(id, updates as Partial<Omit<Sop, "id" | "type">>);
			return { content: [{ type: "text" as const, text: `Updated ${sop.id}: ${sop.title} [${sop.status}]` }] };
		},
	);
}
