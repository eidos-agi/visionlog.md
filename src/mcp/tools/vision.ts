import { existsSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { VisionCore } from "../../core/visionlog.ts";
import type { ProjectRegistry } from "../registry.ts";

const projectIdParam = z.string().optional().describe("UUID from .visionlog/config.yaml. Required only in multi-project sessions. Call project_set to get a project's UUID.");

export function registerVisionTools(server: McpServer, registry: ProjectRegistry) {
	server.tool(
		"project_set",
		"Register a project by its filesystem path and return its UUID. Call this once per project at the start of a multi-project session, then pass the returned project_id to all subsequent tool calls targeting that project. The project must have been initialized with project_init first.",
		{
			path: z.string().describe("Absolute or relative path to the project directory — or any subdirectory of it. The tool will walk up to find .visionlog/config.yaml automatically."),
		},
		async ({ path }) => {
			try {
				const { id, path: registeredPath } = await registry.register(path);
				return {
					content: [{
						type: "text" as const,
						text: `Registered project at ${registeredPath}\nproject_id: ${id}\n\nPass this project_id to all visionlog tool calls targeting this project.`,
					}],
				};
			} catch (err) {
				return {
					content: [{ type: "text" as const, text: `Error: ${(err as Error).message}` }],
					isError: true,
				};
			}
		},
	);

	server.tool(
		"vision_view",
		"View the project vision — the destination, north star, anti-goals, and success criteria.",
		{ project_id: projectIdParam },
		async ({ project_id }) => {
			const core = registry.resolve(project_id);
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
			project_id: projectIdParam,
		},
		async ({ title, body, project_id }) => {
			const core = registry.resolve(project_id);
			await core.setVision(title, body);
			return { content: [{ type: "text" as const, text: `Vision updated: ${title}` }] };
		},
	);

	server.tool(
		"visionlog_status",
		"Overview of all visionlog content: goals, decisions, guardrails, SOPs, vision.",
		{ project_id: projectIdParam },
		async ({ project_id }) => {
			const core = registry.resolve(project_id);
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
		"Lightweight session start. Returns guardrail names, goal statuses, SOP triggers, and tooling state — enough to orient without burning tokens. Call guardrail_view, goal_view, or visionlog_guide when you need full details.",
		{ project_id: projectIdParam },
		async ({ project_id }) => {
			const core = registry.resolve(project_id);
			const lines: string[] = [];

			// 1. Vision — title only
			const vision = await core.getVision();
			if (vision?.title) {
				lines.push(`**Vision:** ${vision.title}`);
			}

			// 2. Guardrails — titles only
			const guards = (await core.listGuardrails()).filter((g) => g.status === "active");
			if (guards.length) {
				lines.push("");
				lines.push(`**Guardrails (${guards.length})** — call guardrail_view before any action that might violate:`);
				for (const g of guards) {
					lines.push(`  - ${g.id}: ${g.title}`);
				}
			}

			// 3. Goals — status counts + active/available names
			const goals = await core.listGoals();
			if (goals.length) {
				const counts: Record<string, number> = {};
				for (const g of goals) counts[g.status] = (counts[g.status] || 0) + 1;
				const active = goals.filter((g) => g.status === "in-progress");
				const available = goals.filter((g) => g.status === "available");

				lines.push("");
				const statusParts = Object.entries(counts).map(([s, n]) => `${n} ${s}`);
				lines.push(`**Goals (${goals.length}):** ${statusParts.join(", ")}`);

				if (active.length) {
					lines.push(`  Active: ${active.map((g) => `${g.id}: ${g.title}`).join(", ")}`);
				}
				if (available.length) {
					lines.push(`  Ready: ${available.map((g) => `${g.id}: ${g.title}`).join(", ")}`);
				}
			} else {
				lines.push("");
				lines.push("**Goals:** none — create goals before working");
			}

			// 4. SOPs — titles + trigger condition (first "When" line from body)
			const sops = (await core.listSops()).filter((s) => s.status === "active");
			if (sops.length) {
				lines.push("");
				lines.push(`**SOPs (${sops.length}):**`);
				for (const s of sops) {
					const bodyLines = s.body?.split("\n") || [];
					const trigger = bodyLines.find((l) => l.trim().toLowerCase().startsWith("when "))?.trim();
					lines.push(`  - ${s.id}: ${s.title}${trigger ? ` — ${trigger}` : ""}`);
				}
			}

			// 5. ADR count
			const decisions = await core.listDecisions();
			const accepted = decisions.filter((d) => d.status === "accepted");
			if (accepted.length) {
				lines.push("");
				lines.push(`**ADRs:** ${accepted.length} accepted — call decision_list for details`);
			}

			// 6. Tooling state
			const backlogExists =
				existsSync(join(core.root, "backlog")) ||
				existsSync(join(core.root, ".backlog")) ||
				existsSync(join(core.root, "backlog.md"));
			const ikeExists = existsSync(join(core.root, ".ike"));
			const researchExists = existsSync(join(core.root, ".research")) ||
				existsSync(join(core.root, "research"));
			lines.push("");
			const tools: string[] = [];
			if (ikeExists) tools.push("ike.md ✓");
			if (backlogExists) tools.push("backlog.md ✓");
			if (researchExists) tools.push("research.md ✓");
			if (tools.length) {
				lines.push(`**Trilogy:** ${tools.join(" | ")}`);
			} else {
				lines.push("**Trilogy:** no task tracking initialized");
			}

			return { content: [{ type: "text" as const, text: lines.join("\n") }] };
		},
	);

	server.tool(
		"visionlog_guide",
		"Call this at the start of every session, alongside visionlog_boot. Returns the full strategic context: vision, key decisions, and goal map — the Who/What/When/Where/Why of this project. visionlog_boot gives you constraints and state. This gives you meaning and direction. Both are required to work effectively.",
		{ project_id: projectIdParam },
		async ({ project_id }) => {
			const core = registry.resolve(project_id);
			const sections: string[] = [];
			const missing: string[] = [];

			// Eidos philosophy — always present, regardless of project content
			sections.push(`## Eidos Principles (the foundation this tool is built on)

**The Kernel**: Guardrails are immutable conscience, not preferences. They are the project's alignment layer. Treat them as such.

**The Separation**: Governance is structure. Code is substance. They must not blur. visionlog holds structure only — never implementation details.

**PERCEIVE before ACT**: You are in the perception phase right now. visionlog_guide gives you meaning and direction. visionlog_boot gives you constraints and state. Both are required before any action.

**Vision is sticky, goals are dealt**: The vision is this project's identity — it does not drift. Goals are the current hand being played. If a goal seems to contradict the vision, surface the conflict. Do not silently update either.`);

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
		"project_init",
		"Initialize visionlog in a project directory. Pass 'path' to target a specific directory; omit to use the server's default (cwd at startup). After init, call project_set with the same path to register it for this session.",
		{
			project_name: z.string().describe("Project name"),
			path: z.string().optional().describe("Absolute path to the project directory to initialize. Defaults to the server's working directory."),
			backlog_path: z.string().optional().describe("Relative path to backlog directory"),
		},
		async ({ project_name, path: targetPath, backlog_path }) => {
			const absPath = targetPath
				? (targetPath.startsWith("/") ? targetPath : join(cwd(), targetPath))
				: null;
			const core = absPath ? new VisionCore(absPath) : registry.resolve();
			await core.init(project_name, backlog_path);
			const id = await core.getProjectId();
			if (absPath) {
				await registry.register(absPath);
			} else {
				await registry.autoRegisterDefault();
			}
			return {
				content: [{ type: "text" as const, text: `Initialized visionlog for "${project_name}" at ${core.root}\nproject_id: ${id}\n\nCall project_set with the same path to register it for this session.` }],
			};
		},
	);
}
