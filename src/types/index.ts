// ─── Entity types ────────────────────────────────────────────────────────────

export type GoalStatus = "locked" | "available" | "in-progress" | "complete";
export type DecisionStatus = "proposed" | "accepted" | "rejected" | "superseded";
export type SopStatus = "draft" | "active" | "deprecated";
export type StandardStatus = "draft" | "active" | "deprecated";

export enum EntityType {
	Goal = "goal",
	Decision = "decision",
	Guardrail = "guardrail",
	Sop = "sop",
	Standard = "standard",
	Vision = "vision",
}

// ─── Goal ────────────────────────────────────────────────────────────────────

export interface Goal {
	id: string; // GOAL-001
	type: "goal";
	title: string;
	status: GoalStatus;
	date: string;
	depends_on: string[]; // GOAL-xxx IDs
	unlocks: string[]; // GOAL-xxx IDs
	backlog_tag?: string; // backlog.md milestone or label to link
	body: string; // markdown body (## What this achieves, ## Exit Criteria, ## Notes)
	filePath?: string;
}

export interface GoalCreateInput {
	title: string;
	status?: GoalStatus;
	depends_on?: string[];
	unlocks?: string[];
	backlog_tag?: string;
	body?: string;
}

// ─── Decision (ADR) ──────────────────────────────────────────────────────────

export interface Decision {
	id: string; // ADR-001
	type: "decision";
	title: string;
	status: DecisionStatus;
	date: string;
	supersedes?: string; // ADR-xxx
	relates_to?: string[]; // GOAL-xxx, GUARD-xxx
	body: string; // ## Context, ## Decision, ## Consequences
	filePath?: string;
}

export interface DecisionCreateInput {
	title: string;
	status?: DecisionStatus;
	supersedes?: string;
	relates_to?: string[];
	body?: string;
}

// ─── Guardrail ───────────────────────────────────────────────────────────────

export interface Guardrail {
	id: string; // GUARD-001
	type: "guardrail";
	title: string;
	status: "active" | "retired";
	date: string;
	adr?: string; // ADR-xxx (the decision that created this rule)
	body: string; // ## Rule, ## Why, ## Violation Examples
	filePath?: string;
}

export interface GuardrailCreateInput {
	title: string;
	status?: "active" | "retired";
	adr?: string;
	body?: string;
}

// ─── SOP ─────────────────────────────────────────────────────────────────────

export interface Sop {
	id: string; // SOP-001
	type: "sop";
	title: string;
	status: SopStatus;
	date: string;
	adr?: string; // ADR-xxx
	body: string; // ## When to use this, ## Steps, ## Guards
	filePath?: string;
}

export interface SopCreateInput {
	title: string;
	status?: SopStatus;
	adr?: string;
	body?: string;
}

// ─── Standard ────────────────────────────────────────────────────────────────

export interface Standard {
	id: string; // STD-001
	type: "standard";
	title: string;
	status: StandardStatus;
	date: string;
	adr?: string;
	body: string;
	filePath?: string;
}

export interface StandardCreateInput {
	title: string;
	status?: StandardStatus;
	adr?: string;
	body?: string;
}

// ─── Vision ──────────────────────────────────────────────────────────────────

export interface Vision {
	title: string;
	type: "vision";
	date: string;
	body: string; // ## Destination, ## North Star, ## Anti-Goals, ## Goal DAG, ## Success Criteria
	filePath?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export interface VisionlogConfig {
	project: string;
	backlog_path?: string; // relative path to backlog/ dir — for loose coupling
	created: string;
}

// ─── Entity union ────────────────────────────────────────────────────────────

export type VisionlogEntity = Goal | Decision | Guardrail | Sop | Standard;
