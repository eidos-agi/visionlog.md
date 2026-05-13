# governor.md

MCP server for long-term project governance. Records vision, goals, guardrails, SOPs, and architectural decisions (ADRs) — the contracts that all execution must honor.

Part of the trilogy: **research.md → governor.md → docket.md**

- research.md earns decisions with evidence
- **governor.md** records them as binding contracts
- docket.md executes within those contracts

(governor.md was previously codenamed `visionlog`; docket.md was previously `ike`. Same tools, new brand names.)

## What it enforces

- Guardrails are active or deprecated — never deleted
- ADRs are permanent once accepted — a new ADR supersedes, never overwrites
- Goals form a DAG — dependencies must be resolved before a goal is available
- Vision is sticky — it does not drift session to session

## Trilogy conventions

governor.md follows shared conventions with docket.md and research.md. See [CONVENTIONS.md](https://github.com/eidos-agi/docket.md/blob/main/CONVENTIONS.md) for the full standard.

- Config lives at `.governor/config.yaml` (committed to git)
- Tools: `project_init` (new project) and `project_set` (register existing for session)

## Install

```bash
uv tool install governor-md
# or: pip install governor-md
```

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "governor": {
      "type": "stdio",
      "command": "governor"
    }
  }
}
```

## Session protocol

```
project_set { path: "/path/to/project" }   <- returns project_id
governor_boot { project_id: "..." }        <- active guardrails + goal state
governor_guide { project_id: "..." }       <- vision + decisions + goal map
```

Read both `governor_boot` and `governor_guide` at the start of every session before touching any task or code.

## Project structure

```
my-project/
  .governor/
    config.yaml          <- project GUID + metadata (commit this)
    vision.md            <- north star, anti-goals, success criteria
    goals/               <- GOAL-NNNN.md — DAG of milestones
    adr/                 <- ADR-NNNN.md — architectural decisions
    guardrails/          <- GUARD-NNNN.md — active constraints
    sops/                <- SOP-NNNN.md — coordination protocols
```

## Tools

### Session
| Tool | Description |
|------|-------------|
| `project_init` | Initialize governor in a new project |
| `project_set` | Register existing project for session, returns project_id |

### Orientation (call at session start)
| Tool | Description |
|------|-------------|
| `governor_boot` | Active guardrails + current goal state + backlog check |
| `governor_guide` | Vision + key decisions + full goal map |
| `governor_status` | Counts: goals, decisions, guardrails, SOPs |

### Vision
| Tool | Description |
|------|-------------|
| `vision_view` | Read the project vision |
| `vision_set` | Set or update the vision document |

### Goals
| Tool | Description |
|------|-------------|
| `goal_create` | Add a goal to the DAG |
| `goal_list` | List all goals with status |
| `goal_view` | Read a goal |
| `goal_update` | Update goal status or body |
| `goal_unlockable` | List goals whose dependencies are met |

### Decisions (ADRs)
| Tool | Description |
|------|-------------|
| `decision_create` | Record an architectural decision |
| `decision_list` | List all ADRs |
| `decision_view` | Read an ADR |
| `decision_update` | Update status or body |

### Guardrails
| Tool | Description |
|------|-------------|
| `guardrail_create` | Add a guardrail |
| `guardrail_list` | List all guardrails |
| `guardrail_view` | Read a guardrail |
| `guardrail_update` | Update status or body |
| `guardrail_inject` | Inject guardrails into an existing prompt |

### SOPs
| Tool | Description |
|------|-------------|
| `sop_create` | Add a standard operating procedure |
| `sop_list` | List all SOPs |
| `sop_view` | Read a SOP |
| `sop_update` | Update status or body |
