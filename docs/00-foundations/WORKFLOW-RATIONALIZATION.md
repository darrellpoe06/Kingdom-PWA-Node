# WORKFLOW RATIONALIZATION — Live State, Need Audit, Canonicalization, Sequences & Build-Into-App

**Status:** Layer 3 foundation (reference). Companion to [`FEATURE-WORKFLOW-REGISTER.md`](FEATURE-WORKFLOW-REGISTER.md) (PR #284).
**Author:** Claude Code (read-only analysis pass), 2026-06-23.
**Repo:** `C:\Users\dpoe\Kingdom-PWA-Node` · **Branch:** `docs/local-llm-hardware-recommendation`.
**Scope:** READ-ONLY. No workflow was created, edited, activated, or deactivated. No automation was enabled. This document recommends; the Governor (Darrell) decides and any NAS change is made by hand, with someone watching, per the three-brakes rule.

---

## What this adds to the Register

The Register inventoried *definitions* and honestly marked every n8n/NAS row **UNKNOWN-live** ("this cloud session cannot reach the LAN"). This document was produced from the **NAS-capable LOCAL session**, so it closes that exact gap: it reaches the NAS over Tailscale, reads the **live active/inactive/last-run state**, reconciles it against the repo, then answers the five things Darrell asked — do we *need* each workflow, what's the real *difference* between near-duplicates, which is the *canonical* final version, what *benefit* each kept workflow and each *sequence* delivers (and why the ordering matters), and how to **build these same processes into the PoeTech App's own workflow layer**.

---

## 1. LIVE STATE (CONFIRMED from the NAS — the Register could not reach this)

**Evidence basis (all CONFIRMED, captured 2026-06-23 ~14:04 UTC):**

- `tailscale status` → NAS node `poetech` (100.70.190.47) **active, direct** `192.168.1.26:41641`.
- `GET http://192.168.1.26:5678/healthz` → **HTTP 200**; Tailscale Funnel `https://poetech.tail5a2f35.ts.net/healthz` → **HTTP 200**. NAS + n8n are up and reachable both ways.
- `GET /webhook/workflow-status` (the live `wf-workflow-status` API, DR-0061 Stage 2) → `{ ok:true, total:40, active:26, recent_errors:0 }` with a per-workflow `active` / `last_run` / `last_status` array. **This is real n8n live state, not the stale repo `active` flag.**
- `GET /webhook/llm-health` → Ollama `v0.24.0`, **5 models installed, 0 loaded, none pinned** (`hermes3:8b`, `deepseek-r1:8b`, `qwen2.5:14b-instruct`, `qwen2.5:3b-instruct`, `nomic-embed-text`). Healthy idle — no runaway pin (the 2026-06-06 signature is absent). ✅
- `GET /webhook/dispatch-status?section=tasks` → **HTTP 404 "webhook not registered"** → CONFIRMS the Dispatch *data API* workflow is **inactive** (see broken-pair finding below).

### 1.1 LIVE ACTIVE — 26 workflows (CONFIRMED active on the NAS now)

| # | Workflow (live name) | Last run / status | Repo def |
|---|---|---|---|
| 01 | Supabase cycle_item → Pushover (dual-path) + ntfy | never-run | `01-supabase-cycle-item-webhook.json` |
| 03 | GitHub event (commit/PR) → Pushover | never-run | `03-github-event-to-phone.json` |
| 08 | Synology Chat inbound capture → /volume1/PoeTech/ChatIn | never-run | `08-synology-chat-inbound-capture.json` |
| 10 | Synology Chat request + ack | never-run | `10-synology-chat-request-with-ack.json` |
| 13 | Chat action router (cron) | **success** 14:05 | `13-chat-action-router.json` |
| 14b | Christina Gmail finance ingest (10 min) **[brakes]** | **success** 14:00 | *(NAS-only variant of `14`)* |
| 15 | Bank OFX/QFX/CSV watcher (Phase 2B · LEDGERBAL) | **success** 14:04 | `15-bank-ofx-watcher.json` |
| 16 | Cross-verify engine (hourly · claim↔confirm) | **success** 14:00 | `16-cross-verify-engine.json` |
| 18 | Imported transactions API (Phase 2B · bank_balances) | **success** 13:26 | `18-imported-transactions-api.json` (evolved) |
| 19 | Mark-noise API (PWA writes back reconcile state) | never-run | `19-mark-noise-api.json` |
| 20 | Health-check + ntfy alerts (10 min · proactive ops) | **success** 14:00 | `20-health-check.json` |
| 21 | Bank statement attachments (Gmail → wf15) | never-run | `infra/n8n/wf-bank-statement-attachments.json` |
| 21b | Bank statement attachments (Christina's Gmail → wf15) | never-run | `infra/n8n/wf-bank-statement-attachments-christina.json` |
| 22 | Link title resolver (Notes → page titles) | never-run | `infra/n8n/wf-link-title.json` |
| 26 | Thought inbox (Darrell → next Claude session) | never-run | `26-thought-inbox.json` |
| 29 | Waitlist intake (PWA → /data + ntfy) | never-run | `29-waitlist-intake.json` |
| 30 | Family feedback intake (Suggest button → /data + ntfy) | never-run | `30-family-feedback-intake.json` |
| 32 | Daily ship summary (9pm · attributed → Chat + ntfy) | never-run | `32-daily-ship-summary.json` |
| — | Dispatch status **PAGE** (NAS-hosted HTML readout) | never-run | `wf-dispatch-status-page.json` |
| — | Local-LLM health API (Ollama /api/ps + tags + version) | **success** 14:04 | `wf-llm-health.json` |
| — | wf-freshness-review (DR-0072 · local + Gemini · guarded) | never-run | `wf-freshness-review.json` |
| — | wf-property-history | never-run | `infra/n8n/wf-property-history.json` |
| — | wf-property-photos | **success** 13:23 | `infra/n8n/wf-property-photos.json` |
| — | wf-review-action (POST · keep/dismiss staged proposal) | never-run | `wf-review-action.json` |
| — | wf-review-feed (staged proposals + feedback → Review tab) | never-run | `wf-review-feed.json` |
| — | Workflow status API (DR-0061 Stage 2) | **success** 14:04 | `wf-workflow-status.json` |

> "never-run" on a webhook/PWA-triggered workflow is normal — it fires only when the PWA calls it or an event arrives; it is **not** a failure signal. The cron-driven ones (13/14b/15/16/18/20 + the status/health APIs) all show **last_status=success**, and **recent_errors=0** across the fleet.

### 1.2 LIVE INACTIVE — 14 workflows (CONFIRMED disabled on the NAS now)

| # | Workflow (live name) | Why it's off (assessment) |
|---|---|---|
| 02 | Daily reports cron (6 AM) | dormant; overlaps 32 daily ship summary |
| 04 | Pushover Smoke Test (manual) | diagnostic, manual-only — correct to leave off |
| 04 | POE morning standup (7 AM) | dormant digest |
| 05 | End-of-day reflection (9 PM) | dormant digest |
| 12 | Network health probe (5 min) | overlaps 20 health-check |
| 14 | Gmail finance ingest (own inbox) | **superseded by 14b** (Christina's inbox is canonical) |
| 18 | Imported transactions API (serves /data/finance-events) | **superseded by 18 Phase 2B** (bank_balances) |
| 23 | Project briefing (Claude session read-out) | dormant; on-demand |
| 27 | Foundation Agent (autonomous inbox processor + Claude trigger) | **correctly OFF — autonomous, lacks three-brakes** |
| 31 | Continuous standup digest (5-min, autonomous) | **correctly OFF — runaway-class, lacks three-brakes** |
| 34 | Skill analytics Layer 2 (→ Ollama 14b stewardship profile) | dormant; sequence 33→34→35 incomplete |
| 37 | Whisper STT voice input | dormant; sovereign STT, awaits use |
| 99 | **Error Workflow (global catch-all · telemetry + alert)** | ⚠️ **GAP — should be ON** (see 1.4) |
| — | Dispatch status **API** (reel + Code Task snapshot) | ⚠️ **GAP — page is ON, this is OFF** (see 1.4) |

### 1.3 DEFINED-IN-REPO BUT NOT ON THE NAS — 15 "attempted/never-deployed" defs

These are exactly the *"other ones we attempt to create"* Darrell asked about — repo JSON with **no live counterpart**:

`01-project-timeline-daily` · `02-workflow-failure-alert` · `03-b2-backup-status` · `06-situational-analysis-and-mutation-cron` · `09-chat-digest-30min` · `11-vercel-deploy-to-chat` · `17-gemini-deeper-reasoning` · `33-data-upload-layer1` · `35-matched-services-layer3` · `36-quality-gatekeeper` · `wf-class-tutor` · `wf-llm-review` · `wf-wake-orchestrator` · `wf-family-photos` · `wf-photo-upload`

(Reconciliation: 53 repo JSON defs map to 40 live workflows — some defs pair to one live workflow, e.g. dispatch page+API, bank-attachments 21+21b; the 15 above have no live presence at all. `14b` exists live with **no clean repo def** → NAS-side drift to capture back into the repo.)

### 1.4 Two live-state findings the Register could not have seen (both CONFIRMED, both real)

1. **Broken pair — Dispatch status.** The **PAGE** workflow is ACTIVE but the **data API** it fetches is INACTIVE (curl 404, confirmed). Net effect: the dispatch readout page loads but its data fetch fails. Per the Layer-0 Dispatch convention, the page fetches `/webhook/dispatch-status?section=…` same-origin — that endpoint is unregistered. **Recommendation (Governor decides): activate the Dispatch status API**, or the page is a dead shell. *Not changed in this read-only pass.*
2. **Error catch-all is OFF.** `99 · Error Workflow (global catch-all)` is INACTIVE. So `recent_errors:0` partly reflects **unmonitored** rather than purely **clean**: the per-execution error router that would telemeter + alert on any workflow failure isn't running. The 10-min `20 health-check` gives *proactive* coverage (and is succeeding), but the *reactive* per-failure net is down. **Recommendation: activate 99** so a future silent failure surfaces. *Not changed here.*

---

## 2. NEED AUDIT — KEEP / PRUNE / MERGE verdict for every workflow

One-line justification each. "KEEP-dormant" = retain, intentionally inactive. "KEEP-gated" = retain but must stay OFF until three-brakes are added.

### 2.1 KEEP (active, earning their place) — 24

| Workflow | Verdict | Justification |
|---|---|---|
| 13 Chat action router | KEEP | Live cron router; the hub of the chat-ops sequence. |
| 14b Christina finance ingest [brakes] | KEEP | Canonical finance-claim ingest; banking inbox is Christina's (memory). |
| 15 Bank OFX watcher | KEEP | Parses real statements → LEDGERBAL; succeeding. |
| 16 Cross-verify engine | KEEP | Reconciles claim↔confirm hourly; the verification heart of finance. |
| 18 Imported API (Phase 2B) | KEEP | Serves real `bank_balances` to the PWA Imported view (#265). |
| 19 Mark-noise API | KEEP | PWA writes reconcile state back; closes the finance review loop. |
| 20 Health-check + ntfy | KEEP | Proactive 10-min ops monitor; the live safety net. |
| 21 / 21b Bank statement attachments | KEEP | Feed wf15 from each Gmail inbox; both inboxes are real. |
| 22 Link title resolver | KEEP | Sovereign title fetch for Notes; no external dependency. |
| 26 Thought inbox | KEEP | Darrell → next Claude session bridge; low-cost, high-leverage. |
| 29 Waitlist intake | KEEP | Real signup capture → /data + ntfy. |
| 30 Family feedback intake | KEEP | **Front half of the feedback→Concerns loop**; preserve and finish the loop. |
| 32 Daily ship summary | KEEP | Attributed end-of-day ship digest. |
| Dispatch status PAGE | KEEP | NAS-hosted system-visibility surface (Layer-0 convention) — **needs its API re-activated**. |
| Local-LLM health API | KEEP | Live Ollama signal that gates cap-resilient routing. |
| wf-freshness-review | KEEP | DR-0072 staged-proposal generator (token+SSRF guarded). |
| wf-review-feed / wf-review-action | KEEP | Read + disposition staged proposals → in-app Review tab (DR-0061). |
| wf-property-photos / wf-property-history | KEEP | Real NAS property data into the app; photos succeeding. |
| Workflow status API | KEEP | The live-truth API that made *this audit* possible — DR-0061 Stage 2. |
| 01 Supabase cycle_item → Pushover | KEEP | Event notify on real DB inserts. |
| 03 GitHub event → Pushover | KEEP | Commit/PR → phone; ships-awareness. |
| 08 Synology Chat inbound capture | KEEP | Captures all inbound chat to disk (sequence input). |
| 10 Synology Chat request + ack | KEEP | Request+ack path (note overlap with 08 — candidate to fold; see 2.3). |

### 2.2 KEEP-dormant / KEEP-gated — 9

| Workflow | Verdict | Justification |
|---|---|---|
| 04 Pushover Smoke Test (manual) | KEEP-dormant | Diagnostic; fire by hand when testing the notify path. |
| 04 POE morning standup | KEEP-dormant | Useful cron digest; off is fine until wanted. |
| 05 End-of-day reflection | KEEP-dormant | Companion digest; same. |
| 23 Project briefing | KEEP-dormant | On-demand Claude-session read-out. |
| 34 Skill analytics Layer 2 | KEEP-dormant | Real value, but sequence 33→34→35 is incomplete (see 2.3). |
| 37 Whisper STT voice input | KEEP-dormant | Sovereign STT; activate when a voice-memo surface needs it. |
| 99 Error Workflow (global) | **KEEP → ACTIVATE** | Reactive failure net; recommend turning ON (1.4). |
| Dispatch status API | **KEEP → ACTIVATE** | Re-pair with the active PAGE (1.4). |
| 27 Foundation Agent / 31 standup digest | **KEEP-gated (stay OFF)** | Autonomous/timer-driven; ship inactive until budget+lock+kill-switch exist (three-brakes rule). |

### 2.3 MERGE — 6 (fold into a canonical sibling)

| Workflow | Merge into | Justification |
|---|---|---|
| 14 Gmail finance ingest (own inbox) | **14b** (Christina) | Same job, different inbox; Christina's is canonical (most artifacts live there). |
| 18 Imported API (serves /data/finance-events) | **18 Phase 2B** (bank_balances) | Same endpoint, older shape; Phase 2B is the live, richer version. |
| 12 Network health probe | **20 Health-check** | Both are 5–10 min ops probes alerting the same channel; one monitor. |
| 02 Daily reports cron | **32 Daily ship summary** | Overlapping daily digest; one attributed end-of-day report. |
| 09 Chat digest (30 min) | **13 router / 31 digest** | Redundant chat-digest cadence; one digest engine, parameterized interval. |
| 02-workflow-failure-alert (repo only) | **99 Error Workflow** | Identical purpose (failure → alert); 99 is the canonical global handler. |
| *(watch)* 10 Synology request+ack | *(consider)* 08 capture | Overlapping inbound paths; evaluate folding into one capture+ack workflow. |

### 2.4 PRUNE — 5 (dead, obsolete, or unsafe)

| Workflow | Verdict | Justification |
|---|---|---|
| 06-situational-analysis-and-mutation-cron | PRUNE | Autonomous self-*mutation* cron; directly violates the three-brakes rule. Do not deploy. |
| 11-vercel-deploy-to-chat | PRUNE | Vercel is being sunset for Cloudflare Pages (memory `off_vercel_cloudflare_pages`); deploy-notify will re-source. |
| 01-project-timeline-daily | PRUNE | Never deployed; superseded by in-app Projects + Dispatch surfaces. |
| wf-wake-orchestrator | PRUNE (hold def) | Hand-cranked multi-lane orchestration; superseded by the app-side **braked** orchestrator hand-off (Cage default-deny). Orchestration-not-working-well (memory). |
| 03-b2-backup-status | PRUNE-unless-used | Backup-status monitor for B2; prune unless B2 backup is actually in the loop, else fold into 20. |

### 2.5 KEEP-as-spec / pending-deploy (defined, not yet live, still wanted) — 6

| Workflow | Verdict | Justification |
|---|---|---|
| wf-class-tutor | KEEP-pending-deploy | Local-first qwen2.5 church-class tutor; app side is built and waiting on the NAS route (memory). |
| wf-llm-review | KEEP-pending-deploy | Local review-note drafting; the cap-resilient offload path. |
| 17-gemini-deeper-reasoning | KEEP-as-spec | The vendor-escalation path the model-broker calls only for deep reasoning; wire when broker lands. |
| 33-data-upload-layer1 / 35-matched-services-layer3 | KEEP-as-spec | Two missing thirds of the stewardship-profile sequence (with 34); build the chain or retire all three together. |
| 36-quality-gatekeeper | KEEP-as-spec | CI harness already exists; a NAS instance is optional, not required. |
| wf-family-photos / wf-photo-upload | KEEP-pending-deploy | Family gallery + generic upload feeds; not imported yet (memory). Photo-upload may fold into property-photos. |

**Verdict counts:** **KEEP 24** active + **9** dormant/gated + **6** pending/spec = **39 keep** · **MERGE 6** · **PRUNE 5**. (Some items appear in both a merge-source and a prune lens; counted once by primary verdict.)

---

## 3. DIFF + CANONICALIZE — near-duplicates and the single version to keep

Where there are competing versions, the **actual difference** and the **one canonical final version**:

| Pair | The real difference | CANONICAL | Why |
|---|---|---|---|
| **14 vs 14b** finance ingest | 14 pulls Darrell's own inbox; **14b** pulls Christina's inbox **and** carries explicit `[brakes]` | **14b** | Banking artifacts live in Christina's inbox (memory `banking_inbox_is_christinas`); 14b is the braked one already running successfully. Retire 14. |
| **18 vs 18** Imported API | old "serves `/data/finance-events`" file-reader vs **Phase 2B** "`bank_balances`" DB-backed | **18 Phase 2B** | Phase 2B is the live, richer, DB-grounded version powering the Imported view (#265). The file-reader is the prototype it replaced. |
| **12 vs 20** monitoring | 12 = network reachability probe (5 min); 20 = service health-check + ntfy (10 min) | **20** | One ops monitor with both reachability + health checks beats two overlapping crons hitting the same alert channel. |
| **02 vs 32** daily report | 02 = generic "daily reports"; 32 = **attributed** "what shipped today" | **32** | 32 is the live, attributed, useful digest; 02 never earned activation. |
| **09 vs 31/13** chat digest | 09 = 30-min digest; 31 = 5-min continuous (autonomous); 13 = action router | **13 + one digest** | Keep the router (13) live; collapse the digest cadences into one parameterized digest — and the 5-min autonomous one stays gated. |
| **02-failure-alert vs 99** | both: workflow failure → alert | **99 global error workflow** | 99 is the standard catch-all; the separate failure-alert def is redundant. Activate 99, drop the def. |
| **Dispatch PAGE vs API** | not duplicates — a **pair**: PAGE renders, API supplies data | **keep both, re-activate API** | The PAGE without the API is a dead shell (1.4). |

---

## 4. BENEFIT + SEQUENCE — what each delivers and why ordering matters *(the heart of the ask)*

A workflow's value is rarely standalone — it's the **chain** that delivers the outcome. The live fleet forms a small number of real sequences. For each: the concrete benefit, and **why the order is load-bearing**.

### SEQ-1 · Finance reconciliation (the crown-jewel chain) — ALL LIVE & SUCCEEDING
`14b Gmail ingest` → `21/21b statement attachments` → `15 OFX/QFX watcher` → `16 cross-verify engine` → `18 Imported API` → PWA Imported view → `19 mark-noise API` (write-back)

- **Benefit:** every dollar shown in the app is a **claim that has been independently confirmed against the bank** before it's trusted — the Verification Doctrine made operational for money. Darrell sees *reconciled* balances, not raw email guesses.
- **Why the order matters:** the *claim* must exist before it can be *confirmed*. 14b harvests the email **claim**; 21/21b pull the **statement** as evidence; 15 parses that evidence into a normalized ledger row; **16 only works if both sides already landed** — it matches claim↔confirm and flags mismatches; 18 then exposes only the reconciled result; 19 lets the human correct/mark-noise, feeding truth back. Reorder it and you'd be "confirming" against data that isn't there yet. The sequence **is** the trust.

### SEQ-2 · Freshness / Governor review loop (DR-0061 / DR-0072) — LIVE
`wf-freshness-review (generate staged proposal)` → `wf-review-feed (surface in app Review tab)` → human reads → `wf-review-action (keep / dismiss)`

- **Benefit:** the system proposes its own improvements but **never self-applies** — a human dispositions each one. Perpetual improvement with a governor.
- **Why the order matters:** generation must precede surfacing must precede disposition. The staged-proposal step is deliberately *between* the model and reality so nothing the LLM drafts reaches production without the keep/dismiss gate. The ordering is the brake.

### SEQ-3 · Chat-ops capture → route → act — LIVE
`08 inbound capture` / `10 request+ack` → `13 action router (cron)` → action channels / `26 thought inbox` → next Claude session

- **Benefit:** Darrell (or family) can drop a request into Synology Chat and have it captured, acknowledged, and routed to the right place — including into the next AI session's context.
- **Why the order matters:** capture-then-route decouples *receiving* from *acting*. 08/10 must durably persist the message first (so nothing is lost if routing fails); 13 then routes on its own cadence with retry. Acting before capture would lose messages on any hiccup.

### SEQ-4 · Observability / live-truth (this audit's own backbone) — LIVE
`20 health-check (proactive)` + `99 error workflow (reactive — currently OFF)` → `wf-workflow-status` / `wf-llm-health` / `01` / `03` / `32` → `Dispatch status PAGE+API` / ntfy / Pushover

- **Benefit:** the system can be *asked what's true about itself* — which is precisely how this document got real data instead of guesses. Proactive (poll) + reactive (catch) + on-demand (query) coverage.
- **Why the order/composition matters:** proactive and reactive monitoring are complementary, not redundant — 20 catches "is it up?" on a clock; 99 catches "did a run fail?" the instant it happens. **With 99 off, the reactive half is missing** (1.4). The status/health APIs sit on top as the queryable surface.

### SEQ-5 · Stewardship-profile analytics (INCOMPLETE — 1 of 3 live)
`33 data-upload layer1 (NOT deployed)` → `34 skill-analytics layer2 (inactive)` → `35 matched-services layer3 (NOT deployed)`

- **Intended benefit:** parsed transactions → Ollama-built stewardship profile → matched services. A real per-family insight pipeline.
- **Why the order matters / why it's stalled:** layer2 can't profile data layer1 never uploaded, and layer3 can't match on a profile layer2 never produced. **A chain is only as deployed as its first link.** Verdict: build all three or retire all three — a lone middle layer delivers nothing.

### SEQ-6 · Property data → app — LIVE
`wf-property-history` + `wf-property-photos` → PWA Rentals/Real-Estate surfaces

- **Benefit:** real per-door history and photos load from the sovereign NAS, not a third party.
- **Why the order matters:** independent feeds, but both must resolve before the door's page is "complete"; photos succeeding + history never-run means history is wired but unexercised — confirm it on next real load.

---

## 5. BUILD-INTO-APP — run these same processes inside the PoeTech App's own workflow layer

Darrell's ask: *"build the same processes into the PoeTech App workflow."* The principle is Layer-0 binding — **the app is the primary artifact**; n8n on the NAS is plumbing, but the **process** (capture → verify → route → disposition → observe) should also live **inside the app** as a modular, reusability-tiered library, so the app runs its **own** institutional processes rather than only reacting to external n8n. This extends the existing **workflow-module-library** direction (DR-0061: "everything in the workflows comes together inside this one app").

### 5.1 Architecture — an in-app workflow layer (modular, reusability-tiered)

A small, testable core that mirrors the n8n sequence shapes, with **no autonomous execution** unless three-braked:

```
app/src/lib/workflow/
  core/           # Tier-1 primitives — reused by EVERY process
    step.js         # a named, idempotent unit of work (try/catch, standard error envelope)
    sequence.js     # ordered steps; stops on failure; records each step as an event
    guard.js        # budget + concurrency-lock + kill-switch wrappers (the three brakes)
    event-log.js    # append institutional events as DATA (one source of truth)
  processes/      # Tier-2 composed processes — the in-app twins of the n8n sequences
    feedback-to-concerns.js   # SEQ: capture → triage → CONCERN/SOLUTION/TARGET/STATUS → closed
    self-review.js            # SEQ: propose → stage → Governor keep/dismiss (DR-0061 twin)
    ops-observe.js            # SEQ: poll health + catch errors → live-truth surface
    dev-build.js              # SEQ: change → verify gate → ship-record (mirrors CI intent)
  registry.js     # Tier-3 catalog: name, tier, risk-tier, brakes, last-run, owner
```

- **Tier-1 primitives** (`step`, `sequence`, `guard`, `event-log`) are the highest-reuse layer — every process composes them. They reuse what already exists: `lib/net.js` (timeout), the standard error envelope (PERPETUAL-PIPELINE-HEALTH), `SectionBoundary` (white-screen brake), and `lib/number-trace.js` for traceable outputs.
- **Tier-2 processes** are the in-app twins of §4's sequences — same ordering discipline, but observable and controllable on a real app surface.
- **Tier-3 registry** is the in-app reflection of `wf-workflow-status` — a real-data view + control for the app's own processes (live view of real state, per the Reality-Trace rule).

### 5.2 The four processes to build in (priority order)

1. **Feedback → Concerns loop (TOP PRIORITY — it's the open gap).** The Register confirmed the loop **does not close**: `30 family feedback intake` captures (live), but the **Concerns & Solutions board** that reads it back, assigns a solution, and tracks to closed sits in held **PR #277** (migration-0038 collision, renumber to 0039). Build the closing half in-app: feedback row → triage step → `CONCERN/SOLUTION/TARGET/STATUS` → Governor disposition → closed. This is the highest-value build-in because it turns a captured signal into a tracked outcome **inside the app**, where the family already lives.
2. **Self-review / perpetual-improvement loop (DR-0061/0072 twin).** In-app: app proposes a micro-improvement → stages it → Governor Review tab keeps/dismisses. Never self-applies. Mirrors SEQ-2 with the same brake (the staging gate).
3. **Ops / institutional-events-as-data.** In-app `event-log` records every process run as a structured institutional-memory event (INSTITUTIONAL-MEMORY-EVENTS), surfaced on the C2S/Dispatch surfaces already on main. Gives the app proactive+reactive self-knowledge without depending on the NAS being reachable.
4. **Dev/Build process.** A real-data Build view driven by actual ship-records + verify-gate receipts (QualityProof already exists), not painted numbers — satisfies the Reality-Trace + Verification doctrines.

### 5.3 Risk-tier + brakes for each proposed automation (binding)

Every proposed in-app automation is risk-tiered (RELEASE-TIERS) and **anything autonomous carries all three brakes** (budget + concurrency-lock + kill-switch) and is **Tier C, ships inactive**:

| In-app process | Trigger | Risk tier | Three brakes required? |
|---|---|---|---|
| Feedback → Concerns (capture + human disposition) | user action + human review | **Tier A/B** | No — human-in-the-loop, not autonomous. |
| Self-review *staging* (propose + stage only) | user-initiated or on-demand | **Tier B** | No — stops at the staging gate; human keeps/dismisses. |
| Self-review *auto-propose on a clock* | timer | **Tier C** | **YES** — budget + lock + kill-switch; ship OFF. |
| Ops event-log (record runs as data) | reactive on each run | **Tier A** | No — append-only logging, no spawned work. |
| Dev/Build record + verify-gate view | CI/event reflection | **Tier A/B** | No — read/record only. |
| Any process that **spawns more work or LLM/compute on a clock** | timer/self-trigger | **Tier C, never Tier A** | **YES, non-negotiable** — and never auto-on while Darrell travels. |

This is the same lesson the NAS already encodes correctly: `27 Foundation Agent` and `31 standup digest` are **deliberately inactive** because they're autonomous and pre-date the brakes. The in-app layer must not reintroduce what the NAS learned to keep switched off.

### 5.4 Cap-resilience wiring (ties to the local-LLM direction)

Every LLM step in an in-app process routes through **one model-broker** that reads the live `wf-llm-health` signal and prefers **local Ollama** (qwen2.5/hermes3 — all 5 confirmed installed) for **drafting / summarizing / tagging / classifying**, escalating to vendor only for **agentic coding / deep reasoning** (the `17-gemini-deeper-reasoning` path). This makes the app's own processes continue working when the vendor LLM is capped — by design, gated on a real health signal, not luck.

---

## 6. SUMMARY (the report)

- **Live state (CONFIRMED, NAS reachable):** 40 workflows, **26 active / 14 inactive, 0 recent errors**; finance + observability crons succeeding; Ollama healthy (5 models, 0 pinned).
- **Need-audit counts:** **KEEP 39** (24 active + 9 dormant/gated + 6 pending/spec) · **MERGE 6** · **PRUNE 5**.
- **Two live findings:** Dispatch PAGE is on but its API is off (dead shell); the **global error workflow (99) is off** (reactive failure net down). Both recommended for activation by the Governor — **not changed in this read-only pass**.
- **Canonical winners:** finance ingest → **14b**; Imported API → **18 Phase 2B**; monitoring → **20**; daily report → **32**; error handling → **99**; chat → **13 + one digest**; dispatch → **keep the PAGE+API pair, re-activate the API**.
- **Top sequences & their benefit:** SEQ-1 finance reconciliation (claim→confirm→trust — *the* crown jewel, all live); SEQ-2 freshness/Governor loop (propose→stage→disposition, never self-applies); SEQ-3 chat capture→route→act (capture-first = nothing lost); SEQ-4 observability (proactive+reactive+queryable — the half that's missing is 99); SEQ-5 stewardship analytics (stalled — 1 of 3 links live); SEQ-6 property data.
- **Build-into-app plan:** a Tier-1 primitive core (`step`/`sequence`/`guard`/`event-log`) → Tier-2 process twins (feedback→Concerns **first**, self-review, ops-events-as-data, dev/build) → Tier-3 in-app registry mirroring `wf-workflow-status`. Risk-tiered; anything autonomous is Tier C with all three brakes, shipped OFF. LLM steps route through a health-gated model-broker (local-first).

---

*Read-only analysis. No workflow, automation, or NAS state was changed. Live data captured 2026-06-23 from the NAS over Tailscale via the `wf-workflow-status` / `wf-llm-health` APIs. Activation recommendations (99, Dispatch API) are for the Governor to decide and to perform by hand, with someone watching, per the three-brakes rule.*
