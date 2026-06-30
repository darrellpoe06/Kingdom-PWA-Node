# The Monolith Won't Shrink Until We Stop Feeding It — Freeze, Cutover Plan, and Timeline

**Date:** 2026-06-29
**Author:** Claude (advisory; Darrell governs — GOVERNANCE-EXECUTION-ADVISORY)
**Grounds:** DR-0078 (hybrid-modular), DR-0076 (verification doctrine — every number here is measured, not asserted), DR-0075 (perpetual improvement), DR-0001 (idle-GPU yield), AI-FOUNDATION-INTERNAL-OPERATIONS + DATA-AS-EMPOWERMENT (sovereignty), `feedback-research-first`, `project-modular-rebuild`, `project-sovereign-mesh-two-nas`, `project-church-device-inventory-gpu-scheduler`
**Status:** the FREEZE (the forcing function) ships with this note. The extraction schedule is a plan for Darrell's go.

---

## The grievance is legitimate. Here is the receipt.

Darrell has asked for ~a month to move PoeTech off the monolith into modules, and it keeps not
happening — new work keeps landing in the monolith. That is **true, and the data proves it**, not
a feeling. Below is the honest WHY, the HOW (a forcing function that has been missing), a real
TIMELINE — and, first, the **strategic frame** that explains why this particular refactor is not
just hygiene but the precondition for everything else. No hand-waving.

---

## PART 0 — The strategic frame: two levers, and why they are coupled

Darrell named two **different** levers, and both gate the **quality of the opportunities and
constraints** we operate under. They are usually discussed separately. The first-class finding of
this report is that **they are coupled — and the order matters.**

### The two levers

1. **Compute substrate** — *where the work runs.* **Today: home-laptop-bound.** This very session,
   and the agentic build work generally, runs on Darrell's laptop, mediated by a vendor. One machine;
   if it sleeps, travels, or the vendor purges context, the work halts. **Target: a sovereign CUDA
   mesh + NAS** — owned hardware that runs the work without a vendor in the loop. The owned-compute
   pieces already exist or are in-flight, grounded:
   - **On main:** the idle-GPU scheduler (`app/src/lib/gpu-scheduler.js`, `infra/gpu-scheduler/`,
     `DR-0001-gpu-scheduling-three-layers-of-yield.md`); the braked headless NAS loop runner
     (`scripts/lib/nas-loops.mjs`, `infra/nas-loops/`) that keeps deterministic work moving when the
     vendor AI is offline; the church compute-tower compose (`infra/church-gpu-node/`); the
     capability router (`scripts/wake-router.mjs`).
   - **In-flight:** the two-NAS sovereign mesh (`infra/ai-orchestrator/mesh/nodes.json`, lane
     `local_fb38b3d3`, PR #408) — replication + capability-routed federation across home + church;
     the on-church-network agent runner (PR #419). *(Church tower GPU/CPU specs are still SME/TBD —
     stated honestly, not assumed.)*
2. **App architecture** — *what the work runs on.* **Today: monolith** (`poe-financial-mvp-v28.jsx`,
   9,572 lines). **Target: modules** (DR-0078 hybrid-modular; this report).

### The coupling (the first-class finding)

**Modules are what make the sovereign CUDA mesh useful.** You cannot farm parallel build work to
multiple local-coder tower-workers when the app is one monolithic file — *they collide on the same
lines.* This is not a hypothetical: PART 1 below measures it. Every recorded monolith conflict was
the **import block (C1)** and the **render switch (C2)** — the exact two regions any two concurrent
build agents would both have to edit to add or change a surface. Two tower-workers told to "each
build a feature" against the monolith would step on each other on line 1.

Once the app is modularized, **each module is an ownable unit of work** — a worker on the mesh takes
a module, builds it in isolation, and integrates through the surface registry + the Events spine
(which already enforce *no cross-module edits*). That is the difference between "N machines, one
contended file" and **real sovereign parallel building.**

> **So the ARCHITECTURE lever UNLOCKS the COMPUTE lever.** The mesh's value is bounded by whether
> the work can be partitioned. The monolith is the partition's enemy. Modularization is the
> precondition that turns owned hardware from "a place to run one agent" into "a fleet that builds
> in parallel."

### The quadrant

|  | **Laptop-only compute** | **Sovereign mesh + NAS** |
|---|---|---|
| **Monolith** | **WORST.** Single point of failure on *both* axes: one file everyone collides on, one vendor-mediated machine that sleeps/purges. Low ceiling, no resilience, not owned. *(Where we are today.)* | **Trapped potential.** Owned, resilient hardware — but the work can't be parallelized onto it (collision on the one file), so the towers sit idle on build work. The compute investment doesn't pay off. |
| **Modules** | **Parallel-capable, nowhere to run it.** Code can be farmed out, but the ceiling is one machine's throughput, still vendor-mediated. | **BEST.** Parallel (each module owned by a worker), resilient (no single machine or vendor is a SPOF; the NAS loop runner + mesh replication already prove braked continuation), and owned end-to-end. |

The diagonal is the lesson: **moving only one lever leaves value trapped.** Mesh-without-modules
buys idle towers; modules-without-mesh buys a partitionable app with nowhere sovereign to run it.
Both levers, in the right order, reach the best quadrant.

### OPPORTUNITIES & CONSTRAINTS

**Opportunities (unlocked when both levers move, in order):**
- **Parallel sovereign building** — N tower-workers each own a module and build concurrently with
  no line-collision; throughput scales with owned hardware, not vendor quota.
- **Resilience / no SPOF** — vendor laptop offline ≠ work stops. The braked NAS loop runner
  (`nas-loops.mjs`) already keeps deterministic work moving headless; mesh replication keeps the PWA
  live on two NAS at once. Neither the vendor nor any single machine is load-bearing.
- **Ownership & sovereignty** — compute on owned hardware (church towers, two NAS), single-writer
  data, no vendor lock; aligns with AI-FOUNDATION-INTERNAL-OPERATIONS + DATA-AS-EMPOWERMENT.
- **Idle-GPU yield** — the scheduler (DR-0001) farms idle church GPU to build/inference work. That
  yield is only realizable if there are *independent units* (modules) to farm; a monolith gives the
  scheduler nothing it can safely parallelize.

**Constraints (real, named — DR-0076):**
- **Compute lever today is laptop-bound and vendor-mediated** — a genuine single point of failure;
  context purges and machine sleep halt work.
- **Architecture lever today is a monolith** — the measured C1/C2 choke-points mean concurrent work
  collides; the app *cannot* be safely parallelized as-is.
- **The mesh is in-flight, not landed** (PR #408), and church tower specs are SME/TBD — the owned
  substrate is partly aspirational today; do not plan as if it is fully online.
- **The bootstrap irony** — *because* the app is still a monolith, the extraction itself must run on
  a **serialized** lane (one monolith-touching PR at a time). The cutover is the work that removes
  its own constraint; until it is done, even the cutover can't be parallelized.
- **The freeze is the precondition's precondition** — if the monolith keeps re-growing while we
  modularize, the architecture lever never completes. The CI line-budget guard (PART 2, Rule 1) is
  what protects the precondition long enough to finish it.

### Sequencing implication

**Modules FIRST — with the forcing function (the CI freeze-guard) holding the line — because
modularity is the precondition that makes the owned compute actually pay off.** Standing up the
two-NAS mesh (`local_fb38b3d3`) and the idle-GPU scheduler (`local_5a07180f`) *before* the app can be
partitioned would buy resilient hardware that build work can't yet use in parallel — the bottom-right
"trapped potential" cell.

This is **not** "compute vs. architecture" as rivals competing for the same hours. **Plan them
together:** as each module lands (Waves A–D below), it becomes an ownable unit the mesh can host, so
the two levers advance in lockstep — architecture opening the door, compute walking through it. The
freeze guard is what keeps the door from swinging shut behind us.

---

## PART 1 — Grounded truth (measured 2026-06-29 against `origin/main`)

### 1.1 The monolith, measured

| Metric | Value | Source |
|---|---|---|
| `app/src/poe-financial-mvp-v28.jsx` size | **9,564 → 9,572 lines** (it grew +8 mid-write — see below) | `wc -l` on `origin/main` |
| Lines ~35 days ago | **~5,362 lines** | `git show` at the commit before the 30-day window |
| Net growth in ~35 days | **+4,200 lines (~+78% — it nearly DOUBLED)** | the two figures above |
| Commits touching it, last 35 days | **170** | `git log --since` on the file |
| Net lines added in last 30 days (add − del) | **+2,584** (5,369 added, 2,785 deleted) | `git log --numstat` |

The file growing **is itself the argument** — DR-0078 said exactly that on 2026-06-17 ("it is still
growing, which is itself the argument"). It has grown ~600+ lines since.

> **It grew again while this report was being written.** When I measured main it was 9,564 lines.
> By the time the freeze PR ran CI, main was **9,572** — another inline feature (+8 lines) had
> merged in the gap. The freeze guard **caught it and failed the build**, exactly as designed. That
> is the problem and the fix in one frame: without the brake, the shell grows even in the hours it
> takes to install the brake. The baseline is set at main's real count, 9,572, and ratchets down
> from there.

### 1.2 The blueprint DID land — and so did Stage 1

This is the part that makes the grievance sharper, not softer: **the plan is real and the first
stage already shipped.**

- **DR-0078** (`docs/decisions/DR-0078-hybrid-modular-shell-plus-feature-modules.md`) — **accepted
  2026-06-17.** Prescribes Hybrid Modular: a small stable shell/core + independent feature modules
  that plug in through a **surface-mount registry** and the Events spine, never importing each other.
  Full spec in `docs/00-foundations/MODULE-ARCHITECTURE-ADR.md`; mechanics in
  `docs/00-foundations/HYBRID-MODULAR-IMPLEMENTATION-PLAN.md` (line-grounded choke-points C1–C6).
- **Stage 1 landed** in **PR #335** (`334f573`, 2026-06-25), CONFIRMED on main:
  - `app/src/surfaces.js` — the surface-mount **registry** exists (23 surfaces declared as lazy
    `load` thunks). ✅ on main.
  - `scripts/module-boundary-guard.mjs` — the structural **boundary gate** exists and runs in CI.
    ✅ on main. It enforces three invariants: registry purity, registry-is-shell-only,
    shell-not-imported-by-features.
  - First peel: **BooksTransactions (~1,120 lines)** carved into its own lazy chunk. ✅
- **Repo is ~80% hybrid already**: 110 component files, 178 lib files. The monolith is mostly a
  *composition root* that imports them — the surfaces are already separate files.

So scaffolding is **not** the missing piece. The spine exists.

### 1.3 The honest root cause: there was a spine but no brake

Here is the WHY, stated plainly. **After Stage 1 shipped the modular spine, the monolith kept
growing anyway:**

- Right after Stage 1 (#335, 2026-06-25): monolith was **8,769 lines**.
- Four days later (2026-06-29): **9,564 lines** — **+795 more lines**, added straight into the shell
  (and +8 more during this write, to **9,572** — see the note above).
- **19 commits touched the monolith after Stage 1** — kitchen inventory (#382, #386), recipes
  (#376), forecast (#374), systems-of-record (#375), CRM (#339), voice (#364), and more. Every one
  a net-new feature, added inline.

Why did the spine not stop this? Because **the boundary gate checks STRUCTURE, not SIZE.**
`module-boundary-guard.mjs` makes sure nobody re-tangles the registry or imports the shell — but
**nothing in CI caps how big the shell gets.** Verified: `grep` for any line/size/budget guard
across `scripts/` returns **nothing**. CI runs lint → boundary-guard → interconnect-guard → vitest
→ build. None of them fail a PR for growing the monolith.

The mechanism, then, is not laziness or bad intent. It is **economics with no counterweight**:

1. **No forcing function.** Adding a feature inline to the shell's render switch is the path of
   least resistance, and nothing said no. The plan *recommended* extraction; nothing *required*
   stopping the bleeding.
2. **Features beat refactors, every time, when both are allowed.** A feature ships Tier A in
   minutes and delights. Extraction is Tier B/C, serialized-lane, joint-review work that produces
   no new user-visible capability. With both lanes open, the feature lane always wins the hour.
3. **DR-0078 explicitly deferred execution** — "Nothing ships before the July conference." That was
   prudent (the monolith is the highest-risk file in the repo), but it created a ~month-long window
   where the *plan* was frozen while the *file* was not. The deferral protected the refactor and
   left the growth unprotected — exactly backwards from what was needed.

**The missing piece is a brake.** Not more plan. A freeze with teeth.

---

## PART 2 — The binding cutover plan, with the forcing function that was missing

### Rule 1 — FREEZE the monolith to bug-fixes only (ENFORCED IN CI, shipping now)

A new CI gate, **`scripts/monolith-budget-guard.mjs`**, freezes the monolith's line count at its
current value (`scripts/monolith-budget.json`, budget = **9,572**) and **hard-fails any PR that
grows it past that budget.** It is a one-way ratchet:

- The line count may only go **DOWN**. Extraction shrinks it; `--generate` re-freezes the budget
  lower so it can never silently regrow.
- `--generate` **refuses to raise** the ceiling (proven: exits 1 when asked to). The only way the
  budget rises is a human editing the JSON by hand with a stated reason in the PR — a deliberate,
  reviewed act, never the default.
- Proven-to-catch (DR-0076, anti-theater): `app/src/__tests__/monolith-budget-guard.test.js` drives
  the gate over synthetic counts and asserts it FAILS on +1 line, FAILS on a feature-sized addition,
  PASSES at budget, and PASSES (signalling re-freeze) on a shrink. The CLI was demonstrated failing
  with exit 1 when the budget was temporarily lowered, and refusing to raise it.

**This is the counterweight.** From the moment this merges, net-new feature code cannot be added to
the shell — CI will be red. The bleeding stops on day one, independent of how fast extraction goes.

> Tradeoff stated honestly: a genuine bug-fix that nets a few lines (a null-guard) will trip the
> gate. That is intentional friction — it makes shell growth a visible, deliberate decision. The
> escape hatch (hand-edit the budget with a reason) keeps it from blocking real fixes while denying
> the silent default.

### Rule 2 — ALL new surfaces built as modules, no exceptions

Already the standing rule (`NEW-SURFACE-NEW-MODULE`, DR-0078 §2). Rule 1 makes it **enforced
instead of aspirational**: there is now no inline path to add a surface — the shell is full. A new
capability is a `components/*.jsx` file mounted by appending one entry to `app/src/surfaces.js`.

### Rule 3 — A protected extraction lane, insulated from the feature/fix stream

Per `HYBRID-MODULAR-IMPLEMENTATION-PLAN` §3 + `SWIMLANES.md`: extraction runs as **INFRA lane 4**,
**serialized** — at most one monolith-touching PR in flight; the next rebases after the prior
merges. Feature/fix work runs in parallel in other lanes and never waits on it. The freeze (Rule 1)
is what makes that parallelism safe: features can keep shipping *as modules* without re-bloating the
shell the extraction lane is draining.

### The extraction order — lowest coupling/risk first, dependency-mapped, zero feature loss

Grounded in the actual inline definitions on main (`grep` of the monolith, line numbers real). Each
peel is **move-not-rewrite**: the section is already a prop-driven function or a pure constant; cut
it to its own file, import it, pass the same props. Behavior is pinned by the existing test suite
**and** by the line-budget ratchet (the count must fall, proving the shell shrank).

**Wave A — pure data/config constants (near-zero risk; no hooks, no JSX, already `export const`):**

| Target file | Pulls out | Lines (approx) | Dependency note |
|---|---|---|---|
| `lib/seed-data.js` | `SEED_DATA` (L229), `EMPTY_WORLD` (L550), `COLG_DEFAULT_CHURCH` (L194) | ~410 | Imported by the shell's initial-state only. |
| `lib/demo-data.js` | `DEMO_DATA_*` (L603–939), `DEMO_DATA_BY_PERSONA`, `DEMO_ONLY_IDS`, `DEMO_ENTITY_NAMES`, `SEED_IDS`, `DEMO_PERSONA_META` (L1570–1810) | ~650 | `DEMO_ENTITY_NAMES`/`SEED_IDS` are exported + imported elsewhere — keep the export surface byte-identical. |
| `lib/tiers.js` | `TIER_ORDER/LABEL/ALIASES`, `VIEW_TIER_REQUIREMENTS` (L1070), `FOUNDATION_CAPS`, `RENTALS_FULL_EDIT_TIER` | ~120 | **Do this deliberately — it is the DR-0078 §prereq:** the registry's `requires` field needs these tier helpers in a core lib so both the shell and `surfaces.js` import from one place. Unblocks Stage 2. |
| `lib/opportunity-library.js` | `OPPORTUNITY_LIBRARY` (L7848), `SKILL_CATEGORIES`, `URGENCY_BANDS` (L7774) | ~180 | Pure data. |

*After Wave A: ~9,564 → ~8,200. Re-freeze the budget after each merge.*

**Wave B — leaf components, prop-light (low risk):**

| Target | Pulls out | Lines | Dependency note |
|---|---|---|---|
| `components/Banners.jsx` | `SalesFooterBanner`, `TherapyReminder`, `AdvisementBanner`, `UpdatePrompt`, `InstallPrompt`, `ImportedDemoGuard`, `UpgradePrompt`, `CompactHero`, `Admin` | ~575 | Each takes ≤2 props or none. |
| `components/Feedback.jsx` | `FeedbackModal` (L6731), `FeedbackPromotePanel` (L6922), `FEEDBACK_AREAS` (L6566), `FEEDBACK_CATEGORIES` | ~505 | **Named dependency:** `FEEDBACK_AREAS` is choke-point C6 — update `scripts/feedback-area-guard.mjs` in the SAME PR to read the map from its new home, or CI goes red. |
| `components/TierSwitcher.jsx` | `TierSwitcher` (L1484) | ~86 | Consumes `lib/tiers.js` from Wave A. |

*After Wave B: ~8,200 → ~7,000.*

**Wave C — large prop-driven surfaces (medium risk; the BooksTransactions-proven pattern from #335):**

| Target | Pulls out | Lines | Dependency note |
|---|---|---|---|
| `components/BooksAccounts.jsx` | `BooksAccounts` (L9137) | ~402 | Identical pattern to the BooksTransactions peel already done in #335; mount via the Books sub-nav registry entry. |
| `components/Calendar.jsx` | `Calendar` (L7952) | ~340 | ~13 props, all handlers; mechanical. |
| `components/BigPictureDashboard.jsx` | `BigPictureDashboard` (L7071) | ~658 | Heaviest prop list (~40 props) but **all props, no shared closure state** — wiring is mechanical; behavior pinned by existing BigPicture tests. |
| `components/Church.jsx` | the inline `Church` composer (L8292) | ~843 | Highest coupling of the surfaces; `surfaces.js` already flags church-`home` as the Stage 3 extraction candidate. Mount as the church `home` registry entry. |

*After Wave C: ~7,000 → ~4,500. The monolith is now ≈ the shell root: state + the render switch.*

**Wave D — render switch → registry iteration (the one genuinely high-risk step):**

Convert the remaining `{view === X && …}` render branches to **iterate `SURFACES`** (the registry
already exists from Stage 1). This is DR-0078's deferred "one final serialized monolith edit" +
Stage 5. **Serialized lane, joint review, full `npm run verify` before merge.** After it, the shell
is a thin composition root (~1,500–2,000 lines: providers + state hooks + registry iteration).

**Net:** ~4,900 lines are extractable before the shell root is even touched. The monolith can
realistically go **9,564 → ~4,500 → ~1,800** (a thin composition root). **Zero feature loss** at
every step — nothing is rewritten, only relocated, with tests + the ratchet as the guardrails.

---

## PART 3 — A real timeline (from today, 2026-06-29)

**The single most important fact: the tourniquet goes on today.** The instant the freeze (Rule 1)
merges, the monolith cannot grow. Even if extraction is slow, the month-long bleed Darrell named is
**over** the day this lands. The schedule below is for *draining* the file; the *freeze* needs no
schedule — it is binary and immediate.

**Read this timeline as the architecture lever (PART 0).** Each module that lands is also an
*ownable unit the sovereign mesh can host* — so the right-hand "what" column is simultaneously the
schedule on which the compute lever becomes useful. As Waves A–D complete, stand the two-NAS mesh
(`local_fb38b3d3`, PR #408) and idle-GPU scheduler (`local_5a07180f`) up *alongside* them, assigning
freshly-extracted modules to tower-workers. Modules first, compute in lockstep behind — not as a
later, separate project. By the time the shell is a thin composition root (Wave D), the app is
partitioned enough that real parallel sovereign building is on the table.

**Assumptions (stated, per DR-0076):**
- One monolith-touching PR in flight at a time (serialized lane) — this is the pace-limiting
  constraint, by design (safety on the hottest file).
- The **July conference** is the priority lane; per DR-0078 it owns the critical path. Extraction is
  INFRA lane 4, scheduled around it — expect a **~1.5–2 week slowdown** during conference crunch.
- Feature work continues in parallel *as modules* (the freeze makes this safe).
- ~11 extraction PRs (Waves A–C) + 1 render-switch conversion (Wave D).

| Week | Dates | Work | Monolith (approx) |
|---|---|---|---|
| **0** | Jun 29 – Jul 5 | **Freeze lands (this PR).** Forcing function active. Begin Wave A: `seed-data.js` + `demo-data.js`. | 9,564 → ~8,500 |
| **1** | Jul 6 – Jul 12 | Wave A finish: `tiers.js` (unblocks registry `requires`) + `opportunity-library.js`. Conference may take the lane. | ~8,500 → ~8,200 |
| **2** | Jul 13 – Jul 19 | **Conference window** — extraction likely paused; freeze still holds the line. | ~8,200 |
| **3** | Jul 20 – Jul 26 | Wave B: `Banners.jsx`, `Feedback.jsx` (+ feedback-area-guard update), `TierSwitcher.jsx`. | ~8,200 → ~7,000 |
| **4** | Jul 27 – Aug 2 | Wave C: `BooksAccounts.jsx` + `Calendar.jsx`. | ~7,000 → ~6,250 |
| **5** | Aug 3 – Aug 9 | Wave C: `BigPictureDashboard.jsx` + `Church.jsx` (Tier B soak each). | ~6,250 → ~4,500 |
| **6** | Aug 10 – Aug 16 | **Wave D:** render switch → registry iteration (serialized, joint-review, full verify). Shell becomes a thin composition root. | ~4,500 → ~1,800 |
| **7** | Aug 17 – Aug 23 | Buffer/soak: confirm the conflict-rate trend turned **DOWN** (DR-0078's own success signal); re-review the boundary-guard's 3 grandfathered helper-inversions (due 2026-08-01); declare **"app runs as modules."** | ~1,800 |

**Confident range: 6–8 weeks → "app runs as modules" by mid-to-late August 2026.**
- **Faster (5–6 wks, early Aug)** if the conference consumes less of the serialized lane than budgeted.
- **Slower (9 wks, early Sep)** if the conference fully blocks the infra lane for ~3 weeks.
- Either way, **shell growth is zero from week 0** — the timeline only governs how fast it shrinks.

**Ties:** DR-0078 / `project-modular-rebuild` (the target), orderly-convergence (serialized lane,
one-monolith-PR-at-a-time), shared-persistence standard (`lib/table-sync.js` + `lib/sync-identity.js`
stay core; no extracted module forks them — the boundary guard already enforces this).

---

## What shipped with this note (the enforced half)

- `scripts/monolith-budget-guard.mjs` — the ratchet guard (freeze + down-only re-freeze + refuse-to-raise).
- `scripts/monolith-budget.json` — budget frozen at **9,572** (2026-06-29).
- `app/src/__tests__/monolith-budget-guard.test.js` — proven-to-catch (9 tests, green).
- `.github/workflows/ci.yml` — the guard runs as a named CI step, between the boundary gate and the
  interconnect gate. **A PR that grows the monolith is now RED.**

The plan was never the problem. The brake was missing. It is on now.

And the brake is doing more than protecting a refactor: it protects the **precondition** for the
sovereign compute story. Modules are how the owned mesh stops being idle hardware and becomes a
fleet that builds in parallel. Architecture first, compute in lockstep — both levers, in order, to
the best quadrant.
