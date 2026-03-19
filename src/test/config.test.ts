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
		const config: VisionlogConfig = { project: "test", created: "2026-03-18" };
		const rt = parseConfig(serializeConfig(config));
		expect(rt.backlog_path).toBeUndefined();
	});
});
