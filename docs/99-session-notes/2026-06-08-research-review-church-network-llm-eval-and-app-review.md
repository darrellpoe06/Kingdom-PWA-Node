# Research Review — Sovereign LLM Teams for the Three Entities: Evaluation, App-Review, and the Self-Updating Loop

**Date:** 2026-06-08 (Mon)
**Author:** Claude (research-review on Darrell's commission, per `feedback-research-first`)
**Triggered by:** Darrell — evaluate new/candidate LLMs for the Church network and give realistic, data-driven timelines for the LLM evaluation and for the sovereign team beginning to continuously review/support/upgrade the three web properties and their business systems. **Rev. 5** folds in items A–J (see TL;DR).
**Status:** Research-review. **No code, no workflow changes, nothing applied to the NAS.** Decision support only.
**Output gate:** binding filters — `project-cost-discipline-with-growth-permission`, `project-sovereign-llm-teams-per-industry`, `feedback-autonomous-automation-three-brakes` (CLAUDE.md "Three Brakes"), RELEASE-TIERS Tier C, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, `COMMUNITY-FIRST-MISSION`, **the TLC firewall (binding, structural — §2.2; senior everywhere below)**, **"we do not sell data" (binding — §7)**.
**Pairs with:** `infra/ai-orchestrator/` (the Cage), `CLAUDE-TOOL-ROUTING.md`, `RELEASE-TIERS.md`, `LESSONS-LEARNED.md` (P10/P11/P12), `AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md`, `2026-06-01-research-review-sovereign-llm-teams-architecture.md`, the Bishop Gwin / COLG migration brief, `GOVERNANCE-EXECUTION-ADVISORY.md`, `AI-FOUNDATION-INTERNAL-OPERATIONS.md`, `IDENTITY-ROLES-AUDIT.md`, `project-continuous-feedback-reel`, `INPUT-VISIBILITY-TO-CLAUDE`, `BUSINESS-PROCESS-CONNECTIONS`, `INSTITUTIONAL-MEMORY-EVENTS`, `EXECUTION-OUTCOME-OBSERVABILITY`, `WORKFLOW-MODULE-LIBRARY`, `project-brand-surface-hosting-map`, `project-non-denominational-word-first-body-undivided`, `project-community-free-funded-by-aligned-brand-sponsorship`, `project-what-is-actually-free`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`.

> **Decision Records:** the durable decisions in this review are recorded as append-only Decision Records — index at [`docs/decisions/INDEX.md`](../decisions/INDEX.md), convention at [`docs/decisions/README.md`](../decisions/README.md). Items **A–J map to DR-0001…DR-0010** (A=DR-0001 … J=DR-0010). This narrative is the synthesis; the DRs are the source of truth. Future changes are new DRs that supersede — not rewrites of this report.

---

## TL;DR (read this first)

- **Three entities, three sensitivity tiers (§2):** **(1) the Church** (COLG / thechurchofthelivinggod.com) — doctrine-gated; **(2) TLC** (tlctherapysolutions.com) — **HIGHEST ISOLATION: HIPAA/PHI, sovereign-only, hard firewall, senior to everything**; **(3) the PoeTech App** (poetech.us) — Cage-gated.
- **Three applied loops across all three live sites (§6):** **(F)** continuous multi-site review + per-objective upgrades; **(G)** calendar auto-update from staff-green-lit decisions (also feeds the §4 blackout scheduler); **(H)** outcome-driven funnel + **self-hosted, privacy-respecting** analytics.
- **(I) First-party data + identity layer (§7):** sovereign email + user-login/SSO (self-hosted IDP, token-isolated) capturing first-party signals **with consent, for INTERNAL continuous decision-making only — we do NOT sell data (binding principle).** This is the primary fuel for D + H. TLC email/logins are ISO-1: **zero PHI in any analytics or decision dataset, ever.**
- **(J) LLMs do the work — bounded autonomy (§8):** LLMs **execute end-to-end** wherever work doesn't *structurally* require a human; staff toil drives toward zero. **Reconciled with the runaway incident:** autonomy is **bounded by the Cage** (four brakes + allowlist + append-only ledger + health-gate/auto-rollback), **not** by routing toil through humans. **Brakes prevent runaway; human gates are for irreducible JUDGMENT** (doctrinal publish, TLC clinical/PHI, money movement, destructive/irreversible actions, final green-lights), **not for labor.** Autonomy is **earned per surface as the Cage proves safe.**
- **App-review does NOT depend on COLG procurement or the Bishop Gwin gate** (`feedback-surface-premise-conflicts`).
- **Compute is NVIDIA RTX 4070 (CUDA).** "4070's" → **two 12 GB cards (confirm topology).** Two boxes ⇒ 14B ceiling; two cards in one box (~24 GB) ⇒ unlocks 30B-A3B (§1).
- **GPU scheduling (§4):** human-presence preemption (4th brake) > service blackout (±1 h) > 24/6.5 Sabbath (Sun 00:00–12:00 Central) > the job.
- **Calendar is a static JPG** (confirmed 2026-06-08): **Sun Worship 11 AM; Wed Bible Study 1 PM & 6 PM; office hours M–F 11 AM–6 PM. No iCal feed** → manual `service-calendar.json`, maintained by (G).
- **Estimates are data-driven and living (§9), not a waterfall** — re-baselined against the Reel / Events / Observability / Module Library / sovereign analytics + first-party data (I).
- **Timelines anchored to 2026-06-08 (first-pass, §10):** eval **~2026-07-11**; App-review **MVP ~2026-07-27**; F/G/H/I phase in **Q3–Q4 2026**; **scoped autonomous execution (J) earned per surface Q4 2026 → 2027**; content-authoring **2027+**.

---

## 1. Candidate LLMs to evaluate

> **Freshness caveat.** Training cutoff is January 2026; names/benchmarks/licenses below are from June 2026 web sources (cited) and move fast. **Re-verify at eval time** (§3).

### Hardware envelope — RTX 4070 (CUDA)

| Box | Spec | VRAM | Role |
|---|---|---|---|
| **DS1621xs** (existing NAS) | Xeon D-1527 4c/8t, 32 GB ECC, CPU-only | n/a (RAM-bound) | Registry (Postgres+pgvector), batch inference, embeddings, **self-hosted analytics (H) + IDP/SSO (I)** |
| **Node 1** (Legion PC, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Daily-driver review inference; one 14B + one embedder (`OLLAMA_MAX_LOADED_MODELS=2`) |
| **Node 2** (Church Switcher, in the Cage) | **1× RTX 4070 (CUDA)** | **12 GB** | Church A/V (NDI/OBS/Proclaim). **Forbidden during active church hours** |
| **Planned GPU box** (`AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` Opt. 2) | 2× used RTX 3090 | **48 GB** combined (~$2,000) | Clean-path parallel multi-model; 30B–70B class |

**The "4070's" question — flagged for confirmation.** **A (likely, per the Cage): two separate boxes**, each 1× 12 GB → **14B ceiling**. **B: two cards in one box** → ~24 GB → unlocks **30B-A3B / 27–32B / Devstral**. **Variant:** 4070 Ti SUPER = 16 GB. Cage `docker-compose.yml`: *"One 14B resident at a time on a 4070. Never pull 32B+ here."*

> **RATIFIED 2026-06-09 (Darrell, delegated to Claude) — see [DR-0012].** The 4070 lives in **Darrell's creative workstation**, which runs heavy CUDA apps (Adobe Premiere / After Effects, Cinema 4D, Photoshop, OBS). **The GPU is shared with creative production, and creative work has absolute priority.** Therefore:
> - **Design for the conservative single-4070 envelope (~12 GB, 1 card assumed).** 2× / Ti SUPER are documented as **upgrade paths only**, not assumed.
> - **Daily reasoner is locked to a 14B-class model that fits ~12 GB quantized and unloads instantly** — `qwen2.5-coder:14b` (Q5_K_M) or `qwen3:14b` (Q4) (S1). 30B-A3B and above stay strictly on the upgrade paths.
> - **The exact card (1 vs 2, base vs Ti SUPER) can be auto-detected later via `nvidia-smi` from a session on that box to refine the choice — this does NOT block.** The conservative design holds regardless of what detection finds.

### Sovereignty-tier scale (defined for this eval)

- **S1 — Fully sovereign / air-gap capable:** open weights, permissive (Apache-2.0/MIT), one 4070 or the NAS, zero callback.
- **S2 — Sovereign, hardware-gated:** open + permissive, needs 2× 4070 or the GPU box.
- **S3 — Sovereign-capable but impractical now.** **S4 — Not sovereign:** vendor API; escalation-only; **never** TLC.

### A. Code-review / reasoning candidates (1× vs 2× 4070)

| Model | Params | Fit | VRAM @ Q4 | Runs on | License | Sov. | Cost |
|---|---|---|---|---|---|---|---|
| **Qwen2.5-Coder 14B** | 14B dense | Strong review; non-MoE; current Cage `OLLAMA_CODER_MODEL` | ~9 GB / fits 12 GB @ Q5 | **1× 4070** | Apache-2.0 | **S1** | $0 marg. Lean default. |
| **Qwen3 14B** | 14B dense | Better reasoning on a budget; ~61 tok/s on 12 GB | ~8.5 GB | **1× 4070** | Apache-2.0 | **S1** | $0 marg. |
| **Qwen3-Coder 30B-A3B** | 30.5B MoE (3B active) | Best sovereign agentic value; MoE = fast | ~22 GB | **2× 4070** / GPU box | Apache-2.0 | **S2** | $0 marg. |
| **Qwen3.6-27B** | 27B dense | Strong all-rounder | ~16–20 GB | **2× 4070** / GPU box | Apache-2.0 | **S2** | $0 marg. |
| **Devstral Small 24B** | 24B | Agentic coding specialist | ~16 GB | **2× 4070** (or 1× 16 GB Ti SUPER) | Apache-2.0 | **S2** | $0 marg. |
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

Per `project-sovereign-llm-teams-per-industry`, a team = *model + system prompt + tool list + RAG corpus + pre-authorized policy*. The same pattern serves **three entities**, each at a **different sensitivity tier with a different guardrail.**

### Shared substrate (applies to all three)

Everything rides behind **the Cage** (`infra/ai-orchestrator/`): guarded-action **allowlist** + VLAN guard + **append-only, hash-chained `ai_audit_ledger`** + **120 s Uptime-Kuma health gate with auto-rollback**. **Read-only first.** The Cage is also **what bounds autonomous execution (§8)** — it is the safety envelope that lets LLMs *do the work* without runaway. The **four brakes** are mandatory for anything timer-driven or write/execute-capable (Tier C per CLAUDE.md + LESSONS-LEARNED P10/P11/P12):

| Brake | Implementation |
|---|---|
| **1. Budget** | Per-run token/turn/wall-clock ceiling; a pass that hits it **terminates**. S4 judge under $25 soft / $50 hard. |
| **2. Concurrency lock** | Single-instance; a fire that finds a prior pass running **SKIPS** (the wf27/builder runaway mode). |
| **3. Kill-switch** | Dead-man's-switch on overrun/failure/missed-heartbeat → **auto-pause**, plus the weekly Sabbath cooldown (§4c). |
| **4. Human-demand preemption** | A human using the system instantly reclaims the GPU; the job suspends/resumes (§4a). |

### 2.1 The Church — COLG / thechurchofthelivinggod.com  ·  Tier ISO-2 (doctrine-gated)

| | |
|---|---|
| **LLM-supported systems** | Sermon-to-content pipeline, study-guide/devotional drafting, comms drafting, church-ops workflow, growth/marketing, website content + **upgrade review (F)**, **calendar from approved decisions (G)**, **reach/engagement funnel (H)**, **member email/login (I)**. |
| **Sensitivity** | **Doctrinal + content.** Father's Business; **non-denominational, Word-first, Body-undivided**; Scripture senior to tradition; per-tradition weights *with Bishop Gwin*. |
| **Guardrail** | **Human/doctrine approval gate before ANY publish.** Sovereign-first; vendor (S4) only for mechanical non-doctrinal tasks. Eventually hosted on the COLG node (Bishop Gwin gate). |

### 2.2 TLC — tlctherapysolutions.com (Christina's LCSW practice)  ·  Tier ISO-1 (HIGHEST ISOLATION — binding, senior everywhere)

> **Binding structural constraint. The TLC firewall governs F, G, H, I, and J below.**

| | |
|---|---|
| **Binding rule** | **LLMs supporting TLC NEVER touch client PHI.** Sovereign-only: **no vendor/cloud LLM on any TLC data path — regardless of token, task class, or who asked.** Fail-closed (`CLAUDE-TOOL-ROUTING.md`: Counseling `allowed_providers = [ollama]`, `bright_line_overrides: tlc_clinical_data`). If possibly clinical, treat as clinical and stay sovereign. |
| **Isolation mechanics** | Token isolation + permission gates; NAS-side regex pre-filter blocks egress. No TLC PHI on Hostinger (no BAA). |
| **What LLMs CAN support (non-PHI only)** | **Public/marketing surface only**; PHI-free scheduling plumbing; practice-ops docs; **de-identified/aggregate** non-PHI reporting. **F/G/H/I for TLC touch the public surface ONLY; zero PHI in any analytics, identity, or decision dataset.** |
| **Guardrail tier** | **ISO-1 — highest.** Sovereign-only, never PHI, fail-closed. Senior to cost, capability, convenience, and to every loop/principle below. |

### 2.3 The PoeTech App — poetech.us  ·  Tier ISO-3 (behind the Cage; marketing sub-tier lower)

| | |
|---|---|
| **LLM-supported systems** | **Continuous code-review** (the MVP), QA, observability, **site-upgrade review (F)**, marketing-copy, **release/roadmap calendar (G)**, **adoption funnel + analytics (H)**, **user login/SSO + first-party signals (I)**, non-sensitive product-telemetry reporting. |
| **Sensitivity** | Lower than Church/TLC — **but still behind the Cage.** Sub-tiers: code/product (review-then-merge) and marketing copy (lightest). |
| **Guardrail** | Read-only review → draft-PR → scoped autonomous execution behind the Cage (§8) → human gate where structurally required (§11). |

**Guardrail summary:** **ISO-1 TLC** ⟶ **ISO-2 Church** ⟶ **ISO-3 PoeTech App.** Sensitivity sets the gate; the Cage + four brakes are the floor under all three and under every loop (§6), the data layer (§7), and all autonomous execution (§8).

---

## 3. Evaluation methodology

**Goal:** pick the smallest model that clears the bar for *continuous review/support/execution* on owned hardware.

**Eval set (our own ground truth, ~40–60 items):** (1) **real repo diffs with known verdicts**; (2) **seeded-bug diffs** — missing try-catch on external I/O, a timer-driven change missing a brake, a same-origin regression, **a TLC-firewall leak**, **a GPU job that ignores human-yield/blackout**, **an action that publishes unreviewed church copy or moves money without a gate** (the §8 irreducible-judgment classes); (3) **retrieval probes**; (4) **false-positive control**.

**Scoring (weighted):** recall (heaviest) · precision · groundedness (auto-checkable citations) · latency/throughput on the target box · cost. **Judges:** automated first pass → LLM-judge panel (vendor frontier S4, escalation-only, **repo/public-site content only, never TLC/clinical** + a second sovereign model), adversarial *refute-each-finding* framing → human spot-check (Quality Gatekeeper signs the Tier-C gate). **TLC firewall holds throughout.**

---

## 4. GPU scheduling — three layers of yield (first-class)

The fleet shares CUDA GPUs with **humans**, **creative production**, and **church A/V**; it is always the lowest-priority tenant. **Creative/human use beats service-window beats Sabbath beats the job.** Per [DR-0012], the 4070 lives in Darrell's creative workstation (Premiere / After Effects / Cinema 4D / Photoshop / OBS) — so creative work has absolute priority and the reasoner must be evictable in ~1 s.

### (a) Human-presence + creative-app preemption — the primary ask ("even better")

**Whenever a human is actively using the system — OR any creative/CUDA app is active — LLM background processes immediately yield CUDA bandwidth and resume after.** The **4th brake — a human-demand kill-switch.** Per [DR-0012], **creative apps / ANY non-Ollama CUDA process are a first-class, absolute-priority preemption trigger** — the reasoner yields the moment they appear, not only on session/PWA activity. Demand sensor (~1–5 s): **any non-Ollama CUDA process** (`nvidia-smi --query-compute-apps` — e.g. Premiere/AE/C4D/Photoshop/OBS/a game), active desktop session / input on the box, or a live PWA "human-active" ping. Yield (~1 s): **pause** (cancel-and-requeue or `SIGSTOP`) + **free VRAM** (`OLLAMA_KEEP_ALIVE=0`) so the full ~12 GB goes to creative work. Resume after ~5 min of no demand (hysteresis), re-checking blackout + Sabbath first. **Net rule: an LLM job never competes with creative production — it fills the gaps around it.**

### (b) Service-window blackout — calendar-driven

**No LLM compute from 1 h BEFORE to 1 h AFTER each church service/event.**

**Source of truth — the COLG calendar (fetched 2026-06-08; static JPG, NO feed):**

| Service | Day/Time (confirmed) | Blackout (±1 h) |
|---|---|---|
| Sunday Worship Experience | **Sun 11:00 AM** | **Sun 10:00 AM – 2:00 PM** |
| Wednesday Bible Study (afternoon) | **Wed 1:00 PM** | **Wed 12:00 PM – 3:30 PM** |
| Wednesday Bible Study (evening) | **Wed 6:00 PM** | **Wed 5:00 PM – 8:30 PM** |
| Office hours (staff present) | **Mon–Fri 11 AM – 6 PM** | *dynamic — human-presence preemption (4a)* |

**Reconciliation:** matches the known COLG cadence — **no discrepancy.** **No iCal/ICS/feed exists.** The scheduler needs a manual **`service-calendar.json`** — **which §6.2 (G) maintains live from staff-approved decisions** (and if COLG later publishes a public iCal, the scheduler subscribes to that).

### (c) 24/6.5 Sabbath rest — the weekly forced cooldown

**24 h/day, 6.5 days/week — NOT 24/7. Sabbath: every Sunday 00:00–12:00 Central — a 12 h pause = the 0.5 day.** All automation **pauses by default**; the watchdog **expects silence**. A failure to engage trips the kill-switch.

### GPU yield + blackout architecture — how a/b/c stack

```
may_run() =
  NOT human_or_creative_cuda_active()  # (4a) creative app / any non-Ollama CUDA proc / human -- absolute priority, ~1s
  AND NOT in_service_blackout()        # (4b) +/-1h around each service (service-calendar.json, kept live by G)
  AND NOT in_sabbath_window()          # (4c) Sun 00:00-12:00 Central
  AND off_hours()                      # heavy eval/review batched to off-hours; never on creative-production hours
  AND brakes_ok()                      # (1) budget  (2) no other instance  (3) watchdog healthy
  -> else: PAUSE, free VRAM, requeue, re-check next tick

Priority ladder:  1. CREATIVE app / HUMAN CUDA -> 2. service +/-1h -> 3. Sabbath -> 4. LLM review/eval job (lowest)
```

Net: ≤156 h/week (24×6.5), minus blackouts, minus every moment a human wants the GPU.

---

## 5. What "review/support the PoeTech App" means operationally (the MVP)

The first instance of §2.3: the **Dev/Ops Foundation Team** (Pilot #1) on the PoeTech repo + running app. **(1) Continuous code-review** — pull the diff, RAG the repo, emit findings as **proposals** to the ledger. **(2) QA.** **(3) Observability.** **Read-only in the MVP**; execution comes only after the soak proves clean, only through guarded-action + health-gate (§8). Ships **inactive** → **read-only with someone watching** → **never** unattended or during travel (P11). "NAS-only sovereign" does not downgrade Tier C (P12). **§6 extends this engine to all three sites; §8 graduates it from proposing to doing.**

---

## 6. The applied loops — review, calendar, and funnel across the three entities

F, G, H are the §12 "for us, by us" loop applied to concrete surfaces. Each respects the §2 tiers (**TLC ISO-1 senior — public surface only, zero PHI**), runs **behind the Cage** (read-only/draft first, four brakes, §4 GPU yield), feeds the §9 telemetry, and graduates along the §8 autonomy gradient.

### 6.1 (F) Continuous multi-site review + upgrade loop

**Scope: all three live properties combed continuously**, each optimized to **ITS OWN** success objective:

| Entity | "Best results" objective | Gate |
|---|---|---|
| **Church** (ISO-2) | **Reach / engagement / discipleship — Father's Business**; content clarity, **accessibility for an elderly tech-novice congregation**, service-info findability, sermon distribution | Doctrine/human approval before any copy change |
| **TLC** (ISO-1) | **Ethical client acquisition — public/marketing surface ONLY, NEVER PHI**; clarity, trust signals, accessibility, appointment-request findability. Zero client data; no profiling | Firewall + human review; sovereign-only |
| **PoeTech App** (ISO-3) | **Adoption + quality**; free-tier conversion (`project-what-is-actually-free`), **$89 discoverability** (Freddie-Taylor feedback), code/UX quality, performance | Cage; draft-PR → human merge / §8 scoped execution |

**Mechanism:** change-detection (diff live site/sitemap; watch the repo) → RAG site + objective → propose upgrades as **draft recommendations behind the Cage**, each a ledger event → per-tier gate. "Best results from each" = a **per-entity objective function.**

### 6.2 (G) Calendar auto-update from staff-approved decisions

**LLM extracts calendar-worthy decisions/events from meeting notes + action-item lists → stages them → staff green-light gate → calendar auto-updates daily-or-workflow-fit.**
- **Synergy — the answer to the §4b static-JPG problem.** The pipeline **maintains `service-calendar.json` directly**, so the blackout scheduler gets **live truth without waiting on COLG to publish iCal.** The church's own decisions become the calendar that gates the GPU.
- **Governance:** behind the Cage; **green-light is the human gate** (an §8 irreducible final green-light); a concrete instance of the §11 content-approval pattern (stage → approve → publish, rollback-able).
- **Per entity:** Church (services/events, staff green-light); **TLC (practice/public events only, NEVER PHI, staff-approved)**; PoeTech (release/roadmap).

### 6.3 (H) Outcome-driven marketing funnel + sovereign tracking

**Best-in-class tracking that is sovereign and privacy-respecting — self-hosted, NOT Google Analytics** (self-hosted Plausible / Umami / Matomo / GoatCounter; cookieless, data on the NAS). Per entity: an automated funnel + an **outcome-driven loop where the LLMs tune the funnel on measured results.**
- **Why sovereign:** sovereignty + cost-discipline + **`DATA-AS-EMPOWERMENT-NOT-EXTRACTION`** (no ad model, no engagement maximization, no data sale, no dark UX) + community-default privacy.
- **Hard constraints:** **TLC analytics carry ZERO PHI** — aggregate only, no client-level tracking. Honor **`project-community-free-funded-by-aligned-brand-sponsorship`** — never selling data or skimming subscribers.
- **Per-entity funnel objective:** Church (visitor → attendance → discipleship); **TLC (public visitor → appointment request — ethical, no PHI)**; PoeTech (visitor → free-tier → $89 where appropriate).
- **Closed loop:** the analytics ARE the telemetry §9 re-baselines on AND that H optimizes against. Funnel changes graduate through the §8 / §11 staged path.

---

## 7. First-party data + identity layer (I) — sovereign email + login, never sold

The loops above are only as good as the signals feeding them. **(I)** is the sovereign first-party data + identity layer that lets the LLMs *make better decisions continuously* — Darrell: *"email and user logins that let us pull the most useful data for our business purposes and opportunities — we do NOT want to sell data, we DO need it to make better decisions continuously."*

### Sovereign email + user-login / SSO (the identity layer)

- **Self-hosted identity provider (IDP) + SSO** — one sovereign login across the entities' surfaces, **token isolation + permission gates**, **no external proprietary identity dependency** (no third-party social-login lock-in for the core). Consistent with **Darrell's named SOUL.md secure-access posture** and the **COLG-NAS "Path C real auth"** direction, and with `IDENTITY-ROLES-AUDIT.md`. Established sovereign options to evaluate: self-hosted **Authentik / Keycloak / Zitadel** (OIDC/SAML), with the IDP and the email system on the NAS/registry tier.
- **Sovereign email** — first-party email (lists, transactional, member/user comms) on infrastructure we control, so the relationship and its signals are ours, not a vendor's.

### First-party data strategy — **BINDING: we do not sell data**

This is a **binding principle of this document, not a nicety:**
- **Data is captured with consent and used INTERNALLY — for continuous decision-making and opportunity-spotting only.** **Never sold. Never engagement-extraction. Never an advertising model. No dark UX, no consent fatigue.** (Operationalizes `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`: family/community own their data; opt-in per stream; aggregation only via explicit per-study opt-in; deletion immediate + verifiable.)
- **Funding stays aligned:** revenue comes from the products + the **aligned-brand-sponsorship** model (`project-community-free-funded-by-aligned-brand-sponsorship`), **not** from monetizing the data. The structural refusal to sell IS the moat.
- **PIN-optional / community-default privacy** is honored; first-party ≠ surveillance.

### Per-entity isolation (the firewall holds in the data layer too)

| Entity | Identity + first-party data posture |
|---|---|
| **TLC** (ISO-1) | **PHI-adjacent → strictest. Sovereign-only. ZERO PHI in any analytics or decision dataset, ever.** Email/logins for the public practice surface carry no clinical content; client identity and PHI never enter the LLM decision loop. Login auth may exist for a portal, but **its PHI is walled off from all analytics/decisioning.** |
| **Church** (ISO-2) | Member email/login at the church tier; engagement signals used internally for discipleship/reach (F/H); doctrine gate on any outbound content. |
| **PoeTech App** (ISO-3) | User login/SSO + product first-party signals (adoption, free-tier→$89 funnel); used internally to improve the app and the funnel. |

### Feeds the continuous loop (explicit)

**First-party data (I) is a primary input to D (§9, data-driven estimates) and H (§6.3, outcome-driven funnel).** The email/login signals — who engages, which surfaces convert, where the funnel leaks — are precisely what let the LLMs "make better decisions continuously" and what re-baselines the projections. **The data serves the family + community and never leaves the sovereign loop.**

---

## 8. LLMs do the work — bounded autonomy, reconciled with the brakes (J)

**Binding operating principle (Darrell):** *"the LLMs should create solutions AND do the work it's requesting from staff — unless staff MUST be involved; we want staff working as little as possible."* **LLMs execute end-to-end wherever the work does not STRUCTURALLY require a human — not draft-and-hand-off.** This is `GOVERNANCE-EXECUTION-ADVISORY` ("offload work to LLMs; humans govern + execute strategic + approve") and `AI-FOUNDATION-INTERNAL-OPERATIONS` ("anything that is a click today should be an API call tomorrow; browsers are for humans deciding things, not for systems doing things").

### The tension — surfaced, not papered over

Item J pushes toward **more execution autonomy.** The 2026-06-06 runaway + the three brakes + read-only-first push toward **more restraint.** These are **not** contradictory once you see what each actually constrains:

> **The brakes bound BLAST RADIUS and COMPUTE — not whether a human pushes the button on reversible, low-sensitivity work.** Maximal LLM execution is **bounded by the Cage, not by routing toil through a human.** The four brakes (budget + concurrency lock + kill-switch + human-presence preemption) + the **allowlist** + the **append-only audit ledger** + the **health-gate / auto-rollback** are exactly what make autonomous execution *safe*: they prevent runaway **without** making a human do the labor. The runaway happened because automation ran **without** those primitives — not because it executed. With the Cage, execution is the default; without it, nothing runs active. **The lesson of 2026-06 is "no autonomy without the Cage," not "no autonomy."**

### The irreducible "staff MUST be involved" set — JUDGMENT, not labor

The human gate is reserved for **irreducible judgment**, never for toil. A human is structurally required ONLY for:

1. **Doctrinal / church-content publish** (ISO-2) — the Word carries the church's authority.
2. **TLC clinical / PHI decisions** (ISO-1) — never autonomous, never even seen by a vendor model.
3. **Money movement / transactions** — no autonomous spend, transfer, or charge.
4. **Destructive / irreversible actions** — anything the health-gate can't roll back.
5. **Final green-lights** — the staff approve-to-publish gate (e.g., item G's calendar green-light).

**Everything else → the LLM executes it.** Drafting, refactoring, reversible config, content *staged for* approval, calendar entries *pending* green-light, funnel adjustments within pre-approved bounds, the whole long tail of clicks-that-should-be-API-calls — done by the LLM, behind the Cage, with the staff watching outcomes, not doing keystrokes.

### The sharpened staged model (supersedes the earlier "review → draft → publish")

```
1. READ-ONLY REVIEW        -> proposals to the ledger                         [MVP, section 5]
2. DRAFT                    -> draft-PR / staged content / pending calendar     [F / G]
3. SCOPED AUTONOMOUS        -> LLM EXECUTES low-sensitivity, REVERSIBLE work
   EXECUTION behind the        end-to-end via guarded-action + health-gate;
   Cage                        instant rollback; full ledger trail             [J -- earned]
4. HUMAN GATE ONLY WHERE    -> the 5 irreducible-judgment classes above
   STRUCTURALLY REQUIRED       (doctrine / PHI / money / destructive / green-light)
```

**Autonomy is earned PER SURFACE as the Cage proves safe on it** — the same maturity discipline as the post-incident quarantine bright line (earn trust before activation; nothing self-activates unattended; P11). A surface graduates from stage 2 to stage 3 only after a clean soak with the brakes proven; a sensitive surface never leaves stage 1–2.

### The principle, crisply

> **Brakes prevent runaway. Human gates are for irreducible judgment. Staff toil is the thing we drive toward zero.**

---

## 9. Estimates are data-driven and living — not a waterfall (D)

**Binding methodology (Darrell): every estimate is anchored to, and re-baselined against, the interconnected data the Iterative Software Project produces.** The §10 dates are **first-pass**, not commitments.

| Estimate | Fed / re-baselined by |
|---|---|
| Eval duration (tok/s per box) | **Execution-Outcome Observability** + the benchmark runs |
| Review/execution cadence, coverage, false-positive rate | **Continuous Feedback Reel** (`_reel.jsonl`) + **Events-as-data** |
| Scheduler tuning (blackout/preempt hit-rates) | GPU telemetry + the Reel |
| Funnel/site-upgrade impact (H, F) | **the sovereign analytics (§6.3) + first-party data (§7)** |
| Autonomy-graduation readiness per surface (J) | soak cleanliness + ledger outcomes per surface |
| Scope & priority of what's next | family/community input (Input-Visibility, wf30/wf08) + **Workflow Module Library** |

**Iterative tightening:** each completed pass is an Event that re-bases the next estimate. **Status:** §10 dates are **first-pass, re-baselined against actual telemetry** — a **living, data-fed projection.** When telemetry contradicts an estimate, telemetry wins.

---

## 10. Timelines — living projection, anchored to 2026-06-08

> First-pass estimates (§9). Assumes go-ahead and Node 1 on hand; else add ~1 week standup. **Per [DR-0012], eval proceeds NOW on the conservative single-4070 envelope — it does NOT wait on card-topology confirmation; `nvidia-smi` auto-detection can refine the model choice later without blocking.** Heavy eval/review runs are batched to **off-hours** so they never collide with creative-production days.

| Track | Scope | Window (first-pass) |
|---|---|---|
| **(a) LLM evaluation** | Harness + eval set → benchmark → pick a 14B-class daily reasoner on the **conservative single-4070** envelope (§3, [DR-0012]); off-hours batching | **2026-06-09 → ~2026-07-11** (CPU-only: +2–4 wk) |
| **(b) App-reviewer MVP** | Reviewer config + repo RAG + **GPU-yield/blackout scheduler** + four brakes; ship inactive → read-only → one 24/6.5 week | **→ live ~2026-07-27** (read-only; Node 1's 4070; $0 marg.) |
| **(e) Multi-site review (F)** | Extend engine to live-site change-detection + per-entity objectives; PoeTech → Church (doctrine) → TLC public surface (firewall) | **~2026-08 → 2026-10** |
| **(f) Calendar pipeline (G)** | Meeting-notes → decision-extraction → staff green-light → `service-calendar.json` (feeds §4b) | **~2026-08 → 2026-09** (high value early) |
| **(g) Funnel + sovereign analytics (H)** | Self-hosted privacy-first analytics (TLC zero-PHI) → automated funnel → LLM tuning loop | analytics **~2026-08**; tuning **2026-Q4+** |
| **(h) First-party data + identity (I)** | Self-hosted IDP/SSO + sovereign email; consent + internal-only data; feeds D/H | **~2026-09 → 2026-11** |
| **(i) Scoped autonomous execution (J)** | **Earned per surface as the Cage proves safe.** Stage 2→3 on low-sensitivity reversible surfaces first; irreducible-judgment classes never autonomous | **first surfaces ~2026-Q4 → 2027**; later/earned |
| **(c) Clean path (showcase)** | Dual-3090, multi-model, guarded mutations, COLG-node hosting after Bishop Gwin gate | **Q4 2026** |
| **(d) Phase N+ content-authoring (FUTURE, §11)** | LLM-authored public/church content, behind the approval workflow | **2027+** |

All tracks are **living/data-driven per §9** — dates re-baseline as telemetry arrives.

---

## 11. Phase N+ (FUTURE) — LLM-authored website/content updates (B)

> **Deliberately a later phase, NOT the MVP.** Darrell: *"Eventually we will want the websites updated by the LLMs."*

**What it is:** escalating to **WRITE actions on public-facing surfaces** — PoeTech App AND the church site (and TLC's PHI-free public site). The **highest-risk action class.** **Governance:** behind the Cage; **Tier C**; all four brakes; **human/doctrine approval before any church-content publish**; **TLC publish is public-surface only, never PHI.** Two content tiers: **doctrinal/church + clinical/TLC = always human-approved, never auto-published** (§8 irreducible set); **PoeTech marketing copy = scoped auto-publish behind approval once proven.**

This is **stage 4-adjacent in the §8 gradient** for *public prose*: even when scoped autonomous execution is earned for reversible config, **public content publish for the sensitive entities stays human-gated.** **G (calendars) is the first concrete instance** of the approval pipeline — proving stage 2→3 on a bounded, low-doctrine surface before any prose is auto-published. **Dependency:** a content-approval workflow must exist first. First-pass: **2027+,** re-baselined per §9.

---

## 12. The self-updating loop — "for us, by us" (closing architecture, E)

Ties §2 (entities), §6 (F/G/H), §7 (first-party data + identity), §8 (bounded autonomy), and §9 (data-driven estimates) into one system. Darrell: *"poetech.us and the PoeTech App being used to consistently update the app for us by us."*

**The PoeTech App (live at poetech.us) is both the product AND the dev/feedback surface — dogfooded.**

```
   family / community input (Suggest button, family-voice -- wf30 / wf08)
   + first-party signals (sovereign email + login/SSO -- section 7, consent, internal-only)
   + measured outcomes (sovereign analytics -- section 6.3)
            |
            v
   sovereign LLM team(s)  -- the three-entity teams (section 2)
   review (5) -> upgrade F / calendar G / funnel H (6) -> SCOPED AUTONOMOUS EXECUTION (8)
            |
            v
   work DONE behind the Cage (allowlist + append-only ledger + health-gate/rollback; four brakes; section 4 yield)
   -- human gate ONLY for the 5 irreducible-judgment classes (8)
            |
            v
   shipped back to the app + the three sites  ->  next round of input + signals + outcomes
```

**"For us, by us" = sovereign + community-owned:** our own data, our own identity layer, our own models, our own analytics — **no external/proprietary dependency in the loop, and the data is never sold (§7).** Embodiment of `project-continuous-feedback-reel`, `INPUT-VISIBILITY-TO-CLAUDE`, `BUSINESS-PROCESS-CONNECTIONS`, `DATA-AS-EMPOWERMENT-NOT-EXTRACTION`, and `GOVERNANCE-EXECUTION-ADVISORY`. **The loop now does the work (§8), not just recommends it** — and it produces its own estimates (§9) and optimizes its own funnel (§6.3) from its own first-party data (§7). **Three entities = what the systems serve; F/G/H = the concrete work; I = the data that fuels decisions; J = the LLMs doing the work; the brakes = what keeps it safe; D = how it measures and re-plans itself.** One system.

---

## 13. Recommendation + rationale

**Recommendation: start the App-reviewer MVP on Node 1 now; extend the same engine to F/G/H and the data/identity layer (I) as data-fed phases; let LLMs DO the work bounded by the Cage (J), reserving humans for the five irreducible-judgment classes; hold TLC at ISO-1 absolutely; never sell data; treat every date as a living projection.**

1. **DO start App-review on Node 1's 4070 in late July**, read-only, behind the Cage, 24/6.5, four brakes — the first instance of the pattern F/G/H/I/J extend.
2. **DO build G (the calendar pipeline) early** — removes the manual-calendar dependency, feeds the §4b scheduler, and proves the §8/§11 approval pipeline on a low-doctrine surface.
3. **DO build the GPU-yield + blackout scheduler before go-live** (human-presence preemption is the primary ask and a real brake). Manual `service-calendar.json` today — **no church feed exists** — maintained by G.
4. **DO hold TLC at ISO-1 across F/G/H/I/J** — public surface only, zero PHI in any analytics/identity/decision dataset, sovereign-only, fail-closed. Senior to every objective and principle here.
5. **DO use sovereign, privacy-respecting analytics (H) and a sovereign identity layer (I), never Google Analytics / no third-party identity lock-in.** Self-hosted on the NAS; the telemetry the loop runs on.
6. **DO make "we do not sell data" binding (§7)** — first-party data is captured with consent, used internally for continuous decisions, never sold; funding stays on products + aligned-brand sponsorship.
7. **DO let LLMs execute end-to-end behind the Cage (J), driving staff toil toward zero** — reserve humans for doctrine, PHI, money, destructive actions, and final green-lights. **Brakes prevent runaway; human gates are for judgment.** Earn autonomy per surface as the Cage proves safe.
8. **DO confirm the "4070's" topology** — it decides 14B vs 30B-A3B (§1).
9. **DO treat the timeline as data-driven and living (§9)** — re-baseline against the Reel / Events / Observability / Module Library / analytics / first-party data.
10. **DO NOT block App-review on the $14–19k COLG procurement or the Bishop Gwin gate.**
11. **DO NOT grant autonomous execution before the Cage is proven on that surface, and NEVER for the five irreducible-judgment classes** (§8); **DO NOT auto-publish doctrinal/clinical content** (§11); content-authoring first-pass 2027+.

**One-line answers:**
- **LLM evaluation:** ~5 weeks, **done ~2026-07-11** (a 4070 on hand); +2–4 wk if CPU-only — *re-baselined per §9.*
- **Sovereign team begins reviewing the App:** **MVP ~2026-07-27** (read-only, Node 1, four brakes, 24/6.5); **F/G/H/I phase in Q3–Q4 2026**; **scoped autonomous execution (J) earned per surface Q4 2026 → 2027**; **clean path Q4 2026**; **content-authoring 2027+ (FUTURE).**

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
- `docs/00-foundations/_root/GOVERNANCE-EXECUTION-ADVISORY.md`, `AI-FOUNDATION-INTERNAL-OPERATIONS.md` — the J operating principle
- `docs/00-foundations/_root/DATA-AS-EMPOWERMENT-NOT-EXTRACTION.md`, `COMMUNITY-FIRST-MISSION.md` — the H + I constraints
- `docs/00-foundations/_root/IDENTITY-ROLES-AUDIT.md` — identity/roles grounding for I; Darrell's named SOUL.md secure-access posture + COLG-NAS "Path C real auth" direction
- `docs/00-foundations/_future/AI-INFRASTRUCTURE-HARDWARE-OPTIONS.md` — Option 2 dual-3090; CPU-only DS1621xs ceiling
- `docs/99-session-notes/2026-06-01-research-review-sovereign-llm-teams-architecture.md` — per-industry team = model+prompt+tools+RAG+policy; Dev/Ops as Pilot #1
- the Bishop Gwin / COLG migration brief — the COLG alignment gate
- memory: `project-continuous-feedback-reel`, `INPUT-VISIBILITY-TO-CLAUDE`, `BUSINESS-PROCESS-CONNECTIONS`, `INSTITUTIONAL-MEMORY-EVENTS`, `EXECUTION-OUTCOME-OBSERVABILITY`, `WORKFLOW-MODULE-LIBRARY`, `project-brand-surface-hosting-map`, `project-non-denominational-word-first-body-undivided`, `project-community-free-funded-by-aligned-brand-sponsorship`, `project-what-is-actually-free`, `project-freddie-taylor-beta-user`, `feedback-autonomous-automation-three-brakes`
- `CLAUDE.md` — "Autonomous Automation Requires Three Brakes"

---

*The default is sovereign. TLC never leaves the firewall — in review, in calendars, in analytics, in identity. The church's words are reviewed before they are spoken. The human at the keyboard always wins the GPU. The reviewer rests around every service and on the Lord's Day. We do not sell the data; we use it to serve. The LLMs do the work, bounded by the Cage; humans are kept for judgment, not toil. Four brakes hold, read-only first, autonomy earned per surface, someone watching. The app improves itself, for us by us, with our own data and our own models, and measures its own progress as it goes. We all win. We create. Amen.*
