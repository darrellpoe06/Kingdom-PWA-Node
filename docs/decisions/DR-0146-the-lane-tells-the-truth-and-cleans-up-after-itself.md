# DR-0146 — The lane tells the truth and cleans up after itself: no more "CI UNKNOWN", no more zombie PRs

- **Status:** accepted
- **Tier:** A (a readout truth fix pinned by tests + a dispatch-only janitor that ships inactive; no schedule, no new data class, closes nothing a human did not arm it to)
- **Scope:** `lib/github-ops.js` (`normalizeMainRuns` judge-from-completed; lane budget spent most-recently-updated-first) + its tests, `.github/workflows/pr-janitor.yml` (new, dispatch-only)
- **Date:** 2026-07-10
- **Principles:** VERIFICATION-DOCTRINE (DR-0076 — the diff is the evidence), SPEAK-ESTABLISHED-FACT (DR-0100 — a knowable verdict is never reported "unknown"), THREE-BRAKES, PERPETUAL-IMPROVEMENT (DR-0075), STREAMLINED-LOOP (DR-0103), NO-STATIC-DATA

## Directive

Darrell, 2026-07-10: *"Do whatever we need to fix the CI unknown lane ect."* And, interrupting the hand-fix mid-sweep: *"comprehensive processes"* + *"all fixes need documentation and added to the Ways"* — the correction that shaped the whole package: a session hand-closing PRs is a sweep that dies with the session; the team needed a **process** it can dispatch, observe, and re-run.

## The verified trace

1. **"CI UNKNOWN" was the board reading a BUSY lane as an unjudged one.** `normalizeMainRuns` judged trunk health from `workflow_runs[0]` — whenever a fresh run was in flight, that run's `conclusion` was null and the whole board read `CI unknown · in_progress`, even while the most recent COMPLETED run (same API page, zero extra requests) held a perfectly good verdict.
2. **The lane budget was spent describing corpses.** `fetchOps` computes each PR's lane from its REAL changed files, bounded at 8 lookups (the unauthenticated 60/hr budget). It took the API's default ordering — so with 24 open PRs, the 8 lookups landed on stale ones and the live work read `unknown`.
3. **23 of the 24 open PRs were proven zombies:** `git diff --quiet origin/main...origin/<branch>` on every branch — 23 empty diffs (their work had merged through other lanes; the PRs never closed), 1 real (#712 sovereign-captions, 22 changed files, kept open). The evidence is the diff, not the age.

## Decision

1. **The trunk verdict comes from the most recent COMPLETED run; an in-flight run is noted beside it, never mistaken for ignorance.** The board now reads "CI green (sha) · new run in flight" while the lane is busy — `attention` remains only for a trunk that genuinely has no finished run to judge. Pinned by tests.
2. **The bounded lane budget is spent on the LIVE PRs first** — open PRs are ordered most-recently-updated before the 8-lookup slice, so a pile of stale PRs can never again starve the readout of the work actually in flight. The notice says exactly what was computed and what was not. Pinned by a 12-PR fixture test.
3. **The janitor is a PROCESS, not a session's hand:** `pr-janitor.yml`, dispatch-only, closes a PR only when idle past the threshold (default 72h) AND its branch is **provably empty against main on the runner** — never a `hold`-labeled PR (the governor's hand is senior), never a draft, never an armed auto-merge, never anything carrying real changes (those are reported in the job summary and left open for a human). Closing preserves the branch; the comment names the evidence and the way back. Three brakes: a 25-close budget per run, a concurrency lock, and no schedule — each run is human-armed; arming a cadence is the governor's standing Tier C decision (with the other watched schedules, re-review 2026-07-17).
4. **First dispatch after this merges retires the 22 remaining zombies** through the process (one was closed by hand before the correction landed — the correction is why the other 22 wait for the janitor).

## Supersedes / pairs

Pairs with DR-0103 (the streamlined lane this board watches), DR-0135 (self-healing program — this is the ops-board's own probe+actuator pair), DR-0125 (the site's witness; this is the lane's), and the 2026-07-03 rate-budget discipline (the 8-lookup bound is kept, now spent wisely). Supersedes the newest-run-only CI verdict and the unordered lane slice.
