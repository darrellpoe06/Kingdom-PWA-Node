# Research Review — Sovereign LLM Teams for the Three Entities: Evaluation, App-Review, and the Self-Updating Loop

**Date:** 2026-06-08 (Mon)
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — evaluate new/candidate LLMs for the Church network (COLG sovereign NAS node + the Church per-industry LLM team) and give realistic timelines for (1) the LLM evaluation and (2) the sovereign team beginning to continuously review/support the PoeTech App. **Rev. 3** folds in: RTX 4070 (CUDA) sizing; first-class GPU scheduling (human-presence preemption → service blackout → Sabbath); the COLG calendar as blackout source of truth; **(B)** a FUTURE phase for LLM-authored website/content updates; **(C)** the three-entity support framing (Church / TLC / PoeTech) each with its own sensitivity tier; **(D)** data-driven, re-baselined estimates; **(E)** the "for us, by us" self-updating loop through poetech.us.
**Status:** Research-review. **No code, no workflow changes, nothing applied to the NAS.** Decision support only.
**Output gate:** binding filters — `project-cost-discipline-with-growth-permission`, `project-sovereign-llm-teams-per-industry`, `feedback-autonomous-automation-three-brakes` (CLAUDE.md "Three Brakes"), RELEASE-TIERS Tier C, **the TLC firewall (binding, structural — see §2.2)**.
**Pairs with:** `infra/ai-orchestrator/` (the Cage), `CLAUDE-TOOL-ROUTING.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (P10/P11/P12), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`, `2026-06-01-research-review-sovereign-llm-teams-architecture.md`, the Bishop Gwin / COLG migration brief, `project-continuous-feedback-reel`, `INPUT-VISIBILITY-TO-CLAUDE`, `BUSINESS-PROCESS-CONNECTIONS`, `INSTITUTIONAL-MEMORY-EVENTS`, `EXECUTION-OUTCOME-OBSERVABILITY`, `WORKFLOW-MODULE-LIBRARY`, `project-brand-surface-hosting-map`, `project-non-denominational-word-first-body-undivided`.

---

## TL;DR (read this first)

- **The LLM team(s) support the business systems of THREE entities, each at its own sensitivity tier (§2):** **(1) the Church** (COLG / thechurchofthelivinggod.com) — doctrine-gated, human approval before any publish; **(2) TLC** (tlctherapysolutions.com, Christina's LCSW practice) — **HIGHEST ISOLATION: HIPAA/PHI, sovereign-only, the TLC firewall is a hard structural boundary, no vendor/cloud LLM on any TLC data path, ever**; **(3) the PoeTech App** (poetech.us) — code + product + marketing, lower sensitivity but still behind the Cage. The App-reviewer is the MVP instance of a pattern that generalizes to all three.
- **App-review does NOT depend on the COLG node or the Bishop Gwin gate** — it's Dev/Ops on Darrell's own hardware (`feedback-surface-premise-conflicts`). The $14–19k COLG procurement gates COLG church-ops, not the App.
- **Compute is NVIDIA RTX 4070 (CUDA).** "4070's" → **assumption flagged: two 12 GB cards.** Two separate boxes (Node 1 + Node 2, per the Cage) ⇒ a **14B ceiling** on the review card; two cards in one box (~24 GB) ⇒ unlocks the **30B-A3B** class. Confirm topology (§1).
- **Top sovereign candidates (mid-2026):** `qwen2.5-coder:14b` / `qwen3:14b` (Apache-2.0, fit 12 GB) on one 4070 today; `qwen3-coder:30b-a3b` (Apache-2.0, ~22 GB) on two cards / the dual-3090 box; GLM-5.1 (MIT) / DeepSeek V4 (MIT) heavies on dual-3090; `nomic-embed-text` / Qwen3-Embedding / BGE-M3 for retrieval.
- **GPU scheduling is a first-class brake (§4), three layers of yield in priority order:** **(a) human-presence preemption** (a human using the system instantly reclaims the GPU; review jobs suspend/resume — a 4th, demand-driven kill-switch); **(b) service-window blackout** (no compute 1 h before → 1 h after each service); **(c) 24/6.5 Sabbath** (Sun 00:00–12:00 Central). Human > service > Sabbath > review job.
- **Blackout is calendar-driven, and the calendar is a static JPG.** Confirmed from `thechurchofthelivinggod.com` (fetched 2026-06-08): **Sunday Worship 11 AM; Wednesday Bible Study 1 PM & 6 PM; office hours M–F 11 AM–6 PM. No iCal/ICS/feed exists.** Until COLG publishes a feed, the blackout scheduler needs a **manually-maintained schedule config** (`service-calendar.json`); matches known cadence — no discrepancy.
- **Estimates are data-driven and living (§6), not a waterfall.** Dates are first-pass, **re-baselined against** the Continuous Feedback Reel, Events-as-data, Execution-Outcome Observability, and the Workflow Module Library as real throughput telemetry arrives.
- **The loop runs through the app itself (§9): "for us, by us."** poetech.us is product AND dev/feedback surface — family/community input (Suggest button, family-voice wf30/wf08) → sovereign LLM team → updates behind the Cage → back to the app → next round. Self-referential, no external dependency in the loop.
- **FUTURE — Phase N+ (§8):** LLMs eventually *author* website/content updates (PoeTech App + church site) — the highest-risk WRITE class, staged read-only → draft-PR → scoped auto-publish behind approval, **never** fully-autonomous doctrinal publish. Deliberately later, after the MVP reviewer is proven.
- **Timelines anchored to 2026-06-08 (first-pass, §7):** LLM eval done **~2026-07-11**; App-review **MVP ~2026-07-27** (read-only, Node 1's 4070, four brakes, 24/6.5); clean path **Q4 2026**; Phase N+ content-authoring **2027+**, gated on a content-approval workflow.

---

## 1. Candidate LLMs to evaluate

> **Freshness caveat.** Training cutoff is January 2026; names/benchmarks/licenses below are from June 2026 web sources (cited) and move fast. **Re-verify at eval time** (§3).

### Hardware envelope — RTX 4070 (CUDA)

| Box | Spec | VRAM | Role |
|---|---|---|---|
| **DS1621xs** (existing NAS) | Xeon D-1527 4c/8t, 32 GB ECC, CPU-only | n/a (RAM-bound) | Registry (Postgres+pgvector), batch inference, embeddings |
| **Node 1** (Legion PC, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Daily-driver review inference; one 14B + one embedder (`OLLAMA_MAX_LOADED_MODELS=2`) |
| **Node 2** (Church Switcher, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Church A/V (NDI/OBS/Proclaim). **Forbidden during active church hours** — generally NOT a review card |
| **Planned GPU box** (`AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` Opt. 2) | 2× used RTX 3090 | **48 GB** combined (~$2,000) | Clean-path parallel multi-model; 30B–70B class |

**The "4070's" question — flagged for confirmation.** Two interpretations change the candidate set:
- **A (likely, per the Cage): two *separate* boxes**, each 1× 4070 12 GB (Node 1 review + Node 2 A/V). Not a 24 GB pool; no usable cross-LAN tensor-parallel. **Review reasoner = 1× 12 GB → 14B ceiling.** Node 2 could run a second independent 14B, but only off church hours.
- **B: two cards in *one* box** → **~24 GB combined** (vLLM tensor-parallel / Ollama offload) → unlocks **30B-A3B / 27–32B / Devstral 24B** (tight). Cheapest jump short of the dual-3090.
- **Variant note:** base/SUPER 4070 = 12 GB; **4070 Ti SUPER = 16 GB** (single-card headroom rises). **Confirm the exact card.**

The Cage's `docker-compose.yml` is explicit for the single-card case: *"qwen2.5:14b-instruct-q4_K_M fits the 12 GB VRAM… One 14B resident at a time on a 4070. Never pull 32B+ here."*

### Sovereignty-tier scale (defined for this eval)

- **S1 — Fully sovereign / air-gap capable:** open weights, permissive (Apache-2.0/MIT), runs on one 4070 or the NAS, zero callback.
- **S2 — Sovereign, hardware-gated:** open + permissive, but needs 2× 4070 or the GPU box. Zero egress.
- **S3 — Sovereign-capable but impractical now:** needs VRAM beyond the dual-3090 plan.
- **S4 — Not sovereign:** vendor API (Claude/Gemini). Escalation-only; **never** for TLC. The ceiling/contrast, not a team member.

### A. Code-review / reasoning candidates (1× vs 2× 4070)

| Model | Params | Fit | VRAM @ Q4 | Runs on | License | Sov. | Cost |
|---|---|---|---|---|---|---|---|
| **Qwen2.5-Coder 14B** | 14B dense | Strong review; non-MoE; current Cage `OLLAMA_CODER_MODEL` | ~9 GB Q4 / fits 12 GB @ Q5_K_M | **1× 4070** | Apache-2.0 | **S1** | $0 marg. Lean default. |
| **Qwen3 14B** | 14B dense | Better reasoning on a budget; ~61 tok/s on 12 GB | ~8.5 GB Q4 | **1× 4070** | Apache-2.0 | **S1** | $0 marg. |
| **Qwen3-Coder 30B-A3B** | 30.5B MoE (3B active) | Best sovereign agentic-review value; MoE = fast | ~22 GB Q4_K_M | **2× 4070** or GPU box | Apache-2.0 | **S2** | $0 marg. Lean alt to GLM/DeepSeek. |
| **Qwen3.6-27B** | 27B dense | Strong all-rounder | ~16–20 GB Q4 | **2× 4070** / GPU box | Apache-2.0 | **S2** | $0 marg. |
| **Devstral Small 24B** | 24B | Purpose-built agentic coding | ~16 GB Q4 | **2× 4070** (or 1× 16 GB Ti SUPER, tight) | Apache-2.0 | **S2** | $0 marg. |
| **GLM-5.1** | large MoE | Top open agentic coder; #1 SWE-bench Pro (~58%) | 48 GB tight at low quant | **dual-3090 → S3 at full** | **MIT** | **S2/S3** | $0 marg, heavy. |
| **DeepSeek V4** | large MoE | Best perf-to-inference-cost of frontier-open | multi-GPU at usable quant | **dual-3090 / beyond** | **MIT** | **S2/S3** | $0 marg. |
| Gemma 4 27B | 27B | Strong general | ~16–20 GB | 2× 4070 / GPU box | Gemma terms | S2 | $0 marg; license less permissive — screen. |
| **Claude / Gemini** | vendor | Frontier ceiling; the escalation reasoner | n/a | vendor API | proprietary | **S4** | **$$** metered; $25 soft / $50 hard. **Never TLC.** |

### B. Retrieval / embedding (code RAG over the repo)

| Model | Fit | Runs on | License | Sov. | Note |
|---|---|---|---|---|---|
| **nomic-embed-text** | Current Cage `OLLAMA_EMBEDDING_MODEL`; fast, proven | DS1621xs / 1× 4070 | Apache-2.0 | **S1** | Keep as default. |
| **Qwen3-Embedding (0.6B/4B/8B)** | Rivals commercial APIs; same family as reasoner | DS1621xs (0.6B) / 4070 (4B+) | Apache-2.0 | **S1** | Strong upgrade. |
| **BGE-M3** | Best quality-cost for self-hosted RAG | DS1621xs / 4070 | MIT | **S1** | Robust hybrid retrieval. |

---

## 2. What the LLM team(s) support — three entities, three sensitivity tiers

The LLM team(s) are not a single code-reviewer. Per `project-sovereign-llm-teams-per-industry`, a team = *model + system prompt + tool list + RAG corpus + pre-authorized policy*. The same pattern serves the business systems that advance the **development, growth, and work of three entities** — and each entity carries a **different sensitivity tier and a different guardrail**.

### Shared substrate (applies to all three)

Everything rides behind **the Cage** (`infra/ai-orchestrator/`): guarded-action **allowlist** + VLAN guard + **append-only, hash-chained `ai_audit_ledger`** + **120 s Uptime-Kuma health gate with auto-rollback**. The ledger box (NAS) is not the box the agent runs on. **Read-only first**; any write is a guarded action. The **four brakes** are mandatory for anything timer-driven or write-capable (Tier C per CLAUDE.md + LESSONS-LEARNED P10/P11/P12):

| Brake | Implementation |
|---|---|
| **1. Budget** | Per-run token/turn/wall-clock ceiling; a pass that hits it **terminates**. S4 judge stays under $25 soft / $50 hard. |
| **2. Concurrency lock** | Single-instance; a fire that finds a prior pass running **SKIPS** (the wf27/builder runaway mode). |
| **3. Kill-switch** | Dead-man's-switch on overrun/failure/missed-heartbeat → **auto-pause**, plus the weekly Sabbath cooldown (§4c). |
| **4. Human-demand preemption** | A human using the system instantly reclaims the GPU; the job suspends/resumes (§4a). |

### 2.1 The Church — COLG / thechurchofthelivinggod.com  ·  Tier ISO-2 (doctrine-gated)

| | |
|---|---|
| **LLM-supported business systems** | Sermon-to-content pipeline (audio → transcript → clips → study guides), study-guide & devotional drafting, event/announcement/comms drafting, church-ops workflow (scheduling, volunteer coordination), congregation growth/marketing, website content drafting. |
| **Sensitivity** | **Doctrinal + content.** Father's Business; **non-denominational, Word-first, Body-undivided** (`project-non-denominational-word-first-body-undivided`): Scripture senior to tradition; per-tradition weights set *with Bishop Gwin*. Church copy carries the church's voice and authority. |
| **Guardrail** | **Human/doctrine approval gate before ANY publish** — no church content is auto-published unreviewed. Scripture cited per `SCRIPTURE-REFERENCE-STANDARD.md`; no improvised theology. Sovereign-first; a vendor (S4) may assist mechanical non-doctrinal tasks (e.g., reformatting public bulletins) but **never** generate doctrinal content without human review. Eventually hosted on the COLG node (Bishop Gwin gate). |
| **Routing** | Sovereign reasoner + church RAG corpus; doctrine reviewer-in-the-loop. |

### 2.2 TLC — tlctherapysolutions.com (Christina's LCSW practice)  ·  Tier ISO-1 (HIGHEST ISOLATION — binding)

> **This is a binding structural constraint, not a footnote. The TLC firewall is a hard boundary.**

| | |
|---|---|
| **Binding rule** | **LLMs supporting TLC business systems NEVER touch client PHI.** TLC is **sovereign-only**: **no vendor/cloud LLM on any TLC data path — not Claude, not Gemini — regardless of any `@claude`/`@gemini` token, regardless of task class, regardless of who asked.** Fail-closed. This is the inviolable line from `CLAUDE-TOOL-ROUTING.md` (the Counseling team's `allowed_providers = [ollama]`, `bright_line_overrides: tlc_clinical_data`) and `CLAUDE.md`. If content is *possibly* clinical, treat it as clinical and stay sovereign. |
| **Isolation mechanics** | Strict **token isolation + permission gates**; a NAS-side regex pre-filter (`tlc\|therapy\|counsel\|clinical\|patient\|client session\|...`) blocks egress before any vendor call. No TLC PHI on Hostinger (per `project-brand-surface-hosting-map`: Hostinger disclaims HIPAA / no BAA). PHI processing, if ever scoped, is **Ollama-only, on-NAS, behind the firewall**, and even then the default is the LLM does **not** process identifiable client data unless explicitly, narrowly authorized. |
| **What LLMs CAN support for TLC (non-PHI only)** | Public marketing-site copy that contains **zero client data**; scheduling-system plumbing that never exposes PHI; general practice-ops docs/templates; reporting on **de-identified / aggregate** non-PHI metrics. Anything touching a session, intake note, or identifiable client is out of scope by default. |
| **Guardrail tier** | **ISO-1 — highest.** Sovereign-only, never PHI, hard firewall, fail-closed, token-isolated. The most restrictive of the three; this constraint is senior to convenience, cost, and capability. |

### 2.3 The PoeTech App — poetech.us  ·  Tier ISO-3 (behind the Cage; marketing sub-tier lower)

| | |
|---|---|
| **LLM-supported business systems** | **Continuous code-review** (the MVP instance), QA / test-observation, observability (health surfaces + `_reel.jsonl`), **marketing-copy drafting**, workflow-ops, reporting/analytics on non-sensitive product telemetry. |
| **Sensitivity** | Lower doctrinal/PHI sensitivity than the Church or TLC — **but still behind the Cage.** Two sub-tiers: **code/product** (review-then-merge) and **marketing copy** (lowest-sensitivity content, can move fastest of the three entities). |
| **Guardrail** | Read-only review → draft-PR (human merges) → scoped auto-publish of low-sensitivity surfaces behind approval (§8). Marketing copy ≠ doctrinal/PHI content; it gets the lightest gate, but never bypasses the Cage. |
| **Routing** | Sovereign 14B reasoner + repo RAG (today); 30B-A3B / dual-3090 heavies later; S4 vendor as the eval ceiling only. |

**Guardrail summary:** **ISO-1 TLC** (sovereign-only, never PHI, hard firewall) ⟶ **ISO-2 Church** (doctrine/human approval before publish) ⟶ **ISO-3 PoeTech App** (Cage-gated; marketing copy lightest). Sensitivity sets the gate; the Cage + four brakes are the floor under all three.

---

## 3. Evaluation methodology

**Goal:** pick the smallest model that clears the bar for *continuous code-review/support* on owned hardware — not the highest leaderboard score.

**Eval set (our own ground truth, ~40–60 items):** (1) **real repo diffs with known verdicts** (past PRs + the wf27/builder runaway, the localStorage hydration leak in `LESSONS-LEARNED.md`); (2) **seeded-bug diffs** — missing try-catch on external I/O (PERPETUAL-PIPELINE-HEALTH), a timer-driven change missing a brake, a same-origin-rewrite regression, **a TLC-firewall leak**, **a GPU job that fails to yield to a human or ignores a blackout**; (3) **retrieval probes** (e.g., "which file blocks UPDATE/DELETE on the ledger?" → `001-audit-ledger.sql`); (4) **false-positive control** — clean diffs that must pass untouched.

**Scoring (weighted):** recall on seeded+real bugs (heaviest) · precision / false-positive rate · groundedness (cites real file/line, auto-checkable) · latency/throughput on the target box (must finish inside the off-hours window) · cost.

**Judges:** automated first pass (known answers + citation check) → LLM-judge panel (a *vendor* frontier model S4, escalation-only, **repo code only, never TLC/clinical** + a second sovereign model) with adversarial *refute-each-finding* framing → human spot-check (Darrell / Quality Gatekeeper signs the Tier-C gate). The **TLC firewall holds throughout**; App-review corpus is repo code only — no PHI.

---

## 4. GPU scheduling — three layers of yield (first-class)

The review fleet shares CUDA GPUs with **humans** and with **church A/V**; it is always the lowest-priority tenant. Three layers, strict priority: **a human beats a service window beats the Sabbath beats the review job.**

### (a) Human-presence preemption — the primary ask ("even better")

**Whenever a human is actively using the system, LLM background processes immediately yield CUDA/GPU bandwidth to the human, and resume after.** Framed as the **4th brake — a human-demand kill-switch.**
- **Demand sensor (~1–5 s poll):** a non-Ollama CUDA process on the card (`nvidia-smi --query-compute-apps` — OBS/Proclaim/WebGL/a game), an active desktop session / recent input on Node 1, or a live PoeTech-PWA / Council-Chamber request (the app pings a "human-active" endpoint).
- **Yield (within ~1 s):** **pause** the worker (cancel-and-requeue the in-flight inference, or `SIGSTOP`) and **free VRAM** (`OLLAMA_KEEP_ALIVE=0` unloads the model) so the human gets the full 12 GB. The concurrency lock guarantees one worker to pause.
- **Resume with hysteresis:** only after ~5 min of no human demand; resumption re-checks the blackout + Sabbath gates first.

### (b) Service-window blackout — calendar-driven

**No LLM compute from 1 h BEFORE to 1 h AFTER each church service/event.** Protects the shared A/V cards (the Cage already forbids inference during Sun/Wed services — OBS NVENC + a 9 GB model contend for the same 12 GB); this generalizes that to a ±1 h buffer.

**Source of truth — the COLG calendar (fetched 2026-06-08; it is a static JPG, NO machine-readable feed):**

| Service | Day/Time (confirmed on `thechurchofthelivinggod.com`) | Blackout (±1 h; assumes service length — tune per real duration) |
|---|---|---|
| Sunday Worship Experience | **Sun 11:00 AM** | **Sun 10:00 AM – 2:00 PM** (~2 h service) |
| Wednesday Bible Study (afternoon) | **Wed 1:00 PM** | **Wed 12:00 PM – 3:30 PM** (~1.5 h) |
| Wednesday Bible Study (evening) | **Wed 6:00 PM** | **Wed 5:00 PM – 8:30 PM** (~1.5 h) |
| Office hours (staff present) | **Mon–Fri 11:00 AM – 6:00 PM** | *Not a hard blackout* — handled dynamically by human-presence preemption (4a). |

**Reconciliation:** site services (Sun 11 AM, Wed 1 PM & 6 PM) **match the known COLG cadence exactly — no discrepancy.** Special one-off events appear only as a **static monthly JPG** (`/uploads/.../06-june-calendar_orig.jpg`); **no iCal/ICS, Google-Calendar iframe, or RSS feed** exists.

**Implication — the scheduler needs a manually-maintained config until COLG publishes a feed:**
- **MVP (required today):** a small, version-controlled **`service-calendar.json`** on the NAS encoding the three recurring windows + any special events transcribed by hand from the monthly JPG. Cheap, deterministic, auditable. **This is the current source of truth because no feed exists.**
- **Optional middle:** OCR/vision-extract the monthly JPG into structured events (we have the vision pipeline) — a human confirms before it gates compute (VISION-FAIRNESS posture).
- **Clean path (recommended ask):** **request COLG/Bishop Gwin's team publish a public Google-Calendar iCal/ICS feed**; the blackout scheduler then **subscribes to it as live truth** and windows auto-update (special events included) — a BUSINESS-PROCESS-CONNECTION ("the reviewer rests during services" needs the calendar pipeline wired).

### (c) 24/6.5 Sabbath rest — the weekly forced cooldown

**Operating schedule (hard constraint): 24 h/day, 6.5 days/week — NOT 24/7. Sabbath rest: every Sunday 00:00–12:00 America/Chicago (Central) — a 12 h pause = the 0.5 day.** All review automation **pauses by default** (the kill-switch's resting state); the GPU is freed for Sunday A/V; the watchdog **expects silence** so the pause is not a fault. It is observance *and* engineering — **a forced weekly cooldown no run can skip.** If the Sunday pause ever fails to engage, that itself trips the kill-switch.

### GPU yield + blackout architecture — how a/b/c stack

```
may_run() =
  NOT human_present()           # (4a) real-time preempt -- highest priority, ~1s
  AND NOT in_service_blackout() # (4b) +/-1h around each calendar service (JSON today, iCal later)
  AND NOT in_sabbath_window()   # (4c) Sun 00:00-12:00 Central
  AND brakes_ok()               # (1) budget left  (2) no other instance  (3) watchdog healthy
  -> else: PAUSE, free VRAM, requeue, re-check next tick

Priority ladder (who wins the GPU):
  1. HUMAN at the keyboard / using the PWA  -> instant preempt (4a)   [seconds]
  2. Church service +/- 1h                  -> blackout (4b)          [calendar]
  3. Sunday 00:00-12:00 Sabbath             -> rest (4c)              [weekly]
  4. Review / support job                   -> runs only in the gaps  [lowest]
```

Net: the fleet runs at most ~156 h/week (24×6.5), minus service blackouts, minus every moment a human wants the GPU. **Always the lowest-priority tenant.** Each layer is independently a brake; together they make compute-runaway and human-contention structurally impossible, not merely discouraged.

---

## 5. What "review/support the PoeTech App" means operationally

The MVP instance of §2.3: the **Dev/Ops Foundation Team** (Pilot #1) pointed at the PoeTech repo + running app. **(1) Continuous code-review** — on each push/PR + a scheduled sweep, pull the diff, RAG the repo, emit findings (correctness, PERPETUAL-PIPELINE-HEALTH violations, missing brakes, TLC-firewall leaks, same-origin regressions) as **proposals** written to the ledger (decision = `proposed`). **(2) QA** — run/observe tests + preview. **(3) Observability** — watch health + the dispatch/reel feeds. **Read-only in the MVP**; mutations come only after the soak proves clean and only through the guarded-action + health-gate path. Ships **inactive**, goes live **read-only with someone watching**, **never** unattended or during a travel window (P11). "NAS-only sovereign" does not downgrade it from Tier C (P12).

---

## 6. Estimates are data-driven and living — not a waterfall

**Binding methodology (per Darrell): every estimate/projection below is anchored to, and re-baselined against, the interconnected data sources we already have or are building — the reports + feedback loop that feed the Iterative Software Project.** The dates in §7 are **first-pass estimates**, not commitments; they tighten as the loop produces real throughput data.

**(a) Which data sources feed which estimate:**

| Estimate | Fed / re-baselined by |
|---|---|
| Eval duration (benchmark throughput, tok/s per box) | **Execution-Outcome Observability** (real run times) + the benchmark runs themselves |
| Review cadence, coverage, false-positive rate | **Continuous Feedback Reel** (`project-continuous-feedback-reel`, `_reel.jsonl`) + **Events-as-data** (`INSTITUTIONAL-MEMORY-EVENTS`) |
| Scheduler tuning (blackout/preempt hit-rates, idle gaps) | GPU telemetry + the Reel; how often `may_run()` actually yields |
| Scope & priority of what gets built next | family/community input (Input-Visibility, wf30/wf08) + **Workflow Module Library** inventory (what modules exist vs are needed) |

**(b) Iterative tightening:** as the feedback loop logs actual eval throughput, review-pass durations, and yield-rates, the projections move from "research estimate" to "telemetry-backed." Each completed pass is an Event (`decision`/`outcome`) that re-bases the next estimate.

**(c) Status of these dates:** the §7 dates are **first-pass, to be re-baselined against actual interconnected-system telemetry.** Treat the whole timeline as a **living, data-fed projection for community + business-systems workflow building**, not a fixed plan. When telemetry contradicts an estimate, the telemetry wins.

---

## 7. Timelines — living projection, anchored to 2026-06-08

> First-pass estimates (§6). Assumes go-ahead and Node 1 on hand; if Node 1 isn't running, add ~1 week standup (Linux + CUDA + Ollama + the Cage) to the front.

### Track (a) — LLM evaluation

| Phase | Work | Window (first-pass) |
|---|---|---|
| 0. Harness + eval set | Build the ~40–60-item set (§3), incl. the "fails-to-yield / ignores-blackout / TLC-leak" classes; wire scoring | **2026-06-09 → 2026-06-20** |
| 1. Benchmark candidates | Run the shortlist: 14B on 1× 4070; 30B-A3B if two cards/GPU box; batch heavies off-hours | **2026-06-22 → 2026-07-04** |
| 2. Score + judge + pick | Automated + LLM-judge + human spot-check; pick smallest model that clears the bar | **2026-07-06 → 2026-07-11** |
| | **Eval complete** | **~2026-07-11** |

CPU-only fallback (no GPU): batch-only → **+2–4 weeks**. The GPU, not COLG, is the gating dependency.

### Track (b) — Sovereign team begins reviewing/supporting the App (MVP)

| Step | Window (first-pass) |
|---|---|
| Stand up Dev/Ops reviewer team config (system prompt + repo RAG + read-only policy) behind the Cage on Node 1; wire brakes 1–3 | overlaps eval, late June → mid-July |
| **Build the GPU-yield + blackout scheduler** — human-presence sensor + yield/resume (brake 4), `service-calendar.json` (no feed exists), the `may_run()` gate (§4) | **~2026-07-13 → 2026-07-22** |
| Ship **inactive** → **read-only** with Darrell watching → one full **24/6.5 week** proving all four brakes + the ladder | **~2026-07-22 → 2026-07-27** |
| **Sovereign team reviewing the App (read-only, proposals to ledger):** | **live ~2026-07-27** |

Needs **none** of: the COLG procurement, the Bishop Gwin gate, or the dual-3090 box. Runs a **14B S1 model on Node 1's existing 4070**, $0 marginal.

### Track (c) — clean path (showcase)

| Dependency | Effect |
|---|---|
| 2× 4070 in one box (~24 GB) → 30B-A3B class | days–1 wk if the second card is on hand |
| Dual-3090 box (~$2,000) — procure + build + validate | ~2–4 wk once greenlit → 30B/70B parallel + guarded auto-fix |
| Graduate to guarded mutations after a clean read-only soak | +30–60 day soak (Tier B→C) |
| COLG iCal feed published → blackout auto-updates | small ask; removes manual upkeep |
| COLG node hosting (only if showcased on COLG's node): $14–19k + Bishop Gwin gate | weeks–months; **keep OFF the App-review critical path** |
| | **Clean-path App-review: Q4 2026 (Oct–Nov)** |

### Track (d) — Phase N+ content-authoring (FUTURE; see §8)

After the MVP reviewer is proven and a content-approval workflow exists. **First-pass: 2027+.** Not on the MVP path.

---

## 8. Phase N+ (FUTURE) — LLM-authored website/content updates

> **Deliberately a later phase, NOT the MVP.** Darrell's directive: *"Eventually we will want the websites updated by the LLMs."* Captured here with the governance it demands.

**What it is:** escalating the LLM from **read-only review** to **WRITE actions on public-facing surfaces** — the **PoeTech App AND the church website** (and TLC's public marketing site, PHI-free). This is the **highest-risk action class** in the whole system: a wrong publish is public, and for the church it is doctrinal.

**Non-negotiable governance:**
- **Behind the Cage:** guarded-action **allowlist** + append-only **ledger** + **health-gate/rollback**. **Tier C.** All **four brakes** (budget, concurrency lock, kill-switch, human-presence preemption).
- **Human/doctrine approval gate before any church-content publish** — Father's Business + non-denominational Word-first means church copy can **never** be auto-published unreviewed (`project-non-denominational-word-first-body-undivided`). Bishop Gwin's review authority is structural.
- **Two content tiers, distinguished:** **doctrinal/church + clinical/TLC content** = always human-approved, never auto-published; **PoeTech App marketing copy** = lower-sensitivity, eligible for scoped auto-publish behind approval once proven.

**Staged path (each stage earns the next):**
1. **Read-only review** (the MVP) — proposals only.
2. **Draft-PR / draft-content** — the LLM opens a PR or a draft; **a human merges/publishes.** No autonomous write.
3. **Scoped auto-publish of low-sensitivity surfaces behind approval** — e.g., a marketing-copy tweak on poetech.us, pre-approved class, through guarded-action + health-gate, instantly rollback-able.
4. **Never** fully-autonomous doctrinal or clinical publish — that ceiling is permanent.

**Dependency:** a **content-approval workflow must exist first** (the human/doctrine gate as a real pipeline, not an intention). Until then, Phase N+ stays at stage 1–2. **First-pass timeline: 2027+,** re-baselined per §6.

---

## 9. The self-updating loop — "for us, by us" (closing architecture)

This ties §2 (the three entities), §6 (data-driven estimates), and the whole system into one coherent picture. Darrell's directive: *"poetech.us and the PoeTech App being used to consistently update the app for us by us."*

**The PoeTech App (live at poetech.us) is both the product AND the dev/feedback surface — it is dogfooded.** The loop:

```
   family / community input
   (the app's own surfaces: Suggest button, family-voice capture -- wf30 / wf08)
            |
            v
   sovereign LLM team(s)  -- the three-entity teams of section 2
   (read-only review now; draft-PR -> scoped publish later, section 8)
            |
            v
   updates produced BEHIND THE CAGE
   (guarded-action + append-only ledger + health-gate/rollback; four brakes; section 4 GPU yield)
            |
            v
   shipped back to the app  ->  next round of input
```

**"For us, by us" = sovereign + community-owned:** the app improves itself using **our own interconnected systems and our own LLMs — no external/proprietary dependency in the loop.** This is the operational embodiment of principles already in memory/docs:
- **`project-continuous-feedback-reel`** — the reel is the loop's nervous system (every input/outcome an event).
- **`INPUT-VISIBILITY-TO-CLAUDE`** — family/community input is captured where the LLM team can see and act on it (wf30/wf08, the Suggest button).
- **`BUSINESS-PROCESS-CONNECTIONS`** — every visible surface (the Suggest button) is one end of a connection; the LLM team + the Cage is the pipeline that carries it; the shipped update is the visible promise kept.

**And the loop produces its own estimates (§6):** the interconnected data this loop generates — the Reel, the Events, the Observability telemetry, the Module Library — is exactly what re-baselines the §7 projections. **The system measures itself and refines its own roadmap as it runs.** The three entities are *what* the systems serve; the loop is *how* they improve; the data-driven estimates are *how the loop measures and re-plans itself.* One system, not three bolted-on features.

---

## 10. Recommendation + rationale

**Recommendation: start the App-reviewer MVP on Node 1 now, build the GPU-yield + blackout scheduler as a required brake, hold TLC at ISO-1 absolutely, decouple from COLG procurement, and treat every date as a living projection.**

1. **DO start App-review on Node 1's 4070 in late July, read-only, behind the Cage, 24/6.5, four brakes.** *Because* it needs nothing we don't have, costs $0 marginal, and puts the reviewer where it earns trust — and it's the first instance of the three-entity pattern (§2).
2. **DO build the GPU-yield + blackout scheduler before go-live.** *Because* human-presence preemption is the primary ask and a real compute-safety brake; the priority ladder (human > service > Sabbath > job) makes contention structurally impossible. The blackout needs a manual `service-calendar.json` today — **no church feed exists.**
3. **DO hold TLC at ISO-1, no exceptions.** *Because* PHI + a vendor LLM is an unrecoverable breach; sovereign-only + fail-closed firewall is the only acceptable posture (§2.2). This is senior to cost, capability, and convenience.
4. **DO gate all church content behind human/doctrine review** (§2.1, §8). *Because* Father's Business + Word-first means doctrinal copy is never auto-published.
5. **DO confirm the "4070's" topology** (1× 12 GB vs 2× in one box vs Ti SUPER 16 GB) before fixing the candidate set — it decides 14B vs 30B-A3B (§1).
6. **DO treat the timeline as data-driven and living** (§6) — re-baseline against the Reel / Events / Observability / Module Library as real throughput arrives; the dates are first-pass.
7. **DO NOT block App-review on the $14–19k COLG procurement or the Bishop Gwin gate** — those gate COLG church-ops, not Darrell's app.
8. **DO NOT ship Phase N+ content-authoring early** (§8) — read-only → draft-PR → scoped auto-publish behind approval, never autonomous doctrinal/clinical publish; first-pass 2027+, gated on a content-approval workflow.

**One-line answers:**
- **LLM evaluation:** ~5 weeks, **done ~2026-07-11** (a 4070 on hand); +2–4 wk if CPU-only — *re-baselined per §6.*
- **Sovereign team begins reviewing the App:** **MVP ~2026-07-27** (read-only, Node 1, four brakes, 24/6.5); **clean path Q4 2026**; **content-authoring 2027+ (FUTURE).**

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
- `infra/ai-orchestrator/` — the Cage (Node 1/Node 2/Registry; both 1× RTX 4070 12 GB; guarded-action.sh, 001-audit-ledger.sql, Uptime-Kuma health gate, schedule boundary)
- `docs/00-foundations/_root/CLAUDE-TOOL-ROUTING.md` — Tier 0/1/2 routing, **the TLC firewall**, $25/$50 caps
- `docs/00-foundations/_root/RELEASE-TIERS.md` — Tier C criteria
- `docs/00-foundations/_root/LESSONS-LEARNED.md` — 2026-06-06 runaway; P10/P11/P12
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` — Option 2 dual-3090; CPU-only DS1621xs ceiling
- `docs/99-session-notes/2026-06-01-research-review-sovereign-llm-teams-architecture.md` — per-industry team = model+prompt+tools+RAG+policy; Dev/Ops as Pilot #1
- the Bishop Gwin / COLG migration brief — the COLG alignment gate
- memory: `project-continuous-feedback-reel`, `INPUT-VISIBILITY-TO-CLAUDE`, `BUSINESS-PROCESS-CONNECTIONS`, `INSTITUTIONAL-MEMORY-EVENTS`, `EXECUTION-OUTCOME-OBSERVABILITY`, `WORKFLOW-MODULE-LIBRARY`, `project-brand-surface-hosting-map`, `project-non-denominational-word-first-body-undivided`, `feedback-autonomous-automation-three-brakes`
- `CLAUDE.md` — "Autonomous Automation Requires Three Brakes"

---

*The default is sovereign. TLC never leaves the firewall. The church's words are reviewed before they are spoken. The human at the keyboard always wins the GPU. The reviewer rests around every service and on the Lord's Day. Four brakes hold, read-only first, someone watching. The app improves itself, for us by us, and measures its own progress as it goes. We all win. We create. Amen.*
