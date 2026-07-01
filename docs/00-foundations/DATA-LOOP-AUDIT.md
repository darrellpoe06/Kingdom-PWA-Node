# DATA-LOOP-AUDIT — every data surface, honest source-trace

**Dated: 2026-07-01.** Standing artifact. Owner mandate (Darrell, 2026-07-01):

> "Review all data loops for dynamic functions — no static data unless it's a label. All data has a path and a purpose. Static/stagnant is the enemy — everything must be LIVE and moving."

This document is the **honest** answer to "which loops are real and which are theater."
No reassurance. A row marked **VIOLATION** is a value that renders as if it reflects
real state but is a hardcoded literal or a frozen seed. Static is acceptable ONLY for
true **labels** (headings, units, captions, business copy) — never for a value that
should move with real data.

Two laws, made enforceable (not slogans) — see the [Enforcement](#enforcement--the-two-laws-as-gates) section:

1. **No static data unless it's a label.** → the `dynamic-not-static` rubric dimension
   in the DR-0086 surface audit, now a **CI gate** (`--fail-on-new`).
2. **All data has a path and a purpose.** → every row below names its SOURCE PATH and
   PURPOSE; a surface with no traceable path is a finding.

---

## How to read this

| Column | Meaning |
|---|---|
| SOURCE PATH | Where the value ACTUALLY comes from: a Supabase table, a computed function, an n8n path (legacy), a NAS/Python loop, or `HARDCODED LITERAL`. |
| DYNAMIC / STATIC | DYNAMIC = fetched/computed live from real state. STATIC = a literal baked into source. |
| VIOLATION | YES = STATIC and NOT a pure label (a value masquerading as live). NO = dynamic, or static-but-genuinely-a-label/goal/fallback. |

**Nuance that is NOT green-washing:** several financial figures are DYNAMIC in code
(they read `data.*`) but the `data` they read is **seed data** until a real user signs
in and their real rows/import overlay it. Those are marked **SEED-DEPENDENT** — live
for a signed-in family with a working import, but painted-looking for anyone else, and
silently frozen if the import is down. Darrell's frustration lives exactly here: the
number is "dynamic" but its input never moved.

---

## Coverage & honesty caveat

Audited this pass (2026-07-01): **Financial (52 surfaces), Ops/Build/Quality/Orchestration/Projects (117), Church/Conference/Choir/Engagement (81)** — 250 surfaces.

**NOT yet swept this pass (pending, do not read as clean):** KPI/status-indicator/Rentals-table/Entities/Contractors/Dispatch-status/big-picture-header cluster, and the full live-feed cadence inventory. Those two passes were interrupted and are tracked as open on the Concerns board. Absence of a row here is **not** a pass.

**Totals so far:** 250 surfaces audited · **33 VIOLATIONS** · the rest DYNAMIC or legitimately-static (label/goal/fallback).

---

## PART 1 — THE AUDIT

### A. Financial surfaces (money first — most visible, most trust-critical)

52 audited · **25 violations**. This is the worst domain, and it is the one that
matters most.

| SURFACE | LOCATION | SOURCE PATH | PURPOSE | DYN/STATIC | VIOLATION |
|---|---|---|---|---|---|
| Net cash flow | poe-financial-mvp-v28.jsx:3641 | computed `totalInflow − totalOutflow` | Primary dashboard metric | DYNAMIC | NO |
| Cash on hand | :3655 | `data.accounts[].balance` (checking/savings/cash/investment, excl. legal-hold) | Spendable balance | DYNAMIC | NO |
| Total consumer debt | :3642 | `data.debts[].balance` (!leaveAlone) | Debt payoff | DYNAMIC | NO |
| Rental income received | :3635 | `data.inflows.rentals[].actual` | Tenant payment tracking | SEED-DEPENDENT | YES — frozen in seed unless imported |
| Rent expected | :3636 | `data.inflows.rentals[].rent` | Collection-rate denominator | STATIC | YES — frozen per-property seed |
| Collection rate % | :3638 | computed `rentalActual/rentalExpected` | Rent-health metric | DYNAMIC (over seed inputs) | INHERITS seed inputs |
| **Total outflow** | :3640, seed :678 | `data.outflows{household,debtService,...}` HARDCODED dict | Cash-flow basis, pressure math | STATIC | **YES — worst offender; never derives from ledger** |
| Household outflow | :678 (`household:1800`) | HARDCODED LITERAL | Pressure-lever base | STATIC | YES — pressure/reserve math built on a frozen number |
| Debt-service outflow | :678 (`debtService:1500`) | HARDCODED LITERAL | Expense baseline | STATIC | YES — should sum `debts[].minPayment` |
| Charitable giving (tithe) | :678 (`charitableGiving:200`) | HARDCODED LITERAL | Tithe protection in pressure math | STATIC | YES — frozen |
| Salary actual/expected | :294–316, totals :3631 | `data.inflows.salaries[].actual` | Income tracking | SEED-DEPENDENT | YES — seed shows as current until import |
| Total opportunity monthly | :3647 | `data.opportunities[].monthly` seed | What-if pipeline | STATIC | YES — aspirational; no pipeline feed |
| Total rental (mortgage) debt | :3643, rows marked `estimated:true` | `rentals[].mortgage.balance` seed | Mortgage payoff | STATIC | YES — `estimated:true` never refreshed |
| Rentals-owned-free date | :3685 `projectRentalSnowball()` | sim over `mortgage{}` seed (rate/balance) | Strategic target | DYNAMIC over STATIC inputs | YES — compounds a frozen seed forward forever |
| Tax calendar items | `data.taxCalendar[]` | seed scaffolding | Tax planning | STATIC | YES — dates + amounts all seed |
| Contractor ytdPaid / monthly | Contractors1099.jsx | `data.contractors1099[]` seed | 1099 payment tracking | STATIC | YES — no real 1099-ledger sync |
| CapEx item costs | About > Capital Spend | `data.capexItems[]` seed | Budget planning | STATIC | YES — no feedback on actual purchase |
| Skill-profile monthly income | Opportunities matcher | `data.skillProfiles[]` seed | Capacity planning | STATIC | YES — never updates on real pay |
| Pressure map %s (per level) | :347–358 `pressureMappings` | HARDCODED %s | Payoff-acceleration knob | STATIC | PARTIAL — the % per level is frozen |
| Debt-free date/years/interest | :3682 `projectDebt()` | amortization sim over `data.debts[]` | Primary motivation | DYNAMIC over SEED-DEPENDENT debts | INHERITS if debt balances never updated |
| Buffer fund current | :3668 | sum `accounts[].balance` type=savings | Emergency reserve | DYNAMIC | NO |
| Buffer fund target | `data.meta.bufferTarget` | seed goal | User goal | STATIC | NO — a goal, not a fact |
| Imported In/Out tiles (window) | Imported.jsx:250–254 | `grouped.windowTotals` over posted ledger rows | 30d/period in-out | DYNAMIC | NO — moves with the ledger + period control |
| Finance-activity In/Out (30d) | lib/finance-activity.js:67 | `summarizeFinancialActivity(ingestData)` real stream | Budget flow | DYNAMIC (null when empty — honest) | NO |
| Account balances (per account) | BooksAccounts | `data.accounts[].balance` | Liquidity | SEED-DEPENDENT | YES if seed, NO if imported |
| Entity rollups | :3716 `entityRollups` | computed over `data.accounts` | Multi-entity view | DYNAMIC | NO |
| Markets watchlist prices | Markets.jsx | live Stooq API over seed tickers | Portfolio snapshot | DYNAMIC (prices) | NO (feedback wants it gated until ticker confirmed live) |
| Demo (`?demo=`) family data | :519–621 | synthetic, labeled "Sample" | Marketing/education | STATIC | NO — labeled demo |

**Worst three (financial):**
1. **`data.outflows` hardcoded dict** (:678) — household/debtService/charitableGiving are literals. Every downstream number (net cash flow contribution, pressure "extra toward debt", reserves) inherits a frozen input. If real spend differs, the app tells the family they have money they don't.
2. **Seed salary/rental figures rendered as current** — dynamic in code, but the input is seed until import completes; a silent import failure leaves month-old confident numbers with no badge.
3. **`mortgage.balance` marked `estimated:true`, fed into the rentals-free projection** — a strategic payoff date computed off an estimate that never refreshes.

> **Lane note:** the core financial-figure derivation (outflows-from-ledger, Tx dynamic
> balances) is owned this cycle by sibling work on `feat/dynamic-financial-figures` +
> the wf18 import repair. This audit **documents** those violations; the fixes land there.
> This branch does not edit `BooksTransactions.jsx` or the core `totals` derivation to
> avoid collision — it hardens the **enforcement + staleness-visibility** layer so those
> fixes can't silently regress.

### B. Ops / Build / Quality / Orchestration / Projects

117 audited · **0 violations.** This domain is honest: every "green" traces to real
state. Recording the good news is part of an honest audit.

- **Live from GitHub API** (OpsBoard): CI status, HEAD SHA, in-flight PRs, recent merges.
- **Live from NAS webhooks** (WakeOrchestrator, WorkflowStatus, LlmHealth, LlmReview, ReviewFeed): brake state, budget spent/cap, handoffs, workflow active/total, Ollama loaded models, review findings.
- **Build-time manifests, file-verified, honestly labeled** (BuildBoard ROADMAP, QualityProof gates/loops/contrast, GovernanceQueue, DR ledger, ConflictLoop event counts): parsed from real repo files at build; each surface states "rendered from the repo at build time." These are STATIC snapshots but **labeled as such** and file-backed — not painted, not a violation.
- **Live from DB** (Projects, Discussions, ProjectMgmtPulse, DispatchPanel): status, personas, priority, lifecycle logs, discussion counts.
- **Loop-health staleness** (LoopHealth): reads real update timestamps per loop; honest `awaiting`/`stale`/`never` states — never painted.

The one caveat (not a violation): BuildBoard `__WORKFLOW_STATS__` is a build-time count,
not live run-status; the code says so and the live equivalent is WorkflowStatus.

### C. Church / Conference / Choir / Engagement / Events

81 audited · **8 violations** — all seed/anchor data that reads as configured/current.

| SURFACE | LOCATION | SOURCE PATH | DYN/STATIC | VIOLATION |
|---|---|---|---|---|
| Campus + room inventory (Main/South, Sanctuary/Kitchen) | EventCenterModule.jsx:72–80 `seedLocalVenues()` | HARDCODED seed (localStorage-empty fallback) | STATIC | YES — reads as a real configured building |
| Observation spaces (13 seeded) | ChurchObservation.jsx:31–45 | HARDCODED `OBSERVATION_SEED` | STATIC | YES — "13 spaces · 0 covered" looks like a real layout |
| Featured trivia (John 18 anchor) | Engagement.jsx:54–73, 99–112 | HARDCODED `TRIVIA` + `ANCHOR_ISO='2026-06-10'` | STATIC | YES — "Featured" framing implies fresh daily content |
| Conference identity fallback | ConferenceModule.jsx:40 | `CONFERENCE_IDENTITY` const (only when signed out) | STATIC | NO — pure signed-out fallback |
| Video-wall spec/timeline | ChurchVideoWall.jsx:33–69 | HARDCODED engineering spec | STATIC | NO — narrative/engineering, not a live claim |
| Choir schedule/roster/songs | Choir.jsx:193–379 | Supabase `choir_*` via subscribe | DYNAMIC | NO |
| Conference variance / check-in | ConferenceVariance.jsx | `subscribeRegistrations()` computed | DYNAMIC | NO |
| Meal counts (anticipated) | EventCenterModule.jsx:421 | computed from `conference_public_registrations` | DYNAMIC | NO |
| Practice pipeline revenue | Practice.jsx:456 | computed from live `inquiries` × constant/client | DYNAMIC | NO (constant is a disclosed rate) |
| Family/property photos | LifeGallery.jsx | NAS bridge live-fetch | DYNAMIC | NO |

**Worst three (church):** the EventCenter room seed, the Observation 13-space seed, and
the Engagement trivia anchor — each renders sample data with enough polish to read as
real/current. Fix pattern: label seeds explicitly as "starting point — none of this is
your real building/content yet" and/or gate the surface until the family configures it.

---

## PART 2 — FIX or FLAG

**Fix (this branch, non-colliding, low-risk):** — see the branch's commits.
- Staleness now VISIBLE: money/data surfaces can render a `StalenessBadge` ("data as of
  5/15 — import down") instead of silently-confident month-old numbers. Reusable
  primitive so Tx/Books/church surfaces adopt it without each re-inventing it.
- The static→live sweep + every violation above is **filed to the Concerns & Solutions
  board** (lib/concerns.js seed + the auto-audit artifact) with honest status, so it is
  tracked, not lost.

**Flag (needs a real source that doesn't exist yet — marked in-app, not faked):**
- Contractor 1099 ledger, CapEx purchase feedback, opportunity pipeline, tax-calendar
  amounts: no live source exists. These must render as "no live source yet" rather than
  a confident seed number. Filed as concerns; conversion blocked on the upstream feed.

**Deferred to the owning lane (documented, not touched here):**
- `data.outflows` → ledger derivation and Tx dynamic balances belong to
  `feat/dynamic-financial-figures`; wf18 import repair to its own lane. Editing them here
  would collide. Documented above so those lanes have the honest target list.

---

## PART 3 — THE WATCHER (a scheduled check, NOT an AI agent)

Be honest about what it is: a **deterministic, $0, no-LLM scheduled check.** It does not
"think." It runs a rubric over real source + real state and files what it finds.

Three layers, all pre-existing and now hardened:

1. **STATIC-DATA LINT** — the `dynamic-not-static` dimension of the DR-0086 surface audit
   (`scripts/surface-audit-rubric.json` + `scripts/lib/surface-audit-core.mjs`). Flags
   hardcoded currency/percent/count value-tiles baked into JSX. **Hardened this branch:**
   stronger patterns + a **CI gate** so new static fails the build (below).

2. **STALENESS** — `lib/loop-health.js` assesses each loop against its expected cadence
   (financial 35d, ledger 45d, cloud-snapshot 21d, engagement 10d, import 45d) reading
   the **real** last-update timestamp (e.g. the finance loop reads when a Chase document
   actually arrived, `env.financialDocAt`). A loop past threshold → `stale`; wired to a
   real-but-unconnected source → `awaiting` (honest, not a dead red). Surfaced in-app on
   the LoopHealth surface AND now via `StalenessBadge` on the data surface itself.

3. **PIPELINE-HEALTH** — the wf18-class "feed unreachable/404" detection lives in the
   audit's `liveProbes` (deterministic HTTP, `--online`). Ships empty by policy (no
   invented endpoints — Verification Doctrine). When a real health endpoint is set, a 404
   files a finding tied to the affected surface ("import down → Tx is stale").

**ALERTING.** Findings land on the in-app **Concerns & Solutions board** (auto-audit
read-through) AND on the NAS **event reel** (`infra/nas-loops/events/_reel.jsonl`) that
the Dispatch Status surface reads — so Darrell is TOLD, not left to find it. Push (ntfy)
is the NAS loop's job on top of the reel.

**How it runs (always-on, not one-off):** `infra/nas-loops/loops/surface-audit.sh`
invokes `node scripts/surface-audit.mjs --write` every NAS cycle behind the three brakes
(budget + single-flight lock + kill-switch). Observer-only: it writes the artifact and
the reel; it never commits or merges.

---

## Enforcement — the two laws as gates

| Law | Slogan → Gate | Where |
|---|---|---|
| No static unless it's a label | `dynamic-not-static` rubric dimension + `--fail-on-new` CI gate: a NEW static-value finding fails the merge | ci.yml + surface-audit.mjs |
| All data has a path + purpose | Every surface is walked; a value with no traceable path is a finding on the board | surface-audit-core.mjs |
| New static never creeps back | Baseline-diff: the committed `audit-findings.json` is the baseline; any newly-introduced finding fails CI until fixed or the baseline is updated (code-reviewed) | surface-audit.mjs `--fail-on-new` |

**Reviewer rubric line (hard check):** _"Is every value-bearing field on this surface
static or live-derived? A static number that should move is a defect, not a default."_
This is now machine-checked, not left to a reviewer remembering to ask.

---

## Standing status

This is a **standing** sweep, not a one-off. The audit re-runs every NAS cycle; a fixed
violation drops off the board automatically (re-audit no longer produces it). New
surfaces are walked the moment they register in `surfaces.js`. The KPI/misc and
feed-cadence passes remain **open** and are tracked on the board.
