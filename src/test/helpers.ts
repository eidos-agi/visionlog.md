import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VisionCore } from "../core/visionlog.ts";

export async function withCore(fn: (core: VisionCore, dir: string) => Promise<void>): Promise<void> {
	const dir = await mkdtemp(join(tmpdir(), "visionlog-test-"));
	const core = new VisionCore(dir);
	await core.init("test-project");
	try {
		await fn(core, dir);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}

export async function withDir(fn: (dir: string) => Promise<void>): Promise<void> {
	const dir = await mkdtemp(join(tmpdir(), "visionlog-test-"));
	try {
		await fn(dir);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
}
