import { z } from "zod";
import type { VisionCore } from "../../core/visionlog.ts";
import type { Guardrail } from "../../types/index.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerGuardrailTools(server: McpServer, core: VisionCore) {
	server.tool(
		"guardrail_list",
		"List all active guardrails — constraints the system must never violate.",
		{ include_retired: z.boolean().optional().describe("Include retired guardrails (default: false)") },
		async ({ include_retired }) => {
			let guards = await core.listGuardrails();
			if (!include_retired) guards = guards.filter((g) => g.status === "active");
			const lines = guards.map((g) => {
				const adr = g.adr ? ` [${g.adr}]` : "";
				return `${g.id}${adr} ${g.title}`;
			});
			return { content: [{ type: "text" as const, text: lines.join("\n") || "No guardrails found." }] };
		},
	);

	server.tool(
		"guardrail_view",
		"View a guardrail in full, including the rule, rationale, and violation examples.",
		{ id: z.string().describe("Guardrail ID (e.g. GUARD-001)") },
		async ({ id }) => {
			const g = await core.getGuardrail(id);
			if (!g) return { content: [{ type: "text" as const, text: `Guardrail ${id} not found.` }] };
			const text = [
				`# ${g.id}: ${g.title}`,
				`**Status**: ${g.status}  |  **Date**: ${g.date}`,
				g.adr ? `**ADR**: ${g.adr}` : null,
				"",
				g.body,
			]
				.filter((l) => l !== null)
				.join("\n");
			return { content: [{ type: "text" as const, text }] };
		},
	);

	server.tool(
		"guardrail_create",
		"Create a new guardrail — a constraint the system must never violate.",
		{
			title: z.string().describe("Short title"),
			status: z.enum(["active", "retired"]).optional().describe("Default: active"),
			adr: z.string().optional().describe("ADR-xxx that established this guardrail"),
			body: z.string().optional().describe("Markdown body with ## Rule, ## Why, ## Violation Examples"),
		},
		async ({ title, status, adr, body }) => {
			const g = await core.createGuardrail({
				title,
				status: status as Guardrail["status"] | undefined,
				adr,
				body,
			});
			return { content: [{ type: "text" as const, text: `Created ${g.id}: ${g.title} [${g.status}]` }] };
		},
	);

	server.tool(
		"guardrail_update",
		"Update a guardrail. Use status=retired to retire a guardrail that no longer applies.",
		{
			id: z.string().describe("Guardrail ID (e.g. GUARD-001)"),
			status: z.enum(["active", "retired"]).optional(),
			title: z.string().optional(),
			adr: z.string().optional(),
			body: z.string().optional(),
		},
		async ({ id, ...updates }) => {
			const g = await core.updateGuardrail(id, updates as Partial<Omit<Guardrail, "id" | "type">>);
			return { content: [{ type: "text" as const, text: `Updated ${g.id}: ${g.title} [${g.status}]` }] };
		},
	);

	server.tool(
		"guardrail_inject",
		"Return all active guardrails formatted for injection into an AI system prompt.",
		{},
		async () => {
			const guards = (await core.listGuardrails()).filter((g) => g.status === "active");
			if (!guards.length) return { content: [{ type: "text" as const, text: "No active guardrails." }] };
			const lines = [
				"## Active Guardrails",
				"The following constraints MUST be respected at all times:",
				"",
				...guards.map((g) => `- **${g.id}**: ${g.title}`),
			];
			return { content: [{ type: "text" as const, text: lines.join("\n") }] };
		},
	);
}
