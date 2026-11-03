# DR-1302: A reading that never happened is not a disagreement — the public shelf witness accused the family's own storefront six days running, and the fix that was supposed to stop this narrowed a proxy instead of asking the question

**Date:** 2026-11-03
**Status:** Accepted
**Tier:** B (one NAS-side witness workflow and its gate; no product code, no schema, no money, nothing deploy-adjacent — but it changes what the lane calls a shelf fault, which is the one thing DR-0973 built it to say, so it carries its proof rather than a claim)
**Type:** verification
**Area:** `.github/workflows/public-shelf-witness.yml` · `app/src/__tests__/a-reading-that-never-happened-is-not-a-disagreement.test.js` (new, 12 cases, five of which execute the lane's own bash) · `app/src/__tests__/a-tailnet-join-is-not-a-witness.test.js` (the shrink-only pin, 42 → 41, and its "loud tier" count corrected)
**Found by:** the agent, taking the next bite of the DR-1284 debt in the order DR-1298 set — and measuring, rather than assuming, which of the remaining lanes could actually publish a wrong cause. The measurement both found this lane and shrank the worklist.
**Pairs with:** DR-0973 (the stranger's screen gets its own eye — the witness this restores), DR-1023 (the earlier fix to this exact guard, which this record shows was aimed one level short), DR-1284 (a tailnet join step is not a witness of the join — the debt this takes the next bite of), DR-1298 (a shut road is not a dark camera — the same shape on the camera witness, one day earlier; this is its sibling and its method), DR-1283 (`scripts/tailnet-key-incident.mjs`, the fleet's one rolling key entry this lane now writes to), DR-1186 (a failed read is recorded as UNKNOWN, never as zero — the rule this lane was breaking), DR-0946 (a read that failed is not an empty shelf), DR-0975 / P53 (the cry-wolf cost), DR-0076 (§1 evidence, §3 proven-to-catch, §4 measure don't claim, §8 unknown never reads as fresh), DR-0621 (a flag is where the work starts), DR-0107 (untouched: this lane is not deploy-adjacent)

## Context

`public-shelf-witness.yml` exists because on 2026-10-11 Darrell found three faults on his own public listing, from his phone, while every pipeline check was green:

> "0.5 Bedroom or 1-Bedroom?!!!!!?????!!!!!"
> "None say co-living!!!!!!!!!!!!!!!!!!!!!!"
> "Why don't we show the same photos for both listings??????!!!!!!!!!"

All three came from one NULL column read as though it had been written. Every instrument we had watched the pipeline; nothing read the page a stranger sees. DR-0973 built this lane to take **two independent readings** — what each advertised door is *called*, straight from the database, and what a real browser renders — and to file a finding when they disagree. A door named "...Bed A" that the shelf advertises as "1-bed" is the founding fault exactly, and it is the one thing a DOM-only reading can never see.

`TS_AUTHKEY` `k17y78NVwb11CNTRL` has been revoked since 2026-10-28. It is a value only Darrell can mint, and every tailnet lane has been red since (DR-1283, still open).

This lane was one of the 43 frozen as shrink-only debt by DR-1284. DR-1298 fixed the camera witness, which was measured publishing a cause it had never measured onto the family's rolling camera ledger, and named the next bites. This is the next bite. It is the same disease, and the lane it bit is the family's own storefront.

## What was measured

**Six consecutive days of filings, and neither reading had been taken.** Step conclusions read from the API for `public-shelf-witness` runs 40757911515 (2026-10-28), 40943512224, 41116974336, 41230844184, 41340322457 and 41540819357 (2026-11-02) — **identical on all six**:

| step | conclusion |
|---|---|
| 4 Join the tailnet (to reach the live database) | **success** |
| 5 What each advertised door IS, by its own labels | failure |
| 6 **Read the shelf in a real browser** | **skipped** |
| 7 Do the two readings agree? | failure |
| 9 Record the run (rolling log) | success |
| 10 **File the finding on the incident ledger** | **success — it filed** |

The join closed `success` while the key was refused (DR-1284's measured behaviour, now measured a third time). The database was never reached. The browser step **never ran at all**. And this is what step 10 wrote onto issue **#2127** — `incident`-labelled, the queryable ledger DR-0125 made the downtime record — once a day for six days, comment ids 6479068863 / 6506815534 / 6531981546 / 6547639695 / 6562586255 / 6590559486:

> **the public shelf disagrees with what the doors are called**, or could not be read. Base: https://poetech.us/properties/app/. Run: … (DR-0973).

A bolded accusation about the family's own storefront, with the real cause — a revoked key — nowhere in it, and `or could not be read` trailing *after* the claim rather than replacing it.

**The guard that was supposed to prevent this had already been fixed once, and the fix was aimed one level short.** On 2026-10-14, run 38597741280, both readings *agreed* — 40 pictures on each bed, the shelf as the doors are called — then the run-log write failed on a GitHub GraphQL error, the **job** went red, and the ledger step, keyed on `failure()`, filed. That false line is still on #2127, with the correction posted beneath it (comment 6173248115) naming the fix: **DR-1023 moved the guard from the job's status to the compare step's own outcome**, `failure() && steps.compare.outcome != 'success'`.

That was a real improvement and it stopped that exact shape. It was still a **proxy**. The compare step's `exit 1` means two different things:

```bash
[ -f /tmp/doors.txt ] || { echo "::error::no database reading — cannot compare"; exit 1; }
```

"the two readings disagree" **and** "a reading never happened". On a shut road it is the second, so DR-1023's narrower guard passed through the identical false finding by a different path. **Narrowing a proxy is not the same as asking the question.** That is the generalisable lesson in this record, and it is the one I would not have found by reading the lane's source — only its six runs show it.

**The guard does work for the case it was pointed at.** Runs 40005324910 (2026-10-23) through 40570592961 (2026-10-27), six of them: step 5 **succeeded**, step 6 **failed**, and step 10 was **skipped**. So this is not a lane that files indiscriminately; it is a lane with one specific hole, and the hole is "a reading that never happened."

**The worklist DR-1298 handed forward is smaller and sharper than its own number.** DR-1298 pinned a "loud tier" of lanes that join the tailnet without verifying **and** write to an issue, and put the remainder at 13. Re-measured on 2026-11-03 that predicate yields **15** lanes, not 13 — but the predicate is itself a proxy. Only **three** of the 15 write to an issue on a step that runs when the road is shut (`if: always()` / `failure()`), and of those three only **one** published a cause it had not measured:

| lane | writes on a shut road | what it says |
|---|---|---|
| `public-shelf-witness.yml` | yes | **six false findings. Fixed by this record.** |
| `public-shelf-anon-probe.yml` | yes | honest: `anon probe: <job.status>` plus `no browser reading` on a rolling run log — and it has **no timer at all** (`workflow_dispatch` / `probe/**` only), so it cannot do this daily |
| `openclaw-tower.yml` | yes | honest already: passes `reachable` explicitly, derives `modelPresent: null` when unreachable (DR-1186), sets an explicit `reason`, and reds separately at the key |

So the question to carry into the remaining 41 is **not** "does this lane write to an issue." It is **"does this lane name a cause it did not measure."** Two of the three loudest candidates were already doing it right.

## Impact

**What the six filings cost, stated plainly.** #2127 is an `incident`-labelled issue, which is the queryable downtime ledger — not a note. Its title is categorical: *"incident: the public shelf is advertising a door as something it is not."* For six days it accumulated daily evidence that the family's storefront was lying about what it rents, while the storefront had not been read once. Any steward who obeyed it — a person, or this agent on a later tick — would have gone to `public_vacancies()`, `rentable_level`, the photo RPCs and the card renderer, and found nothing wrong, because nothing there had been measured at all. That is the DR-0975 / P53 cry-wolf cost with a direction added, and the direction points at the one surface Darrell personally found faults on with his own eyes.

**And it burned the credibility of a correct ledger.** The same issue carries a *true* finding from 2026-10-11 and a *corrected* false one from 2026-10-14. Six more false ones on top do not merely add noise; they make the next real finding on that ledger something a reader discounts. A witness whose findings must be individually re-verified has stopped being a witness.

**What this obligates, and what it un-obligates.** The remaining **41** unverified-join lanes are to be read for the real predicate above — *does it name a cause it did not measure* — and the honest ones are to be **left alone rather than churned**. Correcting the worklist down is as much the work as fixing the lane: a scary number that over-states the debt costs the next session's judgment, and "13 loud lanes remain" was a count of a proxy. It also obligates the reverse reading: a witness that reports an honest UNKNOWN is doing its job, and a lane made to look green while its road is shut would be the worse failure (DR-0076 §8). Every path in this lane that now says UNKNOWN still **fails the run** — nothing was softened.

## Decision

**1. The lane verifies its own join, and a shut road fails at the true cause before one word is published about the shelf.** `Verify the tailnet actually joined` runs `tailscale status --peers=false` straight after the join, sits between the join and the first question asked of the NAS, names `TS_AUTHKEY` as the cause, says plainly in the annotation that this is **not a shelf finding** because neither the database nor the page was read, writes the outage to the fleet's one rolling key entry (DR-1283, called with `|| true` so the escalation can never be what fails the lane), and exits 1. This alone stops all six.

**2. The comparison publishes a VERDICT, and the ledger reads that word instead of a step outcome.** `Do the two readings agree?` now emits one of four:

- `unknown-no-database-reading` — the door rows are missing
- `unknown-no-browser-reading` — `Read the shelf in a real browser` did not succeed (skipped **or** failed)
- `disagree` — both readings were taken and the rules found a finding
- `agree` — both readings were taken and they match

Every `unknown` still exits 1, so the run is still red and still seen. The ledger step's guard is now `failure() && steps.compare.outputs.verdict == 'disagree'`, and the test forbids `steps.compare.outcome` from coming back. **DR-1186's rule, applied to the one place in this lane that was breaking it.**

**3. The ledger sentence stops hedging and states what it knows.** The body now reads *"the public shelf disagrees with what the doors are called. Both readings were taken and they do not match."* The `or could not be read` clause is removed, because with the verdict guard the step cannot fire unless both readings happened — the hedge that made six false findings look plausible would now be a lie in the other direction.

**4. The rolling run log carries the verdict.** `verdict: ${{ steps.compare.outputs.verdict || 'unknown-not-compared' }}` on every line, so an UNKNOWN is legible on the log a reader actually queries rather than being inferred from a red check.

**5. The DR-1284 debt falls 42 → 41, and its "loud tier" note is corrected rather than inherited.** The pin's comment now records the 15/3/1 measurement above and the sharper predicate. `re-review: 2026-11-29` stands.

## Verification

`app/src/__tests__/a-reading-that-never-happened-is-not-a-disagreement.test.js`, **12 cases, 36 green across the three suites this touches** (`npx vitest run` from inside `app/` — the only correct invocation, since running vitest from the repo root with `--root app` mis-resolves paths and manufactures failures). `npm run lint` clean from `app/`. The lane parses as YAML and its step order was printed and checked: join (3) → verify (4) → ask the NAS (5).

**Five of the twelve EXECUTE the lane's own bash** rather than reading it: the `run:` body is lifted out of the YAML, `${{ steps.shelf.outcome }}` is substituted, `/tmp/doors.txt` is pointed at a temp file, and it runs against a real `GITHUB_OUTPUT` with real pipe-separated door rows — including `bed|1-bed multi-family in Champaign, Illinois|40`, the founding fault character for character. The assertions are about what the lane *does* to a verdict and a ledger, not about what its source looks like.

**Proven to catch (DR-0076 §3), three reverts, counted not asserted:**

- Reverting the ledger guard to `failure() && steps.compare.outcome != 'success'` and restoring the hedge: **2 of 12 red.**
- Removing the verify step: **2 of 12 red** — the brake and its position between the join and the first question.
- Reverting the compare step to the pre-DR-1302 bash: **5 of 12 red** — every executed case.
- The shrink-only pin caught its own number in both directions: raised back to 42 against a reality of 41, it failed with `unverified tailnet joins are 41 but the pin says 42` and printed all 41 lanes.

And the lane's founding job is pinned alongside the fix: `EXECUTED: the 2026-10-11 founding fault still files` asserts that a bed advertised as "1-bed" produces `verdict=disagree` and a non-zero exit. A guard that silenced the real finding would be the worse failure, so it is tested in that direction too.

**Not verified on the live instrument, and that is named rather than papered over (DR-0076 §8).** The camera-health fix in DR-1298 was confirmed on a real run because the deploy dispatches that lane directly. This lane's only timer is `41 14 * * *`, and `workflow_dispatch` on it would still fail at the verify step — which is the *correct* new behaviour but proves only the brake, not the verdict path. The verdict path is proven by execution in the test suite instead. The first live confirmation that the full two-reading comparison works end to end comes with the first run after `TS_AUTHKEY` lands.

## What this does not close

**The key.** A fresh Tailscale auth key, **Reusable + Ephemeral**, as `TS_AUTHKEY` — the one value that restores this lane and every other tailnet lane, and a value only Darrell can mint. The old key `k17y78NVwb11CNTRL` is **revoked, not expired**, and should be deleted rather than left in the list. Until it lands, this lane fails at the key with the key's name on it instead of accusing the shelf.

**#2127's six false comments and the issue itself.** They will not clear themselves, and the lane will not touch #2127 again until the road opens. One correction comment is posted beneath them naming the six runs and this record, the way the 2026-10-14 line was corrected — the ledger's own history is the audit trail and is not rewritten.

**The shelf has not actually been read since 2026-10-21, and the cause is NOT established.** Run 39656706216 (2026-10-21) was the last success. On the six runs from 2026-10-23 to 10-27 the database read succeeded and `Read the shelf in a real browser` failed with `Cards read: 0` and `page.goto: Timeout 60000ms exceeded` against `https://poetech.us/properties/app/`. Then the key was revoked and the browser failure was **masked by a louder upstream one** — twelve days in which nothing read the stranger's screen. Issue **#2408** (level-witness, 2026-10-22) shows the same shape on a different browser witness, and names a hanging request: `/voice/health (since 3240ms)`, while `voice-health` has been red since 2026-10-20 (#2280, the studio answering 502). That convergence is suggestive and **it is not a diagnosis**: `app/src/lib/voice-service.js` already carries an abort with a timeout, pinned by `voice-service-hardening.test.js` against a 60-second in-flight `/voice/health` (live-link-probe run 35931484959), so the obvious mechanism is already guarded against and the hypothesis is weakened, not confirmed. The sandbox has no route to poetech.us, so this cannot be measured from here. Named as the next bite rather than claimed. `re-review: 2026-11-10`.

**The remaining 41 lanes — swept with the sharpened predicate in this same session, and the answer is ZERO.** Having corrected the predicate, I ran it over all 41 rather than leaving it as a dated promise: *which of them writes to an issue on a step that runs when the road is shut?* **Two**, and both were read and both are honest:

| lane | why it is left alone |
|---|---|
| `openclaw-tower.yml` | passes `reachable` explicitly, derives `modelPresent: null` when unreachable (DR-1186), sets an explicit `reason` naming the CI key, and reds in a separate step. It records an honest unknown. |
| `public-shelf-anon-probe.yml` | writes `anon probe: <job.status>` plus `no browser reading` on a rolling run log — a status, not a cause — and has **no timer at all** (`workflow_dispatch` / `probe/**` push only), so it cannot accumulate daily. |

So **no lane remains that can publish a cause it did not measure onto a ledger.** The loud tier is closed, measured rather than assumed, and the number went 13 → 15 → 1 → 0 as the predicate got sharper. The other 39 carry DR-1284's original and milder harm — they fail confusingly, surfacing the real fault further down — which is real debt and is still pinned shrink-only at `re-review: 2026-11-29`. **What is explicitly NOT claimed:** this sweep looked at steps that write to an *issue*. A lane that prints a wrong cause into a step summary, a `::notice` or an Actions log is not covered, because that is not a surface a reader later trusts as a finding; if that turns out to matter, it is a new measurement, not something this record settled.

---
_Generated by [Claude Code](https://claude.ai/code)_
