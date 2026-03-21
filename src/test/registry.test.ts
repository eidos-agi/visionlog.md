import { describe, expect, test } from "bun:test";
import { VisionCore } from "../core/visionlog.ts";
import { ProjectRegistry } from "../mcp/registry.ts";
import { withCore, withDir } from "./helpers.ts";

describe("UUID generation in init()", () => {
	test("new project gets a UUID", async () => {
		await withCore(async (core) => {
			const id = await core.getProjectId();
			expect(id).toBeTruthy();
			expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});
	});

	test("each project gets a unique UUID", async () => {
		await withCore(async (core1) => {
			await withCore(async (core2) => {
				const id1 = await core1.getProjectId();
				const id2 = await core2.getProjectId();
				expect(id1).not.toBe(id2);
			});
		});
	});

	test("UUID is preserved on re-init (not rotated)", async () => {
		await withCore(async (core) => {
			const originalId = await core.getProjectId();
			await core.init("renamed-project");
			const afterReinitId = await core.getProjectId();
			expect(afterReinitId).toBe(originalId);
		});
	});

	test("re-init updates project name but keeps UUID", async () => {
		await withCore(async (core, dir) => {
			const originalId = await core.getProjectId();
			await core.init("new-name");
			// Read config via a fresh core to ensure it roundtripped to disk
			const fresh = new VisionCore(dir);
			const freshId = await fresh.getProjectId();
			expect(freshId).toBe(originalId);
		});
	});
});

describe("config.yaml roundtrip includes id", () => {
	test("id field survives serialize → write → read roundtrip", async () => {
		await withCore(async (core, dir) => {
			const id = await core.getProjectId();
			// Read from a fresh core (re-parses from disk)
			const fresh = new VisionCore(dir);
			const freshId = await fresh.getProjectId();
			expect(freshId).toBe(id);
		});
	});
});

describe("ProjectRegistry.resolve()", () => {
	test("no project_id → returns default core", async () => {
		await withCore(async (core) => {
			const registry = new ProjectRegistry(core);
			const resolved = registry.resolve();
			expect(resolved).toBe(core);
		});
	});

	test("undefined project_id → returns default core", async () => {
		await withCore(async (core) => {
			const registry = new ProjectRegistry(core);
			expect(registry.resolve(undefined)).toBe(core);
		});
	});

	test("valid UUID → returns registered core", async () => {
		await withCore(async (core1) => {
			await withCore(async (core2) => {
				const id2 = await core2.getProjectId();
				const registry = new ProjectRegistry(core1);
				registry["map"].set(id2, core2);
				const resolved = registry.resolve(id2);
				expect(resolved).toBe(core2);
			});
		});
	});

	test("unknown UUID → throws instructional error", async () => {
		await withCore(async (core) => {
			const registry = new ProjectRegistry(core);
			const bogusId = "00000000-0000-4000-8000-000000000000";
			expect(() => registry.resolve(bogusId)).toThrow(/Unknown project_id/);
			expect(() => registry.resolve(bogusId)).toThrow(/project_set/);
		});
	});
});

describe("ProjectRegistry.register()", () => {
	test("registers an initialized project and returns its id", async () => {
		await withCore(async (core, dir) => {
			const expectedId = await core.getProjectId();
			const registry = new ProjectRegistry(core);
			const { id } = await registry.register(dir);
			expect(id).toBe(expectedId);
		});
	});

	test("registered project resolves correctly by UUID", async () => {
		await withCore(async (defaultCore) => {
			await withCore(async (targetCore, targetDir) => {
				const registry = new ProjectRegistry(defaultCore);
				const { id } = await registry.register(targetDir);
				const resolved = registry.resolve(id);
				expect(resolved.root).toBe(targetDir);
			});
		});
	});

	test("uninitialized path → throws error", async () => {
		await withCore(async (core) => {
			await withDir(async (emptyDir) => {
				const registry = new ProjectRegistry(core);
				await expect(registry.register(emptyDir)).rejects.toThrow(/No .visionlog\/config.yaml/);
			});
		});
	});

	test("legacy config without id gets auto-migrated on register", async () => {
		await withCore(async (core) => {
			await withDir(async (dir) => {
				// Manually create a config.yaml WITHOUT an id field
				const { mkdir, readFile, writeFile } = await import("node:fs/promises");
				const { join } = await import("node:path");
				await mkdir(join(dir, ".visionlog", "adr"), { recursive: true });
				await mkdir(join(dir, ".visionlog", "guardrails"), { recursive: true });
				await mkdir(join(dir, ".visionlog", "goals"), { recursive: true });
				await mkdir(join(dir, ".visionlog", "decisions"), { recursive: true });
				await mkdir(join(dir, ".visionlog", "sops"), { recursive: true });
				await writeFile(
					join(dir, ".visionlog", "config.yaml"),
					`project: "old-project-no-id"\ncreated: "2024-01-01"\n`,
				);
				const registry = new ProjectRegistry(core);
				const { id } = await registry.register(dir);
				// auto-migrated: returns a valid UUID
				expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
				// id is now persisted on disk
				const onDisk = await readFile(join(dir, ".visionlog", "config.yaml"), "utf8");
				expect(onDisk).toContain(id);
			});
		});
	});
});

describe("ProjectRegistry.register() — edge cases", () => {
	test("re-registration of same path silently overwrites; resolve still works", async () => {
		await withCore(async (core, dir) => {
			const registry = new ProjectRegistry(core);
			const { id: id1 } = await registry.register(dir);
			const { id: id2 } = await registry.register(dir);
			expect(id1).toBe(id2);
			const resolved = registry.resolve(id1);
			expect(resolved.root).toBe(dir);
		});
	});

	test("deleting config.yaml and re-initing generates a new UUID", async () => {
		await withCore(async (core, dir) => {
			const originalId = await core.getProjectId();
			const { unlink } = await import("node:fs/promises");
			const { join } = await import("node:path");
			await unlink(join(dir, ".visionlog", "config.yaml"));
			await core.init("test-project");
			const newId = await core.getProjectId();
			expect(newId).not.toBe(originalId);
		});
	});

	test("re-init after config deletion: stale UUID removed, new UUID resolves", async () => {
		await withCore(async (core, dir) => {
			const registry = new ProjectRegistry(core);
			const { id: id1 } = await registry.register(dir);

			// Simulate UUID rotation: delete config and re-init (generates new UUID)
			const { unlink } = await import("node:fs/promises");
			const { join } = await import("node:path");
			await unlink(join(dir, ".visionlog", "config.yaml"));
			await core.init("test-project");

			const { id: id2 } = await registry.register(dir);
			expect(id2).not.toBe(id1);

			// New UUID resolves correctly
			expect(registry.resolve(id2).root).toBe(dir);
			// Old UUID is gone
			expect(() => registry.resolve(id1)).toThrow(/Unknown project_id/);
		});
	});

	test("visionlog_init response includes a v4 UUID-shaped project_id", async () => {
		await withCore(async (core) => {
			const id = await core.getProjectId();
			expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});
	});
});

describe("ProjectRegistry.autoRegisterDefault()", () => {
	test("default core's UUID resolves after autoRegisterDefault", async () => {
		await withCore(async (core) => {
			const registry = new ProjectRegistry(core);
			await registry.autoRegisterDefault();
			const id = await core.getProjectId();
			const resolved = registry.resolve(id);
			expect(resolved).toBe(core);
		});
	});

	test("autoRegisterDefault on uninitialized core does not throw", async () => {
		await withDir(async (dir) => {
			const core = new VisionCore(dir);
			const registry = new ProjectRegistry(core);
			await expect(registry.autoRegisterDefault()).resolves.toBeUndefined();
		});
	});
});

describe("ProjectRegistry.listRegistered()", () => {
	test("lists registered projects with id and path", async () => {
		await withCore(async (core, dir) => {
			const registry = new ProjectRegistry(core);
			await registry.autoRegisterDefault();
			const list = registry.listRegistered();
			expect(list.length).toBeGreaterThanOrEqual(1);
			const entry = list.find((e) => e.path === dir);
			expect(entry).toBeDefined();
			expect(entry!.id).toMatch(/^[0-9a-f-]{36}$/i);
		});
	});
});
