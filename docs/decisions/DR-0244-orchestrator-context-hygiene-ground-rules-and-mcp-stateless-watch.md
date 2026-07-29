# DR-0244 — Orchestrator context-hygiene ground rules adopted; MCP 2026-07-28 statelessness watched

- **date:** 2026-07-29
- **status:** accepted
- **tier:** A (documentation + one-source findings + tests; no runtime surface, no gate semantics touched)
- **decides:** the context-economy ground rules for any session that delegates to subagents, and the house posture on the MCP 2026-07-28 stateless revision
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

## Decision 2 — MCP 2026-07-28 (WATCH, with the flip trigger named)

Verified 2026-07-29 by live web search, then confirmed against the official release post hand-carried whole by Darrell the same day (primary source): the revision makes the protocol core **stateless** (the initialize handshake and `Mcp-Session-Id` retired; per-request `_meta` version/identity/capabilities; optional `server/discover`), replaces held-open streams with **Multi Round-Trip Requests** (elicitation as confirm-before-act — the house's preview-then-execute posture in protocol form), moves routing to required `Mcp-Method`/`Mcp-Name` headers (Caddy can route/authorize without parsing bodies), adds cacheable list results, a formal **extensions framework** (Tasks, MCP Apps, EMA), auth hardening (RFC 9207; DCR deprecated toward CIMD), and a twelve-month minimum deprecation window — with all four Tier 1 SDKs (TypeScript, **Python**, Go, C#) speaking it day-one. The spec's own state guidance — mint an explicit visible handle, never transport-hidden session state — is SWIMLANES' durable-state law adopted by the protocol.

- **Why it matters here:** statelessness removes the session-affinity objection that made an MCP server a poor fit for the sovereign lane. A stateless MCP endpoint deploys exactly like a DR-0132 FastAPI route — behind Caddy on the NAS, or on the Cloudflare Pages Functions transport the app already runs — and would be the natural way to hand agent sessions TOOLS over house state (the cloud sandbox has no LAN route; a Funnel-fronted MCP server would be the sessions' hands on the NAS).
- **Why it is watch, not staged:** the house runs MCP only as a client today; every current sovereign need is met by the Supabase-bus + self-orchestrating box pattern; and adopting server infrastructure ahead of a demanded workload is the DR-0140 inversion. It is also a breaking revision — nothing is rewritten until client support (including Claude's) actually lands.
- **Flip-to-staged trigger:** the first real, named need to expose a house tool to agent sessions as a tool call, once mainstream clients speak 2026-07-28. `re-review: 2026-08-25`.

## Verification

`research-intake.test.js` pins the pass (adopted rules' language, the watch verdict, the verified-date provenance, no-change-just-because); full suite green. The findings render live in the app from the one source (`research-intake.js`, DR-0121 — no static copy).
