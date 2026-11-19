# DR-1601: CI runs only the legs a change needs

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (the merge lane's required check; no schema, no money)
**Type:** lane
**Area:** `.github/workflows/ci.yml`, new `scripts/ci-legs.mjs`
**Pairs with:** DR-0645 (parallel legs), DR-1297 (one run per commit), DR-1041 (a cancelled run reads as not finished), DR-0076 (proven to catch), DR-1602 / DR-1603 / DR-1604 / DR-1605 (the rest of this lane fix)

## Context

Darrell, 2026-11-19, after a night in which eight lessons took minutes each to write and hours each to land: "fix our way of orchestrating the work then we should have better success."

Measured from the Actions API the same morning: every push ran 24 CI jobs whatever it touched. Run 44515147816 (lesson sov97) started guards, four vitest shards, probes, layout, surface-sweep, curriculum, 12 PostgreSQL wall legs, the door journeys, the aggregator and the wf36 job. Of the last 100 CI runs, 57 were cancelled (superseded); successful branch runs took a median 37 minutes and a p90 of 72 from creation to finish, 18 at the quietest. The wall legs ran 0.5 to 1.5 minutes each, but each held a runner slot under the account's concurrent-job ceiling while 40 to 50 runs queued.

## Decision

A first job, `classify`, reads the push's changed files (the compare API against main, three-dot) and `scripts/ci-legs.mjs` names the legs that cannot be affected. When every path is lesson content (`app/src/lib/living-lessons/*`, `*-class.js`, `*-course*.js`), a test under `app/src/__tests__/`, a record under `docs/`, a ledger or baseline JSON, `scripts/file-budgets.json` or a `scripts/*-fill.mjs` builder, the 12 wall legs and the door journeys skip. The layout probe also skips unless a path belongs to a course the probe or the browser journeys open by URL (read from those scripts, so `living-lessons` and `made-in-time` keep it).

Fail safe: one unrecognised path, main, merge_group, a dispatch, an empty, unreadable or truncated (300-file) diff, or a classifier error runs every leg. vitest, guards, probes (build), surface-sweep and curriculum always run.

The required check `app — lint + vitest` keeps its name and its rule: it now also needs `classify`, and a skipped leg counts as passed only when a successful classifier named it. Any other skip after a successful classifier is a failure; after a cancelled one it reads as did-not-finish (DR-1041). Both still exit 1.

## Proof

`ci-runs-only-the-legs-a-change-needs.test.js` (17 tests) runs the real classifier on the real #2789 file list, and runs the aggregator's run script extracted from ci.yml with bash and jq: it passes on named skips and fails on an unnamed skip, a failed classifier, a cancelled classifier and a failed named leg. Proven to catch: an aggregator that waves every skip through passes the unnamed skip, and the suite sees the difference. Real-PR measurements (a lesson-only PR and a code PR) are recorded on this PR and in DR-1605.

## Not changed

No test is skipped or quarantined; the legs that are skipped run on every push to main. `rls-isolation.yml` and its matrix are untouched (it is dispatched by db-migrate, not by PR CI), and any `infra/` path runs every leg.

re-review: 2026-12-03 (read a week of runs: any lesson PR that skipped a leg and broke main on that leg's ground is a finding against LIGHT).
