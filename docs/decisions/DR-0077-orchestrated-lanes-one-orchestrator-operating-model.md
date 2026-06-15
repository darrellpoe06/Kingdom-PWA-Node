---
id: DR-0077
title: Orchestrated lanes + one orchestrator — parallel isolated lanes via the agent-orchestration tooling, each self-verifying, integrated in order by a KPI/model/token-aware sovereign orchestrator
date: 2026-06-15
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [all]
grounds: [GOVERN-EXECUTE-ADVISE, EARN-AUTONOMY, DATA-DRIVEN-LIVING, SOVEREIGN-FIRST, EXECUTION-OUTCOME-OBSERVABILITY, DECISION-RECORDS]
source: 2026-06-15 — Darrell: "Multi-lane one orchestrator — isn't that your superpower? Find a better process forward without losing quality, still fast, just FASTER because of AI. I want this all in the PoeTech app and outside so we have it locked and not just in your memory which we know is going to empty."
---

## Context

The agent had been **hand-cranking** git worktrees and fighting `node_modules`
junctions one lane at a time — the opposite of orchestration, and slow. Darrell
named the fix: multi-lane + one orchestrator is the actual superpower; use the
tooling, lock the model in the repo + app (not ephemeral memory).

## Decision

Work runs as **parallel isolated lanes + one orchestrator**, both verified, both
sovereign:

1. **Lanes** are created/cleaned by the **agent-orchestration tooling** (Workflow
   parallel/pipeline; Agent `isolation: 'worktree'`) — **not** hand-cranked
   `git worktree` / `mklink` / junctions. A long-lived worktree uses `npm ci`
   once (real deps), never a flaky junction.
2. **Each lane self-verifies** with the sovereign **`npm run verify`** (lint +
   the full deterministic gate suite — tenancy/contrast/overlap + all tests; no
   vendor AI) before it may report "done."
3. **The orchestrator** directs, **re-verifies**, and **integrates lanes into
   `main` in order** — it never hand-edits. It runs on the CLI / the actual
   computer, watching live AND cloud, and is ultimately the **sovereign local
   LLM** (vendors attached for capability, never required — DR-0062/0066).
4. **Parallel vs. sequential is a data-driven choice**, not habit: sequential
   for a small batch of small tasks; parallel lanes for many independent
   non-trivial lanes, **proven on one measured lane before scaling to N**. The
   orchestrator learns the threshold from real runs (DR-0063).
5. **KPI / model / token-aware orchestration (build toward):** route by model
   speed/limits/cost (DR-0073), hold/dispatch by KPIs, adapt from recorded
   experience, and track tokens-remaining per vendor — spending where they most
   help the stack/pipelines.

## Consequences

- The full spec lives in the durable foundation doc; this DR is the ledger entry.
- **Locked in repo + app, not memory:** repo = this DR + the foundation doc +
  the `verify` command + the gates; app = a planned Governor-gated System/
  Orchestration surface (live verify status + lanes + KPIs + per-vendor token
  budgets, real data per DR-0061). Memory is a cache only; if it and the repo
  disagree, the repo governs.
- Refines DR-0011 (operating model) for the multi-agent era; pairs with DR-0076
  (verify in every lane + orchestrator) and DR-0075 (verified is the bar).

## Links

`docs/00-foundations/_root/ORCHESTRATION-AND-VERIFICATION-OPERATING-MODEL.md`
(the spec), `app/package.json` (`verify`), [DR-0076], [DR-0075], [DR-0073],
[DR-0063], [DR-0062]/[DR-0066], [DR-0011], [DR-0065], [DR-0061].
