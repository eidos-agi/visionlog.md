import { existsSync } from "node:fs";
import { join } from "node:path";
import { VisionCore, findProjectRoot } from "../core/visionlog.ts";
import { VISIONLOG_DIR } from "../constants/index.ts";

/**
 * In-process registry of UUID → VisionCore.
 * Each MCP server process maintains its own independent map.
 * No shared disk state. No singletons across windows.
 */
export class ProjectRegistry {
	private readonly map = new Map<string, VisionCore>();
	private readonly defaultCore: VisionCore;

	constructor(defaultCore: VisionCore) {
		this.defaultCore = defaultCore;
	}

	/**
	 * Register a project at the given path and return its UUID.
	 * Reads the UUID from visionlog/config.yaml — the agent must have called
	 * project_init on that path first.
	 */
	async register(path: string): Promise<{ id: string; path: string }> {
		const absPath = path.startsWith("/") ? path : join(process.cwd(), path);

		// Walk up to find visionlog root if path is a project subdir
		const root = (await findProjectRoot(absPath)) ?? absPath;

		if (!existsSync(join(root, ".visionlog/config.yaml"))) {
			throw new Error(
				`No .visionlog/config.yaml found at ${root}. ` +
				`Call project_init in that directory first.`
			);
		}

		const core = new VisionCore(root);
		const id = await core.getProjectId();

		if (!id) {
			throw new Error(
				`.visionlog/config.yaml at ${root} has no 'id' field. ` +
				`Re-run project_init to generate one.`
			);
		}

		// Remove any stale entry for this root (handles UUID rotation after re-init)
		for (const [existingId, existingCore] of this.map) {
			if (existingCore.root === root && existingId !== id) {
				this.map.delete(existingId);
				break;
			}
		}
		this.map.set(id, core);
		return { id, path: root };
	}

	/**
	 * Resolve a VisionCore by project_id.
	 * Falls back to the default (cwd/MCP_PROJECT_ROOT-anchored) core if project_id is absent —
	 * but only if that default points to an initialized visionlog. Otherwise throws loudly
	 * so agents discover the misconfiguration instead of silently writing to the wrong place.
	 * Throws an instructional error if project_id is provided but not registered.
	 */
	resolve(projectId?: string): VisionCore {
		if (!projectId) {
			const configPath = join(this.defaultCore.root, VISIONLOG_DIR, "config.yaml");
			if (!existsSync(configPath)) {
				throw new Error(
					`visionlog: no project registered for this session and no initialized visionlog found at ${this.defaultCore.root}.\n` +
					`Call project_set("<path>") to register a project, or set MCP_PROJECT_ROOT to point to an initialized project directory.`
				);
			}
			return this.defaultCore;
		}

		const core = this.map.get(projectId);
		if (!core) {
			throw new Error(
				`Unknown project_id '${projectId}'. ` +
				`This project hasn't been registered in this session. ` +
				`Call project_set with the project's path to register it.`
			);
		}
		return core;
	}

	/**
	 * Auto-register the default core so its UUID is in the map too.
	 */
	async autoRegisterDefault(): Promise<void> {
		try {
			const id = await this.defaultCore.getProjectId();
			if (id) {
				for (const [existingId, existingCore] of this.map) {
					if (existingCore.root === this.defaultCore.root && existingId !== id) {
						this.map.delete(existingId);
						break;
					}
				}
				this.map.set(id, this.defaultCore);
			}
		} catch {
			// Default project may not be initialized — that's fine
		}
	}

	listRegistered(): Array<{ id: string; path: string }> {
		return Array.from(this.map.entries()).map(([id, core]) => ({ id, path: core.root }));
	}
}
