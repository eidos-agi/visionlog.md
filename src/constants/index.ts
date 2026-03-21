export const VISIONLOG_DIR = ".visionlog";

export const DIRECTORIES = {
	ROOT: VISIONLOG_DIR,
	GOALS: `${VISIONLOG_DIR}/goals`,
	DECISIONS: `${VISIONLOG_DIR}/adr`,
	GUARDRAILS: `${VISIONLOG_DIR}/guardrails`,
	SOPS: `${VISIONLOG_DIR}/sops`,
	STANDARDS: `${VISIONLOG_DIR}/standards`,
} as const;

export const FILES = {
	CONFIG: `${VISIONLOG_DIR}/config.yaml`,
	VISION: `${VISIONLOG_DIR}/vision.md`,
} as const;

export const ID_PREFIXES = {
	goal: "GOAL",
	decision: "ADR",
	guardrail: "GUARD",
	sop: "SOP",
	standard: "STD",
} as const;

export const DEFAULT_GOAL_STATUS = "locked" as const;
export const DEFAULT_DECISION_STATUS = "proposed" as const;
export const DEFAULT_GUARDRAIL_STATUS = "active" as const;
export const DEFAULT_SOP_STATUS = "draft" as const;
export const DEFAULT_STANDARD_STATUS = "draft" as const;
