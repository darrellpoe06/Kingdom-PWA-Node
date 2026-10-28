# DR-1262 — The dependency backlog is not one risk class, and the lane never covered it

**Status:** accepted
**Tier:** B (the CI / deploy lane)
**Date:** 2026-10-28
**Entities:** `.github/workflows/*` (131 action pins); `auto-merge.yml`; PRs #2373, #1129, #1130, #1132, #2266
**Grounds:** PERPETUAL-IMPROVEMENT (DR-0075), VERIFICATION-DOCTRINE (DR-0076), DO-THE-WORK (DR-0111), STREAMLINED-DELIVERY (DR-0103), PROVE-THE-DEPLOY (DR-0107), REVIEW-OUR-WAYS (DR-0108)

## Context

The open-PR backlog was read on 2026-10-28 and is **52 PRs, not the 20 an inherited note claimed** — a figure that had been repeated twice in session without being checked, which is its own small instance of DR-0076. Seven carry the `hold` label and are the Governor's brake, two are deliberately permanent (`#1879` "standing, never merges", `#1346` "permanent draft"), and **five are dependency bumps that had sat for up to 89 days.**

Every workflow run in the repository has meanwhile been printing `Node.js 20 is deprecated` for `actions/checkout@v4`, `actions/setup-node@v4` and `actions/setup-python@v5`.

## What was measured

**Why they sat — and it is structural, not neglect.** `auto-merge.yml:3-4` arms native auto-merge for PRs from `feat/*`, `fix/*`, `merge/*`, `docs/*` and `claude/*`. It does **not** match `dependabot/*`. So the lane that DR-0103 built to make work land on green by itself has never covered dependency updates: they are opened by a bot onto a branch prefix the lane does not see, and then nothing moves them. This is precisely the "we don't move when I'm not pushing" stall DR-0103 exists to remove, surviving in the one corner the fix never reached.

**The five are not one risk class, which is the substance of this record.** Read by diff rather than by label:

| PR | bump | diff | verdict |
| --- | --- | --- | --- |
| #2373 | supabase-js 2.117.3→2.118.0, eslint 10.12→10.13, postcss 8.5.29→8.5.31 | `+36/−36` | **routine** — minor/patch only |
| #1129 | setup-python 5→7 | `+1/−1` | **landed directly** (branch too stale to update) |
| #1130 | checkout 4→7 | `+21/−21` | **landed directly** (branch too stale to update) |
| #1132 | tailwindcss 3.4.19→**4**.3.3 | `+6/−771` | **deferred — a migration, not a bump** |
| #2266 | vitest 2.1.9→**5**.0.5 | `+147/−286` | **deferred — a migration, not a bump** |

`#1132` deletes **771 lines**, because Tailwind 4 moves configuration out of a JS config file and into CSS. Styling can break completely while all 31,602 tests still pass — the "looks right and is wrong" failure DR-0076 was written about. `#2266` jumps **three majors of the test runner that every gate in this repository executes on**; it is the one dependency whose breakage could not be detected by the tests, because it *is* the tests.

**Every documented breaking change was checked against this repository rather than assumed.** The release notes were read over outbound HTTPS — worth recording, because this session's GitHub access is scoped to this repository alone and a first attempt to read the actions' releases through the API was refused, which nearly became a false claim that the evidence was unobtainable. DR-0108's channel question had a third answer neither the API nor a runner: a plain web fetch.

- **checkout v7** blocks fork-PR checkout under `pull_request_target` and `workflow_run`. This repository uses `pull_request_target` in **zero** workflows and has **0 forks**, so no fork PR can exist to be blocked. Nothing documented changes `fetch-depth`, `submodules` or `persist-credentials` defaults.
- **setup-python v7** removes EOL Python versions; this repository requests **3.11 and 3.12**, both current. The removed `pip-install` input existed only in v6.1.0, which is skipped entirely.
- **setup-node v5** begins automatic caching when `package.json` carries a `packageManager` field — **this repository has none**. v6 narrowed automatic caching to npm, and all 10 caching sites already say `cache: npm` explicitly. v6.1.0 removed `always-auth` and v7.0.0 the dummy `NODE_AUTH_TOKEN` export — neither string appears anywhere under `.github/`. v6.3.0 and v7.1.0 changed `node-version-file` resolution — this repository uses none, pinning `node-version: 22` at all 36 sites.
- v5/v6 of these actions require runner **v2.327.1+** and Node 24; GitHub-hosted runners are well past both.

**The bump as landed:** 131 call sites over 70 files — 92 `checkout`, 36 `setup-node`, 3 `setup-python` — with **0 non-version lines changed** (asserted by filtering the diff) and every workflow still parsing.

## Impact

- **The deprecation warning is gone from every run**, and the repository is off three actions whose Node 20 runtime is end-of-life.
- **A stale dependabot branch is not worth rescuing.** #1129 and #1130 both refused `update-branch` with `merge conflict between base and head` after 89 days of workflow churn. The bump itself is mechanical and verifiable, so it was done on current `main` instead; dependabot closes its own PR once it sees the dependency updated. The lesson generalizes: a dependency PR left long enough stops being mergeable and becomes work to redo.
- **A PR cannot exercise a workflow that does not run on a PR, and this was the real risk.** CI green proves the `checkout` sites in PR-triggered workflows only; the 92 sites include push-only, schedule-only and dispatch-only workflows — deploy among them. So the deploy is proved on the merge SHA per DR-0107 and `site-health.yml` is dispatched after merge, which covers the two paths whose failure would reach the family. Stated as a limit rather than left implied, because "CI was green" would have been a true and misleading sentence.
- **The failure mode here is a stall, not a down site.** A broken action fails its job loudly and blocks merges; Cloudflare Pages keeps serving the last good build, so the worst case is a stale site, which `site-health` already watches for (DR-0125).
- **`#1132` and `#2266` are deferred with dates, not dropped.** Tailwind 4 needs its config migrated and the result looked at on a real screen, not inferred from a green suite: `re-review: 2026-11-11`. Vitest 5 needs the suite run on the new runner and the count compared against 31,602 before anything is believed, and it should not travel with any other change: `re-review: 2026-11-11`.
- **What is NOT done, and is deliberately not mine to decide:** extending `auto-merge.yml` to cover `dependabot/*`. That would mean third-party dependency updates merging and deploying **unattended**, which is a standing supply-chain posture rather than routine maintenance — a DR-0089 carve-out, and the Governor's call. The recommendation on the table is to cover `dependabot/*` for **minor and patch only**, leaving every major to a human, which would have landed #2373 on its own in minutes and still have stopped Tailwind 4 and Vitest 5 at the door. `re-review: 2026-11-04`.

## Decision

Bump `actions/checkout` to **v7** (92 sites), `actions/setup-node` to **v7** (36), `actions/setup-python` to **v7** (3), each after checking its documented breaking changes against this repository's actual usage. Land #2373 through the lane with auto-merge armed by hand. Defer #1132 and #2266 as migrations with dated re-reviews. Record the `auto-merge.yml` dependabot gap as a Governor decision with a recommendation, and do not change the lane's merge policy unilaterally.

## Verification

- `131 insertions(+), 131 deletions(-)` across 70 files; **0** non-version lines in the diff; **0** remaining `checkout@v4` / `setup-node@v4` / `setup-python@v5` pins anywhere under `.github/`; every `.yml` under `.github/workflows/` parses.
- Each breaking change checked by measurement, not memory: `pull_request_target` → 0 workflows; forks → 0; `python-version` → 3.11 and 3.12; `packageManager` → absent; `devEngines` → absent; `node-version-file` → absent; `always-auth` / `NODE_AUTH_TOKEN` → absent; `node-version: 22` → all 36 sites.
- Release notes read from the vendors' own release pages, not from training recall (DR-0076 §8).
- `#2373` inspected by diff before arming: three minor/patch bumps, auto-merge armed `squash` via the CCR REST route after GraphQL was refused.
- **Post-merge, required:** the deploy proved on the merge SHA by exact commit (DR-0107 / P62), and `site-health.yml` dispatched so a dispatch-only workflow's `checkout@v7` is exercised on a real run.
