# The Monolith Won't Shrink Until We Stop Feeding It — Freeze, Cutover Plan, and Timeline

**Date:** 2026-06-29
**Author:** Claude (advisory; Darrell governs — GOVERNANCE-EXECUTION-ADVISORY)
**Grounds:** DR-0078 (hybrid-modular), DR-0076 (verification doctrine — every number here is measured, not asserted), DR-0075 (perpetual improvement), `feedback-research-first`, `project-modular-rebuild`
**Status:** the FREEZE (the forcing function) ships with this note. The extraction schedule is a plan for Darrell's go.

---

## The grievance is legitimate. Here is the receipt.

Darrell has asked for ~a month to move PoeTech off the monolith into modules, and it keeps not
happening — new work keeps landing in the monolith. That is **true, and the data proves it**, not
a feeling. Below is the honest WHY, the HOW (a forcing function that has been missing), and a real
TIMELINE. No hand-waving.

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
