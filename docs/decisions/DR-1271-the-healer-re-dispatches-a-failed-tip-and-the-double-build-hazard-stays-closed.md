# DR-1271 — The healer re-dispatches a failed tip, and the double-build hazard it was built for stays closed

**Status:** accepted (built, proven to catch twice, deploy proof named below)
**Tier:** B (the deploy lane)
**Date:** 2026-10-28
**Entities:** `.github/workflows/deploy-freshness.yml` (the in-flight gate; `RETRY_AFTER_MIN`); `app/src/__tests__/deploy-freshness-lane.test.js` (24 cases, 8 of them behavioural)
**Grounds:** DR-1267 (the finding), DR-1269 (the real cause of the 2026-10-28 outage), PROVE-THE-DEPLOY (DR-0107), VERIFICATION-DOCTRINE (DR-0076 §3), THREE-BRAKES (DR-0247), PERPETUAL-IMPROVEMENT (DR-0075)

## Context

DR-1267 recorded the defect and deliberately did **not** fix it: *"it is a change to the deploy lane, and DR-0107 forbids shipping one without proving a real deploy still fires — which is exactly what an unreachable NAS makes impossible right now,"* with `re-review: 2026-10-29`, to be built *"the first day a deploy can be proved at all."*

That day arrived the same day. DR-1269 freed the deploy by giving it a second road to the anon key, and two deploys have since gone green on main — `bd98feae7` at 10:05 and `0aa35a83d` at 14:00. A deploy-lane change is provable again, so the deferred work is done rather than left to a date.

## What was measured

**The defect, restated from DR-1267 and unchanged by DR-1269's correction of the cause.** `deploy-freshness.yml` asked whether ANY deploy run existed for main's exact tip and declined to dispatch if one did:

```
in_flight=$(gh api ".../runs?head_sha=$main_sha&per_page=1" --jq '.total_count // 0')
if [ "${in_flight:-0}" != "0" ]; then echo "ALREADY IN FLIGHT: ..."; return 2; fi
```

On 2026-10-28 the runner's Tailscale auth key was refused (DR-1269 — **not** an unreachable NAS, which was DR-1267's own error) and seven deploys died at the same step. The healer then fired six times, read `ALREADY IN FLIGHT` off those corpses and reported **success** while the site sat five commits behind for over two hours. A green healer above a stale site is the disarmed-check shape.

**The premise, and why it was only half wrong.** The comment said a failed deploy is *"the deploy workflow's problem to report, not a reason for this healer to stack another build on top of it."* That is **right** for a build that failed on its own merits — retrying burns runs and changes nothing — and **wrong** for one killed by a transient cause outside it. A run's conclusion cannot tell those apart, and until this outage nobody had to choose.

**The original hazard is untouched, and that is the load-bearing claim of this record.** The gate exists because runs #1157 and #1158 both built `003aaf22` — two Cloudflare Pages builds for one merge — when auto-merge's own heal had a deploy **RUNNING** on the new tip while the last success was still the previous tip. **That incident was a running deploy, not a failed one.** So narrowing the gate to exclude only `failure`/`cancelled` cannot reopen it: queued, in_progress and success all still count as in flight.

**The new filter, and it was run rather than quoted:**

```
[.workflow_runs[] | select(.status != "completed" or .conclusion == "success")] | length
```

| payload | live | meaning |
| --- | --- | --- |
| all `failure` | 0 | the outage — now dispatchable |
| all `cancelled` | 0 | dispatchable |
| no runs at all | 0 | dispatchable |
| one `queued` | 1 | **the #1157 hazard — still blocked** |
| one `in_progress` | 1 | blocked |
| one `success` | 1 | blocked, a deployed tip is never redeployed |
| `failure` + `in_progress` | 1 | blocked, a build is live |

**Bounded, so a genuinely broken build cannot loop** (DR-0247 budget): the newest run for the tip must be older than `RETRY_AFTER_MIN` (30), so a tip gets at most one re-dispatch per window however often the healer fires. Stateless on purpose — the runs list *is* the state, so there is no file to go stale and no lock to leak. The lock remains the existing single-flight check; the stop-path remains `DEPLOY_FRESHNESS_ENABLED=false`.

## Impact

- **A transient deploy failure now heals itself within one window instead of waiting for the next merge.** During the outage the only thing that produced a fresh deploy attempt was a NEW merge; a tip whose deploy had failed was never retried. That is why nothing recovered between 02:38 and 05:23.
- **A green `deploy-freshness` means more than it did.** It can no longer mean "a corpse exists for this tip". It still does not mean "the site is current" on its own — `site-health`'s SERVED vs MAIN is the reading for that (DR-0125).
- **An existing test asserted the OPPOSITE and had to be replaced, which is the part worth flagging.** `deploy-freshness-lane.test.js` carried *"counts a run of ANY status as in flight, not only a successful one"* with the reasoning quoted above. Changing a pinned behaviour is changing a recorded decision, so the replacement keeps the original hazard as its **own named case** (`still cannot produce two builds for one merge -- the #1157/#1158 hazard`) rather than deleting the protection along with the assertion.
- **The lane's other half is still open and still not mine:** nothing in the merge lane consults deploy health, so PRs merged happily into a dark deploy all through the outage. That trades velocity against staleness and is a Governor's call, carried from DR-1267 at `re-review: 2026-11-04`.
- **Honest limit:** `RETRY_AFTER_MIN` of 30 is a judgement, not a measurement. It is longer than a deploy takes and short enough that a transient fault clears within an hour; if a real outage ever outlasts a day of 30-minute retries the cost is 48 wasted runs, which is cheap against a stale site but is not free. `re-review: 2026-11-11` — count the re-dispatches the window actually produced.

## Decision

Narrow the in-flight gate to `queued`, `in_progress` and `success`, treat a tip whose runs have all finished without success as still stale, and bound the retry to one per tip per 30 minutes. Keep the #1157/#1158 protection as an explicitly named case. Leave the merge-lane question to the Governor.

## Verification

- **24 cases green**, 8 of them behavioural: the filter is **lifted from the workflow file** and run with `jq` against the payload shapes GitHub returns, so an edit that keeps the words and breaks the behaviour fails. Every other case in that file asserts text only, which proves the words are present and nothing about what they do — this is the first in that file that runs anything.
- **Proven to catch, twice, each restored byte-identical by `cmp`:** reverting the filter to `.total_count // 0` reddens 3 cases including the behavioural one; deleting `RETRY_AFTER_MIN` reddens the bound's case. 24/24 green again after both restores.
- The full 107-line step body extracted and checked with `bash -n` — **and the first attempt at that check was itself a lie**, written as `bash -n … | head -3 && echo OK`, which tests `head`'s status and printed OK over a real error from a truncated extraction. Re-done reading bash's own exit status on the complete block.
- `deploy-freshness.yml`, `auto-merge.yml` and `deploy-cloudflare-pages.yml` all parse; 86 tests green across the four lane suites (`deploy-freshness-lane`, `migration-dispatch-lane`, `keep-prs-current-lane`, `the-deploy-has-more-than-one-road`); lint clean.
- **The deploy proof DR-0107 requires is this record's own merge**, named here so it cannot be skipped: the deploy run on the main SHA that carries this change must succeed, confirmed by exact commit with `prove-deploy.mjs --sha <40>` (P62), and `site-health` must read SERVED == MAIN after it.
