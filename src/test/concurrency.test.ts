import { describe, expect, test } from "bun:test";
import { withCore } from "./helpers.ts";

describe("concurrent creates: no duplicate IDs", () => {
	test("10 parallel goal_create calls produce 10 unique IDs", async () => {
		await withCore(async (core) => {
			const results = await Promise.all(
				Array.from({ length: 10 }, (_, i) =>
					core.createGoal({ title: `Goal ${i + 1}` }),
				),
			);

			const ids = results.map((g) => g.id);
			const unique = new Set(ids);
			expect(unique.size).toBe(10);
		});
	});

	test("10 parallel decision_create calls produce 10 unique IDs", async () => {
		await withCore(async (core) => {
			const results = await Promise.all(
				Array.from({ length: 10 }, (_, i) =>
					core.createDecision({ title: `Decision ${i + 1}` }),
				),
			);

			const ids = results.map((d) => d.id);
			const unique = new Set(ids);
			expect(unique.size).toBe(10);
		});
	});

	test("IDs are sequential after concurrent creates", async () => {
		await withCore(async (core) => {
			const results = await Promise.all(
				Array.from({ length: 5 }, (_, i) =>
					core.createGoal({ title: `Goal ${i + 1}` }),
				),
			);

			const nums = results
				.map((g) => parseInt(g.id.split("-")[1], 10))
				.sort((a, b) => a - b);
			expect(nums).toEqual([1, 2, 3, 4, 5]);
		});
	});

	test("concurrent creates across entity types do not interfere", async () => {
		await withCore(async (core) => {
			const [goals, decisions, guardrails] = await Promise.all([
				Promise.all([
					core.createGoal({ title: "G1" }),
					core.createGoal({ title: "G2" }),
					core.createGoal({ title: "G3" }),
				]),
				Promise.all([
					core.createDecision({ title: "D1" }),
					core.createDecision({ title: "D2" }),
				]),
				Promise.all([
					core.createGuardrail({ title: "GR1" }),
					core.createGuardrail({ title: "GR2" }),
				]),
			]);

			expect(new Set(goals.map((g) => g.id)).size).toBe(3);
			expect(new Set(decisions.map((d) => d.id)).size).toBe(2);
			expect(new Set(guardrails.map((g) => g.id)).size).toBe(2);
		});
	});
});
