import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { DIRECTORIES, FILES, ID_PREFIXES } from "../constants/index.ts";
import {
	parseConfig,
	parseDecision,
	parseGoal,
	parseGuardrail,
	parseSop,
	parseStandard,
	parseVision,
} from "../markdown/parser.ts";
import {
	serializeConfig,
	serializeDecision,
	serializeGoal,
	serializeGuardrail,
	serializeSop,
	serializeStandard,
	serializeVision,
} from "../markdown/serializer.ts";
import type { Decision, Goal, Guardrail, Sop, Standard, Vision, VisionlogConfig } from "../types/index.ts";

export class VisionFS {
	constructor(private readonly root: string) {}

	// ─── Config ──────────────────────────────────────────────────────────────

	async isInitialized(): Promise<boolean> {
		try {
			const file = Bun.file(join(this.root, FILES.CONFIG));
			return file.exists();
		} catch {
			return false;
		}
	}

	async loadConfig(): Promise<VisionlogConfig> {
		const path = join(this.root, FILES.CONFIG);
		const content = await readFile(path, "utf8");
		return parseConfig(content);
	}

	async saveConfig(config: VisionlogConfig): Promise<void> {
		await writeFile(join(this.root, FILES.CONFIG), serializeConfig(config), "utf8");
	}

	// ─── Init ────────────────────────────────────────────────────────────────

	async init(projectName: string, backlogPath?: string): Promise<void> {
		for (const dir of Object.values(DIRECTORIES)) {
			await mkdir(join(this.root, dir), { recursive: true });
		}
		// Preserve existing UUID if already initialized — re-init must not rotate the ID
		let existingId = "";
		try {
			const existing = await this.loadConfig();
			if (existing.id) existingId = existing.id;
		} catch {}
		const config: VisionlogConfig = {
			id: existingId || crypto.randomUUID(),
			project: projectName,
			backlog_path: backlogPath,
			created: new Date().toISOString().slice(0, 10),
		};
		await this.saveConfig(config);
	}

	async getProjectId(): Promise<string> {
		const config = await this.loadConfig();
		if (config.id) return config.id;
		// Migrate legacy config: write id on first read
		const id = crypto.randomUUID();
		await this.saveConfig({ ...config, id });
		return id;
	}

	// ─── ID generation ───────────────────────────────────────────────────────

	private async nextId(dir: string, prefix: string): Promise<string> {
		const fullDir = join(this.root, dir);
		let files: string[] = [];
		try {
			files = await readdir(fullDir);
		} catch {
			files = [];
		}
		const nums = files
			.map((f) => {
				const m = f.match(new RegExp(`^${prefix}-(\\d+)`, "i"));
				return m ? parseInt(m[1], 10) : 0;
			})
			.filter((n) => n > 0);
		const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
		return `${prefix}-${String(next).padStart(3, "0")}`;
	}

	async nextGoalId(): Promise<string> {
		return this.nextId(DIRECTORIES.GOALS, ID_PREFIXES.goal);
	}

	async nextDecisionId(): Promise<string> {
		return this.nextId(DIRECTORIES.DECISIONS, ID_PREFIXES.decision);
	}

	async nextGuardrailId(): Promise<string> {
		return this.nextId(DIRECTORIES.GUARDRAILS, ID_PREFIXES.guardrail);
	}

	async nextSopId(): Promise<string> {
		return this.nextId(DIRECTORIES.SOPS, ID_PREFIXES.sop);
	}

	async nextStandardId(): Promise<string> {
		return this.nextId(DIRECTORIES.STANDARDS, ID_PREFIXES.standard);
	}

	// ─── Goals ───────────────────────────────────────────────────────────────

	private goalFilename(goal: Goal): string {
		const slug = goal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
		return `${goal.id}-${slug}.md`;
	}

	async saveGoal(goal: Goal): Promise<string> {
		const filename = goal.filePath
			? basename(goal.filePath)
			: this.goalFilename(goal);
		const path = join(this.root, DIRECTORIES.GOALS, filename);
		await writeFile(path, serializeGoal(goal), "utf8");
		return path;
	}

	async loadGoal(filename: string): Promise<Goal> {
		const path = join(this.root, DIRECTORIES.GOALS, filename);
		const content = await readFile(path, "utf8");
		return parseGoal(content, path);
	}

	async listGoals(): Promise<Goal[]> {
		const dir = join(this.root, DIRECTORIES.GOALS);
		let files: string[] = [];
		try {
			files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
		} catch {
			return [];
		}
		return Promise.all(files.map((f) => this.loadGoal(f)));
	}

	async findGoal(id: string): Promise<Goal | null> {
		const goals = await this.listGoals();
		return goals.find((g) => g.id === id.toUpperCase()) ?? null;
	}

	// ─── Decisions ───────────────────────────────────────────────────────────

	private decisionFilename(d: Decision): string {
		const slug = d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
		return `${d.id}-${slug}.md`;
	}

	async saveDecision(decision: Decision): Promise<string> {
		const filename = decision.filePath
			? basename(decision.filePath)
			: this.decisionFilename(decision);
		const path = join(this.root, DIRECTORIES.DECISIONS, filename);
		await writeFile(path, serializeDecision(decision), "utf8");
		return path;
	}

	async loadDecision(filename: string): Promise<Decision> {
		const path = join(this.root, DIRECTORIES.DECISIONS, filename);
		const content = await readFile(path, "utf8");
		return parseDecision(content, path);
	}

	async listDecisions(): Promise<Decision[]> {
		const dir = join(this.root, DIRECTORIES.DECISIONS);
		let files: string[] = [];
		try {
			files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
		} catch {
			return [];
		}
		return Promise.all(files.map((f) => this.loadDecision(f)));
	}

	async findDecision(id: string): Promise<Decision | null> {
		const decisions = await this.listDecisions();
		return decisions.find((d) => d.id === id.toUpperCase()) ?? null;
	}

	// ─── Guardrails ──────────────────────────────────────────────────────────

	private guardrailFilename(g: Guardrail): string {
		const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
		return `${g.id}-${slug}.md`;
	}

	async saveGuardrail(guardrail: Guardrail): Promise<string> {
		const filename = guardrail.filePath
			? basename(guardrail.filePath)
			: this.guardrailFilename(guardrail);
		const path = join(this.root, DIRECTORIES.GUARDRAILS, filename);
		await writeFile(path, serializeGuardrail(guardrail), "utf8");
		return path;
	}

	async loadGuardrail(filename: string): Promise<Guardrail> {
		const path = join(this.root, DIRECTORIES.GUARDRAILS, filename);
		const content = await readFile(path, "utf8");
		return parseGuardrail(content, path);
	}

	async listGuardrails(): Promise<Guardrail[]> {
		const dir = join(this.root, DIRECTORIES.GUARDRAILS);
		let files: string[] = [];
		try {
			files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
		} catch {
			return [];
		}
		return Promise.all(files.map((f) => this.loadGuardrail(f)));
	}

	async findGuardrail(id: string): Promise<Guardrail | null> {
		const list = await this.listGuardrails();
		return list.find((g) => g.id === id.toUpperCase()) ?? null;
	}

	// ─── SOPs ────────────────────────────────────────────────────────────────

	private sopFilename(sop: Sop): string {
		const slug = sop.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
		return `${sop.id}-${slug}.md`;
	}

	async saveSop(sop: Sop): Promise<string> {
		const filename = sop.filePath
			? basename(sop.filePath)
			: this.sopFilename(sop);
		const path = join(this.root, DIRECTORIES.SOPS, filename);
		await writeFile(path, serializeSop(sop), "utf8");
		return path;
	}

	async loadSop(filename: string): Promise<Sop> {
		const path = join(this.root, DIRECTORIES.SOPS, filename);
		const content = await readFile(path, "utf8");
		return parseSop(content, path);
	}

	async listSops(): Promise<Sop[]> {
		const dir = join(this.root, DIRECTORIES.SOPS);
		let files: string[] = [];
		try {
			files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
		} catch {
			return [];
		}
		return Promise.all(files.map((f) => this.loadSop(f)));
	}

	async findSop(id: string): Promise<Sop | null> {
		const list = await this.listSops();
		return list.find((s) => s.id === id.toUpperCase()) ?? null;
	}

	// ─── Standards ───────────────────────────────────────────────────────────

	async saveStandard(std: Standard): Promise<string> {
		const slug = std.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
		const filename = std.filePath
			? basename(std.filePath)
			: `${std.id}-${slug}.md`;
		const path = join(this.root, DIRECTORIES.STANDARDS, filename);
		await writeFile(path, serializeStandard(std), "utf8");
		return path;
	}

	async loadStandard(filename: string): Promise<Standard> {
		const path = join(this.root, DIRECTORIES.STANDARDS, filename);
		const content = await readFile(path, "utf8");
		return parseStandard(content, path);
	}

	async listStandards(): Promise<Standard[]> {
		const dir = join(this.root, DIRECTORIES.STANDARDS);
		let files: string[] = [];
		try {
			files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
		} catch {
			return [];
		}
		return Promise.all(files.map((f) => this.loadStandard(f)));
	}

	// ─── Vision ──────────────────────────────────────────────────────────────

	async loadVision(): Promise<Vision | null> {
		try {
			const path = join(this.root, FILES.VISION);
			const content = await readFile(path, "utf8");
			return parseVision(content, path);
		} catch {
			return null;
		}
	}

	async saveVision(vision: Vision): Promise<void> {
		await writeFile(join(this.root, FILES.VISION), serializeVision(vision), "utf8");
	}
}
