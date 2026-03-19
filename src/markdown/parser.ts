import matter from "gray-matter";
import type { Decision, Goal, Guardrail, Sop, Standard, Vision, VisionlogConfig } from "../types/index.ts";

function parseDate(raw: unknown): string {
	if (!raw) return new Date().toISOString().slice(0, 10);
	if (raw instanceof Date) return raw.toISOString().slice(0, 10);
	return String(raw);
}

function parseStringArray(raw: unknown): string[] {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw.map(String);
	if (typeof raw === "string") return raw.split(",").map((s) => s.trim()).filter(Boolean);
	return [];
}

export function parseGoal(content: string, filePath?: string): Goal {
	const { data, content: body } = matter(content);
	return {
		id: String(data.id ?? ""),
		type: "goal",
		title: String(data.title ?? ""),
		status: (data.status as Goal["status"]) ?? "locked",
		date: parseDate(data.date),
		depends_on: parseStringArray(data.depends_on),
		unlocks: parseStringArray(data.unlocks),
		backlog_tag: data.backlog_tag ? String(data.backlog_tag) : undefined,
		body: body.trim(),
		filePath,
	};
}

export function parseDecision(content: string, filePath?: string): Decision {
	const { data, content: body } = matter(content);
	return {
		id: String(data.id ?? ""),
		type: "decision",
		title: String(data.title ?? ""),
		status: (data.status as Decision["status"]) ?? "proposed",
		date: parseDate(data.date),
		supersedes: data.supersedes ? String(data.supersedes) : undefined,
		relates_to: parseStringArray(data.relates_to),
		body: body.trim(),
		filePath,
	};
}

export function parseGuardrail(content: string, filePath?: string): Guardrail {
	const { data, content: body } = matter(content);
	return {
		id: String(data.id ?? ""),
		type: "guardrail",
		title: String(data.title ?? ""),
		status: (data.status as Guardrail["status"]) ?? "active",
		date: parseDate(data.date),
		adr: data.adr ? String(data.adr) : undefined,
		body: body.trim(),
		filePath,
	};
}

export function parseSop(content: string, filePath?: string): Sop {
	const { data, content: body } = matter(content);
	return {
		id: String(data.id ?? ""),
		type: "sop",
		title: String(data.title ?? ""),
		status: (data.status as Sop["status"]) ?? "draft",
		date: parseDate(data.date),
		adr: data.adr ? String(data.adr) : undefined,
		body: body.trim(),
		filePath,
	};
}

export function parseStandard(content: string, filePath?: string): Standard {
	const { data, content: body } = matter(content);
	return {
		id: String(data.id ?? ""),
		type: "standard",
		title: String(data.title ?? ""),
		status: (data.status as Standard["status"]) ?? "draft",
		date: parseDate(data.date),
		adr: data.adr ? String(data.adr) : undefined,
		body: body.trim(),
		filePath,
	};
}

export function parseVision(content: string, filePath?: string): Vision {
	const { data, content: body } = matter(content);
	return {
		title: String(data.title ?? "Project Vision"),
		type: "vision",
		date: parseDate(data.date),
		body: body.trim(),
		filePath,
	};
}

export function parseConfig(yamlContent: string): VisionlogConfig {
	// Wrap in frontmatter delimiters only if not already present
	const normalised = yamlContent.trimStart().startsWith("---")
		? yamlContent
		: `---\n${yamlContent}\n---`;
	const { data } = matter(normalised);
	return {
		project: String(data.project ?? ""),
		backlog_path: data.backlog_path ? String(data.backlog_path) : undefined,
		created: parseDate(data.created),
	};
}
