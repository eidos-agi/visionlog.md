import { describe, expect, test } from "bun:test";
import { parseConfig } from "../markdown/parser.ts";
import { serializeConfig } from "../markdown/serializer.ts";
import type { VisionlogConfig } from "../types/index.ts";
import { withCore } from "./helpers.ts";

describe("parseConfig: date handling", () => {
	test("bare ISO date in YAML returns ISO string, not Date.toString()", () => {
		// js-yaml parses bare dates as Date objects; parseConfig must handle this
		const yaml = "project: \"my-project\"\ncreated: 2024-01-15\n";
		const config = parseConfig(yaml);
		expect(config.created).toBe("2024-01-15");
		expect(config.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	test("quoted ISO date also returns clean ISO string", () => {
		const yaml = `project: "my-project"\ncreated: "2024-01-15"\n`;
		const config = parseConfig(yaml);
		expect(config.created).toBe("2024-01-15");
	});

	test("missing created falls back to today (ISO format)", () => {
		const config = parseConfig('project: "my-project"\n');
		expect(config.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	test("full roundtrip: serialize → load → created stays ISO", async () => {
		await withCore(async (core, dir) => {
			const loaded = await (core as unknown as { fs: { loadConfig: () => Promise<unknown> } }).fs.loadConfig();
			const c = loaded as VisionlogConfig;
			expect(c.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		});
	});
});

describe("serializeConfig / parseConfig roundtrip", () => {
	test("project and backlog_path survive roundtrip", () => {
		const config: VisionlogConfig = {
			id: "11111111-1111-4111-8111-111111111111",
			project: "eidos-library",
			backlog_path: "../backlog",
			created: "2026-03-18",
		};
		const rt = parseConfig(serializeConfig(config));
		expect(rt.project).toBe("eidos-library");
		expect(rt.backlog_path).toBe("../backlog");
		expect(rt.created).toBe("2026-03-18");
	});

	test("absent backlog_path roundtrips as undefined", () => {
		const config: VisionlogConfig = { id: "22222222-2222-4222-8222-222222222222", project: "test", created: "2026-03-18" };
		const rt = parseConfig(serializeConfig(config));
		expect(rt.backlog_path).toBeUndefined();
	});

	test("id field survives roundtrip", () => {
		const uuid = "537b732e-58f1-416d-b51d-804cabf206a9";
		const config: VisionlogConfig = { id: uuid, project: "test", created: "2026-03-18" };
		const rt = parseConfig(serializeConfig(config));
		expect(rt.id).toBe(uuid);
	});

	test("missing id in YAML parses as empty string", () => {
		const config = parseConfig('project: "test"\ncreated: "2026-03-18"\n');
		expect(config.id).toBe("");
	});
});

describe("legacy config migration", () => {
	test("getProjectId() on config without id writes a UUID to disk", async () => {
		const { mkdtemp, mkdir, readFile, writeFile, rm } = await import("node:fs/promises");
		const { join } = await import("node:path");
		const { tmpdir } = await import("node:os");
		const { VisionCore } = await import("../core/visionlog.ts");

		const dir = await mkdtemp(join(tmpdir(), "visionlog-legacy-"));
		try {
			await mkdir(join(dir, ".visionlog"), { recursive: true });
			await writeFile(
				join(dir, ".visionlog", "config.yaml"),
				`project: "legacy-project"\ncreated: "2024-01-01"\n`,
			);
			const core = new VisionCore(dir);
			const id = await core.getProjectId();

			// Returns a valid v4 UUID
			expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

			// UUID is persisted on disk
			const onDisk = await readFile(join(dir, ".visionlog", "config.yaml"), "utf8");
			expect(onDisk).toContain(id);

			// Second read returns the same UUID (not a new one each time)
			const id2 = await core.getProjectId();
			expect(id2).toBe(id);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
