import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DIRECTORIES } from "../constants/index.ts";
import { VisionFS } from "../file-system/operations.ts";
import { withDir } from "./helpers.ts";

describe("nextId", () => {
	test("empty directory starts at 001", async () => {
		await withDir(async (dir) => {
			await mkdir(join(dir, DIRECTORIES.GOALS), { recursive: true });
			const fs = new VisionFS(dir);
			expect(await fs.nextGoalId()).toBe("GOAL-001");
		});
	});

	test("takes max + 1, not first gap", async () => {
		await withDir(async (dir) => {
			const goalsDir = join(dir, DIRECTORIES.GOALS);
			await mkdir(goalsDir, { recursive: true });
			// GOAL-001 and GOAL-003 exist — gap at 002
			await writeFile(join(goalsDir, "GOAL-001-foo.md"), "");
			await writeFile(join(goalsDir, "GOAL-003-bar.md"), "");
			const fs = new VisionFS(dir);
			expect(await fs.nextGoalId()).toBe("GOAL-004");
		});
	});

	test("case-insensitive: lowercase files are counted", async () => {
		await withDir(async (dir) => {
			const goalsDir = join(dir, DIRECTORIES.GOALS);
			await mkdir(goalsDir, { recursive: true });
			await writeFile(join(goalsDir, "goal-001-foo.md"), "");
			await writeFile(join(goalsDir, "goal-002-bar.md"), "");
			const fs = new VisionFS(dir);
			// Must not re-issue GOAL-001 or GOAL-002
			expect(await fs.nextGoalId()).toBe("GOAL-003");
		});
	});

	test("non-matching files in directory are ignored", async () => {
		await withDir(async (dir) => {
			const goalsDir = join(dir, DIRECTORIES.GOALS);
			await mkdir(goalsDir, { recursive: true });
			await writeFile(join(goalsDir, "README.md"), "");
			await writeFile(join(goalsDir, ".DS_Store"), "");
			await writeFile(join(goalsDir, "GOAL-002-real.md"), "");
			const fs = new VisionFS(dir);
			expect(await fs.nextGoalId()).toBe("GOAL-003");
		});
	});

	test("each entity type uses its own sequence", async () => {
		await withDir(async (dir) => {
			await mkdir(join(dir, DIRECTORIES.GOALS), { recursive: true });
			await mkdir(join(dir, DIRECTORIES.DECISIONS), { recursive: true });
			await writeFile(join(dir, DIRECTORIES.GOALS, "GOAL-005-foo.md"), "");
			const fs = new VisionFS(dir);
			expect(await fs.nextGoalId()).toBe("GOAL-006");
			expect(await fs.nextDecisionId()).toBe("ADR-001"); // separate sequence
		});
	});
});
