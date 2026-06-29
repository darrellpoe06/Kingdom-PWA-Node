# MODEL-LAB-SPEC.md

**Status:** DESIGN / SPEC (2026-06-23). No behavior change in this commit — spec only, nothing built, no model pulled. Defines an in-app **Model Lab**: a sovereign, user-judged LLM evaluation surface where the family chooses which local models compete, sees them answer the **same** problem head-to-head, votes which answer they prefer, and lets those preferences crown a per-task winner that tunes the routing policy and the user-choosable defaults.

**Risk tier:** **C** (real-data surface that *writes back into routing*, and it drives local compute — see §10). Build ships **inactive**; turn on watched. The MVP-now slice (§9) is the smallest Tier-B-able cut.

**Companions:**
- [`LOCAL-LLM-MODEL-PICKS.md`](LOCAL-LLM-MODEL-PICKS.md) — the model menu + recommended per-tier defaults this lab's rankings *inform*.
- [`DR-0073`](../decisions/DR-0073-orchestrator-capability-aware-routing.md) — capability-aware routing (`ORCH_MODE`); the policy Model Lab tunes.
- [`DR-0063`](../decisions/DR-0063-local-authors-plan-head-to-head-vendor-historical-decision-framework.md) — local authors → head-to-head vs vendor → **historical decision framework (competence collection)**. **Model Lab is the human-judged sibling of that ledger**: DR-0063 is the *machine* adjudicating local-vs-vendor; Model Lab is the *family* adjudicating local-vs-local. Same "decisions are data" discipline, different judge.
- [`LlmHealth.jsx`](../../app/src/components/LlmHealth.jsx) + `wf-llm-health` — the live Ollama readout pattern (`/api/ps`, `/api/tags`) the Lab reuses to know what's installed/loaded.
- [`scripts/orchestrator-v05.mjs`](../../scripts/orchestrator-v05.mjs) — the existing `callOllama(/api/generate)` + judge + audit-ledger plumbing the Lab's runner generalizes.

> **Verification doctrine (DR-0076):** every number the Lab shows traces to a real model run — a real Ollama response, a real latency, a real vote count. No painted "Model A: 87% preferred." A model with zero votes shows **"not yet judged,"** never a fabricated score. Rankings carry their **n** (sample size) so a 2-vote "winner" is never dressed as settled.

---

## 0. TL;DR

1. **What it is.** An **arena** inside the app: pick 2+ local models → send them one situation → read their answers side-by-side → vote which is better → the votes aggregate into a **per-task-type ranking** that (a) tunes which model routing picks per tier and (b) tells us which models to keep/pull/drop and which is the pre-selected default.
2. **Where it lives.** A new **🥊 Model Lab** card/sub-tab on the **Build board**, right beside the existing **🧠 Local LLMs** (`LlmHealth`) card — family/Governor-gated. Same neighborhood as "what models are hot"; this is "which model is *better*."
3. **Why now is spec-only.** Multi-model compare on the **CPU NAS is minutes-slow** (dense 14B = 2–4 tok/s; two models on one CPU contend). It's genuinely usable when models are pulled and **ideally once the GPU box lands** (real-time). The MVP that works **today** (§9): compare the **two models already on the NAS**, one prompt, async, you come back to the result.
4. **The output that matters.** Not a leaderboard for its own sake — a **feedback signal into the routing policy + the defaults menu** (`LOCAL-LLM-MODEL-PICKS.md`). The family's lived preference becomes the system's competence record about its own tools.

---

## 1. The feature, precisely (Darrell's four asks)

| # | Ask | What the Lab does |
|---|---|---|
| 1 | **Toggle models on/off for a run** | A model picker reads the installed list from `wf-llm-health` (`/api/tags`); each installed model has an on/off toggle. The set of "on" models are the contestants for the next run. Defaults pre-checked from `LOCAL-LLM-MODEL-PICKS.md`. |
| 2 | **Head-to-head on the SAME process/problem** | One **situation** (prompt + optional task-type tag) is sent to **every** "on" model. Outputs render **side-by-side** (or stacked on mobile), each labeled with model name, latency, and tok/s — the real measured numbers, not estimates. |
| 3 | **User preference voting (arena-style)** | The family votes which answer they prefer **by the quality they care about** — *clarity, understanding, correctness*. Two modes: **pairwise** ("A vs B — which is better?", the arena primitive) and optional **rank-all** (drag/order N answers). Blind-by-default (model names hidden until after the vote, to fight name bias). |
| 4 | **Aggregate → rankings → feed routing + defaults** | Votes aggregate into a **per-task-type** ranking (Elo-style from pairwise, or mean-rank). That ranking (a) writes a **suggested routing preference** per tier (advisory, human-confirmed — never auto-flips routing) and (b) surfaces a **keep / pull / drop** recommendation + the **pre-selected default** in the model-picks menu. |

---

## 2. Where it lives in the app

- **Home:** **Build board** (`BuildBoard.jsx`), as a new **🥊 Model Lab** section directly under the existing **🧠 Local LLMs** card (`LlmHealth` renders at `BuildBoard.jsx:352`). The two are a pair: *health* = "what's loaded / what ran away"; *lab* = "what's better." Same governance gate, same KpiDot palette, same `N8N_BASE` same-origin fetch pattern.
- **Gate:** **family + Governor only.** This is an internal stewardship surface (AI-FOUNDATION-INTERNAL-OPERATIONS — "browsers are for humans deciding things"). No-leak: prompts and votes never appear on any congregation/public surface. Non-family identities never see the tab (the `auth-identity-tenancy-boundary` rule).
- **Nav id:** add `build-model-lab` alongside the existing `build-llm-health` entry (`poe-financial-mvp-v28.jsx:5570`).
- **New module, not the monolith** (`project-new-surface-new-module`): `app/src/components/ModelLab.jsx` + `app/src/lib/model-lab.js` (pure run/vote/ranking logic, unit-tested), mirroring how `LlmHealth.jsx` keeps `normalizeLlmHealth`/`llmHealthKpi` pure and testable.

---

## 3. How it calls the local models

The Lab does **not** call Ollama from the browser. It goes through the **same-origin `/n8n` rewrite** to NAS-side n8n workflows (the `project_n8n_same_origin_rewrite` rule; cross-origin Funnel throttles). Two new workflows, mirroring `wf-llm-health`:

### `wf-model-lab-run` (POST `/webhook/model-lab-run`)
- **Body:** `{ run_id, prompt, task_type, models: ["qwen2.5:14b…","qwen2.5:3b…"], options: { num_ctx, temperature } }`.
- **Action:** for each model, calls Ollama `POST /api/generate` (`{ model, prompt, stream:false }`) — exactly the `callOllama` shape in `orchestrator-v05.mjs:75`. Captures `response`, `total_duration`, `eval_count`, `eval_duration` → derives **real tok/s + latency**.
- **Sequential, not parallel, on CPU** (one CPU can't decode two models at once without thrashing; §10). On a GPU box this can fan out.
- **Returns:** `{ run_id, outputs: [{ model, text, latency_ms, tok_s, ok, error }] }`. Each output is independently try/caught — one model erroring (OOM, not-pulled) marks *that* card failed, never sinks the run (PERPETUAL-PIPELINE-HEALTH; the SectionErrorBoundary / `break-it` posture).

### `wf-model-lab-store` (POST `/webhook/model-lab-store`) — optional NAS-side persistence
- For the **sovereign-only** deployment (NAS Postgres / JSONL), votes + runs persist NAS-side instead of cloud Supabase. The cloud path (§4) is the default for the family app; the NAS path is the fully-sovereign mirror. Same data model either home.

### Behind the brakes + a queue
- The runner rides a **single-instance queue** (concurrency lock — `feedback_autonomous_automation_three_brakes`): one Lab run executes at a time; a second request **queues**, it does not stack two model fleets onto the CPU.
- **Budget:** per-run wall-clock ceiling + max-models-per-run cap; a run that blows the ceiling terminates and reports partial results honestly ("model C timed out"), never hangs.
- **Kill-switch:** a stuck/looping run auto-aborts on the heartbeat miss. This is **human-triggered** (you press *Run* — no scheduler, no unattended spend of compute), so it's the lightest corner of the three-brakes rule, but the lock + budget + abort still apply because it drives real NAS compute.

---

## 4. Data model

Four tables (cloud Supabase default; `instance_id` + `user_in_instance()` tenancy like every other table — `project_supabase_cloud_is_live_backend`). Next free migration number: **`0041-model-lab.sql`**. All four are **owner/family-scoped**; RLS denies anon; no public read ever.

```
model_lab_runs
  id              uuid pk
  instance_id     uuid            -- tenancy
  created_by      uuid            -- which family member ran it
  task_type       text            -- 'reasoning'|'coding'|'clinical-tag'|'draft'|'router'|'scripture'|… (see §6)
  prompt          text            -- the situation sent to every model
  options         jsonb           -- { num_ctx, temperature, … }
  status          text            -- 'running'|'complete'|'partial'|'failed'
  created_at      timestamptz

model_lab_outputs                 -- one row per model per run
  id              uuid pk
  run_id          uuid fk -> model_lab_runs
  instance_id     uuid
  model           text            -- 'qwen2.5:14b-instruct-q4_K_M'
  text            text            -- the model's answer (the real /api/generate response)
  latency_ms      int
  tok_s           numeric         -- measured, not estimated
  ok              boolean
  error           text            -- null unless this model failed
  created_at      timestamptz

model_lab_votes                   -- one row per human judgment
  id              uuid pk
  run_id          uuid fk
  instance_id     uuid
  voter           uuid            -- which family member voted (for per-voter view; never surfaced publicly)
  mode            text            -- 'pairwise' | 'rank'
  -- pairwise:
  winner_output   uuid fk -> model_lab_outputs   -- the preferred answer
  loser_output    uuid fk -> model_lab_outputs
  -- rank: ordered list of output ids
  ranking         jsonb           -- [output_id, output_id, …] best-first (null for pairwise)
  quality_axis    text            -- 'clarity'|'understanding'|'correctness'|'overall' (what they judged on)
  blind           boolean         -- were names hidden at vote time
  created_at      timestamptz

model_lab_rankings                -- materialized aggregate (per instance × task_type × model)
  instance_id     uuid
  task_type       text
  model           text
  rating          numeric         -- Elo (pairwise) or mean-rank score
  wins            int
  losses          int
  n_votes         int             -- the sample size — ALWAYS shown with the rating (DR-0076)
  last_updated    timestamptz
  pk (instance_id, task_type, model)
```

`model_lab_rankings` is **derived** (recomputable from votes — characterize-before-change discipline; never a stored truth that can drift from its inputs, the same lesson as derived account balances). Aggregation lives in `lib/model-lab.js` as a pure function so it's unit-testable and proven-to-catch.

---

## 5. Voting UX — controls-in-context, no view-snap

The hard-won UX rules from prior feedback surfaces apply:

- **Controls in context, no view-snap** (the recurring `feedback_persona_cards` / controls-in-context lesson): the vote buttons sit **directly under each answer**, in view. Voting does **not** scroll, collapse, or jump the page; the answers stay put and the chosen one gets a quiet confirmation state in place.
- **Pairwise is the primitive.** Default presentation: two answers, **A vs B**, with three judgments offered — **"A is clearer," "A is more correct," "they're equal / both good."** (Arena-style; the axis is recorded in `quality_axis`.) For >2 models, the Lab serves a short series of pairwise duels (round-robin or swiss) rather than forcing a single N-way decision.
- **Optional rank-all** for the user who wants it: drag answers into a best→worst order in one shot. Surfaced as a secondary mode, never the wall in front of the 95% (§0.5 of the model-picks doc — *defaults for the user who doesn't care; full choice for the user who does*).
- **Blind by default.** Model names hidden until the vote lands, then revealed — kills brand/name bias so the family judges the *answer*, not the label. A "reveal" toggle is available for the user who wants to vote with names visible.
- **Quality axis is explicit.** The user is voting *for the quality they prefer* — the UI names the axis (clarity / understanding / correctness / overall) so the aggregate knows what it's measuring. Different task types weight different axes (a router cares about correctness+speed; a draft cares about clarity).
- **Accessibility:** WCAG 2.1 AA at every theme (default midnight), large-print + read-aloud primitives available (`TextSizeControl`, `TTSControl`) since these are long-reading surfaces. Vote controls are real buttons, keyboard-reachable, with visible focus.
- **Speed is shown, honestly.** Each answer card shows measured **latency + tok/s** so a vote can weigh "good enough and 4× faster" against "slightly better and minutes-slow" — the exact speed-vs-quality trade the model-picks defaults are built around.

---

## 6. Task types (the ranking dimension)

Rankings are **per task type**, because the whole point (DR-0063 competence collection) is *which model wins which kind of work* — not one global "best." The starter set maps to the routing tiers in `LOCAL-LLM-MODEL-PICKS.md §4`:

| task_type | What it judges | Maps to tier |
|---|---|---|
| `reasoning` | hard reasoning / logic / math | Daily-driver (thinking-on) |
| `draft` | general chat / writing / drafting | Daily-driver |
| `coding` | code generation / fix | Coder tier |
| `router` | fast classify / route (short, deterministic) | Router / classifier |
| `clinical-tag` | structured tagging / extraction reliability | Narrow tagging |
| `scripture` | scripture-grounded / worldview content (correctness is expensive — DR-0076) | Daily-driver, high-care |
| `structured` | JSON / tool-call structure reliability | Hermes specialist niche |

The set is editable (a family can add a task type that matters to them — `family-defines-what-matters`, QUALITY-OF-LIFE). Each task type carries a default quality-axis weighting.

---

## 7. How rankings feed routing + defaults

This is the payoff — the Lab is a **feedback signal into the policy**, not a museum.

1. **Into routing (advisory, human-confirmed).** For each tier, the Lab computes the family-preferred model (highest `rating` at adequate `n_votes`). It writes a **suggested preference** — surfaced to the Governor as *"For `coding`, the family prefers `qwen2.5-coder:7b` over `qwen2.5:14b` (n=14, 71% pairwise)."* Routing (`ORCH_MODE` / `OLLAMA_MODEL`, DR-0073) reads the **confirmed** preference; it **never auto-flips** (GOVERNANCE-EXECUTION-ADVISORY — discovery is automatic, the routing change is a human hand). This is the per-user model-preference layer the model-picks doc §0.5 already calls for, now *driven by evidence* instead of a guess.
2. **Into the defaults menu.** The ranking sets the **pre-selected default** badge in the model picker (the "recommended" model per tier) and the per-user override falls back to it. A user still chooses their own (speed-vs-quality is theirs to make); the Lab just makes the *default* earned rather than asserted.
3. **Into keep / pull / drop.** A model that consistently loses every task type → a **"candidate to drop"** flag (frees disk/RAM). A task type where every installed model scores low → a **"pull a stronger model"** flag (e.g. the §4 recommendation to move the driver to a 30B-A3B MoE). These are recommendations to the Governor, never auto-`ollama rm` / auto-`pull` — pulling stays Darrell's hand.
4. **Into the competence ledger (DR-0063).** Every run+vote is a row in the historical decision framework — the human-judged, local-vs-local complement to DR-0063's machine-judged local-vs-vendor ledger. **Bounded** (DR-0063 step 4): capture the verdict, not heavy instrumentation; if the record costs more than it returns, trim it.

---

## 8. Privacy (binding)

- **Owner/family-scoped, always.** Prompts, outputs, and votes are `instance_id`-scoped, RLS-enforced, anon-denied. Never surfaced on any public/congregation surface, never enumerated outward (`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`).
- **No surveillance.** Per-voter attribution exists only to let the family see *its own* breakdown ("Christina prefers X for drafts"); it is never aggregated across families, never sold, never used to profile a person. No engagement optimization on this surface.
- **Local-only for private content.** If a Model Lab prompt is itself private/sovereign (e.g. testing models on a sensitive draft), it runs **local-only** and may persist NAS-side (`wf-model-lab-store`) rather than cloud — the same TLC-firewall invariant as DR-0073 (privacy outranks convenience; private work never reaches a vendor, and here, optionally, never leaves the NAS).
- **Exportable + deletable.** Runs/votes export and delete on family command, immediately and verifiably (the eight binding behaviors).

---

## 9. MVP-now vs full-later (honest sequencing)

**The honest constraint:** multi-model compare on the **CPU NAS is minutes-slow**. Dense `qwen2.5:14b` decodes at **2–4 tok/s**; running two models for one prompt is two of those, sequentially. A real answer is *minutes*, not seconds. That's fine for an **async, come-back-later** judging session; it is **not** a snappy live arena. The arena gets real when models are pulled (especially the **30B-A3B MoE** that's 3–6× faster) and **truly real on the GPU box** (real-time fan-out).

### MVP — works TODAY (Tier B-able slice)
- Compare the **two models already on the NAS** (whatever `wf-llm-health`/`/api/tags` reports installed), one prompt, one task type.
- `wf-model-lab-run` calls each sequentially; the surface shows a **"running… ~N min on CPU"** honest progress state, then renders both answers when done (async — the family kicks it off and comes back; no spinner-hostage).
- **Pairwise vote only** (A vs B), blind, one quality axis.
- Votes persist; a minimal **per-task tally** ("A preferred 3 of 4") shows — with **n** visible.
- **No auto-routing.** The tally is read-only advisory. Routing stays manual.
- Ships **inactive**, turned on watched (Tier C posture for the autonomous-compute corner, even though human-triggered).

This MVP proves the loop end-to-end on real hardware with zero new model pulls. It is deliberately small: **one prompt, two models, pairwise, no routing write-back.**

### Full — when models are pulled + ideally GPU box lands
- N-model fleets (toggle any installed model on/off), parallel fan-out on GPU.
- Elo ranking across many runs, per task type, with rank-all mode.
- **Routing write-back** (advisory → Governor-confirmed preference per tier).
- **Keep/pull/drop** recommendations wired to the model-picks menu defaults.
- The DR-0063 competence ledger fully populated; vendor-vs-local (machine-judged) and local-vs-local (family-judged) sit in one decision history.
- Optional: auto-replay a saved "situation suite" against a newly-pulled model so a new model from the `wf-model-watch` reel (model-picks §7) gets judged the day it lands.

---

## 10. Risk tier + brakes (why Tier C)

| Concern | Mitigation |
|---|---|
| **Drives real NAS compute** (could thrash the CPU, echo the 2026-06-06 runaway) | Single-instance queue (concurrency lock) + per-run budget ceiling + heartbeat kill-switch. Human-triggered only — no scheduler, no unattended spend. |
| **Writes into routing** (a bad ranking could mis-route real work) | Advisory only; routing change is **human-confirmed** (Governor), never auto-flipped. `n_votes` gates any suggestion; low-n shows "not yet judged." |
| **Real-data trust surface** (DR-0076) | Every number is a measured run; zero-vote models show honest "not judged"; rankings carry their sample size. Aggregation is a pure, proven-to-catch function. |
| **Privacy** | Owner/family-scoped, anon-denied, no surveillance, private prompts run local-only. |

**Verdict: Tier C.** It touches routing identity *and* drives autonomous-ish compute. Build it, ship it **inactive**, turn it on with someone watching. The MVP slice (§9) is the smallest piece that earns a **Tier B** soak on its own (read-only tally, no routing write-back, human-triggered) — that's the recommended first cut.

---

## 11. Open questions (for Darrell)

1. **Default home: cloud or NAS?** Cloud Supabase (family app default, easy) vs NAS-only (fully sovereign, matches "internal surfaces live on the NAS"). Spec supports both; which is the default for *this* surface?
2. **Pairwise vs rank-all as the primary** — pairwise is the lower-friction default; is rank-all wanted in the MVP or deferred to full?
3. **Who votes** — Darrell + Christina only, or any family member? (Sets the `voter` allowlist and the per-voter view.)
4. **Situation suite** — do we want a saved set of standard "situations" (one per task type) to replay against every new model, or always ad-hoc prompts?
5. **Vendor in the arena?** Today the Lab is **local-vs-local** (sovereign). Do we ever want a vendor answer in the blind compare (judged, never auto-called) — folding DR-0063's local-vs-vendor into the *same* human-judged arena? (Privacy gate would have to hold: a private prompt never gets a vendor contestant.)

---

*Spec only. No model pulled, no table created, no routing changed. The build follows when models are pulled and ideally when the GPU box (DR-0053) lands; the §9 MVP runs today on the two NAS models to prove the loop. Grounded in `LOCAL-LLM-MODEL-PICKS.md` (the menu), DR-0073 (the routing policy it tunes), DR-0063 (the competence-ledger discipline it extends to human judgment), and the `LlmHealth`/`orchestrator-v05` plumbing it reuses.*
