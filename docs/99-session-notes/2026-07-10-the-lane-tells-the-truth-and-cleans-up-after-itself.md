# The lane tells the truth and cleans up after itself — the "CI UNKNOWN" board, traced and retired

> Layer 4 working artifact. Companion to **DR-0146** and REV-0038. Triggers, Darrell 2026-07-10: *"Do whatever we need to fix the CI unknown lane ect"* — and, interrupting the hand-fix mid-sweep, the correction that shaped the package: *"comprehensive processes"* + *"all fixes need documentation and added to the Ways."*

## What the board was actually saying

**"CI UNKNOWN · CI in_progress" was never a broken CI — it was the board misreading a BUSY lane.** `normalizeMainRuns` judged trunk health from `workflow_runs[0]`; whenever a fresh run was in flight its `conclusion` was null, so the whole strip read unknown while the most recent COMPLETED run — sitting on the same API page, zero extra requests — held the real verdict. Reporting a knowable verdict as "unknown" is an under-claim (DR-0100). Fixed: the verdict comes from the last completed run, the in-flight run is told beside it (*"CI green · new run in flight"*), and `attention` remains only for a trunk with no finished run at all. Pinned by tests.

## Why the live PRs read "unknown" lanes

The lane readout computes each open PR's lane from its REAL changed files, bounded at 8 lookups (the unauthenticated 60/hr budget — the 2026-07-03 discipline). It took the API's default ordering — and the repo had **24 open PRs**, so the budget was spent describing stale ones while the work in flight read `unknown`. Fixed: most-recently-updated first, pinned by a 12-PR fixture test; the notice states exactly what was computed and what was not.

## The evidence pass, and the correction that turned a sweep into a process

Branch-by-branch on the sandbox: `git diff --quiet origin/main...origin/<branch>` across all 24 — **23 empty diffs** (their work had merged through other lanes; the PRs simply never closed) and **1 real** (#712 sovereign-captions, 22 changed files — kept open). One zombie was closed by hand; the governor interrupted the second: *"comprehensive processes."* The hand stopped there. The process is `pr-janitor.yml` — dispatch-only, three brakes (25-close budget, concurrency lock, no schedule), closing ONLY idle-past-threshold AND provably-empty-vs-main PRs verified on the runner; `hold`, drafts, armed auto-merge, and anything with real changes always survive and are reported in the job summary. The branch is never deleted; the closing comment names the evidence and the way back. The first dispatch after merge retires the remaining 22 through the process.

## Ways updated with the fix (the standing refrain honored)

DR-0146 filed with the INDEX row; REV-0038 (orchestration) in the registry the app reads; Ari carries the new standing duty (`lane-hygiene`) in his derived record this build; arming the janitor's cadence joins the other watched schedules in the governor's standing Tier C decision (re-review 2026-07-17). No static data anywhere in the package: the board reads the live API, the janitor reads the live PR list, and every close carries runner-verified evidence.
