import { describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { VisionCore, findProjectRoot } from "../core/visionlog.ts";
import { withDir } from "./helpers.ts";

describe("findProjectRoot", () => {
	test("finds root when called from the project root itself", async () => {
		await withDir(async (dir) => {
			const core = new VisionCore(dir);
			await core.init("test");
			const found = await findProjectRoot(dir);
			expect(found).toBe(dir);
		});
	});

	test("finds root when called from a subdirectory", async () => {
		await withDir(async (dir) => {
			const core = new VisionCore(dir);
			await core.init("test");

			const subdir = join(dir, "src", "deep", "nested");
			await mkdir(subdir, { recursive: true });

			const found = await findProjectRoot(subdir);
			expect(found).toBe(dir);
		});
	});

	test("returns null when no visionlog/config.yaml exists in the tree", async () => {
		await withDir(async (dir) => {
			// No init — no config.yaml
			const found = await findProjectRoot(dir);
			expect(found).toBeNull();
		});
	});

	test("does not escape into unrelated parent directories", async () => {
		await withDir(async (dirA) => {
			await withDir(async (dirB) => {
				// Init a project in dirA
				const coreA = new VisionCore(dirA);
				await coreA.init("project-a");

				// dirB is completely separate — should not find dirA's config
				const found = await findProjectRoot(dirB);
				expect(found).toBeNull();
			});
		});
	});
});
