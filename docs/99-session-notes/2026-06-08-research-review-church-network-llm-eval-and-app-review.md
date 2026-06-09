# Research Review — Church-Network LLM Evaluation + Sovereign App-Review Timeline

**Date:** 2026-06-08 (Mon)
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — evaluate new/candidate LLMs for the Church network (COLG sovereign NAS node + the Church per-industry LLM team), and give realistic timelines for (1) the LLM evaluation itself and (2) the sovereign team beginning to continuously review the PoeTech App. **Rev. 2** folds in Darrell's additions: RTX 4070 (CUDA) hardware correction, a first-class GPU-scheduling policy (human-presence preemption → service blackout → Sabbath), and the COLG calendar as the blackout source of truth.
**Status:** Research-review. **No code, no workflow changes, nothing applied to the NAS.** Decision support only.
**Output gate:** binding filters — `project-cost-discipline-with-growth-permission`, `project-sovereign-llm-teams-per-industry`, `feedback-autonomous-automation-three-brakes` (CLAUDE.md "Three Brakes"), RELEASE-TIERS Tier C, the TLC firewall.
**Pairs with:** `infra/ai-orchestrator/` (the Cage), `CLAUDE-TOOL-ROUTING.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (P10/P11/P12), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`, `2026-06-01-research-review-sovereign-llm-teams-architecture.md`, the Bishop Gwin / COLG migration brief.

---

## TL;DR (read this first)

- **The App-review use case does NOT depend on the COLG node or the Bishop Gwin gate.** Reviewing *Darrell's own* PoeTech App is Dev/Ops work on *Darrell's own* sovereign hardware. The $14–19k COLG procurement + Bishop Gwin alignment gate are dependencies for *COLG-facing church-ops*, not for reviewing the App. **This decoupling is the MVP unlock** (per `feedback-surface-premise-conflicts`).
- **Compute is NVIDIA RTX 4070 (CUDA).** Darrell said "4070's" (plural) — **assumption flagged for confirmation: two RTX 4070 12 GB cards.** Whether they are *two separate boxes* (Node 1 + Node 2, per the Cage blueprint) or *two cards in one box* materially changes what fits (see §1). 1× 4070 = a 14B ceiling; 2× 4070 in one box (~24 GB) unlocks the 30B-A3B class.
- **Top sovereign candidates (mid-2026):** `qwen2.5-coder:14b` / `qwen3:14b` (Apache-2.0, fit 12 GB) for a single 4070 today; `qwen3-coder:30b-a3b` (Apache-2.0, ~22 GB Q4) once two cards share a box; GLM-5.1 (MIT) / DeepSeek V4 (MIT) as the heavy clean-path options on the dual-3090 box; `nomic-embed-text` / Qwen3-Embedding / BGE-M3 for retrieval.
- **GPU scheduling is now a first-class brake (§3).** Three layers of yield, in priority order: **(a) human-presence preemption** — humans actively using the system instantly reclaim the GPU; review jobs suspend and resume when the human is done (a 4th, demand-driven brake / human-demand kill-switch); **(b) service-window blackout** — no LLM compute from 1 h before to 1 h after each church service/event; **(c) 24/6.5 Sabbath rest** — a 12 h Sunday pause. They stack.
- **Blackout is calendar-driven.** COLG's site (`thechurchofthelivinggod.com`) publishes services as a **static monthly JPG — not a machine-readable feed.** Recurring services confirmed: **Sun Worship 11 AM, Wed Bible Study 1 PM & 6 PM** (matches known cadence — no discrepancy). Short-term: a small manual `service-calendar.json`; clean path: ask COLG to publish a Google-Calendar **iCal/ICS** feed the blackout scheduler subscribes to as live truth.
- **Timelines anchored to 2026-06-08:**
  - **(a) LLM evaluation:** ~5 weeks → done **by ~2026-07-11** on a 4070; CPU-only-on-DS1621xs fallback adds 2–4 weeks.
  - **(b) Sovereign team begins reviewing the App:** *MVP-pragmatic earliest* **~2026-07-27** (read-only, single 14B, Node 1's 4070, behind the Cage, all three+1 brakes incl. the GPU-yield scheduler, 24/6.5); *clean path* **Q4 2026 (Oct–Nov)** (dual-3090 box, multi-model, guarded mutations, COLG iCal subscription).
- **Recommendation:** take the MVP path now on Node 1; build the GPU-yield + blackout scheduler as a required brake; do NOT block App-review on COLG procurement. Ship **inactive**, turn on **read-only** with someone watching, prove the brakes for one full 24/6.5 week, then graduate.

---

## 1. Candidate LLMs to evaluate

> **Freshness caveat.** Training cutoff is January 2026; the model names, benchmarks, and licenses below are from June 2026 web sources (cited) and move fast. **Re-verify every figure at eval time** — that is what §2 is for. Treat this as the shortlist to benchmark, not settled truth.

### Hardware envelope — RTX 4070 (CUDA) corrected

| Box | Spec | VRAM | Role |
|---|---|---|---|
| **DS1621xs** (existing NAS) | Xeon D-1527 4c/8t, 32 GB ECC, CPU-only | n/a (RAM-bound) | Registry (Postgres+pgvector), batch-only inference, embeddings |
| **Node 1** (Legion PC, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Daily-driver review inference; one 14B + one embedder resident (`OLLAMA_MAX_LOADED_MODELS=2`) |
| **Node 2** (Church Switcher, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Church A/V (NDI/OBS/Proclaim). **Forbidden during active church hours** — generally NOT a review card |
| **Planned GPU box** (`AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` Opt. 2) | 2× used RTX 3090 | **48 GB** combined (~$2,000) | Clean-path parallel multi-model; 30B–70B class |

**The "4070's" question — flagged for confirmation.** Two interpretations, and they change the candidate set:

- **Interpretation A (most likely, per the Cage blueprint): two *separate* boxes**, each 1× RTX 4070 12 GB — Node 1 (Legion PC, the review box) and Node 2 (Church Switcher, A/V, off during services). These are **not** a 24 GB pool; they don't tensor-parallel across the LAN at usable latency. **The review reasoner is effectively 1× 12 GB on Node 1 → a 14B ceiling.** Node 2 could run a *second, independent* 14B specialist, but only off church hours.
- **Interpretation B: two cards in *one* box** (e.g., both in Node 1, or a future build) → **~24 GB combined via tensor parallelism (vLLM) or sequential offload (Ollama)** → unlocks the **30B-A3B / 27–32B / Devstral 24B** class (tight). This is materially better and is the cheap on-ramp short of the dual-3090.
- **Note on 4070 variants:** base/SUPER 4070 = 12 GB; a **4070 Ti SUPER = 16 GB**. If the cards are Ti SUPERs, single-card headroom rises to 16 GB (Devstral 24B Q4 ~16 GB becomes borderline-viable on one card). **Confirm the exact model.**

The Cage's own `docker-compose.yml` is explicit for the single-card case: *"qwen2.5:14b-instruct-q4_K_M fits the 12 GB VRAM without CPU spillover… One 14B resident at a time on a 4070. Never pull 32B+ here."* So **30B-class candidates are 2×-4070-in-one-box or GPU-box candidates, never single-4070 candidates.**

### Sovereignty-tier scale (defined for this eval)

The repo's "sovereign mesh" is the **Sovereignty-First Install Pattern** (autonomy gates before convenience), not a formal model tiering — so I define a 4-level **sovereign-mesh-compatibility** scale for scoring:

- **S1 — Fully sovereign / air-gap capable:** open weights, permissive license (Apache-2.0 / MIT), runs on a single 4070 or the NAS, zero callback. Best mesh fit; survives an ISP/power event.
- **S2 — Sovereign, hardware-gated:** open weights + permissive license, but size forces 2× 4070 or the GPU box (won't fit one 12 GB card). Still zero egress.
- **S3 — Sovereign-capable but impractical now:** open weights, but needs VRAM beyond the dual-3090 plan; sovereign only after a larger buy.
- **S4 — Not sovereign:** vendor API (Claude/Gemini). Escalation-only per `CLAUDE-TOOL-ROUTING.md`; **never** for TLC. The ceiling/contrast, not a sovereign-team member.

### A. Code-review / reasoning candidates (re-sanitized for 1× vs 2× 4070)

| Model | Params | Fit | VRAM @ Q4 | Runs on | License | Sov. | Cost screen |
|---|---|---|---|---|---|---|---|
| **Qwen2.5-Coder 14B** | 14B dense | Strong code-review; non-MoE; current Cage `OLLAMA_CODER_MODEL` | ~9 GB Q4 / fits 12 GB at Q5_K_M | **1× 4070** | Apache-2.0 | **S1** | $0 marginal. The lean default; already in the blueprint. |
| **Qwen3 14B** | 14B dense | Better reasoning on a budget; ~61 tok/s on 12 GB | ~8.5 GB Q4 | **1× 4070** | Apache-2.0 | **S1** | $0 marginal. Lean reasoning pick. |
| **Qwen3-Coder 30B-A3B** | 30.5B MoE (3B active) | Best sovereign agentic-review value; MoE keeps it fast | ~22 GB Q4_K_M (26 GB recommended) | **2× 4070 (one box, tight)** or GPU box | Apache-2.0 | **S2** | $0 marginal on owned GPU. Lean alt to GLM/DeepSeek; MoE = best perf/cost. |
| **Qwen3.6-27B** | 27B dense | Strong all-rounder | ~16–20 GB Q4 | **2× 4070** or GPU box | Apache-2.0 | **S2** | $0 marginal. Dense alt if MoE proves flaky on review. |
| **Devstral Small 24B** | 24B | Purpose-built agentic coding | ~16 GB Q4 | **2× 4070** (or 1× 16 GB Ti SUPER, tight) | Apache-2.0 | **S2** | $0 marginal. Agentic-coding specialist. |
| **GLM-5.1** | large MoE | Top open agentic coder; #1 SWE-bench Pro (~58%); 600+ tool-call loops | 48 GB tight at low quant; realistically multi-GPU | **dual-3090 (aggressive quant) → S3 at full** | **MIT** | **S2/S3** | $0 marginal but heavy. Clean-path heavy. |
| **DeepSeek V4** | large MoE | Best perf-to-inference-cost of the frontier-open class | multi-GPU at usable quant | **dual-3090 / beyond** | **MIT** | **S2/S3** | $0 marginal; strong heavy-reasoning fallback. |
| Gemma 4 27B | 27B | Strong general | ~16–20 GB | 2× 4070 / GPU box | Gemma terms | S2 | $0 marginal; license less permissive than Apache/MIT — screen first. |
| **Claude / Gemini** | vendor | Frontier ceiling; the escalation reasoner | n/a | vendor API | proprietary | **S4** | **$$** metered; $25/mo soft, $50/mo hard. Escalation-only; **never** TLC. Benchmark *against*, don't deploy *as*. |

### B. Retrieval / embedding candidates (code RAG over the repo)

| Model | Fit | Runs on | License | Sov. | Note |
|---|---|---|---|---|---|
| **nomic-embed-text** | Current Cage `OLLAMA_EMBEDDING_MODEL`; fast, proven | DS1621xs / 1× 4070 | Apache-2.0 | **S1** | Keep as default; high throughput. |
| **Qwen3-Embedding (0.6B/4B/8B)** | Rivals commercial APIs; same family as the reasoner | DS1621xs (0.6B) / 4070 (4B+) | Apache-2.0 | **S1** | Strong upgrade candidate. |
| **BGE-M3** | Best quality-cost for self-hosted RAG | DS1621xs / 4070 | MIT | **S1** | Multilingual; robust hybrid retrieval. |

**Read:** the daily driver is a **14B coder on one 4070 today (S1)**, embeddings on the DS1621xs/4070 (S1). The **30B-A3B becomes reachable the moment two 4070s share a box (S2)** — the cheapest meaningful capability jump. GLM-5.1 / DeepSeek-V4 heavies are **dual-3090 clean-path (S2/S3)**. Vendor frontier is the **benchmark ceiling (S4)**, not a member.

---

## 2. Evaluation methodology

**Goal:** pick the smallest model that clears the bar for *continuous PoeTech-App code-review* on owned hardware — not the highest leaderboard score.

**Eval set (build from our own ground truth, ~40–60 items):**
1. **Real repo diffs with known verdicts** — past PRs + the post-incident commits (the wf27/builder runaway; the localStorage hydration leak in `LESSONS-LEARNED.md`). Did the model catch what we caught?
2. **Seeded-bug diffs** — inject known classes: missing try-catch on external I/O (PERPETUAL-PIPELINE-HEALTH); a timer-driven change missing a brake; a same-origin-rewrite regression; a TLC-firewall leak; **a GPU job that fails to yield to a human or ignores a blackout window.** Recall here is the headline metric.
3. **Retrieval probes** — "where is X enforced?" questions answerable only by reading the repo (e.g., "which file blocks UPDATE/DELETE on the ledger?" → `001-audit-ledger.sql`). Tests the RAG layer.
4. **False-positive control** — clean diffs that should pass untouched. Over-flagging is a failure mode; measure it.

**Scoring (weighted):** recall on seeded+real bugs (heaviest) · precision / false-positive rate · groundedness (cites the real file/line, auto-checkable) · latency/throughput on the target box (must finish inside the off-hours window) · cost ($0 for S1/S2, metered for the S4 ceiling).

**Who/what judges:** automated first pass (seeded bugs have known answers; groundedness auto-checks citations) → LLM-judge panel (a *vendor* frontier model S4, escalation-only, **repo code only — no clinical content** + a second sovereign model), adversarial *refute-each-finding* framing to suppress plausible-but-wrong flags → human spot-check (Darrell / Quality Gatekeeper signs the Tier-C gate). The **TLC firewall holds throughout**: the App-review corpus is repo code only — no PHI — so the vendor-judge round is clean.

---

## 3. What "review the PoeTech App" means operationally — behind the Cage

The sovereign reviewer is a **per-industry LLM team** (the 2026-06-01 sense: *model + system prompt + tool list + RAG corpus + pre-authorized policy*) — here the **Dev/Ops Foundation Team** (Pilot #1) pointed at the PoeTech repo + running app.

**What it does (escalating scope):** (1) **continuous code-review** — on each push/PR + a scheduled sweep, pull the diff, RAG the repo, emit findings (correctness, PERPETUAL-PIPELINE-HEALTH violations, missing brakes on timer-driven changes, TLC-firewall leaks, same-origin regressions); (2) **QA** — run/observe the test suite + preview, flag regressions; (3) **observability** — watch health surfaces + the `_reel.jsonl` / dispatch-status feeds, correlate findings with runtime behavior.

**Everything rides behind the Cage** (`infra/ai-orchestrator/`): **read-only first** — findings are *proposals* written to the append-only, hash-chained `ai_audit_ledger` (decision = `proposed`); no mutation in the MVP. Any future write goes through the **guarded-action wrapper** (allowlist + VLAN guard + ledger row + **120 s Uptime-Kuma health gate with auto-rollback**). The ledger box (NAS) is not the box the agent runs on — separation of powers holds.

**The brakes (mandatory — this class is Tier C, per CLAUDE.md + LESSONS-LEARNED P10/P11/P12):**

| Brake | Implementation for the reviewer |
|---|---|
| **1. Budget** | Per-run token/turn/wall-clock ceiling. A pass that hits the ceiling **terminates itself.** Aggregate = the $0 sovereign path; the S4 judge stays under the $25 soft / $50 hard vendor cap. |
| **2. Concurrency lock** | Single-instance. A scheduled fire that finds the prior pass still running **SKIPS** — never stacks (the exact wf27/builder runaway failure mode). |
| **3. Kill-switch** | Dead-man's-switch on overrun / repeated failure / missed heartbeat → **auto-pause**, never auto-continue. Plus the weekly **Sabbath cooldown** (§4c). |
| **4. Human-demand preemption** *(new — see §4a)* | A human actively using the system instantly reclaims the GPU; the review job **suspends and resumes** when the human is done. A real-time, demand-driven kill-switch that complements brakes 1–3. |

This class **ships inactive**, goes live **read-only with someone watching**, and is **never** switched on unattended or during a travel window (P11). "NAS-only sovereign surface" does **not** downgrade it from Tier C (P12).

---

## 4. GPU scheduling — three layers of yield (first-class section)

The review fleet shares CUDA GPUs with **humans** and with **church A/V**. It must always be the lowest-priority tenant. Three layers of yield, in strict priority order — **a human beats a service window beats the Sabbath beats the review job**:

### (a) Human-presence preemption — the primary ask ("even better")

**Whenever a human is actively using the system, LLM background processes immediately yield CUDA/GPU bandwidth to the human.** Humans get GPU priority; review jobs suspend or throttle and resume when the human is done. This is **real-time, demand-based preemption**, and it is framed as the **4th brake** — a human-demand kill-switch.

How it works (concrete, sovereign, no vendor dependency):
- **Demand sensor (poll ~1–5 s):** detect human GPU/system demand by any of — a non-Ollama CUDA process on the card (`nvidia-smi --query-compute-apps`, e.g. OBS/Proclaim/a browser doing WebGL, a game); an active desktop/login session or recent input activity on Node 1; a live request to the PoeTech PWA / Council Chamber (the app pings a "human-active" endpoint).
- **Yield action (within ~1 s of demand):** signal the review worker to **pause** (cancel-and-requeue the in-flight inference; or `SIGSTOP` the Ollama request), and **free VRAM** (`OLLAMA_KEEP_ALIVE=0` to unload the model) so the human gets the full 12 GB. The concurrency lock (brake 2) guarantees only one worker exists to pause.
- **Resume with hysteresis:** the job resumes only after a **quiet cooldown** (e.g. 5 min of no human demand) so it never thrashes on/off. Resumption re-checks the blackout (4b) and Sabbath (4c) gates first.
- **Why this is also a brake:** a runaway that ignored a human would be both a UX failure *and* a compute-safety failure; making human-demand a hard preempt means the worst case for a person at the keyboard is a brief pause of *their* work, never contention.

### (b) Service-window blackout — calendar-driven

**No LLM compute from 1 hour BEFORE to 1 hour AFTER each church service/event.** This protects the shared A/V cards (Node 2's 4070 runs NDI/OBS/Proclaim; the Cage already forbids model inference during Sun/Wed services because OBS NVENC + a 9 GB model contend for the same 12 GB). The blackout generalizes that from "during the service" to a ±1 h buffer.

**Source of truth — the COLG calendar (fetched 2026-06-08):**

| Service | Day/Time (confirmed on `thechurchofthelivinggod.com`) | Blackout window (±1 h; assumes ~2 h service — tune per real duration) |
|---|---|---|
| Sunday Worship Experience | **Sun 11:00 AM** | **Sun 10:00 AM – 2:00 PM** |
| Wednesday Bible Study (afternoon) | **Wed 1:00 PM** | **Wed 12:00 PM – 3:30 PM** (1.5 h service) |
| Wednesday Bible Study (evening) | **Wed 6:00 PM** | **Wed 5:00 PM – 8:30 PM** (1.5 h service) |
| Office hours (staff present) | **Mon–Fri 11:00 AM – 6:00 PM** | *Not a hard blackout* — handled dynamically by human-presence preemption (4a), since staff presence is intermittent, not constant. |

**Reconciliation:** the site's recurring services (Sun 11 AM, Wed 1 PM & 6 PM) **match the known COLG cadence exactly — no discrepancy.** Special one-off events appear only as a **static monthly JPG** (`/uploads/.../06-june-calendar_orig.jpg`); there is **no iCal/ICS, Google-Calendar iframe, or RSS feed** on the site.

**Implication for the scheduler:**
- **Short-term (MVP):** a small, version-controlled `service-calendar.json` on the NAS encoding the three recurring windows + any special events transcribed by hand from the monthly JPG. Cheap, deterministic, auditable.
- **Optional middle:** OCR/vision-extract the monthly JPG into structured events (we have the vision/Whisper pipeline) — but a human confirms output before it drives a blackout (VISION-FAIRNESS-STANDARD posture: don't trust an unverified extraction to gate compute).
- **Clean path (recommended):** **ask COLG/Bishop Gwin's team to publish a public Google-Calendar iCal/ICS feed.** The blackout scheduler then **subscribes to it as the live source of truth** and windows auto-update — special events included — with no manual transcription. This is a small ask that makes the whole thing self-maintaining; frame it as a BUSINESS-PROCESS-CONNECTION (the visible promise "the reviewer rests during services" needs the calendar pipeline wired).

### (c) 24/6.5 Sabbath rest — the weekly forced cooldown

**Operating schedule (hard constraint): 24 h/day, 6.5 days/week — explicitly NOT 24/7.** **Sabbath rest window: every Sunday, 00:00–12:00 America/Chicago (Central) — a 12 h pause = the 0.5 day.** All review automation is **paused by default** in this window (the kill-switch's resting state, not an exception); the GPU is freed for Sunday-service A/V; the heartbeat watchdog **expects silence** so the pause is not flagged as a fault. It covers pre-dawn through the close of the main Sunday worship block — the Lord's Day, and the heaviest church A/V demand. It is observance *and* engineering: **a forced weekly cooldown no run can skip.** If the Sunday pause ever *fails to engage*, that is itself a kill-switch trip — the watchdog pages and the fleet pauses.

### GPU yield + blackout architecture — how a/b/c stack

A single **gate function** evaluates, in priority order, before any review pass is allowed to hold the GPU:

```
may_run() =
  NOT human_present()          # (4a) real-time preempt — highest priority, ~1s reaction
  AND NOT in_service_blackout() # (4b) ±1h around each calendar service (iCal/JSON-driven)
  AND NOT in_sabbath_window()   # (4c) Sun 00:00-12:00 Central
  AND brakes_ok()              # (1) budget left  (2) no other instance  (3) watchdog healthy
  -> else: PAUSE, free VRAM, requeue, re-check on the next tick
```

```
Priority ladder (who wins the GPU):
  1. HUMAN at the keyboard / using the PWA   --> instant preempt (4a)   [seconds]
  2. Church service +/- 1h                    --> blackout (4b)          [calendar]
  3. Sunday 00:00-12:00 Sabbath               --> rest (4c)             [weekly]
  4. Review job                               --> runs only in the gaps  [lowest]
```

Net effect: the reviewer runs at most ~156 h/week (24×6.5), minus service blackouts, minus every moment a human wants the GPU. **The review job is always the lowest-priority tenant** — it fills the gaps and never competes. Each layer is independently a brake; together they make compute-runaway and human-contention structurally impossible, not merely discouraged.

---

## 5. Timelines — two tracks, anchored to 2026-06-08

> Assumes Darrell's go-ahead and that Node 1 (Legion PC + RTX 4070) is on hand or stood up in parallel. The Cage is a *just-merged blueprint* — if Node 1 isn't physically running yet, add its standup (Linux + CUDA drivers + Ollama + the Cage stack: ~1 day of work, ~1 week of calendar) to the front of both tracks. **Rev. 2 adds the GPU-yield + blackout scheduler build to Track (b).**

### Track (a) — LLM evaluation

| Phase | Work | Window |
|---|---|---|
| **0. Harness + eval set** | Build the ~40–60-item eval set (§2) from real diffs + seeded bugs (incl. the new "fails to yield / ignores blackout" class); wire automated scoring | **2026-06-09 → 2026-06-20** (~2 wk) |
| **1. Benchmark candidates** | Pull + run the shortlist: 14B class on 1× 4070; 30B-A3B if two cards share a box or the GPU box exists; batch the heavies off-hours | **2026-06-22 → 2026-07-04** (~2 wk) |
| **2. Score + judge + pick** | Automated metrics + LLM-judge panel + human spot-check; pick the smallest model that clears the bar | **2026-07-06 → 2026-07-11** (~1 wk) |
| | **Evaluation complete** | **~2026-07-11** |

**CPU-only fallback:** no GPU → eval on the DS1621xs is batch-only (sub-1 tok/s for 30B; 3–8 tok/s for 7B) → **add 2–4 weeks** (→ late July / early Aug). The GPU, not COLG, is the gating dependency.

### Track (b) — Sovereign team begins reviewing the App

**MVP-pragmatic earliest path (recommended start):**

| Step | Window |
|---|---|
| Stand up Dev/Ops reviewer team config (system prompt + repo RAG + read-only policy) behind the Cage on Node 1; wire brakes 1–3 | overlaps eval, **late June → mid-July** |
| **Build the GPU-yield + blackout scheduler** — human-presence demand sensor + yield/resume (brake 4), `service-calendar.json` from the confirmed Sun/Wed windows, the `may_run()` gate (§4) | **~2026-07-13 → 2026-07-22** (~1.5 wk) |
| Ship **inactive** → turn on **read-only** with Darrell watching → run one full **24/6.5 week** proving all four brakes + the priority ladder | **~2026-07-22 → 2026-07-27** |
| **Sovereign team reviewing the App (read-only, proposals to the ledger):** | **live ~2026-07-27** |

- Needs **none** of: the $14–19k COLG procurement, the Bishop Gwin gate, or the dual-3090 box. It runs a **14B S1 model on Node 1's existing 4070**, read-only, $0 marginal.
- The GPU-yield scheduler is the one piece Rev. 2 adds to the critical path (~1.5 wk), shifting the read-only go-live from ~Jul 20 to **~Jul 27**. Worth it: human-presence preemption is the primary ask and a required brake.

**Clean path (the showcase version):**

| Dependency | Effect on timeline |
|---|---|
| **2× 4070 in one box** (cheap interim) → ~24 GB → 30B-A3B class | days–1 wk if the second card is on hand; unlocks S2 reasoners short of the dual-3090 |
| **Dual-3090 GPU box** (Opt. 2, ~$2,000) — procure + build + validate tensor-parallel | ~2–4 wk once greenlit → 30B/70B parallel multi-model + guarded auto-fix |
| **Graduate to guarded mutations** (auto-label/comment/fix via guarded-action + health-gate) after the read-only soak proves clean | +30–60 day soak (Tier B→C discipline) |
| **COLG iCal feed** published by Bishop Gwin's team → blackout scheduler subscribes as live truth | small ask; removes manual calendar upkeep |
| **COLG node hosting** (only if the reviewer is *showcased on COLG's own node*): $14–19k procurement **+ Bishop Gwin alignment gate** | relationship-paced, **weeks–months**; keep OFF the App-review critical path |
| | **Clean-path App-review (GPU box, multi-model, guarded, iCal-driven blackout): Q4 2026 (Oct–Nov)** |

**Dependency map (the one thing to get right):**

```
App-review (Darrell's app)              COLG church-ops (Bishop Gwin's people)
  ├── Node 1 / 1x 4070   ✅ now           ├── $14-19k COLG NAS procurement
  ├── the Cage           ✅ merged        ├── Bishop Gwin alignment gate
  ├── a 14B S1 model     ✅ now           ├── COLG-first Church Ops team
  ├── brakes 1-3         build            └── (optional) COLG iCal feed
  └── GPU-yield+blackout build (~1.5wk)
        │                                  (these gate the COLG node,
        └── MVP live ~Jul 27               NOT the App review)

  Optional later: 2x 4070-in-a-box -> 30B-A3B; dual-3090 -> clean path Q4 2026
  Optional later: host the reviewer ON the COLG node = a showcase,
                  AFTER the Bishop Gwin gate -- never a blocker for it.
```

---

## 6. Recommendation + rationale

**Recommendation: take the MVP path on Node 1 now. Build the GPU-yield + blackout scheduler as a required brake. Decouple App-review from COLG procurement. Default to the leanest S1 model that clears the eval.**

**What — and what not — because:**

1. **DO start App-review on Node 1's RTX 4070 in late July, read-only, behind the Cage, 24/6.5, with all four brakes.** *Because* it needs nothing we don't already have, costs $0 marginal, and puts the reviewer in production where it earns trust — the fastest honest path to value.
2. **DO build the GPU-yield + blackout scheduler before go-live, not after.** *Because* human-presence preemption is Darrell's primary ask and a genuine compute-safety brake; a reviewer that hogs the GPU from a person at the keyboard fails both UX and the Three-Brakes posture. The priority ladder (human > service > Sabbath > review job) makes contention structurally impossible.
3. **DO confirm the "4070's" topology before fixing the candidate set.** *Because* 1× 12 GB caps us at 14B (S1) while 2× in one box (~24 GB) unlocks 30B-A3B (S2) — the cheapest capability jump. State the assumption (two 12 GB cards, likely two boxes), confirm, and size accordingly. A 4070 Ti SUPER (16 GB) would shift the single-card ceiling.
4. **DO ship inactive and turn it on read-only with someone watching, for one full 24/6.5 week before anything writes.** *Because* the 2026-06-06 runaway is the precedent: timer-driven automation + nobody watching + no brakes = manual shutdown. The four brakes + the Sunday Sabbath + read-only-first mean the worst case is noise, not mutation (P10/P11/P12).
5. **DO default to a 14B Apache-2.0 model (Qwen2.5-Coder 14B / Qwen3 14B); reserve 30B-A3B / GLM-5.1 / DeepSeek-V4 for two-card / dual-3090 hardware.** *Because* the binding constraint is VRAM and the Cage already forbids 32B+ on one 4070; the smallest model that clears the bar wins on cost, latency, and the (now narrower) off-hours window.
6. **DO ask COLG to publish a public iCal/ICS calendar feed.** *Because* the site's calendar is a static JPG today; an iCal feed lets the blackout scheduler self-update (special events included) instead of relying on manual transcription — and it's a small, relationship-appropriate ask.
7. **DO NOT block App-review on the $14–19k COLG procurement or the Bishop Gwin gate.** *Because* reviewing Darrell's own app is Dev/Ops on Darrell's own hardware; coupling it to a relationship-paced five-figure church procurement would stall a July-shippable capability behind a Q4 dependency for no architectural reason. Hosting the reviewer *on* the COLG node later is a showcase, earned after the gate — never a prerequisite.
8. **DO NOT buy the dual-3090 box to start, and DO NOT let the reviewer mutate anything until the read-only soak is clean** — then graduate to guarded mutations through the existing allowlist + 120 s health-gate + ledger. *Because* the MVP runs on the 4070 we have; the box is the clean-path unlock, justified once value is proven and the eval says a 30B-class model is worth the VRAM. Earn the spend.

**One-line answer to the two questions asked:**
- **LLM evaluation:** ~5 weeks, **done by ~2026-07-11** (a 4070 on hand); +2–4 weeks if CPU-only.
- **Sovereign team begins reviewing the App:** **MVP ~2026-07-27** (read-only, Node 1's 4070, four brakes incl. GPU-yield + calendar blackout, 24/6.5); **clean path Q4 2026** (GPU box, multi-model, guarded mutations, iCal-driven blackout).

---

## Sources

**COLG service schedule (fetched 2026-06-08):**
- [Church of the Living God — homepage (service times)](https://thechurchofthelivinggod.com) — Sun Worship 11 AM; Wed Bible Study 1 PM & 6 PM; office hours M–F 11 AM–6 PM.
- [Church of the Living God — calendar page](https://thechurchofthelivinggod.com/calendar.html) — static monthly JPG; **no iCal/ICS/feed** present.

**External model landscape (June 2026 — re-verify at eval time):**
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

**Repo grounding (read before researching, per `feedback-research-first`):**
- `infra/ai-orchestrator/` — the Cage (Node 1/Node 2/Registry topology, both 1× RTX 4070 12 GB; guarded-action.sh, 001-audit-ledger.sql, Uptime-Kuma health gate, schedule boundary)
- `docs/00-foundations/_root/CLAUDE-TOOL-ROUTING.md` — Tier 0/1/2 routing, TLC firewall, $25/$50 cost caps
- `docs/00-foundations/_root/RELEASE-TIERS.md` — Tier C criteria for timer-driven automation
- `docs/00-foundations/_root/LESSONS-LEARNED.md` — 2026-06-06 runaway; principles P10/P11/P12
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` — Option 2 dual-3090 (~$2,000); CPU-only DS1621xs ceiling
- `docs/99-session-notes/2026-06-01-research-review-sovereign-llm-teams-architecture.md` — per-industry team = model+prompt+tools+RAG+policy; Dev/Ops as Pilot #1
- the Bishop Gwin / COLG migration brief — the COLG alignment gate
- `CLAUDE.md` — "Autonomous Automation Requires Three Brakes" (budget + concurrency lock + kill-switch)

---

*The default is sovereign. The human at the keyboard always wins the GPU. The reviewer rests around every service and on the Lord's Day. Four brakes hold, read-only first, someone watching. We start with the hardware we have, earn the spend, and never put a July capability behind a Q4 gate. We all win. We create. Amen.*
