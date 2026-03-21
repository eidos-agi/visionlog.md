import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ProjectRegistry } from "../registry.ts";
import {
	BUNDLED_DEFAULTS,
	BUNDLED_SCHEMA_VERSION,
	DEFAULTS_REMOTE_URL,
	type DefaultSop,
	type DefaultsManifest,
} from "../../defaults/bundled.ts";

const projectIdParam = z
	.string()
	.optional()
	.describe(
		"UUID from .visionlog/config.yaml. Required only in multi-project sessions.",
	);

/** Fetch the remote defaults manifest. Returns null on network failure. */
async function fetchRemoteDefaults(): Promise<DefaultsManifest | null> {
	try {
		const res = await fetch(DEFAULTS_REMOTE_URL, {
			signal: AbortSignal.timeout(8000),
		});
		if (!res.ok) return null;
		return (await res.json()) as DefaultsManifest;
	} catch {
		return null;
	}
}

/** Compare two SOP bodies — returns true if meaningfully different (ignores trailing whitespace). */
function sopsDiffer(a: string, b: string): boolean {
	return a.trim() !== b.trim();
}

export function registerDefaultsTools(
	server: McpServer,
	registry: ProjectRegistry,
) {
	server.tool(
		"defaults_check",
		"Check for updated default SOPs from the upstream visionlog repository. Performs a three-way comparison: local (what this project has), bundled (what shipped with this package version), and remote (latest from upstream). Use defaults_apply to adopt changes after reviewing the diff.",
		{
			project_id: projectIdParam,
		},
		async ({ project_id }) => {
			const core = registry.resolve(project_id);
			const localSops = await core.listSops();

			// Fetch remote
			const remote = await fetchRemoteDefaults();

			const lines: string[] = [];

			// Schema version check
			if (remote === null) {
				lines.push(
					"⚠️  Remote fetch failed — showing bundled vs. local comparison only.",
				);
				lines.push(`   (Remote URL: ${DEFAULTS_REMOTE_URL})`);
				lines.push("");
			} else if (remote.schemaVersion > BUNDLED_SCHEMA_VERSION) {
				lines.push(
					`⚠️  Remote schemaVersion (${remote.schemaVersion}) is newer than this package supports (${BUNDLED_SCHEMA_VERSION}).`,
				);
				lines.push(
					"   Update the visionlog.md package to apply these defaults.",
				);
				lines.push("");
			}

			const remoteSops: DefaultSop[] = remote?.sops ?? BUNDLED_DEFAULTS.sops;
			const sourceLabel = remote ? "remote" : "bundled";

			lines.push(
				`## visionlog defaults — comparing local vs. ${sourceLabel}`,
			);
			lines.push("");

			let hasChanges = false;

			for (const upstream of remoteSops) {
				const local = localSops.find((s) => s.title === upstream.title);

				if (!local) {
					hasChanges = true;
					lines.push(`### ✨ NEW: "${upstream.title}" [${upstream.status}]`);
					lines.push(
						`This SOP exists upstream but has not been seeded locally.`,
					);
					lines.push(
						`Run defaults_apply with title "${upstream.title}" to add it.`,
					);
					lines.push("");
					continue;
				}

				const bundled = BUNDLED_DEFAULTS.sops.find(
					(s) => s.title === upstream.title,
				);

				const bodyChanged = sopsDiffer(upstream.body, local.body);
				const statusChanged = upstream.status !== local.status;

				if (bodyChanged || statusChanged) {
					hasChanges = true;
					lines.push(`### 🔄 UPDATED: "${local.id}: ${upstream.title}"`);

					if (statusChanged) {
						lines.push(
							`  Status: local=${local.status} → ${sourceLabel}=${upstream.status}`,
						);
					}

					if (bodyChanged) {
						// Show a coarse diff — list sections present in upstream but missing locally
						const upstreamSections = (upstream.body.match(/^## .+/gm) ?? []).map(
							(s) => s.trim(),
						);
						const localSections = (local.body.match(/^## .+/gm) ?? []).map((s) =>
							s.trim(),
						);
						const newSections = upstreamSections.filter(
							(s) => !localSections.includes(s),
						);
						const removedSections = localSections.filter(
							(s) => !upstreamSections.includes(s),
						);

						if (newSections.length > 0)
							lines.push(`  + New sections: ${newSections.join(", ")}`);
						if (removedSections.length > 0)
							lines.push(`  - Removed sections: ${removedSections.join(", ")}`);
						if (newSections.length === 0 && removedSections.length === 0)
							lines.push(`  Body content changed (same sections, different text)`);

						// Show if this was modified from bundled baseline (local customization)
						if (bundled && sopsDiffer(bundled.body, local.body)) {
							lines.push(
								`  ⚠️  Local body differs from bundled baseline — you may have customized this SOP.`,
							);
							lines.push(
								`  Applying upstream will overwrite your local changes.`,
							);
						}
					}

					lines.push(
						`  Run defaults_apply with title "${upstream.title}" to update.`,
					);
					lines.push("");
				}
			}

			if (!hasChanges) {
				lines.push(
					`✅ All default SOPs are up to date with ${sourceLabel}.`,
				);
			}

			lines.push("---");
			lines.push(
				`Package bundled version: schemaVersion=${BUNDLED_SCHEMA_VERSION}`,
			);
			if (remote) {
				lines.push(
					`Remote version: schemaVersion=${remote.schemaVersion} (${remote.sops.length} SOPs)`,
				);
			}
			lines.push(`Local SOPs: ${localSops.length} total`);

			return {
				content: [{ type: "text" as const, text: lines.join("\n") }],
			};
		},
	);

	server.tool(
		"defaults_apply",
		"Apply one or more upstream default SOPs to this project. For each title: creates the SOP if it doesn't exist locally, or updates the body/status if it has changed. This is a deliberate governance action — review defaults_check output before applying.",
		{
			titles: z
				.array(z.string())
				.describe(
					'SOP titles to apply (must match exactly). Use ["*"] to apply all upstream defaults.',
				),
			use_bundled: z
				.boolean()
				.optional()
				.describe(
					"Apply from bundled package defaults rather than fetching remote. Default: false (fetch remote).",
				),
			project_id: projectIdParam,
		},
		async ({ titles, use_bundled, project_id }) => {
			const core = registry.resolve(project_id);

			// Resolve source
			let source: DefaultsManifest;
			if (use_bundled) {
				source = BUNDLED_DEFAULTS;
			} else {
				const remote = await fetchRemoteDefaults();
				if (!remote) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Remote fetch failed. Pass use_bundled: true to apply from the package's bundled defaults instead.\n(URL: ${DEFAULTS_REMOTE_URL})`,
							},
						],
					};
				}
				if (remote.schemaVersion > BUNDLED_SCHEMA_VERSION) {
					return {
						content: [
							{
								type: "text" as const,
								text: `Remote schemaVersion (${remote.schemaVersion}) is newer than this package supports (${BUNDLED_SCHEMA_VERSION}).\nUpdate the visionlog.md package before applying these defaults.`,
							},
						],
					};
				}
				source = remote;
			}

			const applyAll = titles.length === 1 && titles[0] === "*";
			const toApply = applyAll
				? source.sops
				: source.sops.filter((s) => titles.includes(s.title));

			const missing = applyAll
				? []
				: titles.filter((t) => !source.sops.find((s) => s.title === t));
			if (missing.length > 0) {
				return {
					content: [
						{
							type: "text" as const,
							text: `Unknown SOP title(s): ${missing.join(", ")}\nAvailable: ${source.sops.map((s) => `"${s.title}"`).join(", ")}`,
						},
					],
				};
			}

			const localSops = await core.listSops();
			const results: string[] = [];

			for (const upstream of toApply) {
				const local = localSops.find((s) => s.title === upstream.title);

				if (!local) {
					const created = await core.createSop({
						title: upstream.title,
						status: upstream.status,
						body: upstream.body,
					});
					results.push(`✨ Created ${created.id}: "${created.title}"`);
				} else {
					const bodyChanged = sopsDiffer(upstream.body, local.body);
					const statusChanged = upstream.status !== local.status;

					if (bodyChanged || statusChanged) {
						await core.updateSop(local.id, {
							...(statusChanged ? { status: upstream.status } : {}),
							...(bodyChanged ? { body: upstream.body } : {}),
						});
						const changes: string[] = [];
						if (statusChanged)
							changes.push(`status: ${local.status} → ${upstream.status}`);
						if (bodyChanged) changes.push("body updated");
						results.push(
							`🔄 Updated ${local.id}: "${local.title}" (${changes.join(", ")})`,
						);
					} else {
						results.push(
							`✅ "${local.title}" — already up to date, no changes made`,
						);
					}
				}
			}

			return {
				content: [
					{
						type: "text" as const,
						text: results.join("\n"),
					},
				],
			};
		},
	);
}
