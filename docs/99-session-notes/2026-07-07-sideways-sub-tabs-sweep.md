# 2026-07-07 — Sideways sub-tabs sweep: every surface, coverage checklist, timings

**Directive (Darrell, third statement of the requirement):** "All tabs need sideways sub
tabs for sections with the sideways scroll bars so we can see what we have — this is the
second time I'm asking... Everything is buried down each page... no more down scrolling
to see a surface with KPIs or anything, all data should matter." Governed by **DR-0116**
(new this session), fulfilling 2026-07-04 ("sliding tabs for all tabs") + 2026-07-05
(the 3rd row), which had lived only in the `SectionTabs.jsx` header.

**Root cause of the re-ask (the lesson):** the first directive shipped a sound primitive
and 8 adoptions, but the remaining surfaces were never written down as a tracked backlog
— no DR, no checklist, no re-review date. An untracked directive stalls silently.
This note IS the checklist; DR-0116 makes "new surfaces adopt at birth" binding.

## Timings — each requirement, for timeline management (all UTC, wall clock)

| # | Phase | Start | End | Duration | Notes |
|---|-------|-------|-----|----------|-------|
| 1 | Recon + surface triage (39 surfaces sized, adoption gap measured) | 12:24 | 12:28 | 4 min | |
| 2 | Ways & documentation review (4 parallel research passes: history, delivery lane, technical/tests, IA alignment) | 12:28 | 12:45 | 17 min | Darrell-ordered gate before any change |
| 3 | Baseline verification (npm ci, lint, 404 files / 4,869 tests green) | 12:33 | 12:42 | 9 min | overlapped with #2 |
| 4 | DR-0116 written + indexed + merged (PR #661) | 12:40 | 12:45 | 5 min | lane auto-merged on green |
| 5 | Conversion contract + 8 parallel conversion crews over ~30 surfaces | 12:41 | 12:58 | 17 min | crews ran 8.5–16 min each, concurrent |
| 6 | Batch commits as each crew verified green (6 batches → PR #662, merged 12:53) | 12:45 | 12:58 | rolling | |
| 7 | Final assembled-tree gates: lint + 5 guard scripts + 407 files / 4,885 tests + production build | 12:55 | 12:58 | 3 min | all green |
| 8 | Final batch push (PR #664) + deploy proof for merged portion | 12:58 | 13:00 | 2 min | deploys confirmed per merge (DR-0107) |
| | **Request → all code pushed** | **12:24** | **12:58** | **34 min** | docs + merge-watch followed |

## Coverage checklist — every surface, its state, its why

**Already adopted before this sweep (8):** AdminConsole, BigPictureDashboard,
ChurchHome, DevOps/Opportunities, EventCenterModule, Rentals, QualityProof (3rd-row),
AccessUsageMetrics (3rd-row).

**Converted this sweep — sections now slide sideways (17):**

| Surface | Sections (defaultId first) | Pinned above the strip | 3rd row |
|---|---|---|---|
| Engagement | Trivia · Messages | header | — |
| VoiceStudio | Listen · Voices · Record (gated) | honesty banner, status notices | — |
| EternalAlgorithmsStudy | Study series · Godhead · Witness · Game · Forge (gated) | header + help; KJV footer below | — |
| ScriptureLibrary | The Word (full Bible) · Curated study | header | kept inner chip strips |
| CommandServeCenter | See · Command · Control · Serve | SERVE header, brake banner, no-leak fallback | — |
| EventManagement (staff) | Requests · Calendar · Declined · Log a booking | 3-KPI revenue/health strip | — |
| DeviceInventory | Registry · Compute Pool | header, DeviceEditor, At-a-glance KPIs | — |
| Contractors1099 | Outbound · Inbound · Worker voice | header, count, add form | — |
| Relationships | Matrix · Guardian · Landlord | header, save toast | relationship-type chips |
| HarvestLedger | Recordings · Coverage · Pipeline (gated) | title, banner, 4-stat KPI grid | — |
| MooreDivahs | Orders · Classes · Materials · Numbers | brand header, new-order form, 4 KPI tiles | — |
| ChurchVideoWall | On-site · Spec · Signal · Software · Checklists · Budget · Story | identity/status header | — |
| ChefCorner | Recipes · Kitchen (steward) · Costing (steward) | header + text-size control | kept add-flow strip |
| Choir | 9 sections from the canonical TABS (ids byte-identical for the feedback guard) | header, alert banner | — |
| TVTime | My shows & picks · Your circle (kill-switch gated) | show search/import card, trending strip | — |
| Practice | Operations · Growth · Learn | TLC banner, 4-cell inquiry KPI row | ops chips: Inquiries · Services · Revenue |
| Inventory (item detail) | Move · Edit · Ledger · History | page KPI roll-up already pinned | — |

**Harmonized — own strip kept as the section row, new 3rd-row chips added (3):**
BooksTransactions (ledger + Upcoming/History/Evaluate strip kept — `txView` drives
shortfall/balance logic; analysis chips: Forecast · Balances · Proof), ChurchLearn
(course picker kept; per-course chips: Weeks · Join · Pace · Paper), ServiceProgram
(lens strip kept — `lens` drives sector view; chips: Run of show · Actuals · Team).

**Kept with verified reason — tab state is program-driven or read by logic the
uncontrolled primitive can't express (6):** Study (`setKind` jumps from derivations),
Forecast (`setTab('track')` after recording), Games ("Begin the journey" jumps to Play),
Pulpit (`onReuse` jumps to library; DR-0079 Sermon Stories lands on these ids), Library
(save jumps back to shelf; strip registered onto the shared tablist this sweep), CRM
(pipeline state feeds memos/effects; already underline→chips hierarchy). All already
ride the shared TabScroll primitive; all pass the guards.

**Fit-exempt — fits ~1.5–2 screens as one coherent flow, tabs would hurt (6):**
Markets, Cart (KPIs already pinned top), ConferenceModule (the deliberate one-door),
ThinkingSpace, CreationWorkspace (contenteditable canvas cannot survive remount),
ChurchObservation (one homogeneous user-editable grid).

**Deferred (1):** **About** — front door / mission identity = Tier C per RELEASE-TIERS;
gets its own `hold`-labeled PR and family review. `re-review: 2026-07-14`.

## Verification (DR-0076 receipts)

- Baseline before any change: 404 files / 4,869 tests green; after: **407 / 4,885**
  (16 new proof tests added, incl. new render proofs for ChurchLearn and ServiceProgram).
- Final tree: lint clean; module-boundary, monolith-budget, interconnect,
  source-adapter, surface-audit guards all exit 0; full Vitest green; real production
  build succeeds. Choir's `const TABS` verified byte-identical against
  `feedback-area-guard.mjs` (9 choir sub-tabs OK). Church/books nav ids and help keys
  untouched — help-freshness unaffected.
- Deploy proof (DR-0107): each merge produced a completed Cloudflare Pages deploy run;
  final confirmation recorded after PR #664 merged.
- **DR-0104 standing step:** the family reviews the landed build on poetech.us in
  Admin → Actions → Review as a user — slide every converted tab, confirm KPIs sit
  above the strips and nothing role-gated leaks.

## Open items (DR-0075 form)

| Item | Why not now | Re-review |
|---|---|---|
| About front-door conversion | Tier C (mission identity) — needs family review on a held PR | 2026-07-14 |
| Per-section help keys (`surface:section`) for converted strips | help resolves to parent view today; no guard requires finer keys — needs a key-convention decision first | 2026-07-21 |
| Controlled-mode option for SectionTabs (would let Study/Forecast/Games/Pulpit/Library/CRM fold in) | primitive change touches all adopters; six keeps are guard-green today | 2026-07-21 |
