import { join } from "node:path";
import { VisionFS } from "../file-system/operations.ts";
import type {
	Decision,
	DecisionCreateInput,
	Goal,
	GoalCreateInput,
	Guardrail,
	GuardrailCreateInput,
	Sop,
	SopCreateInput,
	Standard,
	StandardCreateInput,
	Vision,
} from "../types/index.ts";

export class VisionCore {
	private readonly fs: VisionFS;

	constructor(projectRoot: string) {
		this.fs = new VisionFS(projectRoot);
	}

	// ─── Lifecycle ───────────────────────────────────────────────────────────

	async init(projectName: string, backlogPath?: string): Promise<void> {
		await this.fs.init(projectName, backlogPath);
	}

	async isInitialized(): Promise<boolean> {
		return this.fs.isInitialized();
	}

	// ─── Goals ───────────────────────────────────────────────────────────────

	async createGoal(input: GoalCreateInput): Promise<Goal> {
		const id = await this.fs.nextGoalId();
		const goal: Goal = {
			id,
			type: "goal",
			title: input.title,
			status: input.status ?? "locked",
			date: new Date().toISOString().slice(0, 10),
			depends_on: input.depends_on ?? [],
			unlocks: input.unlocks ?? [],
			backlog_tag: input.backlog_tag,
			body: input.body ?? `## What this achieves\n\n\n\n## Exit Criteria\n\n- [ ] \n\n## Notes\n\n`,
		};
		await this.fs.saveGoal(goal);
		return goal;
	}

	async listGoals(): Promise<Goal[]> {
		return this.fs.listGoals();
	}

	async getGoal(id: string): Promise<Goal | null> {
		return this.fs.findGoal(id);
	}

	async updateGoal(id: string, updates: Partial<Omit<Goal, "id" | "type">>): Promise<Goal> {
		const goal = await this.fs.findGoal(id);
		if (!goal) throw new Error(`Goal ${id} not found`);
		const updated: Goal = { ...goal, ...updates };
		await this.fs.saveGoal(updated);
		return updated;
	}

	/** Returns goals whose depends_on are all complete — these can become "available" */
	async unlockableGoals(): Promise<Goal[]> {
		const all = await this.listGoals();
		const complete = new Set(all.filter((g) => g.status === "complete").map((g) => g.id));
		return all.filter((g) => {
			if (g.status !== "locked") return false;
			return g.depends_on.every((dep) => complete.has(dep));
		});
	}

	// ─── Decisions ───────────────────────────────────────────────────────────

	async createDecision(input: DecisionCreateInput): Promise<Decision> {
		const id = await this.fs.nextDecisionId();
		const decision: Decision = {
			id,
			type: "decision",
			title: input.title,
			status: input.status ?? "proposed",
			date: new Date().toISOString().slice(0, 10),
			supersedes: input.supersedes,
			relates_to: input.relates_to ?? [],
			body:
				input.body ??
				`## Context\n\n\n\n## Decision\n\n\n\n## Consequences\n\n### Positive\n\n- \n\n### Negative\n\n- \n`,
		};
		await this.fs.saveDecision(decision);
		return decision;
	}

	async listDecisions(): Promise<Decision[]> {
		return this.fs.listDecisions();
	}

	async getDecision(id: string): Promise<Decision | null> {
		return this.fs.findDecision(id);
	}

	async updateDecision(id: string, updates: Partial<Omit<Decision, "id" | "type">>): Promise<Decision> {
		const decision = await this.fs.findDecision(id);
		if (!decision) throw new Error(`Decision ${id} not found`);
		const updated: Decision = { ...decision, ...updates };
		await this.fs.saveDecision(updated);
		return updated;
	}

	// ─── Guardrails ──────────────────────────────────────────────────────────

	async createGuardrail(input: GuardrailCreateInput): Promise<Guardrail> {
		const id = await this.fs.nextGuardrailId();
		const guardrail: Guardrail = {
			id,
			type: "guardrail",
			title: input.title,
			status: input.status ?? "active",
			date: new Date().toISOString().slice(0, 10),
			adr: input.adr,
			body: input.body ?? `## Rule\n\n\n\n## Why\n\n\n\n## Violation Examples\n\n- \n`,
		};
		await this.fs.saveGuardrail(guardrail);
		return guardrail;
	}

	async listGuardrails(): Promise<Guardrail[]> {
		return this.fs.listGuardrails();
	}

	async getGuardrail(id: string): Promise<Guardrail | null> {
		return this.fs.findGuardrail(id);
	}

	async updateGuardrail(id: string, updates: Partial<Omit<Guardrail, "id" | "type">>): Promise<Guardrail> {
		const g = await this.fs.findGuardrail(id);
		if (!g) throw new Error(`Guardrail ${id} not found`);
		const updated: Guardrail = { ...g, ...updates };
		await this.fs.saveGuardrail(updated);
		return updated;
	}

	// ─── SOPs ────────────────────────────────────────────────────────────────

	async createSop(input: SopCreateInput): Promise<Sop> {
		const id = await this.fs.nextSopId();
		const sop: Sop = {
			id,
			type: "sop",
			title: input.title,
			status: input.status ?? "draft",
			date: new Date().toISOString().slice(0, 10),
			adr: input.adr,
			body: input.body ?? `## When to use this\n\n\n\n## Steps\n\n1. \n\n## Guards\n\n- \n`,
		};
		await this.fs.saveSop(sop);
		return sop;
	}

	async listSops(): Promise<Sop[]> {
		return this.fs.listSops();
	}

	// ─── Standards ───────────────────────────────────────────────────────────

	async createStandard(input: StandardCreateInput): Promise<Standard> {
		const id = await this.fs.nextStandardId();
		const std: Standard = {
			id,
			type: "standard",
			title: input.title,
			status: input.status ?? "draft",
			date: new Date().toISOString().slice(0, 10),
			adr: input.adr,
			body: input.body ?? `## Rule\n\n\n\n## Rationale\n\n\n\n## Examples\n\n`,
		};
		await this.fs.saveStandard(std);
		return std;
	}

	async listStandards(): Promise<Standard[]> {
		return this.fs.listStandards();
	}

	// ─── Vision ──────────────────────────────────────────────────────────────

	async getVision(): Promise<Vision | null> {
		return this.fs.loadVision();
	}

	async setVision(title: string, body: string): Promise<Vision> {
		const vision: Vision = {
			title,
			type: "vision",
			date: new Date().toISOString().slice(0, 10),
			body,
		};
		await this.fs.saveVision(vision);
		return vision;
	}

	// ─── Status overview ─────────────────────────────────────────────────────

	async status(): Promise<{
		goals: { total: number; by_status: Record<string, number> };
		decisions: { total: number; by_status: Record<string, number> };
		guardrails: { total: number; active: number };
		sops: { total: number; active: number };
		has_vision: boolean;
	}> {
		const [goals, decisions, guardrails, sops, vision] = await Promise.all([
			this.listGoals(),
			this.listDecisions(),
			this.listGuardrails(),
			this.listSops(),
			this.getVision(),
		]);

		const countBy = <T extends { status: string }>(items: T[]) =>
			items.reduce(
				(acc, item) => {
					acc[item.status] = (acc[item.status] ?? 0) + 1;
					return acc;
				},
				{} as Record<string, number>,
			);

		return {
			goals: { total: goals.length, by_status: countBy(goals) },
			decisions: { total: decisions.length, by_status: countBy(decisions) },
			guardrails: { total: guardrails.length, active: guardrails.filter((g) => g.status === "active").length },
			sops: { total: sops.length, active: sops.filter((s) => s.status === "active").length },
			has_vision: vision !== null,
		};
	}
}

/** Resolve project root from a starting directory (walks up looking for visionlog/config.yaml) */
export async function findProjectRoot(startDir: string): Promise<string | null> {
	const { existsSync } = await import("node:fs");
	let dir = startDir;
	for (let i = 0; i < 10; i++) {
		if (existsSync(join(dir, "visionlog/config.yaml"))) return dir;
		const parent = join(dir, "..");
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}
