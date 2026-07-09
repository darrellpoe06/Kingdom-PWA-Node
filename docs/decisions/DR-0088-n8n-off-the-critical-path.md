# DR-0088 — Take n8n off the reliability-critical path (Supabase-bus + self-orchestrating box)

- **Status:** accepted
- **Date:** 2026-07-08
- **Tier:** C (touches autonomous orchestration + the app's server-side data path)
- **Scope:** all
- **Supersedes:** nothing wholesale. **Amends** `STACK-DEPENDABILITY-REVIEW.md` §1.4 ("No swap is warranted / fix the discipline") for the *reliability-critical* path only — this does not swap the n8n product, it changes its ROLE.
- **Extends:** **DR-0083** (2026-06-30 — "loops = plain scheduled Python on the NAS, not n8n; never gate the money pipeline on n8n"; same n8n-fragility finding) from the loops/data path to the **LLM/orchestration** path; **DR-0073** (capability-aware routing) and **DR-0080** (deterministic-first) supply the routing + the "don't invoke an LLM where deterministic works" rule the router obeys.
- **Principles:** VERIFICATION-DOCTRINE (DR-0076), THREE-BRAKES, APP-IS-PRIMARY, REALITY-TRACE (DR-0061), SOVEREIGNTY, PERPETUAL-IMPROVEMENT (DR-0075), GOVERN-EXECUTE-ADVISE.

## Context — "why n8n? it breaks" (Darrell, 2026-07-08), grounded in the record

The frustration is evidenced, not a hunch:

- **Tonight (2026-07-08):** `GET https://poetech.us/n8n/healthz` → **HTTP 530** — the Cloudflare→Tailscale-Funnel→NAS-n8n inbound hop was unreachable. Every webhook that path carries was dead at that moment.
- **LESSONS-LEARNED:** P17 (n8n Code nodes have no global `fetch`, `require('http')` disallowed → **silent** failures, e.g. wf30 ntfy quietly failing); P18 (LAN-bound n8n unreachable by cloud agents — "Host not in allowlist"); P19 (Executions tab shows stale snapshots, "Succeeded" ≠ correct output). The 2026-06-13 workflow-status feed lost **hours** to these.
- **STACK-DEPENDABILITY-REVIEW §1.4:** of 47 workflow JSONs exactly **one** is `active:true` in the repo — activation lives in n8n's SQLite DB, so **"built ≠ running"** and repo/live **drift**; wf18 flipped inactive on a restart (two workflows on one webhook path → n8n auto-deactivated) and **stayed down a day**; `errorWorkflow` set on **zero** workflows (failures are silent); ~22 webhooks have **no header auth**; bind mounts added imperatively (data loss on recreate); isolated SQLite backend.

The review's verdict was **"the tool earns its place / fix the discipline, don't swap."** That verdict was sound **for its moment** — but it pre-dates the **2026-07-08 architecture shift** that changes the premise:

1. The two church GPU boxes are now **drivable headless over SSH** from `kingdom-home` (verified: build + GPU + local Ollama).
2. **Supabase (cloud `mjjlevhdufpaplypnqrv`) is the live backend**, reachable by **both** the PWA and the church boxes.
3. Darrell chose **"box self-orchestrates"** (this session) for the orchestration seat.

The break is not "n8n the product" — it is the **fragile inbound multi-hop path** (PWA → Cloudflare → Tailscale Funnel → NAS n8n → service) used as the *critical* glue, plus the operational gaps above. The premise shift lets us remove that path for the critical work entirely.

## Decision

1. **The reliability-critical and NEW orchestration path does NOT route through n8n's inbound webhooks.** It uses a **Supabase-bus + self-orchestrating box** (outbound poll):
   - The PWA (or Darrell) writes a **spec/task row** to Supabase.
   - The **church box agent polls Supabase outbound** (no inbound to the mesh, no Funnel, no n8n SPOF), runs the work on **local qwen or a vendor API** (`llm-providers.js` / `llm-router.js`), writes results back to Supabase, and opens a **PR** into the **gated build pipeline**.
   - The PWA **reads Supabase**. Gates dispose (CI, auto-merge green-required, tests, monolith budget, contrast/legibility) — the router trusts the **gates**, not the model.
   - Outbound poll is strictly more reliable than inbound multi-hop: a box behind a firewall with no open ports and no Funnel can still do all its work.
2. **n8n is NOT ripped out.** It remains for genuine **visual, self-contained** flows where it earns its place (per the review) — but is **removed as a single point of failure** for anything reliability-critical.
3. **Existing n8n webhooks migrate incrementally** (phased, below): data flows → Supabase-direct (RPC/RLS/Edge Function); LLM/compute flows → box-agent/Supabase-queue.
4. **Whatever n8n remains gets the discipline the review named:** **gate** on `scripts/workflow-conformance.mjs` (activation, `errorWorkflow`, `headerAuth`), Postgres backend, committed mounts. A green gate must *mean* running-and-correct.
5. **The box agent is Tier C and ships INERT** — kill-switch engaged, ARMED absent, budgets 0, single-flight lock, append-only log — armed only by Darrell, attended (2026-06-06 runaway precedent).

## Phased migration (the plan)

| Phase | Path | From (n8n webhook) | To |
|---|---|---|---|
| P1 (now) | NEW LLM router | — | `llm-providers.js` + `llm-router.js` on the Supabase-bus; no n8n from day one |
| P2 | LLM/compute reads | `/webhook/llm-health`, `/webhook/llm-review`, `class-tutor` | box agent writes health/review/tutor results to Supabase; PWA reads Supabase |
| P3 | Data writes | `/webhook/mark-noise`, `/webhook/family-feedback`, `book-checkout` | Supabase RPC / insert with RLS; no n8n |
| P4 | Property history | `/webhook/property-history` | Supabase view/RPC over the ledger |
| P5 | Remaining visual flows (finance ingest wf14-18 etc.) | stay on n8n | but conformance-GATED + Postgres backend + committed mounts |

## Consequences

- **More reliable:** the critical path no longer depends on the Funnel being up or a workflow being manually re-activated. Tonight's 530 would not have taken the LLM tier down.
- **More sovereign:** work runs on-mesh (box + local qwen) or via a vendor the box calls directly; no third hop.
- **Safe by gates, not trust:** LLM-proposed work is disposed by the same deterministic gates that guard human PRs — that is what makes "with or without Claude" safe (DR-0076).
- **Cost:** build the bus (a Supabase `agent_tasks` table + RLS/grants) and the inert box agent; migrate webhooks over P2–P5. n8n stays, leaner and gated.

## Verification

- P1 landed with `llm-providers.js` (proven-to-catch tests) + `llm-router.js` (inert-by-default gate, proven-to-catch). The bus table ships with RLS + grants (the known "new table 403" trap) and a live insert/read check before any consumer trusts it.
