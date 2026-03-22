import type { Decision, Goal, Guardrail, Sop, Standard, Vision, VisionlogConfig } from "../types/index.ts";

function frontmatter(pairs: Record<string, unknown>): string {
	const lines: string[] = ["---"];
	for (const [key, val] of Object.entries(pairs)) {
		if (val === undefined || val === null) continue;
		if (Array.isArray(val)) {
			if (val.length === 0) {
				lines.push(`${key}: []`);
			} else {
				lines.push(`${key}: [${val.map((v) => JSON.stringify(v)).join(", ")}]`);
			}
		} else {
			lines.push(`${key}: ${JSON.stringify(val)}`);
		}
	}
	lines.push("---");
	return lines.join("\n");
}

export function serializeGoal(goal: Goal): string {
	const fm = frontmatter({
		id: goal.id,
		type: goal.type,
		title: goal.title,
		status: goal.status,
		date: goal.date,
		depends_on: goal.depends_on,
		unlocks: goal.unlocks,
		...(goal.backlog_tag ? { backlog_tag: goal.backlog_tag } : {}),
	});
	return `${fm}\n\n${goal.body}\n`;
}

export function serializeDecision(decision: Decision): string {
	const fm = frontmatter({
		id: decision.id,
		type: decision.type,
		title: decision.title,
		status: decision.status,
		date: decision.date,
		...(decision.supersedes ? { supersedes: decision.supersedes } : {}),
		...(decision.relates_to?.length ? { relates_to: decision.relates_to } : {}),
		...(decision.source_research_id ? { source_research_id: decision.source_research_id } : {}),
	});
	return `${fm}\n\n${decision.body}\n`;
}

export function serializeGuardrail(g: Guardrail): string {
	const fm = frontmatter({
		id: g.id,
		type: g.type,
		title: g.title,
		status: g.status,
		date: g.date,
		...(g.adr ? { adr: g.adr } : {}),
	});
	return `${fm}\n\n${g.body}\n`;
}

export function serializeSop(sop: Sop): string {
	const fm = frontmatter({
		id: sop.id,
		type: sop.type,
		title: sop.title,
		status: sop.status,
		date: sop.date,
		...(sop.adr ? { adr: sop.adr } : {}),
	});
	return `${fm}\n\n${sop.body}\n`;
}

export function serializeStandard(std: Standard): string {
	const fm = frontmatter({
		id: std.id,
		type: std.type,
		title: std.title,
		status: std.status,
		date: std.date,
		...(std.adr ? { adr: std.adr } : {}),
	});
	return `${fm}\n\n${std.body}\n`;
}

export function serializeVision(v: Vision): string {
	const fm = frontmatter({
		title: v.title,
		type: v.type,
		date: v.date,
	});
	return `${fm}\n\n${v.body}\n`;
}

export function serializeConfig(config: VisionlogConfig): string {
	const lines = [
		`id: ${JSON.stringify(config.id ?? "")}`,
		`project: ${JSON.stringify(config.project)}`,
		`created: ${JSON.stringify(config.created)}`,
	];
	if (config.backlog_path) lines.push(`backlog_path: ${JSON.stringify(config.backlog_path)}`);
	return lines.join("\n") + "\n";
}
