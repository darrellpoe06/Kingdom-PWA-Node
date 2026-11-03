# DR-1301: The ten-minute witness runs five times a day — GitHub is dropping ~96% of this repository's scheduled runs, and a hypothesis is withdrawn

**Date:** 2026-11-03
**Status:** Accepted (measurement + a dated non-improvement; nothing in the lane changes yet)
**Tier:** B (it changes what we believe our standing instruments are worth; no product code, no schema, no money, and no workflow is edited by this record)
**Type:** verification
**Area:** `.github/workflows/site-health.yml` · `camera-health.yml` · `research-inbox.yml` · `feedback-fixed.yml` · `nas-health.yml` — measured, not modified
**Found by:** the agent, checking whether the duplicate-CI fix had restored the schedulers it was hypothesised to be starving. It had not, which is the finding.
**Pairs with:** DR-0125 (the site has its own witness — the record this measurement qualifies), DR-1291 (an unsigned road is not a dark layer — it fixed what the witness *says*; this is about how often it *speaks*), DR-1297 (CI runs once per commit — the hypothesis withdrawn here), DR-0107 (a down site is the worst outcome), DR-0076 (§4 measure don't claim, §8 unknown freshness never reads as fresh), DR-0075 (a non-improvement carries a why and a date)

## Context

DR-0125 made `site-health.yml` the standing outside-in witness after P31: the app was reported down while every deploy run was green, because every safeguard watched the pipeline and none ever made an HTTP request to the product. Its cron is `*/10 * * * *` — every ten minutes — and the whole value of an outside-in probe is that the gap between observations is short enough that an outage is caught rather than reported by a person.

On 2026-10-29, while measuring that witness for DR-1291, the scheduled-run count looked far too low. I offered a hypothesis and **labelled it as one**: the duplicate `push` + `pull_request` CI pair (each PR commit running ~19 jobs twice) might be starving the schedulers. DR-1297 removed that duplication and merged **2026-10-29T08:02:00Z**.

This record closes that loop. The hypothesis is wrong, and the real number is worse than the one that prompted it.

## What was measured

**Delivery against the cron, counted from `event=schedule` runs over the last 100 scheduled `site-health` runs:**

| day | scheduled runs delivered |
|---|---|
| 2026-10-26 | 5 |
| 2026-10-27 | 5 |
| 2026-10-28 | 5 |
| **2026-10-29** (DR-1297 merged 08:02Z) | 5 |
| 2026-10-30 | 4 |
| 2026-10-31 | 6 |
| 2026-11-01 | 5 |
| 2026-11-02 | 3 |

`*/10 * * * *` is **144 runs a day**. We are getting about **5**. That is a delivery rate near **3.5%**, and it is *identical on both sides of the DR-1297 merge* — 5/5/5 before, 5/4/6/5/3 after. **The duplicate-CI hypothesis is falsified and withdrawn.** Whatever drops these runs, it was not that.

**The number that actually matters is not the rate but the gap.** The longest interval between two consecutive scheduled `site-health` runs, across the last 100, is **616 minutes — ten hours and sixteen minutes.** The witness built to notice an outage within ten minutes has a measured blind window of over ten hours.

**It is the whole fleet, not one lane.** Counted on 2026-11-02:

| lane | cron | expected/day | delivered |
|---|---|---|---|
| `site-health` | `*/10 * * * *` | 144 | 3 |
| `research-inbox` | `7,22,37,52 * * * *` | 96 | 3 |
| `camera-health` | `7,37 * * * *` | 48 | 3 |
| `feedback-fixed` | `7 * * * *` | 24 | 3 |
| `nas-health` | `23 */6 * * *` | 4 | 2 |

Note the shape: four lanes with wildly different crons all delivered **three**. The loss is not proportional to the request — it looks like a per-repository ceiling on scheduled dispatches, not random drop. `nas-health`, which only asks for 4 a day, is the one that nearly gets what it asks for. **That pattern is an observation, not a diagnosis; I have not confirmed a mechanism and am not claiming one.**

## Impact

**Every "fresh" this fleet has reported for at least eight days means less than its record says.** DR-1291 fixed what the site witness *says* when it runs, and that fix is holding — 22 consecutive successes. This record is about the other half: a verdict is only as good as the sampling rate behind it, and ours is ~3.5% of the designed rate with ten-hour holes. An outage that opens and closes inside one of those holes is invisible to the instrument built to see it, and DR-0107 — a down site is the worst outcome — rests on exactly that instrument.

**It also means the queue-shaped lanes are not the lanes their records describe.** `research-inbox` at `7,22,37,52` exists so that "a research item he sent should not sit for an hour" — its own comment says so. At 3 deliveries a day it sits for hours routinely. The same applies to the hourly lesson-intake lanes.

**What this obligates:** no record in this repository may describe one of these lanes by its cron expression as though the cron were the cadence. The cron is a request; the delivered rate is the fact, and it is currently about one in thirty.

## Decision

**Record the measurement, change no lane today, and name the candidate fix with a date.**

Nothing in the fleet is edited by this record. Three reasons, stated rather than implied:

1. **The cause is outside our reach and not yet identified.** GitHub's scheduler is not something a workflow edit can compel, and I have a shape (a per-repo ceiling) but no confirmed mechanism. Changing crons on a guess would be the kind of unmeasured move DR-0076 §4 exists to stop — and asking for *more* runs is the obvious wrong move if a ceiling is what we are hitting.
2. **The honest fix is to make the witness report its own cadence, not to chase the scheduler.** The candidate: `site-health`'s verdict should carry the elapsed time since the previous observation and refuse to read "fresh" across a gap longer than some multiple of its cron — DR-0076 §8 (unknown freshness never reads as fresh) applied to the instrument's own sampling rate rather than only to the site's build. That is buildable, in-scope, and genuinely useful whatever GitHub does. It is **not** built here because it touches the Tier B witness lane I changed six days ago in DR-1291, and that change deserves its soak before the next one lands on top of it.
3. **The event-driven paths are unaffected and still carry the load.** The deploy dispatches `camera-health` directly, and a merge still triggers the deploy; DR-0103 §3 already says watch event-driven first and treat a timer as a short fallback. What this measurement shows is that the fallback is far weaker than assumed — not that the primary path is broken.

`re-review: 2026-11-09` — re-measure the delivery rate and the worst gap; if either is unchanged, build the cadence-aware verdict.

## Verification

Every number above is from `gh api .../actions/workflows/<lane>/runs?event=schedule`, counted on 2026-11-03, filtering by `created_at` — not from the Actions list page, which mixes `schedule` with `workflow_dispatch` and `workflow_run` and would have flattered the count. The 616-minute gap is computed from consecutive `created_at` values across the last 100 scheduled `site-health` runs.

The withdrawn hypothesis is verified withdrawn by the per-day table spanning the DR-1297 merge: same rate on both sides, so the duplication was not the cause. I stated it as a hypothesis when I raised it and I am stating the falsification here rather than letting it stand as folklore.

**No gate is added by this record, and that is a real limit.** There is no machine check that a lane's described cadence matches its delivered one, so this measurement will go stale silently the way the one it corrects did. Building that check is a candidate for the re-review above, together with the cadence-aware verdict; both are named rather than claimed. `re-review: 2026-11-09`.

---
_Generated by [Claude Code](https://claude.ai/code)_
