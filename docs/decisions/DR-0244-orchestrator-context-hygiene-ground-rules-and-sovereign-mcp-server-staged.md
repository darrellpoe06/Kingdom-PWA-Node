# DR-0244 — Orchestrator context-hygiene ground rules adopted; the sovereign MCP server built same-day, staged inactive

- **date:** 2026-07-29
- **status:** accepted
- **tier:** A (documentation + one-source findings + tests; no runtime surface, no gate semantics touched)
- **decides:** the context-economy ground rules for any session that delegates to subagents (with the transcript rule enforced as a PreToolUse hook), and the sovereign MCP server built to the 2026-07-28 stateless spec — staged inactive, read-only v1
- **pairs-with:** DR-0143 (the intake this entered through), DR-0239/REV-0211 (machinery over memory — the lived compaction-loss twin), DR-0132 (sovereign Python lane — where a future MCP server would live), DR-0140 (demand-first — why MCP is watched, not adopted), DR-0080 (deterministic-first), P36 (LESSONS-LEARNED)

## The trigger

Darrell 2026-07-29, hand-carrying two articles: **"The Orchestrator's Tax"** (Rahul Garg, martinfowler.com, 2026-07-28) and the **MCP 2026-07-28** release note — *"What can we get from this to use within our building processes? opportunities and constraints based on our Ways and documentation?"* and *"Lesson also..."*. Both ran the DR-0143 intake: captured whole, premise-verified, house-first checked, tiered, verdicts written, one source updated, recorded here.

## Decision 1 — Context-hygiene ground rules (ADOPTED)

The article's thesis — every token in the orchestrator's context competes for its attention; a subagent's real value is what it keeps OUT of that context — is adopted as ground rules because the house already holds the lived evidence (REV-0211's compaction-loss record; the Two-Session Git Race incident; ICM's own layer-at-the-right-time premise). The rules, for any session or workflow that delegates:

1. **Never import a raw subagent transcript to answer a status question.** Status is answered from what is already known, or from a summary the subagent returns. Context pollution is not a one-time token bill — it taxes every decision after it.
2. **Delegate by cognitive locality.** Tasks needing the same mental model (same subsystem, same conventions) stay together in one agent; overlapping file or domain ownership between planned agents is a CONSOLIDATION signal, never a cue to spawn more.
3. **Skills and context do not inherit.** A spawned agent gets pointed at the files/skills to load (path references), never a full inline paste of what the parent holds.
4. **No repo-wide git operations inside concurrent agents** (stash/checkout/reset while sibling writers are active) — the house's own 2026-05-25 lesson, now generalized to agent fan-outs; worktree isolation where parallel writes are genuine.
5. **New standing rules state the missing FACT, not a decision procedure.** If a reasonably competent session would decide rightly knowing one fact, the rule is that fact — approvals/checkpoints/confirm-gates encode bureaucracy where a clarification would do, and every standing line is a per-session tax. (This is also why these rules live HERE and in LESSONS-LEARNED P36, not appended to CLAUDE.md — the lesson applied to itself. Whether Layer 0 itself should be slimmed is the Governor's call, named as an opportunity in the session note, `re-review: 2026-08-25`.)

Outside numeric calibrations (2–4 agents per wave, five as a consolidation trigger) are carried as heuristics from one practitioner on one model — DR-0100 tier 2, never law here.

## Decision 2 — MCP 2026-07-28: the sovereign MCP server BUILT same-day, STAGED inactive

Verified 2026-07-29 by live web search, then confirmed against the official release post hand-carried whole by Darrell the same day (primary source): the revision makes the protocol core **stateless** (the initialize handshake and `Mcp-Session-Id` retired; per-request `_meta` version/identity/capabilities; optional `server/discover`), replaces held-open streams with **Multi Round-Trip Requests** (elicitation as confirm-before-act — the house's preview-then-execute posture in protocol form), moves routing to required `Mcp-Method`/`Mcp-Name` headers (Caddy can route/authorize without parsing bodies), adds cacheable list results, a formal **extensions framework** (Tasks, MCP Apps, EMA), auth hardening (RFC 9207; DCR deprecated toward CIMD), and a twelve-month minimum deprecation window — with all four Tier 1 SDKs (TypeScript, **Python**, Go, C#) speaking it day-one. The spec's own state guidance — mint an explicit visible handle, never transport-hidden session state — is SWIMLANES' durable-state law adopted by the protocol.

- **Why it matters here:** statelessness removes the session-affinity objection that made an MCP server a poor fit for the sovereign lane. A stateless MCP endpoint deploys exactly like a DR-0132 FastAPI route — behind Caddy on the NAS — and is the natural way to hand agent sessions TOOLS over house state (the cloud sandbox has no LAN route; a Funnel-fronted MCP server is the sessions' hands on the NAS).
- **What was built (Darrell 2026-07-29: "Let's build what we can and test it"; DR-0236 — nothing waits, brakes gate activation never building):** `infra/nas-mcp/mcp_server.py` — the 2026-07-28 stateless shape (server/discover, cache-hinted deterministic tools/list, tools/call; bearer auth refused-when-unset; Mcp-Method/Mcp-Name header-body agreement per SEP-2243) over the dispatch reel, the Code Task snapshot, and a read-only Cage brake view. **Read-only v1 by design** — any write tool is a separate DR-0089 governance gate. **Self-deploying (Darrell 2026-07-29: "YOU DO IT"):** the service rides the `services.json` self-deploy manifest — merge to main IS the deploy; the NAS mirror pulls, the armed `services-sync` loop runs the idempotent `install.sh` (token once, venv, systemd unit, best-effort Caddy route, a REAL discover round-trip as health), and `poetech-mcp.service` starts — the same lane that deploys scribe, no hands in the path. The initial "the Governor's runbook is the activation" framing was the DR-0108 miss (the agent scoping to its own limits — the house had already built the no-hands channel); the ConnectBot runbook remains only as the fallback when the loops fleet is unarmed.
- **Proof (DR-0076):** the full round-trip proven live in the build sandbox against fixture state — discover, list, all four tools, plus the refusal paths (bad token 401, wrong version 400, header mismatch 400, unknown tool −32602). Invariants pinned in CI by `nas-mcp-server.test.js`, including the v1-read-only bright line.
- **Staged, not adopted (DR-0143 evidence rule):** promotion = a real agent session reaching NAS state through the endpoint, measured useful. `re-review: 2026-08-25`.

## Decision 3 — Rule 1 enforced as machinery (DR-0239 dimension 7)

The transcript rule does not rely on any session remembering it: `scripts/context-hygiene-pretool-hook.mjs` (wired in `.claude/settings.json`, PreToolUse on Read|Bash) deterministically BLOCKS a Read or transcript-streaming Bash call aimed at a raw subagent/task transcript file, pointing at the right move instead (status from what is known; SendMessage the agent for the specific answer). Fail-open on every ordinary read — proven-to-catch and proven-not-to-overreach in `context-hygiene-guard.test.js` (the house's own data JSONL files — the reel, conflict events — pass untouched).

## Verification

`research-intake.test.js` pins the pass (adopted rules' language, the staged verdict with the proof named, the primary-source provenance); `nas-mcp-server.test.js` pins the server invariants; `context-hygiene-guard.test.js` proves the hook catches the wound and spares ordinary work; lint + suite green. The findings render live in the app from the one source (`research-intake.js`, DR-0121 — no static copy).
