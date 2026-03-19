import { describe, expect, test } from "bun:test";
import { withCore } from "./helpers.ts";

describe("updateGoal: no clobber", () => {
	test("updating status does not touch title, depends_on, body", async () => {
		await withCore(async (core) => {
			const goal = await core.createGoal({
				title: "My Goal",
				depends_on: ["GOAL-000"],
				body: "## Notes\n\nKeep this.",
			});

			const updated = await core.updateGoal(goal.id, { status: "available" });

			expect(updated.title).toBe("My Goal");
			expect(updated.depends_on).toEqual(["GOAL-000"]);
			expect(updated.body).toContain("Keep this.");
			expect(updated.status).toBe("available");
		});
	});

	test("updating depends_on does not touch title or status", async () => {
		await withCore(async (core) => {
			const goal = await core.createGoal({ title: "G", status: "locked" });
			const updated = await core.updateGoal(goal.id, { depends_on: ["GOAL-999"] });

			expect(updated.title).toBe("G");
			expect(updated.status).toBe("locked");
			expect(updated.depends_on).toEqual(["GOAL-999"]);
		});
	});

	test("clearing depends_on to [] works", async () => {
		await withCore(async (core) => {
			const goal = await core.createGoal({ title: "G", depends_on: ["GOAL-001"] });
			expect(goal.depends_on).toEqual(["GOAL-001"]);

			const updated = await core.updateGoal(goal.id, { depends_on: [] });
			expect(updated.depends_on).toEqual([]);

			// Persisted: reload from disk
			const reloaded = await core.getGoal(goal.id);
			expect(reloaded?.depends_on).toEqual([]);
		});
	});

	test("clearing backlog_tag via empty string results in undefined on reload", async () => {
		await withCore(async (core) => {
			const goal = await core.createGoal({ title: "G", backlog_tag: "v1.0" });
			await core.updateGoal(goal.id, { backlog_tag: "" });

			const reloaded = await core.getGoal(goal.id);
			// serializer omits falsy backlog_tag; parser returns undefined for missing
			expect(reloaded?.backlog_tag).toBeUndefined();
		});
	});
});

describe("updateDecision: no clobber", () => {
	test("accepting a decision does not change title or body", async () => {
		await withCore(async (core) => {
			const d = await core.createDecision({
				title: "Use Bun",
				body: "## Context\n\nFast runtime.",
			});

			const updated = await core.updateDecision(d.id, { status: "accepted" });
			expect(updated.title).toBe("Use Bun");
			expect(updated.body).toContain("Fast runtime.");
		});
	});

	test("supersedes can be set after the fact", async () => {
		await withCore(async (core) => {
			const d = await core.createDecision({ title: "New approach" });
			const updated = await core.updateDecision(d.id, { supersedes: "ADR-000" });
			expect(updated.supersedes).toBe("ADR-000");

			const reloaded = await core.getDecision(d.id);
			expect(reloaded?.supersedes).toBe("ADR-000");
		});
	});
});

describe("updateGuardrail: no clobber", () => {
	test("retiring a guardrail does not change title or body", async () => {
		await withCore(async (core) => {
			const g = await core.createGuardrail({
				title: "No hardcoding",
				body: "## Rule\n\nDon't hardcode.",
			});

			const updated = await core.updateGuardrail(g.id, { status: "retired" });
			expect(updated.title).toBe("No hardcoding");
			expect(updated.body).toContain("Don't hardcode.");
			expect(updated.status).toBe("retired");
		});
	});
});

describe("persist: changes survive reload", () => {
	test("updateGoal writes to disk and is readable on next getGoal", async () => {
		await withCore(async (core) => {
			const goal = await core.createGoal({ title: "Persisted" });
			await core.updateGoal(goal.id, { status: "complete", title: "Persisted Updated" });

			const reloaded = await core.getGoal(goal.id);
			expect(reloaded?.status).toBe("complete");
			expect(reloaded?.title).toBe("Persisted Updated");
		});
	});
});
