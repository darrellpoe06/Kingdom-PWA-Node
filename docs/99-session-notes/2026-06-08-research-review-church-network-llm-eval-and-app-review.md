# Research Review — Sovereign LLM Teams for the Three Entities: Evaluation, App-Review, and the Self-Updating Loop

**Date:** 2026-06-08 (Mon)
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — evaluate new/candidate LLMs for the Church network (COLG sovereign NAS node + the Church per-industry LLM team) and give realistic timelines for (1) the LLM evaluation and (2) the sovereign team beginning to continuously review/support/upgrade the three web properties. **Rev. 4** folds in: RTX 4070 (CUDA) sizing; first-class GPU scheduling (human-presence preemption → service blackout → Sabbath); the COLG calendar as blackout source of truth; **(B)** a FUTURE phase for LLM-authored content; **(C)** the three-entity support framing (Church / TLC / PoeTech) each with its sensitivity tier; **(D)** data-driven, re-baselined estimates; **(E)** the "for us, by us" self-updating loop; **(F)** continuous multi-site review + upgrade loop across all three properties; **(G)** calendar auto-update from staff-approved decisions; **(H)** outcome-driven marketing funnel + sovereign privacy-respecting tracking.
**Status:** Research-review. **No code, no workflow changes, nothing applied to the NAS.** Decision support only.
**Output gate:** binding filters — `project-cost-discipline-with-growth-permission`, `project-sovereign-llm-teams-per-industry`, `feedback-autonomous-automation-three-brakes` (CLAUDE.md "Three Brakes"), RELEASE-TIERS Tier C, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `COMMUNITY-FIRST-MISSION`, **the TLC firewall (binding, structural — see §2.2; senior everywhere below)**.
**Pairs with:** `infra/ai-orchestrator/` (the Cage), `CLAUDE-TOOL-ROUTING.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (P10/P11/P12), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`, `2026-06-01-research-review-sovereign-llm-teams-architecture.md`, the Bishop Gwin / COLG migration brief, `project-continuous-feedback-reel`, `INPUT-VISIBILITY-TO-CLAUDE`, `BUSINESS-PROCESS-CONNECTIONS`, `INSTITUTIONAL-MEMORY-EVENTS`, `EXECUTION-OUTCOME-OBSERVABILITY`, `WORKFLOW-MODULE-LIBRARY`, `project-brand-surface-hosting-map`, `project-non-denominational-word-first-body-undivided`, `project-community-free-funded-by-aligned-brand-sponsorship`, `project-what-is-actually-free`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`.

---

## TL;DR (read this first)

- **The LLM team(s) support the business systems of THREE entities, each at its own sensitivity tier (§2):** **(1) the Church** (COLG / thechurchofthelivinggod.com) — doctrine-gated, human approval before any publish; **(2) TLC** (tlctherapysolutions.com, Christina's LCSW practice) — **HIGHEST ISOLATION: HIPAA/PHI, sovereign-only, the TLC firewall is a hard structural boundary, no vendor/cloud LLM on any TLC data path, ever; senior to everything below**; **(3) the PoeTech App** (poetech.us) — code + product + marketing, lower sensitivity but still behind the Cage.
- **Three applied loops across all three live sites (§6):** **(F)** continuously comb thechurchofthelivinggod.com, tlctherapysolutions.com, and poetech.us — detect changes, propose upgrades, each optimized to *its own* success objective; **(G)** auto-update calendars from staff-green-lit decisions in meeting notes (this is also how the §4 blackout scheduler gets live truth without waiting on COLG to publish iCal); **(H)** outcome-driven marketing funnel + **self-hosted, privacy-respecting** analytics (not Google Analytics) per entity, with the LLMs tuning the funnel on measured results. All three are the §10 loop applied to concrete surfaces, gated by §2 tiers, fed by §7 telemetry.
- **App-review does NOT depend on the COLG node or the Bishop Gwin gate** — Dev/Ops on Darrell's own hardware (`feedback-surface-premise-conflicts`).
- **Compute is NVIDIA RTX 4070 (CUDA).** "4070's" → **assumption flagged: two 12 GB cards.** Two boxes ⇒ **14B ceiling**; two cards in one box (~24 GB) ⇒ unlocks **30B-A3B** (§1). Confirm topology.
- **GPU scheduling is a first-class brake (§4), three layers in priority order:** human-presence preemption (4th brake) > service blackout (1 h before→after) > 24/6.5 Sabbath (Sun 00:00–12:00 Central) > the review job.
- **Calendar is a static JPG.** Confirmed from `thechurchofthelivinggod.com` (fetched 2026-06-08): **Sunday Worship 11 AM; Wednesday Bible Study 1 PM & 6 PM; office hours M–F 11 AM–6 PM. No iCal/ICS/feed.** Until a feed exists the blackout scheduler needs a **manual `service-calendar.json`** — which **(G)** then maintains from approved decisions.
- **Estimates are data-driven and living (§7), not a waterfall** — re-baselined against the Continuous Feedback Reel, Events-as-data, Execution-Outcome Observability, the Workflow Module Library, and (per H) the sovereign analytics.
- **FUTURE — Phase N+ (§9):** LLMs *author* content/website updates — highest-risk WRITE, staged read-only → draft-PR → scoped auto-publish behind approval, **never** autonomous doctrinal/clinical publish. G is the first concrete instance (calendars).
- **Timelines anchored to 2026-06-08 (first-pass, §8):** LLM eval **~2026-07-11**; App-review **MVP ~2026-07-27**; multi-site review (F) + calendar pipeline (G) + funnel/analytics (H) phase in **Q3–Q4 2026**; content-authoring **2027+**.

---

## 1. Candidate LLMs to evaluate

> **Freshness caveat.** Training cutoff is January 2026; names/benchmarks/licenses below are from June 2026 web sources (cited) and move fast. **Re-verify at eval time** (§3).

### Hardware envelope — RTX 4070 (CUDA)

| Box | Spec | VRAM | Role |
|---|---|---|---|
| **DS1621xs** (existing NAS) | Xeon D-1527 4c/8t, 32 GB ECC, CPU-only | n/a (RAM-bound) | Registry (Postgres+pgvector), batch inference, embeddings, **self-hosted analytics (H)** |
| **Node 1** (Legion PC, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Daily-driver review inference; one 14B + one embedder (`OLLAMA_MAX_LOADED_MODELS=2`) |
| **Node 2** (Church Switcher, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Church A/V (NDI/OBS/Proclaim). **Forbidden during active church hours** — generally NOT a review card |
| **Planned GPU box** (`AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` Opt. 2) | 2× used RTX 3090 | **48 GB** combined (~$2,000) | Clean-path parallel multi-model; 30B–70B class |

**The "4070's" question — flagged for confirmation.** **A (likely, per the Cage): two *separate* boxes**, each 1× 4070 12 GB → **review reasoner = 14B ceiling.** **B: two cards in *one* box** → **~24 GB** → unlocks **30B-A3B / 27–32B / Devstral** (tight). **Variant:** 4070 Ti SUPER = 16 GB. The Cage's `docker-compose.yml`: *"One 14B resident at a time on a 4070. Never pull 32B+ here."*

### Sovereignty-tier scale (defined for this eval)

- **S1 — Fully sovereign / air-gap capable:** open weights, permissive (Apache-2.0/MIT), runs on one 4070 or the NAS, zero callback.
- **S2 — Sovereign, hardware-gated:** open + permissive, needs 2× 4070 or the GPU box. Zero egress.
- **S3 — Sovereign-capable but impractical now:** needs VRAM beyond the dual-3090 plan.
- **S4 — Not sovereign:** vendor API (Claude/Gemini). Escalation-only; **never** for TLC. The ceiling, not a team member.

### A. Code-review / reasoning candidates (1× vs 2× 4070)

| Model | Params | Fit | VRAM @ Q4 | Runs on | License | Sov. | Cost |
|---|---|---|---|---|---|---|---|
| **Qwen2.5-Coder 14B** | 14B dense | Strong review; non-MoE; current Cage `OLLAMA_CODER_MODEL` | ~9 GB Q4 / fits 12 GB @ Q5_K_M | **1× 4070** | Apache-2.0 | **S1** | $0 marg. Lean default. |
| **Qwen3 14B** | 14B dense | Better reasoning on a budget; ~61 tok/s on 12 GB | ~8.5 GB Q4 | **1× 4070** | Apache-2.0 | **S1** | $0 marg. |
| **Qwen3-Coder 30B-A3B** | 30.5B MoE (3B active) | Best sovereign agentic value; MoE = fast | ~22 GB Q4_K_M | **2× 4070** or GPU box | Apache-2.0 | **S2** | $0 marg. Lean alt to GLM/DeepSeek. |
| **Qwen3.6-27B** | 27B dense | Strong all-rounder | ~16–20 GB Q4 | **2× 4070** / GPU box | Apache-2.0 | **S2** | $0 marg. |
| **Devstral Small 24B** | 24B | Purpose-built agentic coding | ~16 GB Q4 | **2× 4070** (or 1× 16 GB Ti SUPER) | Apache-2.0 | **S2** | $0 marg. |
| **GLM-5.1** | large MoE | Top open agentic coder; #1 SWE-bench Pro (~58%) | 48 GB tight at low quant | **dual-3090 → S3 at full** | **MIT** | **S2/S3** | $0 marg, heavy. |
| **DeepSeek V4** | large MoE | Best perf-to-inference-cost of frontier-open | multi-GPU | **dual-3090 / beyond** | **MIT** | **S2/S3** | $0 marg. |
| Gemma 4 27B | 27B | Strong general | ~16–20 GB | 2× 4070 / GPU box | Gemma terms | S2 | license less permissive — screen. |
| **Claude / Gemini** | vendor | Frontier ceiling; escalation reasoner | n/a | vendor API | proprietary | **S4** | **$$** $25 soft / $50 hard. **Never TLC.** |

### B. Retrieval / embedding (code + site RAG)

| Model | Fit | Runs on | License | Sov. | Note |
|---|---|---|---|---|---|
| **nomic-embed-text** | Current Cage `OLLAMA_EMBEDDING_MODEL`; fast | DS1621xs / 1× 4070 | Apache-2.0 | **S1** | Keep as default. |
| **Qwen3-Embedding (0.6B/4B/8B)** | Rivals commercial APIs; same family | DS1621xs / 4070 | Apache-2.0 | **S1** | Strong upgrade. |
| **BGE-M3** | Best quality-cost for self-hosted RAG | DS1621xs / 4070 | MIT | **S1** | Robust hybrid retrieval. |

---

## 2. What the LLM team(s) support — three entities, three sensitivity tiers

Per `project-sovereign-llm-teams-per-industry`, a team = *model + system prompt + tool list + RAG corpus + pre-authorized policy*. The same pattern serves the business systems of **three entities** — each at a **different sensitivity tier with a different guardrail**.

### Shared substrate (applies to all three)

Everything rides behind **the Cage** (`infra/ai-orchestrator/`): guarded-action **allowlist** + VLAN guard + **append-only, hash-chained `ai_audit_ledger`** + **120 s Uptime-Kuma health gate with auto-rollback**. **Read-only first.** The **four brakes** are mandatory for anything timer-driven or write-capable (Tier C per CLAUDE.md + LESSONS-LEARNED P10/P11/P12):

| Brake | Implementation |
|---|---|
| **1. Budget** | Per-run token/turn/wall-clock ceiling; a pass that hits it **terminates**. S4 judge stays under $25 soft / $50 hard. |
| **2. Concurrency lock** | Single-instance; a fire that finds a prior pass running **SKIPS** (the wf27/builder runaway mode). |
| **3. Kill-switch** | Dead-man's-switch on overrun/failure/missed-heartbeat → **auto-pause**, plus the weekly Sabbath cooldown (§4c). |
| **4. Human-demand preemption** | A human using the system instantly reclaims the GPU; the job suspends/resumes (§4a). |

### 2.1 The Church — COLG / thechurchofthelivinggod.com  ·  Tier ISO-2 (doctrine-gated)

| | |
|---|---|
| **LLM-supported systems** | Sermon-to-content pipeline (audio → transcript → clips → study guides), study-guide/devotional drafting, event/announcement/comms drafting, church-ops workflow, congregation growth/marketing, website content drafting + **upgrade review (F)**, **calendar from approved decisions (G)**, **reach/engagement funnel (H)**. |
| **Sensitivity** | **Doctrinal + content.** Father's Business; **non-denominational, Word-first, Body-undivided** (`project-non-denominational-word-first-body-undivided`): Scripture senior to tradition; per-tradition weights *with Bishop Gwin*. |
| **Guardrail** | **Human/doctrine approval gate before ANY publish.** Scripture cited per `SCRIPTURE-REFERENCE-STANDARD.md`; no improvised theology. Sovereign-first; vendor (S4) only for mechanical non-doctrinal tasks, never doctrinal generation unreviewed. Eventually hosted on the COLG node (Bishop Gwin gate). |

### 2.2 TLC — tlctherapysolutions.com (Christina's LCSW practice)  ·  Tier ISO-1 (HIGHEST ISOLATION — binding, senior everywhere)

> **Binding structural constraint, not a footnote. The TLC firewall is a hard boundary that governs F, G, and H below.**

| | |
|---|---|
| **Binding rule** | **LLMs supporting TLC NEVER touch client PHI.** TLC is **sovereign-only**: **no vendor/cloud LLM on any TLC data path — not Claude, not Gemini — regardless of any token, task class, or who asked.** Fail-closed. The inviolable line from `CLAUDE-TOOL-ROUTING.md` (Counseling team `allowed_providers = [ollama]`, `bright_line_overrides: tlc_clinical_data`) and `CLAUDE.md`. If content is *possibly* clinical, treat it as clinical and stay sovereign. |
| **Isolation mechanics** | Strict **token isolation + permission gates**; NAS-side regex pre-filter blocks egress before any vendor call. No TLC PHI on Hostinger (`project-brand-surface-hosting-map`: Hostinger disclaims HIPAA / no BAA). |
| **What LLMs CAN support (non-PHI only)** | **Public marketing-site surface only** (zero client data); scheduling plumbing that never exposes PHI; practice-ops docs/templates; reporting on **de-identified / aggregate** non-PHI metrics. **F/G/H for TLC touch the public/marketing surface ONLY.** Anything touching a session/intake/identifiable client is out of scope by default. |
| **Guardrail tier** | **ISO-1 — highest.** Sovereign-only, never PHI, hard firewall, fail-closed, token-isolated. Senior to cost, capability, convenience — **and to F, G, H.** |

### 2.3 The PoeTech App — poetech.us  ·  Tier ISO-3 (behind the Cage; marketing sub-tier lower)

| | |
|---|---|
| **LLM-supported systems** | **Continuous code-review** (the MVP), QA, observability, **site-upgrade review (F)**, marketing-copy drafting, **release/roadmap calendar (G)**, **adoption funnel + analytics (H)**, reporting on non-sensitive product telemetry. |
| **Sensitivity** | Lower than Church/TLC — **but still behind the Cage.** Two sub-tiers: **code/product** (review-then-merge) and **marketing copy** (lowest-sensitivity; moves fastest of the three entities). |
| **Guardrail** | Read-only review → draft-PR (human merges) → scoped auto-publish of low-sensitivity surfaces behind approval (§9). |

**Guardrail summary:** **ISO-1 TLC** (sovereign-only, never PHI) ⟶ **ISO-2 Church** (doctrine/human approval before publish) ⟶ **ISO-3 PoeTech App** (Cage-gated; marketing lightest). Sensitivity sets the gate; the Cage + four brakes are the floor under all three and under every loop in §6.

---

## 3. Evaluation methodology

**Goal:** pick the smallest model that clears the bar for *continuous review/support* on owned hardware — not the highest leaderboard score.

**Eval set (our own ground truth, ~40–60 items):** (1) **real repo diffs with known verdicts** (past PRs + the wf27/builder runaway, the localStorage hydration leak); (2) **seeded-bug diffs** — missing try-catch on external I/O, a timer-driven change missing a brake, a same-origin regression, **a TLC-firewall leak**, **a GPU job that ignores human-yield/blackout**, **a site-upgrade proposal that would publish unreviewed church copy**; (3) **retrieval probes** (e.g., "which file blocks UPDATE/DELETE on the ledger?" → `001-audit-ledger.sql`); (4) **false-positive control**.

**Scoring (weighted):** recall (heaviest) · precision · groundedness (auto-checkable citations) · latency/throughput on the target box · cost.

**Judges:** automated first pass → LLM-judge panel (vendor frontier S4, escalation-only, **repo/public-site content only, never TLC/clinical** + a second sovereign model) with adversarial *refute-each-finding* framing → human spot-check (Darrell / Quality Gatekeeper signs the Tier-C gate). The **TLC firewall holds throughout.**

---

## 4. GPU scheduling — three layers of yield (first-class)

The fleet shares CUDA GPUs with **humans** and **church A/V**; it is always the lowest-priority tenant. **Human beats service-window beats Sabbath beats the job.**

### (a) Human-presence preemption — the primary ask ("even better")

**Whenever a human is actively using the system, LLM background processes immediately yield CUDA bandwidth and resume after.** The **4th brake — a human-demand kill-switch.**
- **Demand sensor (~1–5 s):** non-Ollama CUDA process (`nvidia-smi --query-compute-apps` — OBS/Proclaim/WebGL/game), active desktop session / recent input on Node 1, or a live PoeTech-PWA / Council-Chamber request ("human-active" ping).
- **Yield (~1 s):** **pause** (cancel-and-requeue or `SIGSTOP`) and **free VRAM** (`OLLAMA_KEEP_ALIVE=0`) so the human gets the full 12 GB. Concurrency lock guarantees one worker to pause.
- **Resume with hysteresis:** only after ~5 min of no demand; re-checks blackout + Sabbath first.

### (b) Service-window blackout — calendar-driven

**No LLM compute from 1 h BEFORE to 1 h AFTER each church service/event.** Protects the shared A/V cards.

**Source of truth — the COLG calendar (fetched 2026-06-08; static JPG, NO machine-readable feed):**

| Service | Day/Time (confirmed) | Blackout (±1 h) |
|---|---|---|
| Sunday Worship Experience | **Sun 11:00 AM** | **Sun 10:00 AM – 2:00 PM** (~2 h) |
| Wednesday Bible Study (afternoon) | **Wed 1:00 PM** | **Wed 12:00 PM – 3:30 PM** |
| Wednesday Bible Study (evening) | **Wed 6:00 PM** | **Wed 5:00 PM – 8:30 PM** |
| Office hours (staff present) | **Mon–Fri 11 AM – 6 PM** | *dynamic — handled by human-presence preemption (4a)* |

**Reconciliation:** matches the known COLG cadence exactly — **no discrepancy.** Special events appear only as a **static monthly JPG**; **no iCal/ICS/feed** exists.

**The scheduler needs a manually-maintained config — and §6.2 (G) maintains it.** MVP: a version-controlled **`service-calendar.json`** on the NAS (recurring windows + special events). **Today it is the source of truth because no feed exists; the calendar pipeline (G) keeps it live from staff-approved decisions, and if COLG later publishes a public iCal/ICS the scheduler subscribes to that instead.**

### (c) 24/6.5 Sabbath rest — the weekly forced cooldown

**24 h/day, 6.5 days/week — NOT 24/7. Sabbath: every Sunday 00:00–12:00 Central — a 12 h pause = the 0.5 day.** All automation **pauses by default**; the GPU is freed for Sunday A/V; the watchdog **expects silence**. Observance *and* engineering — **a forced weekly cooldown no run can skip.** A failure to engage trips the kill-switch.

### GPU yield + blackout architecture — how a/b/c stack

```
may_run() =
  NOT human_present()           # (4a) real-time preempt -- highest priority, ~1s
  AND NOT in_service_blackout() # (4b) +/-1h around each service (service-calendar.json, kept live by G)
  AND NOT in_sabbath_window()   # (4c) Sun 00:00-12:00 Central
  AND brakes_ok()               # (1) budget  (2) no other instance  (3) watchdog healthy
  -> else: PAUSE, free VRAM, requeue, re-check next tick

Priority ladder (who wins the GPU):
  1. HUMAN at keyboard / using the PWA  -> instant preempt (4a)   [seconds]
  2. Church service +/- 1h              -> blackout (4b)          [calendar, G-maintained]
  3. Sunday 00:00-12:00 Sabbath         -> rest (4c)              [weekly]
  4. Review / support / upgrade job     -> runs only in the gaps  [lowest]
```

Net: ≤156 h/week (24×6.5), minus service blackouts, minus every moment a human wants the GPU. **Always the lowest-priority tenant.** Each layer is independently a brake.

---

## 5. What "review/support the PoeTech App" means operationally (the MVP)

The first instance of §2.3: the **Dev/Ops Foundation Team** (Pilot #1) pointed at the PoeTech repo + running app. **(1) Continuous code-review** — on each push/PR + a scheduled sweep, pull the diff, RAG the repo, emit findings (correctness, PERPETUAL-PIPELINE-HEALTH violations, missing brakes, TLC-firewall leaks, same-origin regressions) as **proposals** to the ledger. **(2) QA.** **(3) Observability.** **Read-only in the MVP**; mutations only after the soak proves clean, only through guarded-action + health-gate. Ships **inactive** → **read-only with someone watching** → **never** unattended or during travel (P11). "NAS-only sovereign" does not downgrade Tier C (P12). **§6 extends this same engine from the App's code to all three live sites and their business systems.**

---

## 6. The applied loops — review, calendar, and funnel across the three entities

F, G, and H are **not three new features**; they are the §10 "for us, by us" loop applied to three concrete business-system surfaces. Each respects the §2 isolation tiers (**TLC ISO-1 is senior — F/G/H for TLC touch the public/marketing surface only, zero PHI**), each runs **behind the Cage** (read-only/draft first, four brakes, §4 GPU yield), and each **produces telemetry that re-baselines the §7 estimates.** All three follow the §9 staged write path: review → draft → scoped publish behind approval → never autonomous doctrinal/clinical publish.

### 6.1 (F) Continuous multi-site review + upgrade loop

**Scope: all three live web properties — thechurchofthelivinggod.com, tlctherapysolutions.com, poetech.us — combed continuously.** Detect changes, propose upgrades, **each optimized to ITS OWN success objective** ("the best possible results from each"):

| Entity | "Best results" objective | What the LLM optimizes | Gate |
|---|---|---|---|
| **Church** (ISO-2) | **Reach / engagement / discipleship — Father's Business** | Content clarity, **accessibility for an elderly tech-novice congregation** (`COMMUNITY-FIRST-MISSION`), service-info findability, sermon-content distribution, connection pathways | **Doctrine/human approval before any copy change** |
| **TLC** (ISO-1) | **Ethical client acquisition — public/marketing surface ONLY, NEVER PHI** | Public-site clarity, trust signals, accessibility, appointment-request findability. **Zero client data; no behavioral profiling; review never leaves the public surface.** | Firewall + human review; sovereign-only |
| **PoeTech App** (ISO-3) | **Adoption + quality** | Conversion to the free tiers (`project-what-is-actually-free`), **$89 discoverability** (per Freddie-Taylor feedback), code/UX quality, performance, accessibility | Cage; draft-PR → human merge |

**Mechanism:** change-detection (diff the live site / sitemap; watch the repo for poetech) → RAG the site + its objective → propose upgrades as **draft recommendations behind the Cage** (read-only → draft-PR/draft-content), each a ledger event → human/doctrine gate per tier. "Best results from each" = a **per-entity objective function**, not one generic metric.

### 6.2 (G) Calendar auto-update from staff-approved decisions

**The LLM extracts calendar-worthy decisions/events from meeting notes + action-item lists → stages them → a staff green-light approval gate → the calendar auto-updates on a daily-or-workflow-fit cadence.**

- **Synergy — this is the answer to the §4b static-JPG problem.** The approved-decision pipeline **maintains `service-calendar.json` directly**, so the **service-blackout scheduler gets live truth without waiting on COLG to publish iCal.** The church's own meeting decisions become the calendar that gates the GPU. (If COLG later publishes a public iCal, the scheduler subscribes to that; until then, G is the live source.)
- **Governance:** behind the Cage; the **green-light is the human gate**; a concrete instance of the §9 content-approval pattern applied to calendars (stage → staff approve → publish, rollback-able via the health-gate).
- **Per entity:** Church calendar (services/events, staff green-light, Father's Business); **TLC calendar — practice/public events only, NEVER client PHI, staff-approved** (ISO-1 holds); PoeTech release/roadmap calendar from decisions.
- **Cadence:** daily, or whatever cycle fits each staff's workflow (Darrell's framing).

### 6.3 (H) Outcome-driven marketing funnel + sovereign tracking

**Best-in-class tracking that is sovereign and privacy-respecting — self-hosted, NOT Google Analytics** (e.g., self-hosted Plausible / Umami / Matomo / GoatCounter; cookieless, privacy-first, data stays on the NAS). Per entity: an automated marketing funnel + an **outcome-driven optimization loop where the LLMs adjust the funnel on measured results.**

- **Why sovereign analytics:** fits sovereignty + `project-cost-discipline-with-growth-permission` + **`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`** (no advertising model, no engagement maximization, no data sale, no dark UX) + community-default privacy. The structural difference from extractive mainstream analytics IS the moat.
- **Hard constraints:** **TLC analytics carry ZERO PHI** — aggregate/de-identified only, no client-level tracking, no behavioral profiling (ISO-1). Honor **`project-community-free-funded-by-aligned-brand-sponsorship`** — funded by vetted aligned-brand partners, **never** by selling data or skimming subscribers; no engagement-extraction.
- **Per-entity funnel objective:** Church (visitor → service attendance → connection/discipleship path); **TLC (public visitor → appointment request — ethical, no PHI, no profiling)**; PoeTech (visitor → free-tier signup → $89 conversion where appropriate).
- **Closed loop (same as §7/§10):** the analytics ARE the telemetry that §7 re-baselines on AND that H optimizes against — measured outcomes feed the LLMs, which tune the funnel, behind the Cage, with the per-entity gate. Funnel changes graduate through the §9 staged path (draft → approval → scoped publish).

---

## 7. Estimates are data-driven and living — not a waterfall

**Binding methodology (per Darrell): every estimate/projection is anchored to, and re-baselined against, the interconnected data sources that feed the Iterative Software Project.** The §8 dates are **first-pass estimates**, not commitments.

**(a) Which data sources feed which estimate:**

| Estimate | Fed / re-baselined by |
|---|---|
| Eval duration (tok/s per box) | **Execution-Outcome Observability** + the benchmark runs |
| Review cadence / coverage / false-positive rate (incl. multi-site F) | **Continuous Feedback Reel** (`_reel.jsonl`) + **Events-as-data** (`INSTITUTIONAL-MEMORY-EVENTS`) |
| Scheduler tuning (blackout/preempt hit-rates, idle gaps) | GPU telemetry + the Reel |
| Funnel/site-upgrade impact (H, F) | **the sovereign analytics (§6.3)** — conversion, reach, adoption outcomes |
| Calendar-pipeline throughput (G) | approved-decision volume + Events |
| Scope & priority of what gets built next | family/community input (Input-Visibility, wf30/wf08) + **Workflow Module Library** inventory |

**(b) Iterative tightening:** as the loop logs actual throughput, durations, yield-rates, and funnel outcomes, projections move from "research estimate" to "telemetry-backed." Each completed pass is an Event that re-bases the next estimate. **(c) Status:** §8 dates are **first-pass, re-baselined against actual interconnected-system telemetry.** A **living, data-fed projection for community + business-systems workflow building** — when telemetry contradicts an estimate, telemetry wins.

---

## 8. Timelines — living projection, anchored to 2026-06-08

> First-pass estimates (§7). Assumes go-ahead and Node 1 on hand; else add ~1 week standup.

### Track (a) — LLM evaluation

| Phase | Window (first-pass) |
|---|---|
| 0. Harness + eval set (§3) incl. yield/blackout/firewall/unreviewed-publish classes | **2026-06-09 → 2026-06-20** |
| 1. Benchmark candidates (14B on 1× 4070; 30B-A3B if two cards/GPU box) | **2026-06-22 → 2026-07-04** |
| 2. Score + judge + pick | **2026-07-06 → 2026-07-11** |
| **Eval complete** | **~2026-07-11** |

CPU-only fallback: **+2–4 weeks.** The GPU, not COLG, is the gate.

### Track (b) — App-reviewer MVP (read-only)

| Step | Window (first-pass) |
|---|---|
| Reviewer team config + repo RAG + read-only policy behind the Cage on Node 1; brakes 1–3 | overlaps eval |
| **GPU-yield + blackout scheduler** (human-presence sensor + brake 4; `service-calendar.json`; `may_run()` gate) | **~2026-07-13 → 2026-07-22** |
| Ship **inactive** → **read-only** with watching → one full **24/6.5 week** proving four brakes | **~2026-07-22 → 2026-07-27** |
| **Reviewing the App (read-only, proposals to ledger):** | **live ~2026-07-27** |

Needs **none** of COLG procurement / Bishop Gwin gate / dual-3090. 14B S1 on Node 1's 4070, $0 marginal.

### Track (e) — Multi-site review + upgrade loop (F)

| Step | Window (first-pass) |
|---|---|
| Extend the reviewer engine from repo to live-site change-detection + per-entity objectives (§6.1); **PoeTech first**, then **Church** (doctrine gate), then **TLC public surface** (firewall) | **~2026-08 → 2026-10** |
| Read-only → draft-recommendations behind the Cage; human/doctrine gate per tier | living per §7 |

### Track (f) — Calendar pipeline (G)

| Step | Window (first-pass) |
|---|---|
| Meeting-notes → decision-extraction → staging → **staff green-light** → `service-calendar.json` (then the §4b blackout reads it live) | **~2026-08 → 2026-09** |
| High value early: it removes the manual-calendar dependency and feeds the GPU scheduler | living per §7 |

### Track (g) — Funnel + sovereign analytics (H)

| Step | Window (first-pass) |
|---|---|
| Stand up self-hosted privacy-first analytics on the NAS (per entity; **TLC zero-PHI**) | **~2026-08** (stand-up is days) |
| Automated funnel + outcome-driven LLM tuning loop (matures with data) | **2026-Q4+**, living per §7 |

### Track (c) — clean path (showcase) & Track (d) — Phase N+ (FUTURE, §9)

Clean path (dual-3090, multi-model, guarded mutations, COLG-node hosting after Bishop Gwin gate): **Q4 2026.** Content-authoring: **2027+**, gated on a content-approval workflow.

---

## 9. Phase N+ (FUTURE) — LLM-authored website/content updates

> **Deliberately a later phase, NOT the MVP.** Darrell: *"Eventually we will want the websites updated by the LLMs."*

**What it is:** escalating from **read-only review** to **WRITE actions on public-facing surfaces** — PoeTech App AND the church site (and TLC's PHI-free public site). The **highest-risk action class**: a wrong publish is public, and for the church it is doctrinal.

**Non-negotiable governance:** behind the Cage (allowlist + ledger + health-gate/rollback); **Tier C**; all **four brakes**; **human/doctrine approval before any church-content publish** (`project-non-denominational-word-first-body-undivided`); **TLC publish is public-surface only and never carries PHI**. **Two content tiers:** doctrinal/church + clinical/TLC = always human-approved, never auto-published; **PoeTech marketing copy** = eligible for scoped auto-publish behind approval once proven.

**Staged path (each stage earns the next):** (1) read-only review → (2) **draft-PR / draft-content, human merges** → (3) **scoped auto-publish of low-sensitivity surfaces behind approval** (guarded-action + health-gate, rollback-able) → (4) **never** fully-autonomous doctrinal/clinical publish (permanent ceiling).

**G (calendars) is the first concrete instance of this pattern** — stage → staff green-light → publish — proving the approval pipeline on a bounded, low-doctrine surface before any prose is auto-published. **Dependency:** a **content-approval workflow must exist first.** First-pass: **2027+,** re-baselined per §7.

---

## 10. The self-updating loop — "for us, by us" (closing architecture)

Ties §2 (three entities), §6 (the applied loops F/G/H), and §7 (data-driven estimates) into one system. Darrell: *"poetech.us and the PoeTech App being used to consistently update the app for us by us."*

**The PoeTech App (live at poetech.us) is both the product AND the dev/feedback surface — it is dogfooded.** The loop:

```
   family / community input
   (the app's own surfaces: Suggest button, family-voice capture -- wf30 / wf08)
   + measured outcomes (sovereign analytics, section 6.3)
            |
            v
   sovereign LLM team(s)  -- the three-entity teams of section 2
   (review now; multi-site upgrade F, calendar G, funnel H; draft -> scoped publish later, section 9)
            |
            v
   updates produced BEHIND THE CAGE
   (guarded-action + append-only ledger + health-gate/rollback; four brakes; section 4 GPU yield)
            |
            v
   shipped back to the app + the three sites  ->  next round of input + outcomes
```

**"For us, by us" = sovereign + community-owned:** the systems improve themselves using **our own interconnected data and our own LLMs — no external/proprietary dependency in the loop** (the sovereign analytics of §6.3 are the proof: no Google Analytics, no data sale). Operational embodiment of **`project-continuous-feedback-reel`** (the loop's nervous system), **`INPUT-VISIBILITY-TO-CLAUDE`** (input captured where the team can act — wf30/wf08, the Suggest button), **`BUSINESS-PROCESS-CONNECTIONS`** (every visible surface is one end of a connection; the LLM team + the Cage carries it; the shipped update is the promise kept), and **`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`** (the data serves the family + community, never extracts from them).

**The loop produces its own estimates (§7):** the data it generates — the Reel, the Events, the Observability telemetry, the Module Library, **and the sovereign funnel analytics (H)** — is exactly what re-baselines the §8 projections and what F/H optimize against. **The system measures itself and refines its own roadmap as it runs.** Three entities = *what* the systems serve; F/G/H = *the concrete work*; the loop = *how they improve*; data-driven estimates = *how the loop measures and re-plans itself.* One system.

---

## 11. Recommendation + rationale

**Recommendation: start the App-reviewer MVP on Node 1 now; extend the same engine to multi-site review (F), the calendar pipeline (G), and the sovereign funnel (H) as data-fed phases; hold TLC at ISO-1 absolutely across all of them; gate church content behind doctrine review; decouple from COLG procurement; treat every date as a living projection.**

1. **DO start App-review on Node 1's 4070 in late July**, read-only, behind the Cage, 24/6.5, four brakes. *Because* it needs nothing we don't have, costs $0 marginal, and is the first instance of the three-entity pattern (§2) that F/G/H extend.
2. **DO build G (the calendar pipeline) early** — it removes the manual-calendar dependency, feeds the §4b GPU scheduler live truth, and proves the §9 approval pipeline on a low-doctrine surface. *Because* it's high-leverage and de-risks content-authoring.
3. **DO build the GPU-yield + blackout scheduler before go-live** (human-presence preemption is the primary ask and a real brake). The blackout needs a manual `service-calendar.json` today — **no church feed exists** — which G then maintains.
4. **DO hold TLC at ISO-1 across F, G, and H** — public/marketing surface only, zero PHI, sovereign-only, fail-closed. *Because* PHI + a vendor LLM is an unrecoverable breach; this is senior to every objective in §6.
5. **DO use sovereign, privacy-respecting analytics (H), never Google Analytics** — self-hosted on the NAS. *Because* it fits sovereignty + cost-discipline + `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` + the aligned-brand funding model, and it IS the telemetry the loop re-baselines on.
6. **DO optimize each site to its own objective (F)** — Church reach/discipleship, TLC ethical public acquisition, PoeTech adoption/quality — not one generic metric.
7. **DO confirm the "4070's" topology** (1× 12 GB vs 2× in one box vs Ti SUPER 16 GB) — it decides 14B vs 30B-A3B (§1).
8. **DO treat the timeline as data-driven and living** (§7) — re-baseline against the Reel / Events / Observability / Module Library / analytics; the dates are first-pass.
9. **DO NOT block App-review on the $14–19k COLG procurement or the Bishop Gwin gate.**
10. **DO NOT ship Phase N+ content-authoring early** (§9) — read-only → draft-PR → scoped auto-publish behind approval, never autonomous doctrinal/clinical publish; first-pass 2027+, gated on a content-approval workflow (G is the first instance).

**One-line answers:**
- **LLM evaluation:** ~5 weeks, **done ~2026-07-11** (a 4070 on hand); +2–4 wk if CPU-only — *re-baselined per §7.*
- **Sovereign team begins reviewing the App:** **MVP ~2026-07-27** (read-only, Node 1, four brakes, 24/6.5); **multi-site review (F) + calendar (G) + funnel (H) phase in Q3–Q4 2026**; **clean path Q4 2026**; **content-authoring 2027+ (FUTURE).**

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
- `infra/ai-orchestrator/` — the Cage (Node 1/Node 2/Registry; both 1× RTX 4070 12 GB; guarded-action.sh, 001-audit-ledger.sql, health gate, schedule boundary)
- `docs/00-foundations/_root/CLAUDE-TOOL-ROUTING.md` — Tier 0/1/2 routing, **the TLC firewall**, $25/$50 caps
- `docs/00-foundations/_root/RELEASE-TIERS.md` — Tier C criteria
- `docs/00-foundations/_root/LESSONS-LEARNED.md` — 2026-06-06 runaway; P10/P11/P12
- `docs/00-foundations/_root/DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md` — the H constraints
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` — Option 2 dual-3090; CPU-only DS1621xs ceiling
- `docs/99-session-notes/2026-06-01-research-review-sovereign-llm-teams-architecture.md` — per-industry team = model+prompt+tools+RAG+policy; Dev/Ops as Pilot #1
- the Bishop Gwin / COLG migration brief — the COLG alignment gate
- memory: `project-continuous-feedback-reel`, `INPUT-VISIBILITY-TO-CLAUDE`, `BUSINESS-PROCESS-CONNECTIONS`, `INSTITUTIONAL-MEMORY-EVENTS`, `EXECUTION-OUTCOME-OBSERVABILITY`, `WORKFLOW-MODULE-LIBRARY`, `project-brand-surface-hosting-map`, `project-non-denominational-word-first-body-undivided`, `project-community-free-funded-by-aligned-brand-sponsorship`, `project-what-is-actually-free`, `project-freddie-taylor-beta-user`, `feedback-autonomous-automation-three-brakes`
- `CLAUDE.md` — "Autonomous Automation Requires Three Brakes"

---

*The default is sovereign. TLC never leaves the firewall — in review, in calendars, in analytics. The church's words are reviewed before they are spoken. The human at the keyboard always wins the GPU. The reviewer rests around every service and on the Lord's Day. Four brakes hold, read-only first, someone watching. Each site is tuned to its own God-given purpose. The app improves itself, for us by us, with our own data and our own models, and measures its own progress as it goes. We all win. We create. Amen.*
