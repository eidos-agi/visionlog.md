import { z } from "zod";
import type { Decision } from "../../types/index.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectRegistry } from "../registry.ts";

const decisionStatusSchema = z.enum(["proposed", "accepted", "rejected", "superseded"]);
const projectIdParam = z.string().optional().describe("UUID from .visionlog/config.yaml. Required only in multi-project sessions. Call project_set to get a project's UUID.");

export function registerDecisionTools(server: McpServer, registry: ProjectRegistry) {
	server.tool(
		"decision_list",
		"List all architectural decisions (ADRs). Filter by status to see proposed, accepted, or superseded decisions.",
		{
			status: decisionStatusSchema.optional().describe("Filter by decision status"),
			project_id: projectIdParam,
		},
		async ({ status, project_id }) => {
			const core = registry.resolve(project_id);
			let decisions = await core.listDecisions();
			if (status) decisions = decisions.filter((d) => d.status === status);
			const lines = decisions.map((d) => {
				const sup = d.supersedes ? ` (supersedes ${d.supersedes})` : "";
				return `${d.id} [${d.status}] ${d.title}${sup}`;
			});
			return { content: [{ type: "text" as const, text: lines.join("\n") || "No decisions found." }] };
		},
	);

	server.tool(
		"decision_view",
		"View a single architectural decision in full.",
		{
			id: z.string().describe("Decision ID (e.g. ADR-001)"),
			project_id: projectIdParam,
		},
		async ({ id, project_id }) => {
			const core = registry.resolve(project_id);
			const d = await core.getDecision(id);
			if (!d) return { content: [{ type: "text" as const, text: `Decision ${id} not found.` }] };
			const text = [
				`# ${d.id}: ${d.title}`,
				`**Status**: ${d.status}  |  **Date**: ${d.date}`,
				d.supersedes ? `**Supersedes**: ${d.supersedes}` : null,
				d.relates_to?.length ? `**Relates to**: ${d.relates_to.join(", ")}` : null,
				"",
				d.body,
			]
				.filter((l) => l !== null)
				.join("\n");
			return { content: [{ type: "text" as const, text }] };
		},
	);

	server.tool(
		"decision_create",
		"Record a new architectural decision (ADR). Use status=proposed for decisions under consideration.",
		{
			title: z.string().describe("Short title"),
			status: decisionStatusSchema.optional().describe("Default: proposed"),
			supersedes: z.string().optional().describe("ADR ID this supersedes"),
			relates_to: z.array(z.string()).optional().describe("Related entity IDs"),
			body: z.string().optional().describe("Markdown body with ## Context, ## Decision, ## Consequences"),
			project_id: projectIdParam,
		},
		async ({ title, status, supersedes, relates_to, body, project_id }) => {
			const core = registry.resolve(project_id);
			const d = await core.createDecision({
				title,
				status: status as Decision["status"] | undefined,
				supersedes,
				relates_to,
				body,
			});
			return { content: [{ type: "text" as const, text: `Created ${d.id}: ${d.title} [${d.status}]` }] };
		},
	);

	server.tool(
		"decision_update",
		"Update a decision's status or body. Use to accept a proposed ADR or mark one as superseded.",
		{
			id: z.string().describe("Decision ID (e.g. ADR-001)"),
			status: decisionStatusSchema.optional(),
			title: z.string().optional(),
			supersedes: z.string().optional(),
			relates_to: z.array(z.string()).optional(),
			body: z.string().optional(),
			project_id: projectIdParam,
		},
		async ({ id, project_id, ...updates }) => {
			const core = registry.resolve(project_id);
			const d = await core.updateDecision(id, updates as Partial<Omit<Decision, "id" | "type">>);
			return { content: [{ type: "text" as const, text: `Updated ${d.id}: ${d.title} [${d.status}]` }] };
		},
	);
}
