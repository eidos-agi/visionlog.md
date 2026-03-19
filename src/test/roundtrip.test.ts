import { describe, expect, test } from "bun:test";
import { parseDecision, parseGoal, parseGuardrail, parseSop, parseStandard, parseVision } from "../markdown/parser.ts";
import {
	serializeDecision,
	serializeGoal,
	serializeGuardrail,
	serializeSop,
	serializeStandard,
	serializeVision,
} from "../markdown/serializer.ts";
import type { Decision, Goal, Guardrail, Sop, Standard, Vision } from "../types/index.ts";

describe("roundtrip: Goal", () => {
	const base: Goal = {
		id: "GOAL-001",
		type: "goal",
		title: "Core Retrieval",
		status: "in-progress",
		date: "2026-03-18",
		depends_on: [],
		unlocks: ["GOAL-002"],
		body: "## What this achieves\n\nSomething useful.",
	};

	test("basic fields survive serialize → parse", () => {
		const rt = parseGoal(serializeGoal(base));
		expect(rt.id).toBe("GOAL-001");
		expect(rt.title).toBe("Core Retrieval");
		expect(rt.status).toBe("in-progress");
		expect(rt.date).toBe("2026-03-18");
	});

	test("date comes back as ISO string, not Date.toString()", () => {
		const rt = parseGoal(serializeGoal(base));
		expect(rt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	test("empty depends_on roundtrips as []", () => {
		const rt = parseGoal(serializeGoal({ ...base, depends_on: [] }));
		expect(rt.depends_on).toEqual([]);
	});

	test("populated depends_on roundtrips with order preserved", () => {
		const rt = parseGoal(serializeGoal({ ...base, depends_on: ["GOAL-002", "GOAL-003"] }));
		expect(rt.depends_on).toEqual(["GOAL-002", "GOAL-003"]);
	});

	test("absent backlog_tag roundtrips as undefined", () => {
		const rt = parseGoal(serializeGoal({ ...base, backlog_tag: undefined }));
		expect(rt.backlog_tag).toBeUndefined();
	});

	test("present backlog_tag roundtrips correctly", () => {
		const rt = parseGoal(serializeGoal({ ...base, backlog_tag: "v1.0" }));
		expect(rt.backlog_tag).toBe("v1.0");
	});

	test("body whitespace is trimmed", () => {
		const rt = parseGoal(serializeGoal({ ...base, body: "  \nbody content\n  " }));
		expect(rt.body).toBe("body content");
	});

	test("body containing a --- line is not truncated", () => {
		const bodyWithHr = "## Section\n\nSome text.\n\n---\n\nMore text after.";
		const rt = parseGoal(serializeGoal({ ...base, body: bodyWithHr }));
		expect(rt.body).toContain("More text after.");
	});
});

describe("roundtrip: Decision", () => {
	const base: Decision = {
		id: "ADR-001",
		type: "decision",
		title: "Use claude -p",
		status: "accepted",
		date: "2026-03-18",
		relates_to: [],
		body: "## Context\n\nWe needed an LLM.",
	};

	test("basic fields", () => {
		const rt = parseDecision(serializeDecision(base));
		expect(rt.id).toBe("ADR-001");
		expect(rt.status).toBe("accepted");
	});

	test("supersedes absent → undefined", () => {
		const rt = parseDecision(serializeDecision({ ...base, supersedes: undefined }));
		expect(rt.supersedes).toBeUndefined();
	});

	test("supersedes present roundtrips", () => {
		const rt = parseDecision(serializeDecision({ ...base, supersedes: "ADR-000" }));
		expect(rt.supersedes).toBe("ADR-000");
	});

	test("relates_to array roundtrips", () => {
		const rt = parseDecision(serializeDecision({ ...base, relates_to: ["GOAL-001", "GUARD-002"] }));
		expect(rt.relates_to).toEqual(["GOAL-001", "GUARD-002"]);
	});

	test("date is ISO string not locale form", () => {
		const rt = parseDecision(serializeDecision(base));
		expect(rt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe("roundtrip: Guardrail", () => {
	const base: Guardrail = {
		id: "GUARD-001",
		type: "guardrail",
		title: "Never use Gemini",
		status: "active",
		date: "2026-03-18",
		body: "## Rule\n\nDon't.",
	};

	test("basic fields", () => {
		const rt = parseGuardrail(serializeGuardrail(base));
		expect(rt.id).toBe("GUARD-001");
		expect(rt.status).toBe("active");
	});

	test("adr absent → undefined", () => {
		const rt = parseGuardrail(serializeGuardrail({ ...base, adr: undefined }));
		expect(rt.adr).toBeUndefined();
	});

	test("adr present roundtrips", () => {
		const rt = parseGuardrail(serializeGuardrail({ ...base, adr: "ADR-001" }));
		expect(rt.adr).toBe("ADR-001");
	});
});

describe("roundtrip: Sop", () => {
	const base: Sop = {
		id: "SOP-001",
		type: "sop",
		title: "Add a plugin",
		status: "active",
		date: "2026-03-18",
		body: "## Steps\n\n1. Do the thing.",
	};

	test("basic fields", () => {
		const rt = parseSop(serializeSop(base));
		expect(rt.id).toBe("SOP-001");
		expect(rt.status).toBe("active");
	});

	test("adr roundtrips", () => {
		const rt = parseSop(serializeSop({ ...base, adr: "ADR-003" }));
		expect(rt.adr).toBe("ADR-003");
	});
});

describe("roundtrip: Standard", () => {
	const base: Standard = {
		id: "STD-001",
		type: "standard",
		title: "No hard deletes",
		status: "active",
		date: "2026-03-18",
		body: "## Rule\n\nUse soft deletes.",
	};

	test("basic fields", () => {
		const rt = parseStandard(serializeStandard(base));
		expect(rt.id).toBe("STD-001");
	});
});

describe("roundtrip: Vision", () => {
	const base: Vision = {
		title: "The destination",
		type: "vision",
		date: "2026-03-18",
		body: "## Destination\n\nKnowledge retrieval.",
	};

	test("basic fields", () => {
		const rt = parseVision(serializeVision(base));
		expect(rt.title).toBe("The destination");
		expect(rt.body).toContain("Knowledge retrieval.");
	});
});
