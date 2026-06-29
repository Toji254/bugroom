# BugRoom real-agent swarm plan

## Why the current swarm is not real

Today BugRoom is a single backend call dressed as a swarm.

Evidence from the current code:
- `src/app/api/analyze/route.ts` makes one call to `callCerebrasAnalysis(...)`.
- `src/lib/cerebras.ts` sends one `/chat/completions` request to one model.
- The four agents shown in `src/lib/types.ts` are static UI definitions and a schema contract for the single model to fill.

So the current system is:
1. one screenshot
2. one prompt
3. one model call
4. one JSON response containing four pre-labeled agent findings

That is not real multi-agent orchestration. It is a single-agent structured-output simulation.

## What “real swarm” should mean in BugRoom

A real BugRoom swarm should have:
- independent agent runs with distinct prompts, tools, and state
- visible work logs per agent
- explicit coordination events (claim, critique, revise, merge)
- optional subagent spawning for specialized tasks
- human-visible discard/integrate decisions
- durable incident timeline and artifacts
- a clean boundary between analysis, remediation proposals, and optional execution

## Product goals from Loki's request

1. Screenshot-aware intake
   - Optional background watcher detects new screenshots.
   - User gets a native prompt: continue in BugRoom or open in default image viewer.

2. Real visible agent work
   - Each primary agent should show states like queued, running, blocked, critiquing, merged, discarded.
   - The UI should stream reasoning summaries and outputs, not just final cards.

3. Subagents
   - Primary agents may spawn subagents for narrow work.
   - Subagents are visible in the UI.
   - Parent agents can discard or integrate subagent output.

4. Self-improvement
   - Reusable successful subagent procedures can be promoted into skills/playbooks.
   - Failed or low-signal subagents stay as timeline artifacts only.

5. Better UX
   - Timeline-first war room.
   - Live event feed.
   - Evidence tray for screenshots, OCR snippets, logs, and candidate fixes.
   - Strong operator control over autonomy.

## Recommended architecture

### 1. Orchestrator model
Use LangGraph-style stateful orchestration, not just one giant prompt.

Recommended stack:
- Next.js app keeps the UI
- a server-side orchestrator manages swarm state and event streaming
- each primary agent is an actual task runner with its own prompt + tool scope
- use SSE or WebSocket streaming for live UI updates
- keep Cerebras as one available model, but agent execution should not depend on a single structured-output pass

Why this fit:
- BugRoom needs branching state, event streaming, retries, and visible handoffs
- Crew-style role prompts alone are not enough for the UX Loki wants
- LangGraph-style state machines fit “spawn / critique / merge / discard” best

### 2. Core domain entities

#### Incident
- id
- source (`upload`, `preset`, `watcher`)
- screenshot asset
- operator prompt
- status
- createdAt

#### AgentRun
- id
- incidentId
- agentType (`vision`, `debug`, `ux`, `fix`)
- parentRunId nullable
- status (`queued`, `running`, `blocked`, `completed`, `discarded`, `integrated`, `failed`)
- goal
- summary
- output
- confidence
- startedAt
- finishedAt

#### SwarmEvent
- id
- incidentId
- runId
- type (`spawned`, `note`, `tool_call`, `critique`, `merge`, `discard`, `integrate`, `operator_prompt`, `finalized`)
- payload
- createdAt

#### SkillCandidate
- id
- sourceRunId
- title
- summary
- status (`candidate`, `approved`, `rejected`, `promoted`)

### 3. Real primary agents

#### Vision Agent
Responsibilities:
- OCR
- visible UI state extraction
- identify explicit on-screen errors
- isolate evidence regions

Tools:
- screenshot parser
- OCR
- optional DOM/screenshot metadata if source is local app capture

#### Code Detective
Responsibilities:
- infer likely technical causes
- map symptoms to probable code paths
- request repo searches when codebase is present

Tools:
- code search
- stack trace recognizer
- dependency/version checker

#### UX Reviewer
Responsibilities:
- identify usability, accessibility, comprehension issues
- detect overloaded dashboards or unclear next actions

Tools:
- heuristic evaluator
- optional a11y ruleset

#### Fix Captain
Responsibilities:
- resolve conflicts
- rank next actions
- decide whether to spawn specialist subagents
- produce final operator recommendation

Tools:
- consensus builder
- task planner
- patch proposal formatter

### 4. Real subagents
Examples:
- OCR verifier
- stack-trace normalizer
- chart interpreter
- accessibility spot-checker
- reproduction planner
- patch drafter
- docs lookup agent
- test-plan agent

Rules:
- subagents are spawned only with explicit scope
- every subagent must produce a verifiable artifact
- parent agent either discards or integrates the output
- UI shows that decision visibly

### 5. Live UX model

#### Left rail: intake + evidence
- screenshot source card
- watcher toggle
- uploaded files
- OCR snippets
- extracted labels/errors

#### Center: incident timeline
- event stream with timestamps
- agent spawn/critique/merge events
- expandable subagent branches
- “discarded” items stay visible but dimmed

#### Right rail: operator controls
- autonomy level
- allow subagents toggle
- max parallel agents
- allow code-fix proposals
- allow auto-apply (off by default)

#### Bottom dock: swarm roster
- primary agent chips with live status
- subagent chips nested under parents
- click any chip to inspect logs/artifacts

### 6. Screenshot auto-detect feature
For desktop screenshot detection, use a local companion watcher, not a browser-only trick.

Implementation shape:
- a small local watcher process monitors common screenshot folders
- on new image:
  - fingerprint file
  - generate thumbnail
  - show local prompt: “Open in BugRoom” or “Open with default viewer”
- if BugRoom chosen:
  - app ingests the file and creates a new incident draft

Why:
- browsers alone cannot watch arbitrary OS folders continuously
- this belongs in a local companion/desktop bridge or Hermes-style local helper

### 7. Self-improving skills flow
Do not let agents mutate global skills automatically with no review.

Safe model:
- successful subagent outputs become `SkillCandidate`s
- Fix Captain may recommend promotion
- operator approves promotion
- promoted candidates become reusable internal playbooks/prompts/templates

This gives you “self-improving” behavior without silent prompt rot.

### 8. Safety and control model
Autonomy toggles should include:
- Observe only
- Analyze only
- Analyze + propose fixes
- Analyze + draft patches
- Analyze + apply in sandbox

Never default to auto-execution on user machines.

## Thin implementation slices

### Slice 1 — Make swarm state real
Acceptance:
- incidents and agent runs are stored as real entities
- UI reads from incident state, not fake standby cards
- one primary agent run can be created and displayed live

### Slice 2 — Add event streaming
Acceptance:
- UI receives live run updates via SSE/WebSocket
- agent status changes are visible without refresh
- timeline renders spawn/start/complete events

### Slice 3 — Split current single analysis into 4 real primary runs
Acceptance:
- vision/debug/ux/fix each run independently
- final consensus is assembled from actual runs
- each run has its own prompt and output pane

### Slice 4 — Add subagent spawning
Acceptance:
- a primary agent can spawn a subagent
- subagent events appear nested in timeline
- parent can discard or integrate result

### Slice 5 — Add screenshot watcher
Acceptance:
- local watcher detects new screenshots in configured folders
- user can choose BugRoom or default image viewer
- selecting BugRoom creates an incident draft with thumbnail

### Slice 6 — Skill candidate promotion
Acceptance:
- integrated subagent outputs can be marked as reusable candidates
- operator can approve or reject promotion
- promoted items appear in a reusable library

## Recommended next build step
Start with Slice 1 + Slice 2.

Reason:
- until swarm state and event streaming are real, everything else is theater
- screenshot watching and self-improvement are valuable, but they sit on top of orchestration primitives

## Immediate repo changes to make next
1. introduce incident/agent/event types and persistence
2. add an SSE route for incident events
3. refactor `/api/analyze` into an orchestrator entrypoint
4. make the UI consume incident events instead of a single final JSON blob
