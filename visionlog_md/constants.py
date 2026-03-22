"""Directory structure and ID prefix constants."""

VISIONLOG_DIR = ".visionlog"

DIRECTORIES = {
    "ROOT": VISIONLOG_DIR,
    "GOALS": f"{VISIONLOG_DIR}/goals",
    "DECISIONS": f"{VISIONLOG_DIR}/adr",
    "GUARDRAILS": f"{VISIONLOG_DIR}/guardrails",
    "SOPS": f"{VISIONLOG_DIR}/sops",
    "STANDARDS": f"{VISIONLOG_DIR}/standards",
}

FILES = {
    "CONFIG": f"{VISIONLOG_DIR}/config.yaml",
    "VISION": f"{VISIONLOG_DIR}/vision.md",
}

ID_PREFIXES = {
    "goal": "GOAL",
    "decision": "ADR",
    "guardrail": "GUARD",
    "sop": "SOP",
    "standard": "STD",
}

DEFAULT_GOAL_STATUS = "locked"
DEFAULT_DECISION_STATUS = "proposed"
DEFAULT_GUARDRAIL_STATUS = "active"
DEFAULT_SOP_STATUS = "draft"
DEFAULT_STANDARD_STATUS = "draft"
