# Research Review — Church-Network LLM Evaluation + Sovereign App-Review Timeline

**Date:** 2026-06-08 (Mon)
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — evaluate new/candidate LLMs for the Church network (COLG sovereign NAS node + the Church per-industry LLM team), and give realistic timelines for (1) the LLM evaluation itself and (2) the sovereign team beginning to continuously review the PoeTech App.
**Status:** Research-review. **No code, no workflow changes, nothing applied to the NAS.** Decision support only.
**Output gate:** binding filters — `project-cost-discipline-with-growth-permission`, `project-sovereign-llm-teams-per-industry`, `feedback-autonomous-automation-three-brakes` (CLAUDE.md "Three Brakes"), RELEASE-TIERS Tier C, the TLC firewall.
**Pairs with:** `infra/ai-orchestrator/` (the Cage), `CLAUDE-TOOL-ROUTING.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (P10/P11/P12), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`, `2026-06-01-research-review-sovereign-llm-teams-architecture.md`, the Bishop Gwin / COLG migration brief.

---

## TL;DR (read this first)

- **The App-review use case does NOT depend on the COLG node or the Bishop Gwin gate.** Reviewing *Darrell's own* PoeTech App is Dev/Ops work on *Darrell's own* sovereign hardware (Node 1's RTX 4070, the planned dual-GPU box). The $14–19k COLG procurement + Bishop Gwin alignment gate the prompt names as a dependency are dependencies for *COLG-facing church-ops*, not for reviewing the App. **This decoupling is the MVP unlock** — surfaced here per `feedback-surface-premise-conflicts`.
- **Top sovereign candidates (mid-2026):** `qwen3-coder:30b-a3b` (Apache-2.0, ~22 GB Q4) for the GPU box; `qwen2.5-coder:14b` / `qwen3:14b` (Apache-2.0, fits 12 GB) for Node 1 today; GLM-5.1 (MIT) and DeepSeek V4 (MIT) as the heavy clean-path options; `nomic-embed-text` / Qwen3-Embedding / BGE-M3 for retrieval.
- **Cadence is a hard constraint: 24/6.5, not 24/7.** A 12-hour **Sabbath rest window each Sunday (00:00–12:00 America/Chicago)** is both observance and engineered cooldown — the weekly forced kill-switch no run can skip. It stacks on the Cage's existing Wednesday-service compute freeze.
- **Timelines anchored to 2026-06-08:**
  - **(a) LLM evaluation:** ~5 weeks → done **by ~2026-07-11** on Node 1's 4070. CPU-only-on-DS1621xs fallback adds 2–4 weeks.
  - **(b) Sovereign team begins reviewing the App:**
    - *MVP-pragmatic earliest:* **~2026-07-13 to 2026-07-20** — read-only review, single 14B model, Node 1's 4070, behind the Cage, 24/6.5, three brakes.
    - *Clean path:* **Q4 2026 (Oct–Nov)** — dual-3090 box, multi-model team, guarded-mutation review, optionally showcased on the COLG node after the Bishop Gwin gate.
- **Recommendation: take the MVP path now on Node 1; do NOT block App-review on COLG procurement.** Ship it **inactive**, turn it on **read-only** with someone watching, prove the three brakes for one full 24/6.5 week, then graduate to guarded mutations and the GPU box.

---

## 1. Candidate LLMs to evaluate

> **Freshness caveat.** My training cutoff is January 2026; the model names, benchmark numbers, and licenses below are from June 2026 web sources (cited) and move fast. **Re-verify every figure at eval time** — that is exactly what the methodology in §2 is for. Treat this table as the shortlist to benchmark, not as settled truth.

### Hardware envelope we are fitting to

| Box | Spec | VRAM ceiling | Role |
|---|---|---|---|
| **DS1621xs** (existing NAS) | Xeon D-1527 4c/8t, 32 GB ECC, CPU-only | n/a (RAM-bound) | Registry (Postgres+pgvector), batch-only inference, embeddings |
| **Node 1** (Legion PC, in the Cage blueprint) | 1× RTX 4070 | **12 GB** | Daily-driver inference; one 14B + one embedder resident (`OLLAMA_MAX_LOADED_MODELS=2`) |
| **Planned GPU box** (`AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` Option 2) | 2× used RTX 3090 | **48 GB** combined (~$2,000) | True parallel multi-model serving; 30B–70B class |

Node 1's 12 GB is the binding constraint *today*. The Cage's own `docker-compose.yml` says it plainly: *"qwen2.5:14b-instruct-q4_K_M fits the 12 GB VRAM without CPU spillover… One 14B resident at a time on a 4070. Never pull 32B+ here."* The 30B-class candidates are **GPU-box candidates**, not Node-1 candidates.

### Sovereignty-tier scale (defined for this eval)

The repo's "sovereign mesh" is the **Sovereignty-First Install Pattern** (autonomy gates before convenience), not a formal 1–4 model tiering — so I define a 4-level **sovereign-mesh-compatibility** scale here for scoring:

- **S1 — Fully sovereign / air-gap capable:** open weights, permissive license (Apache-2.0 / MIT), runs entirely on-NAS or Node 1, zero callback. Best mesh fit; survives an ISP/power event.
- **S2 — Sovereign, hardware-gated:** open weights + permissive license, but size forces the GPU box (won't fit 12 GB). Still zero egress.
- **S3 — Sovereign-capable but impractical now:** open weights, but needs multi-GPU/enterprise VRAM beyond the dual-3090 plan; sovereign only after a larger buy.
- **S4 — Not sovereign:** vendor API (Claude/Gemini). Escalation-only per `CLAUDE-TOOL-ROUTING.md`; **never** for TLC clinical content. Listed as the ceiling/contrast, not a sovereign-team member.

### A. Code-review / reasoning candidates

| Model | Params | Fit (reasoning / code-review) | VRAM @ Q4 | Hardware | License | Sov. tier | Cost-efficiency screen |
|---|---|---|---|---|---|---|---|
| **Qwen2.5-Coder 14B** | 14B dense | Strong code-review; simple non-MoE inference; current Cage `OLLAMA_CODER_MODEL` | ~9 GB (Q4) / fits 12 GB at Q5_K_M | **Node 1 (4070) today** | Apache-2.0 | **S1** | $0 marginal. The lean default; already in the blueprint. |
| **Qwen3 14B** | 14B dense | Better reasoning than 2.5 on a budget; ~61 tok/s on 12 GB | ~8.5 GB (Q4) | **Node 1 (4070) today** | Apache-2.0 | **S1** | $0 marginal. Lean reasoning pick for Node 1. |
| **Qwen3-Coder 30B-A3B** | 30.5B MoE (3B active) | Best sovereign code-review/agentic value; MoE keeps it fast | ~22 GB (Q4_K_M); 26 GB recommended | **GPU box** (or 18 GB+ unified RAM, slow) | Apache-2.0 | **S2** | $0 marginal on owned GPU. Lean alt to GLM/DeepSeek; MoE = best perf/cost for self-host. |
| **Qwen3.6-27B** | 27B dense | Strong all-rounder; single-GPU | ~16–20 GB (Q4) | **GPU box** | Apache-2.0 | **S2** | $0 marginal. Dense alt if MoE proves flaky on review tasks. |
| **GLM-5.1** | large MoE | Top open agentic coder; #1 SWE-bench Pro (~58%); 600+ tool-call loops | 48 GB tight at low quant; realistically multi-GPU | **GPU box (aggressive quant) → S3 at full** | **MIT** | **S2/S3** | $0 marginal but heavy. Clean-path "ask the better model" local heavy. |
| **DeepSeek V4** | large MoE | Best perf-to-inference-cost ratio of the frontier-open class | multi-GPU at usable quant | **GPU box (quant) / beyond** | **MIT** | **S2/S3** | $0 marginal; strong heavy-reasoning fallback. |
| **Devstral Small 24B** | 24B | Purpose-built agentic coding | ~16 GB (Q4) | **GPU box** (too big for 12 GB) | Apache-2.0 | **S2** | $0 marginal. Agentic-coding specialist alt. |
| Gemma 4 27B | 27B | Strong general; single-GPU | ~16–20 GB | GPU box | Gemma terms | S2 | $0 marginal; license is less permissive than Apache/MIT — screen before adopting. |
| **Claude (Opus/Sonnet) / Gemini** | vendor | Frontier code-review ceiling; the escalation reasoner | n/a | vendor API | proprietary | **S4** | **$$** metered; $25/mo soft cap, $50/mo hard stop. Escalation-only; **never** TLC. Benchmark *against*, don't deploy *as* a sovereign team member. |

### B. Retrieval / embedding candidates (for "review the App" = code RAG over the repo)

| Model | Fit | Hardware | License | Sov. tier | Note |
|---|---|---|---|---|---|
| **nomic-embed-text** | Current Cage `OLLAMA_EMBEDDING_MODEL`; fast, proven | DS1621xs / Node 1 | Apache-2.0 | **S1** | Keep as default; high throughput. |
| **Qwen3-Embedding (0.6B/4B/8B)** | Rivals commercial APIs on retrieval; pairs with Qwen reasoners | DS1621xs (0.6B) / Node 1 (4B+) | Apache-2.0 | **S1** | Strong upgrade candidate; same-family as the reasoner. |
| **BGE-M3** | Best quality-cost for self-hosted production RAG | DS1621xs / Node 1 | MIT | **S1** | Multilingual; robust hybrid retrieval. |

**Read:** for App-review, the daily driver is a **14B coder on Node 1 today (S1)**, embeddings on the DS1621xs/Node 1 (S1), and the **30B-A3B / GLM-5.1 / DeepSeek-V4 heavies are GPU-box (S2/S3) clean-path** members. Vendor frontier is the **benchmark ceiling (S4)** the sovereign team is measured against — not a member of it.

---

## 2. Evaluation methodology

**Goal:** pick the smallest model that clears the bar for *continuous PoeTech-App code-review* on owned hardware — not the highest leaderboard score.

**Eval set (build from our own ground truth, ~40–60 items):**
1. **Real repo diffs with known verdicts** — past PRs and the post-incident commits (the wf27/builder runaway, the localStorage hydration leak in `LESSONS-LEARNED.md`). Did the model catch what we caught?
2. **Seeded-bug diffs** — inject known classes (missing try-catch on external I/O per PERPETUAL-PIPELINE-HEALTH; a timer-driven change missing a brake; a same-origin-rewrite regression; a TLC-firewall leak). Recall on these is the headline metric.
3. **Retrieval probes** — "where is X enforced?" questions answerable only by reading the repo (e.g., "which file blocks UPDATE/DELETE on the ledger?" → `001-audit-ledger.sql`). Tests the RAG layer, not just the reasoner.
4. **False-positive control** — clean diffs that should pass untouched. Over-flagging is a failure mode; measure it.

**Scoring (weighted):**
- **Recall on seeded + real bugs** (catch rate) — heaviest weight; a reviewer that misses the runaway class is disqualified.
- **Precision / false-positive rate** — noise kills trust (and burns the budget).
- **Groundedness** — does it cite the actual file/line, or hallucinate? (Auto-checkable against the repo.)
- **Latency / throughput** on the target box — must finish a review pass inside the off-hours window.
- **Cost** — $0 marginal for S1/S2; metered for the S4 ceiling.

**Who/what judges:**
- **Automated first pass** — seeded bugs have known answers; recall/precision compute mechanically. Groundedness auto-checks citations against the repo.
- **LLM-judge panel for the subjective dimensions** — a *vendor* frontier model (S4, escalation-only, on non-clinical repo content only) plus a second sovereign model score severity/clarity. Adversarial framing (try to *refute* each finding) to suppress plausible-but-wrong flags — the pattern from our own review discipline.
- **Human spot-check (Darrell / Quality Gatekeeper)** — final calibration on a sample; the Gatekeeper signs the Tier-C gate before anything goes active.
- **TLC firewall holds throughout:** no clinical content ever enters the eval, and the App-review corpus is repo code only — no PHI, so the vendor-judge round is clean.

---

## 3. What "review the PoeTech App" means operationally — behind the Cage, on 24/6.5

The sovereign reviewer is a **per-industry LLM team** in the `2026-06-01` architecture sense: *model + system prompt + tool list + RAG corpus + pre-authorized policy*. Here, the **Dev/Ops Foundation Team** (named Pilot #1 in that research) pointed at the PoeTech repo + running app.

**What it does (escalating scope):**
1. **Continuous code-review** — on each push/PR (and a scheduled sweep), pull the diff, RAG the repo for context, emit findings (correctness, PERPETUAL-PIPELINE-HEALTH violations, missing brakes on timer-driven changes, TLC-firewall leaks, same-origin-rewrite regressions).
2. **QA** — run/observe the test suite and preview; flag regressions.
3. **Observability** — watch the app's health surfaces and the `_reel.jsonl` / dispatch-status feeds; correlate review findings with runtime behavior.

**Everything rides behind the Cage** (`infra/ai-orchestrator/`):
- **Read-only first.** Findings are *proposals* written to the append-only, hash-chained `ai_audit_ledger` (decision = `proposed`). No mutation in the MVP.
- **Guarded-action wrapper** for any future write (auto-fix, label, comment): allowlist + VLAN guard + ledger row + **120 s Uptime-Kuma health gate with auto-rollback**. The ledger box (NAS) is *not* the box the agent runs on — separation of powers holds.
- **Health-gate** is the per-action brake already in the blueprint.

**The three brakes (mandatory — this class is Tier C, per CLAUDE.md + LESSONS-LEARNED P10/P11/P12):**

| Brake | Implementation for the reviewer |
|---|---|
| **1. Budget** | Per-run token/turn/wall-clock ceiling. A pass that hits the ceiling **terminates itself**. Aggregate cap = the $0 sovereign path; the S4 judge is held under the $25 soft / $50 hard vendor cap. |
| **2. Concurrency lock** | Single-instance. A scheduled fire that finds the prior pass still running **SKIPS** — never stacks. (This is the exact failure mode the wf27/builder runaway hit.) |
| **3. Kill-switch** | Dead-man's-switch on overrun / repeated failure / missed heartbeat → **auto-pause**, never auto-continue. Plus the weekly **Sabbath cooldown** below. |

### The 24/6.5 cadence and the Sabbath rest window

**Operating schedule (hard constraint): 24 hours/day, 6.5 days/week — explicitly NOT 24/7.**

- **Sabbath rest window: every Sunday, 00:00–12:00 America/Chicago (Central) — a 12-hour pause = the 0.5 day.** During this window **all review automation is paused by default** (the kill-switch's "off" is the resting state, not an exception), the GPU is freed for any Sunday-service A/V contention, and the heartbeat watchdog **expects silence** so the pause is not flagged as a fault.
- **Why this window:** it covers pre-dawn through the close of the main Sunday worship block — the Lord's Day, and the period of heaviest church A/V demand on the shared RTX 4070s. It is observance *and* engineering: a **forced weekly cooldown no run can skip**, the natural-kill-switch the Three-Brakes rule wants made structural rather than discretionary.
- **Stacks with the Cage's existing freeze:** the blueprint already forbids model inference during Sun/Wed services (OBS NVENC + a 9 GB model contend for the same 12 GB). The Sabbath window generalizes the Sunday half of that from "during services" to "the whole morning," and the Wednesday-service freeze remains.
- **Operationally:** the reviewer runs ~156 hours/week (24 × 6.5) instead of 168. The 12 missing hours are the brake. If the Sunday pause ever *fails to engage*, that is itself a kill-switch trip — the watchdog pages and the fleet pauses.

This class **ships inactive**, goes live **read-only with someone watching**, and is **never** switched on unattended or during a travel window (P11). "NAS-only sovereign surface" does **not** downgrade it from Tier C (P12).

---

## 4. Timelines — two tracks, anchored to 2026-06-08

> Date ranges assume Darrell's go-ahead and that Node 1 (the Legion PC + RTX 4070) is on hand or stood up in parallel. The Cage is a *just-merged blueprint* — if Node 1 is not yet physically running, add its standup (Linux + drivers + Ollama + the Cage stack: ~1 day of work, ~1 week of calendar) to the front of both tracks.

### Track (a) — LLM evaluation

| Phase | Work | Window |
|---|---|---|
| **0. Harness + eval set** | Build the ~40–60-item eval set (§2) from real repo diffs + seeded bugs; wire automated scoring | **2026-06-09 → 2026-06-20** (~2 wk) |
| **1. Benchmark candidates** | Pull + run the shortlist on Node 1's 4070 (14B class) and, if the GPU box exists, the 30B class; batch the heavies off-hours | **2026-06-22 → 2026-07-04** (~2 wk) |
| **2. Score + judge + pick** | Automated metrics + LLM-judge panel + human spot-check; pick the smallest model that clears the bar | **2026-07-06 → 2026-07-11** (~1 wk) |
| | **Evaluation complete** | **~2026-07-11** |

**CPU-only fallback:** if there is no GPU and the eval runs on the DS1621xs, big models are batch-only (sub-1 tok/s for 30B; 3–8 tok/s for 7B) — **add 2–4 weeks** (→ late July / early Aug). This is why the GPU is the gating dependency, not COLG.

### Track (b) — Sovereign team begins reviewing the App

**MVP-pragmatic earliest path (recommended start):**

| Step | Window |
|---|---|
| Stand up Dev/Ops reviewer team config (system prompt + repo RAG + read-only policy) behind the Cage on Node 1; wire the three brakes + Sabbath window | overlaps eval, **late June → mid-July** |
| Ship **inactive**, then turn on **read-only** with Darrell watching, run one full **24/6.5 week** to prove the brakes | **~2026-07-13 → 2026-07-20** |
| **Sovereign team reviewing the App (read-only, proposals to the ledger):** | **live ~2026-07-20** |

- Needs **none** of: the $14–19k COLG procurement, the Bishop Gwin gate, or the dual-3090 box. It runs a **14B S1 model on Node 1's existing 4070**, read-only, $0 marginal.
- This is the "is there a concrete blocker to *this month*" answer: **no** — Node 1 + the Cage + a 14B + three brakes + the Sabbath window is shippable in July.

**Clean path (the showcase version):**

| Dependency | Effect on timeline |
|---|---|
| **Dual-3090 GPU box** (Option 2, ~$2,000) — procure + build + validate tensor-parallel | ~2–4 weeks once greenlit → enables 30B/70B parallel multi-model team + guarded auto-fix |
| **Graduate to guarded mutations** (auto-label/comment/fix via guarded-action + health-gate) after read-only soak proves clean | +30–60 day soak (Tier B→C discipline) |
| **COLG node hosting** (only if the reviewer is showcased on COLG's own sovereign node): $14–19k procurement **+ Bishop Gwin alignment gate** | relationship-paced, **weeks-to-months**; do not put this on the App-review critical path |
| | **Clean-path App-review (GPU box, multi-model, guarded): Q4 2026 (Oct–Nov)** |

**Dependency map (the one thing to get right):**

```
App-review (Darrell's app)         COLG church-ops (Bishop Gwin's people)
  ├── Node 1 / 4070  ✅ now          ├── $14-19k COLG NAS procurement
  ├── the Cage       ✅ merged       ├── Bishop Gwin alignment gate
  ├── a 14B S1 model ✅ now          └── COLG-first Church Ops team
  └── three brakes + Sabbath        
        │                            (these gate the COLG node,
        └── MVP live ~Jul 20         NOT the App review)
        
  Optional later: dual-3090 box → clean path Q4 2026
  Optional later: host the reviewer ON the COLG node = a showcase,
                  AFTER the Bishop Gwin gate — never a blocker for it.
```

---

## 5. Recommendation + rationale

**Recommendation: take the MVP path on Node 1 now. Decouple App-review from COLG procurement. Default to the leanest S1 model that clears the eval.**

**What — and what not — because:**

1. **DO start App-review on Node 1's RTX 4070 in July, read-only, behind the Cage, 24/6.5.** *Because* it needs nothing we don't already have, it costs $0 marginal, and it puts the reviewer in production where it earns trust — the fastest honest path to value.
2. **DO ship it inactive and turn it on read-only with someone watching, for one full 24/6.5 week before anything writes.** *Because* the 2026-06-06 runaway is the exact precedent: timer-driven automation + nobody watching + no brakes = manual shutdown. The three brakes + the Sunday Sabbath cooldown are the structural fix (P10/P11/P12); read-only-first means the worst case is noise, not mutation.
3. **DO default to a 14B Apache-2.0 model (Qwen2.5-Coder 14B / Qwen3 14B) as the daily reviewer; reserve 30B-A3B / GLM-5.1 / DeepSeek-V4 for the GPU box.** *Because* Node 1's 12 GB is the binding constraint and the Cage already forbids 32B+ there; the smallest model that clears the bar wins on cost, latency, and the off-hours window.
4. **DO benchmark the vendor frontier (Claude/Gemini, S4) as the eval *ceiling*, not deploy it as a team member.** *Because* the routing doc makes vendor escalation-only and $-capped, and the sovereign-first default is the whole point — but knowing the gap to frontier tells us how much the sovereign reviewer is leaving on the table.
5. **DO NOT block App-review on the $14–19k COLG procurement or the Bishop Gwin gate.** *Because* reviewing Darrell's own app is Dev/Ops on Darrell's own hardware; coupling it to a relationship-paced, five-figure church procurement would stall a July-shippable capability behind a Q4 dependency for no architectural reason. Hosting the reviewer *on* the COLG node later is a showcase, earned after the gate — never a prerequisite.
6. **DO NOT buy the dual-3090 box to start.** *Because* the MVP runs on the 4070 we have; the box is the *clean-path* unlock (parallel multi-model + guarded auto-fix), justified once the read-only reviewer has proven its value and the eval says a 30B-class model is worth the VRAM. Cost-discipline with growth-permission: earn the spend.
7. **DO NOT let the reviewer mutate anything until the read-only soak is clean** — then graduate to guarded mutations through the existing allowlist + 120 s health-gate + ledger. *Because* every write is a blast-radius increase, and the Cage's separation-of-powers + auto-rollback is exactly the earned-trust ramp.

**One-line answer to the two questions asked:**
- **LLM evaluation:** ~5 weeks, **done by ~2026-07-11** (Node 1 GPU on hand); +2–4 weeks if CPU-only.
- **Sovereign team begins reviewing the App:** **MVP ~2026-07-20** (read-only, Node 1, three brakes, 24/6.5); **clean path Q4 2026** (GPU box, multi-model, guarded mutations).

---

## Sources

External model landscape (June 2026 — re-verify at eval time):
- [Best Open Source LLM 2026 Ranking + Ollama Guide — whatllm.org](https://whatllm.org/best-open-source-llm)
- [Best LLM for Coding in 2026: Ranked by Real Benchmarks — whatllm.org](https://whatllm.org/best-llm-for-coding)
- [Best Open-Source & Open-Weight Coding Models (2026) — kilo.ai](https://kilo.ai/open-source-models)
- [Best Open-Source LLMs for Agentic Coding in 2026 — MindStudio](https://www.mindstudio.ai/blog/best-open-source-llms-agentic-coding-2026)
- [Best Open-Source LLM Models in 2026 (license table) — Hugging Face / daya-shankar](https://huggingface.co/blog/daya-shankar/open-source-llms)
- [Qwen3-Coder 30B A3B VRAM Requirements — willitrunai.com](https://willitrunai.com/models/qwen-3-coder-30b-a3b)
- [Qwen3-Coder: How to Run Locally — Unsloth](https://unsloth.ai/docs/models/tutorials/qwen3-coder-how-to-run-locally)
- [Qwen3-Coder 30B: Hardware Requirements & Performance — arsturn.com](https://www.arsturn.com/blog/running-qwen3-coder-30b-at-full-context-memory-requirements-performance-tips)
- [Best Models to run on 12GB and 16GB VRAM — mayhemcode.com](https://www.mayhemcode.com/2026/05/best-models-to-run-on-12gb-and-16gb.html)
- [Qwen2.5-Coder 14B VRAM Requirements — willitrunai.com](https://willitrunai.com/blog/qwen-2-5-coder-14b-vram-requirements)
- [Best Open-Source Embedding Models in 2026 — BentoML](https://www.bentoml.com/blog/a-guide-to-open-source-embedding-models)
- [Best Embedding Model for RAG 2026 — Milvus](https://milvus.io/blog/choose-embedding-model-rag-2026.md)

Repo grounding (read before researching, per `feedback-research-first`):
- `infra/ai-orchestrator/` — the Cage (Node 1/Node 2/Registry topology, guarded-action.sh, 001-audit-ledger.sql, Uptime-Kuma health gate, schedule boundary)
- `docs/00-foundations/_root/CLAUDE-TOOL-ROUTING.md` — Tier 0/1/2 routing, TLC firewall, $25/$50 cost caps
- `docs/00-foundations/_root/RELEASE-TIERS.md` — Tier C criteria for timer-driven automation
- `docs/00-foundations/_root/LESSONS-LEARNED.md` — 2026-06-06 runaway; principles P10/P11/P12
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` — Option 2 dual-3090 (~$2,000)
- `docs/99-session-notes/2026-06-01-research-review-sovereign-llm-teams-architecture.md` — per-industry team = model+prompt+tools+RAG+policy; Dev/Ops as Pilot #1
- the Bishop Gwin / COLG migration brief — the COLG alignment gate
- `CLAUDE.md` — "Autonomous Automation Requires Three Brakes" (budget + concurrency lock + kill-switch)

---

*The default is sovereign. The reviewer rests on the Lord's Day. Three brakes hold, read-only first, someone watching. We start with the hardware we have, earn the spend, and never put a July capability behind a Q4 gate. We all win. We create. Amen.*
