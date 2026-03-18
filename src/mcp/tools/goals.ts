import { z } from "zod";
import type { VisionCore } from "../../core/visionlog.ts";
import type { Goal } from "../../types/index.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const goalStatusSchema = z.enum(["locked", "available", "in-progress", "complete"]);

export function registerGoalTools(server: McpServer, core: VisionCore) {
	server.tool(
		"goal_list",
		"List all goals in the vision DAG. Optionally filter by status.",
		{
			status: goalStatusSchema.optional().describe("Filter by lifecycle status"),
		},
		async ({ status }) => {
			let goals = await core.listGoals();
			if (status) goals = goals.filter((g) => g.status === status);
			const lines = goals.map((g) => {
				const deps = g.depends_on.length ? ` (needs: ${g.depends_on.join(", ")})` : "";
				return `${g.id} [${g.status}] ${g.title}${deps}`;
			});
			return { content: [{ type: "text" as const, text: lines.join("\n") || "No goals found." }] };
		},
	);

	server.tool(
		"goal_view",
		"View a single goal in full, including exit criteria and dependencies.",
		{ id: z.string().describe("Goal ID (e.g. GOAL-001)") },
		async ({ id }) => {
			const goal = await core.getGoal(id);
			if (!goal) return { content: [{ type: "text" as const, text: `Goal ${id} not found.` }] };
			const text = [
				`# ${goal.id}: ${goal.title}`,
				`**Status**: ${goal.status}  |  **Date**: ${goal.date}`,
				`**Depends on**: ${goal.depends_on.join(", ") || "none"}`,
				`**Unlocks**: ${goal.unlocks.join(", ") || "none"}`,
				goal.backlog_tag ? `**Backlog tag**: ${goal.backlog_tag}` : null,
				"",
				goal.body,
			]
				.filter((l) => l !== null)
				.join("\n");
			return { content: [{ type: "text" as const, text }] };
		},
	);

	server.tool(
		"goal_create",
		"Create a new goal in the vision DAG.",
		{
			title: z.string().describe("Short descriptive title"),
			status: goalStatusSchema.optional().describe("Default: locked"),
			depends_on: z.array(z.string()).optional().describe('Goal IDs this depends on'),
			unlocks: z.array(z.string()).optional().describe("Goal IDs this unlocks when complete"),
			backlog_tag: z.string().optional().describe("backlog.md milestone or label to link"),
			body: z.string().optional().describe("Markdown body"),
		},
		async ({ title, status, depends_on, unlocks, backlog_tag, body }) => {
			const goal = await core.createGoal({
				title,
				status: status as Goal["status"] | undefined,
				depends_on,
				unlocks,
				backlog_tag,
				body,
			});
			return { content: [{ type: "text" as const, text: `Created ${goal.id}: ${goal.title} [${goal.status}]` }] };
		},
	);

	server.tool(
		"goal_update",
		"Update a goal's status, body, or dependencies.",
		{
			id: z.string().describe("Goal ID (e.g. GOAL-001)"),
			status: goalStatusSchema.optional(),
			title: z.string().optional(),
			depends_on: z.array(z.string()).optional(),
			unlocks: z.array(z.string()).optional(),
			backlog_tag: z.string().optional(),
			body: z.string().optional(),
		},
		async ({ id, ...updates }) => {
			const goal = await core.updateGoal(id, updates as Partial<Goal>);
			return { content: [{ type: "text" as const, text: `Updated ${goal.id}: ${goal.title} [${goal.status}]` }] };
		},
	);

	server.tool(
		"goal_unlockable",
		"List goals that are currently locked but whose dependencies are all complete.",
		{},
		async () => {
			const goals = await core.unlockableGoals();
			if (!goals.length) return { content: [{ type: "text" as const, text: "No goals ready to unlock." }] };
			const text = goals.map((g) => `${g.id} ${g.title}`).join("\n");
			return { content: [{ type: "text" as const, text: `Ready to unlock:\n${text}` }] };
		},
	);
}
