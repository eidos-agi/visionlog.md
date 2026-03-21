/**
 * Bundled default SOPs — the canonical trilogy operational procedures.
 * These are seeded into every new visionlog project on init (offline-safe).
 * They also serve as the local baseline for defaults-check comparisons.
 *
 * To update these defaults: edit here, bump BUNDLED_SCHEMA_VERSION, and
 * publish a new defaults.json to the upstream repo root.
 */

export const BUNDLED_SCHEMA_VERSION = 1;

export const DEFAULTS_REMOTE_URL =
	"https://raw.githubusercontent.com/eidos-agi/visionlog.md/main/defaults.json";

/**
 * GitHub API fallback URL — works for private repos when VISIONLOG_GITHUB_TOKEN is set.
 * Content is base64-encoded in the response; fetchRemoteDefaults handles decoding.
 */
export const DEFAULTS_API_URL =
	"https://api.github.com/repos/eidos-agi/visionlog.md/contents/defaults.json";

export interface DefaultSop {
	title: string;
	status: "active" | "draft" | "deprecated";
	body: string;
}

export interface DefaultsManifest {
	schemaVersion: number;
	sops: DefaultSop[];
}

export const BUNDLED_SOPS: DefaultSop[] = [
	{
		title: "Goal Decomposition",
		status: "active",
		body: `## When to use this

When a visionlog goal has no ike.md tasks yet, or when starting work on a goal that is \`available\` or \`in-progress\`. Do not create tasks without first consulting this SOP.

## Steps

1. **Read the goal** — call \`visionlog.goal_view(id)\`. Understand the exit criteria, dependencies, and what "complete" means.

2. **Check guardrails** — call \`visionlog.guardrail_list(status: active)\`. Identify any guardrails that constrain how this goal is executed. If a proposed approach would violate one, stop and redesign before proceeding.

3. **Propose milestones** — decompose the goal into 1–3 milestones. A milestone is a meaningful, demonstrable checkpoint — not a task list. Ask: what intermediate states of the world would prove we are on track?

4. **Create milestones in ike.md** — call \`ike.milestone_create\` for each milestone. Name them after the outcome, not the activity.

5. **Decompose each milestone into tasks** — for each milestone, identify the atomic work items. A task should be completable in one session. Call \`ike.task_create\` for each with:
   - \`visionlog_goal_id\` set to the goal's ID
   - \`milestone\` set to the milestone ID
   - \`priority\` reflecting urgency
   - \`acceptance_criteria\` defining what done looks like

6. **Update goal status** — if the goal was \`locked\`, check whether its \`depends_on\` goals are complete. If yes, call \`visionlog.goal_update(status: available)\`. If you are starting work now, set \`in-progress\`.

## Guards

- Never create tasks without reading the goal and active guardrails first
- A goal should have no more than 3 milestones unless the scope demands it — if it does, the goal is probably too large and should be split
- Every task must have \`acceptance_criteria\` — a task without a definition of done will never be verifiably complete
- Do not skip directly from goal to tasks — the milestone layer is what connects strategy to execution`,
	},
	{
		title: "Completion Feedback",
		status: "active",
		body: `## When to use this

After completing an ike.md task. Completion is not just marking a task done — it is closing the loop back to the goal. Follow this SOP every time.

## Steps

1. **Complete the task** — call \`ike.task_complete(task_id)\`. Record completion notes describing what was done and any decisions made during execution.

2. **Check the milestone** — call \`ike.task_list(milestone: <milestone_id>)\`. If all tasks in the milestone are complete, call \`ike.milestone_close(milestone_id)\`.

3. **Check the goal** — if a milestone was closed, call \`ike.task_list(visionlog_goal_id: <goal_id>, include_completed: false)\`. If no open tasks remain for this goal:
   - Call \`visionlog.goal_view(id)\` — review exit criteria
   - If exit criteria are met, call \`visionlog.goal_update(id, status: complete)\`
   - If exit criteria are not fully met, create the remaining tasks before updating status

4. **Capture decisions made** — if any non-obvious decisions were made during execution that aren't recorded anywhere, call \`visionlog.decision_create\` with \`status: accepted\` to formalize them. A decision made in execution but not recorded is a contract that was never written.

5. **Check unlocks** — call \`visionlog.goal_unlockable()\`. If completing this goal unlocks others, update their status to \`available\`.

## Guards

- Never mark a goal complete without checking its exit criteria in visionlog
- If you made a decision during execution, write the ADR — do not leave it in task notes
- Do not skip step 5 — unlocking goals is how the DAG advances`,
	},
	{
		title: "Blocked Task Escalation",
		status: "active",
		body: `## When to use this

When an ike.md task cannot proceed. A blocked task is a signal that the plan is misaligned with reality. Do not leave it blocked without diagnosing why and taking explicit action.

## Steps

1. **Record the blockage** — call \`ike.task_edit(task_id, status: "In Progress")\` and add a note with the reason. Name the reason precisely. Vague blocked reasons ("can't proceed") are not acceptable.

2. **Diagnose the type** — determine which category applies:

   **A. Dependency** — another task or goal must complete first.
   Action: verify the dependency in ike.md or visionlog. Update \`dependencies\` on the task if not already set. Wait or switch to unblocked work.

   **B. Information gap** — the task cannot be completed because knowledge is missing.
   Action: open a research.md project to find the answer. Call \`research.project_init\` with a clear question. Update the blocked task's notes with the research project ID. Return to this task when the research project is decided.

   **C. Contradiction** — the task conflicts with a visionlog guardrail or ADR.
   Action: this is a serious escalation. The task as written is invalid. Either (a) redesign the task to comply, or (b) if the contract itself is wrong, open a research.md project to earn a new decision that supersedes the existing ADR. Do not proceed with a task that violates a guardrail.

   **D. Resource or access constraint** — the agent lacks a tool, permission, or capability.
   Action: create a high-priority task assigned to a human (\`assignees: ["human"]\`) describing the missing capability. The original task remains blocked until the human task is resolved.

3. **Never leave a task blocked without a linked action** — every blocked task must have either a dependency link, a research project ID in its notes, a redesigned scope, or a human-assigned task waiting for it.

## Guards

- A blocked task with no diagnosis is invisible debt — it will sit in the backlog forever
- Do not spawn a research.md project for questions that can be answered by reading existing visionlog ADRs or SOPs first
- A contradiction with a guardrail is never a blocker to work around — it is a signal to stop and govern`,
	},
];

export const BUNDLED_DEFAULTS: DefaultsManifest = {
	schemaVersion: BUNDLED_SCHEMA_VERSION,
	sops: BUNDLED_SOPS,
};
