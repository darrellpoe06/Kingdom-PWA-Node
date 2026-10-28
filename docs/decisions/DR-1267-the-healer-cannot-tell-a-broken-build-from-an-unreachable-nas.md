# DR-1267 — The healer cannot tell a broken build from an unreachable NAS, so it healed nothing for four hours

**Status:** accepted (finding recorded; the fix is dated, not shipped)
**Tier:** B (the deploy lane)
**Date:** 2026-10-28
**Entities:** `.github/workflows/deploy-freshness.yml:160-172`; `deploy-cloudflare-pages.yml`; main `81813abd` vs served `a286826`
**Grounds:** PROVE-THE-DEPLOY (DR-0107), VERIFICATION-DOCTRINE (DR-0076), PERPETUAL-IMPROVEMENT (DR-0075), HOLD-THE-HAND-OF-THE-PROCESS (DR-0621), THREE-BRAKES (DR-0247/0248)

## Context

From **01:50 UTC on 2026-10-28** the Synology NAS stopped answering on the tailnet. Every deploy since has failed at one step, `Fetch the sovereign anon key from the NAS (repoint armed only)`, with `ssh: connect to host poetech.tail5a2f35.ts.net port 22: Network is unreachable`. **That step is right to fail** — it refuses to ship an app with no backend key, and says so in its own error: *"failing this deploy rather than shipping half a backend (DR-0107). The live site keeps its current build."*

What was NOT expected is that `deploy-freshness.yml`, the healer DR-0107 exists to provide, ran repeatedly and reported **success** the whole time while deploying nothing.

## What was measured

**Four deploys failed, all at the same step:** 01:50 (`e59d9008`), ~02:0x (re-dispatched by hand), 02:25 (`fd875494`), 02:38 (`81813abd`). **After 02:38 no deploy was attempted at all** — measured at 04:05 and again at 05:05, a gap of over two hours.

**Meanwhile the healer fired and passed:** `deploy-freshness` runs at 02:26, 02:27, 02:27, 02:38, 02:39 and 03:04, every one `success`, every one `workflow_run`-triggered. A green healer above a stale site is the disarmed-check shape (DR-0060 / DR-1092): the check reported health while the thing it guards was broken.

**The cause, read from the workflow rather than guessed:** `deploy-freshness.yml:160-172` asks whether ANY deploy run exists for main's exact tip and, if so, declines to dispatch:

```
# ANY run for main's exact tip counts, whatever its status — queued, running or
# failed — because a failed deploy for this tip is the deploy workflow's problem
# to report, not a reason for this healer to stack another build on top of it.
in_flight=$(gh api ".../runs?head_sha=$main_sha&per_page=1" --jq '.total_count // 0')
if [ "${in_flight:-0}" != "0" ]; then
  echo "ALREADY IN FLIGHT: a deploy run exists for main $main_sha; not dispatching."
  return 2
fi
```

**This is not an oversight, and the record should not pretend it is.** The author considered failed runs and included them deliberately, with a stated reason, after a real incident in which this healer raced auto-merge's own dispatch and fired a SECOND build (the comment names runs #1157 / #1155). The guard against double-dispatch is the same line as the guard against RE-dispatch, and nobody had to choose between them until now.

**The premise is what fails, and only for one class of failure.** "A failed deploy is the deploy workflow's problem to report, not a reason to retry" is **correct when the build is broken** — retrying a bad build burns runs and changes nothing. It is **wrong when the cause is transient and external**: an unreachable NAS, a Cloudflare blip, a runner killed mid-step. There, re-dispatch is precisely the cure, and the healer declines it because it cannot tell the two apart from a run's conclusion alone.

**Cost, measured on the real gap.** Served `a286826`, main `81813abd` — four commits and **28 files under `app/src`**, holding **Living Lesson 270** (DR-1263), **Sovereign A.I. week 53** (DR-1265), the exam-attempt/best-score work (DR-1264) and the library census (DR-1266). All merged, none visible in the app. The site itself stayed **up** throughout (poetech.us 200, backend 200, sign-in POST 400/81 bytes healthy), so this is a stale site, not a down one — but the first two hours of the gap were free (a workflows-only commit) and everything after was not.

**The lane kept merging into a known-broken deploy.** Four PRs landed between 02:00 and 02:40 while every deploy was failing, because the gates gate on CI and nothing in the lane consults deploy health. This is DR-0107's gap in a new form: not "a merge that did not trigger a deploy", but "merges that kept landing while the deploy was known dark".

## Impact

- **The healer's green is not evidence that the served build is current.** Until this is fixed, `deploy-freshness` succeeding means only "a run exists for this tip", which a failed run satisfies. Anyone reading it as freshness is reading it wrong, and this record is the correction.
- **Recovery is by hand, so it is written down rather than assumed:** when the NAS answers, dispatch `deploy-cloudflare-pages.yml` on `main` and prove it on main's exact tip with `scripts/prove-deploy.mjs --sha <40>` (by commit, never list position — P62). It will NOT restart itself.
- **The fix, specified but deliberately NOT shipped here:** count only runs that are `queued`, `in_progress` or `success` as "in flight", and treat a `failure`/`cancelled` run for main's tip as still stale — while keeping the original intent intact with a bound, so a genuinely broken build cannot loop: at most ONE re-dispatch per tip per hour (budget), the existing single-flight check (lock), and `DEPLOY_FRESHNESS_ENABLED=false` already present as the stop-path. That satisfies DR-0247's budget+lock for a deterministic loop without restoring a hand switch.
- **Why it is not shipped in this record:** it is a change to the deploy lane, and **DR-0107 forbids shipping one without proving a real deploy still fires** — which is exactly what an unreachable NAS makes impossible right now. Shipping an unprovable lane change during an outage is how the 2026-07-06 nine-hour stale-site incident happened (P25/P26). `re-review: 2026-10-29`, to be built and proved the first day a deploy can be proved at all.
- **A second, smaller finding, recorded not fixed:** nothing in the merge lane consults deploy health, so PRs merge happily into a dark deploy. Whether the lane SHOULD hold merges when the last deploy failed is a Governor's call, not a tooling tweak — it trades delivery velocity against staleness, and DR-0107 ranks uptime higher than velocity but says nothing about merging. `re-review: 2026-11-04`.

## Decision

Record the defect, its real cause, and the bounded fix, and do not ship a deploy-lane change that cannot be proved during the outage that revealed it. Recover by hand: dispatch the deploy and prove it by exact SHA once the NAS is back. Treat a green `deploy-freshness` as "a run exists", never as "the site is current", until the fix lands.

## Verification

- Four failed deploys named by SHA and timestamp, each failing at the same named step, with the SSH error quoted verbatim from the run log.
- Six `deploy-freshness` runs named by timestamp, all `success`, spanning the window in which no deploy was attempted.
- The deciding lines quoted from `deploy-freshness.yml:160-172`, including the comment that shows the inclusion of failed runs was deliberate.
- The gap measured by `git diff --name-only a286826..origin/main`: 4 commits, 28 files under `app/src`, named by DR.
- Site state measured outside-in by `site-health.yml` in the same window: `PAGES_CODE 200`, `BACKEND_CODE 200`, `XO_POST 400 / 81 bytes`, `SERVED a286826`, `MAIN e59d900` at the time of that run.
- The lesson queue read `UNKNOWN` — never zero — at 02:08, 03:07, 04:08 and 05:08, the witness correctly refusing to call an unread queue an empty one.
- **NOT verified, and that is the point:** no deploy has been proved since `a286826d` at 01:20, and no fix to the healer has been exercised. Both wait on the NAS.
