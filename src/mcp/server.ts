import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { cwd } from "node:process";
import { VisionCore, findProjectRoot } from "../core/visionlog.ts";
import { registerDecisionTools } from "./tools/decisions.ts";
import { registerGoalTools } from "./tools/goals.ts";
import { registerGuardrailTools } from "./tools/guardrails.ts";
import { registerSopTools } from "./tools/sops.ts";
import { registerVisionTools } from "./tools/vision.ts";

export async function startMcpServer() {
	const projectRoot = (await findProjectRoot(cwd())) ?? cwd();
	const core = new VisionCore(projectRoot);

	const server = new McpServer({
		name: "visionlog",
		version: "0.1.0",
	});

	registerGoalTools(server, core);
	registerDecisionTools(server, core);
	registerGuardrailTools(server, core);
	registerSopTools(server, core);
	registerVisionTools(server, core);

	const transport = new StdioServerTransport();
	await server.connect(transport);
}
