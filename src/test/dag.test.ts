import { describe, expect, test } from "bun:test";
import { withCore } from "./helpers.ts";

describe("unlockableGoals", () => {
	test("locked goal with no dependencies is NOT returned", async () => {
		await withCore(async (core) => {
			await core.createGoal({ title: "Standalone", status: "locked" });
			const unlockable = await core.unlockableGoals();
			expect(unlockable).toHaveLength(0);
		});
	});

	test("locked goal whose single dep is complete IS returned", async () => {
		await withCore(async (core) => {
			const g1 = await core.createGoal({ title: "Done", status: "locked" });
			await core.updateGoal(g1.id, { status: "complete" });

			const g2 = await core.createGoal({
				title: "Waiting",
				status: "locked",
				depends_on: [g1.id],
			});

			const unlockable = await core.unlockableGoals();
			expect(unlockable.map((g) => g.id)).toContain(g2.id);
		});
	});

	test("locked goal with partially complete deps is NOT returned", async () => {
		await withCore(async (core) => {
			const g1 = await core.createGoal({ title: "Done", status: "locked" });
			await core.updateGoal(g1.id, { status: "complete" });

			const g2 = await core.createGoal({ title: "Not done", status: "in-progress" });

			const g3 = await core.createGoal({
				title: "Blocked",
				status: "locked",
				depends_on: [g1.id, g2.id],
			});

			const unlockable = await core.unlockableGoals();
			expect(unlockable.map((g) => g.id)).not.toContain(g3.id);
		});
	});

	test("available/in-progress/complete goals are never returned", async () => {
		await withCore(async (core) => {
			const g1 = await core.createGoal({ title: "Avail", status: "available" });
			const g2 = await core.createGoal({ title: "WIP", status: "in-progress" });
			const g3 = await core.createGoal({ title: "Done", status: "complete" });

			const unlockable = await core.unlockableGoals();
			const ids = unlockable.map((g) => g.id);
			expect(ids).not.toContain(g1.id);
			expect(ids).not.toContain(g2.id);
			expect(ids).not.toContain(g3.id);
		});
	});

	test("all deps complete → returned; then marking one dep incomplete removes it", async () => {
		await withCore(async (core) => {
			const g1 = await core.createGoal({ title: "A", status: "locked" });
			const g2 = await core.createGoal({ title: "B", status: "locked" });
			await core.updateGoal(g1.id, { status: "complete" });
			await core.updateGoal(g2.id, { status: "complete" });

			const g3 = await core.createGoal({
				title: "C",
				status: "locked",
				depends_on: [g1.id, g2.id],
			});

			expect((await core.unlockableGoals()).map((g) => g.id)).toContain(g3.id);

			// Revert g2 back to in-progress
			await core.updateGoal(g2.id, { status: "in-progress" });
			expect((await core.unlockableGoals()).map((g) => g.id)).not.toContain(g3.id);
		});
	});
});
