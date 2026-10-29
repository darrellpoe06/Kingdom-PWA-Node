# DR-1284: A tailnet join step is not a witness of the join — the lesson-intake lanes now ask, and the rest of the debt is counted

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (four NAS-side workflows gain a verify step; no change to merge, CI or deploy, and nothing deploy-adjacent is touched)
**Type:** verification
**Area:** `.github/workflows/inbox-lessons-waiting.yml`, `inbox-lesson-body.yml`, `lesson-inbox-bell.yml`, `lessons-sync.yml`; `app/src/__tests__/a-tailnet-join-is-not-a-witness.test.js`
**Found by:** the agent, while running the hourly lesson-intake tick's own road rather than assuming it was shut — the step conclusions disagreed with the outcome, and the disagreement was the finding.
**Pairs with:** DR-1283 (a dead tailnet key is never silent — the rolling entry this writes to), DR-1269 (the second-road pattern, which is why four lanes are legitimately exempt), DR-1186 (a failed read is recorded as UNKNOWN, never as zero), DR-0076 (§3 proven-to-catch, §4 measure don't claim, §8 unknown never reads as known), DR-0239 (gate the class), DR-0107 (never change the deploy lane without proving the site deploys), DR-1126 (the shrink-only worklist pattern), DR-0621 (hold the hand of the process — take the next bite, do not discard)

## Context

The hourly voice-and-in-app lesson intake routine reads its queue through `inbox-lessons-waiting.yml`, which joins the tailnet to reach the live database. Rather than assume the refused `TS_AUTHKEY` had shut it, the routine's own road was dispatched (run 40799538255). It failed — and the way it failed is the subject of this record.

Its step conclusions read:

```
success   Join the tailnet (to reach the live database)
failure   List the waiting lesson rows (never a body)
```

The join step reported **success**. The road was shut.

That is not a one-off. The same thing is on `db-migrate` run 40795511412 from an hour earlier, where the action's own log says both halves out loud:

```
Attempt 5 to bring up Tailscale...
backend error: invalid key: ... not valid
Tailscale up failed. Retrying in 25 seconds...
##[end-action id=__tailscale_github-action.__run_16;outcome=success;conclusion=success]
```

`tailscale/github-action` succeeding as a **step** says nothing about whether the runner is on the tailnet. The failure then surfaces downstream wearing someone else's face — in db-migrate's case `ssh: connect to host poetech.tail5a2f35.ts.net port 22: Network is unreachable`, which reads like a dead NAS and was a dead key. DR-1267 made exactly that misreading on 2026-10-28, and DR-1269 had to correct it.

`nas-health.yml` has carried the right idiom since it was written: a separate step that runs `tailscale status --peers=false` and exits 1 naming the real cause. Nothing here is invented; one lane already knew.

## What was measured

Swept over `.github/workflows` on 2026-10-29, by reading the files rather than recalling them:

| | |
|---|---|
| workflows using `tailscale/github-action` | **64** |
| of those, verifying the join (`tailscale status` / a verify step) | **16** (12 before this change) |
| declaring `continue-on-error` on the join because another road exists | **4** — `deploy-cloudflare-pages.yml`, `harvest-health.yml`, `loops-health.yml`, `ops-queue-health.yml` |
| joining and never asking | **44** |

And the consequence on the lane that matters most: the lesson queue's read failed, so **the queue is unread, not empty.** `inbox-lessons-waiting.yml` already handles that correctly — DR-1186 made it write `read=failed`, `count=unknown` and *"This is not an empty queue -- it is an unread one"* to its summary **before** failing. That half was right. What was wrong is that its join step claimed the road was open, so a reader of the run's status would look for the fault in the database.

**Not measured, and not claimed:** the exact error inside that run's failing step. The job-log blob 403s through this sandbox's proxy, so the specific message is unread; what is established is the step's failure, its recorded UNKNOWN, and the join step's misleading success. The two logs quoted above are from runs whose content was readable.

## Impact

Any teaching Darrell has spoken into the app since the key was refused may be waiting unread, and the runs that were supposed to tell us said their road was open. That is worse than a plain failure: a red step is a question, a green step over a shut road is a wrong answer. In 44 of 64 lanes the fleet reports that wrong answer by construction.

## Decision

1. **The four lanes carrying his lesson intake verify their own join** — `inbox-lessons-waiting`, `inbox-lesson-body`, `lesson-inbox-bell`, `lessons-sync`. Each runs `tailscale status --peers=false` straight after the join, and on failure names `TS_AUTHKEY` as the cause, writes the outage to the fleet's one rolling entry (DR-1283's `scripts/tailnet-key-incident.mjs`, called with `|| true` so the escalation can never be what fails a lane), and then exits 1 exactly as before. Two of the four gained `issues: write` for that entry; nothing else in them changed.
2. **The rest of the debt is counted, not swept.** `UNVERIFIED = 44` is pinned shrink-only: a new lane must verify its own join, and the number may fall and may never rise. Sweeping all 44 means 44 judgment calls about what each lane should do when the road is shut, and several are deploy-adjacent — DR-0107 is explicit that the deploy lane is never changed without proving the site still deploys, and a mechanical sweep is the opposite of that. `re-review: 2026-11-29`, deploy-adjacent lanes last.
3. **The four exempt lanes are listed by name**, not merely counted, so a lane quietly joining the exempt set shows up in a diff rather than passing as an exemption.

## Verification

- `app/src/__tests__/a-tailnet-join-is-not-a-witness.test.js` — **4 tests**, run with DR-1283's gate: **19 passed**.
- **Proven to catch — three breaks, applied to the live workflow files, each restored byte-identical (`cmp`):**

  | break | result |
  |---|---|
  | the verify stripped from the lesson-queue lane — its state an hour before this record | **3 failed**, naming the lane |
  | the verify kept but its `exit 1` removed — a log line instead of a brake | **1 failed** |
  | a new lane added that joins without verifying — the debt rising | **1 failed**, naming the new file |

  Restored: **4 passed** after each.
- Anti-vacuity is asserted, not assumed: the sweep must find more than 50 joiners, and the three classes must sum to the joiner count, so a classifier that stopped matching could not read as a clean fleet (DR-0076 §3).
- `npm run lint` and `npm run verify:gates`, each read without a pipe; `resolve-ledger-conflicts.mjs` used for the base merge with wm10 (pointer folded to DR-1284, no duplicate rows, business-systems-guard green) rather than resolved by hand.
- **Not verified:** none of the four verify steps has yet run against a live refused join — the next firing of each is the measurement of record. The escalation they call has still never written a real issue (DR-1283 carries that same limit).
