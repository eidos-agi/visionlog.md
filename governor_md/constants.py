"""Directory structure and ID prefix constants."""

GOVERNOR_DIR = ".governor"

DIRECTORIES = {
    "ROOT": GOVERNOR_DIR,
    "GOALS": f"{GOVERNOR_DIR}/goals",
    "DECISIONS": f"{GOVERNOR_DIR}/adr",
    "GUARDRAILS": f"{GOVERNOR_DIR}/guardrails",
    "SOPS": f"{GOVERNOR_DIR}/sops",
    "STANDARDS": f"{GOVERNOR_DIR}/standards",
}

FILES = {
    "CONFIG": f"{GOVERNOR_DIR}/config.yaml",
    "VISION": f"{GOVERNOR_DIR}/vision.md",
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
