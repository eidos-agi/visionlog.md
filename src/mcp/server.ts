import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { cwd, env } from "node:process";
import { VisionCore, findProjectRoot } from "../core/visionlog.ts";
import { ProjectRegistry } from "./registry.ts";
import { registerDecisionTools } from "./tools/decisions.ts";
import { registerDefaultsTools } from "./tools/defaults.ts";
import { registerGoalTools } from "./tools/goals.ts";
import { registerGuardrailTools } from "./tools/guardrails.ts";
import { registerSopTools } from "./tools/sops.ts";
import { registerVisionTools } from "./tools/vision.ts";

export async function startMcpServer() {
	// MCP_PROJECT_ROOT pins the server to a specific project directory,
	// preventing silent content routing to the wrong place when the MCP
	// server process starts from a different cwd than the project.
	const anchor = env.MCP_PROJECT_ROOT
		? env.MCP_PROJECT_ROOT
		: (await findProjectRoot(cwd())) ?? cwd();
	const defaultCore = new VisionCore(anchor);
	const registry = new ProjectRegistry(defaultCore);

	// Auto-register the cwd project so its UUID works as project_id immediately
	await registry.autoRegisterDefault();

	const server = new McpServer({
		name: "visionlog",
		version: "0.1.0",
		instructions: `visionlog is the static St. Peter for this project.

St. Peter (from Eidos philosophy) sits above all the pods — all the agents, all the sessions — and keeps them pointed at the long-term goal. In a live system, St. Peter is a coordinator. visionlog is St. Peter frozen in amber: the vision and contracts written down so that any stateless agent, in any session, can read them and know where the ladder points.

READ THIS AT THE START OF EVERY SESSION. Before touching any task, any code, any decision.

The vision is your long-term trajectory. The guardrails are drift corrections written in advance — St. Peter already telling you where not to go. The SOPs are coordination protocols. The ADRs are decisions that have been made and must not be relitigated without new evidence.

If your work would violate a guardrail, St. Peter has already told you no. Adjust before you start, not after you ship.

The trilogy:
- research.md (research-md): make decisions with evidence before they become contracts here
- visionlog: records vision, goals, guardrails, SOPs, ADRs — the contracts all execution must honor
- ike.md: executes work within the contracts defined here

This is the source of truth for what this project believes, where it is going, and what it has committed to. Guardrails are contracts — not preferences.`,
	});

	registerGoalTools(server, registry);
	registerDecisionTools(server, registry);
	registerGuardrailTools(server, registry);
	registerSopTools(server, registry);
	registerVisionTools(server, registry);
	registerDefaultsTools(server, registry);

	const transport = new StdioServerTransport();
	await server.connect(transport);
}
