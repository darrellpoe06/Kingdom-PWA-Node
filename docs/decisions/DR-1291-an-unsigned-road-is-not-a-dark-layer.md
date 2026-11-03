# DR-1291: An unsigned road is not a dark layer — the site witness failed sixty times in a row while the site was up and fresh

**Date:** 2026-10-29
**Status:** Accepted
**Tier:** B (the witness lane itself: no product code, no schema, no money; it changes what `site-health.yml` calls an outage, which is the one instrument DR-0125 exists to keep honest, so it carries its proof and its re-measurement rather than a claim)
**Type:** verification
**Area:** `.github/workflows/site-health.yml` · `scripts/site-health-verdict.mjs` · `app/src/__tests__/the-witness-sees-the-worker-roads.test.js` · `app/src/__tests__/the-witness-is-not-a-constant.test.js`
**Pairs with:** DR-0125 (the site has its own witness), DR-0107 (a down site outranks delivery — and so does a witness that cannot tell), DR-1180 (the second door is optional while the first is open — the decision this restores to working order, and whose own prediction this falsifies), DR-1092 (the road signs its own answer), DR-1124 / DR-1158 (the witness learned to see the Worker roads, and carved the reading), DR-0975 and LESSONS P53 (a witness that cries wolf drowns out the fault that matters), DR-0076 (§3 proven-to-catch, §4 measure don't claim, §5 characterise before you change, §8 provenance), DR-0100 (state the documented damage plainly), DR-0075 (a non-improvement is a recorded decision with a date), DR-1159 / DR-0108 (the order of roads; the runner is the team's eye where the sandbox has none)

## Context

`site-health.yml` is the outside-in witness. It exists because of P31: on 2026-07-08 the app was reported down while every deploy run was green, because every safeguard watched the pipeline and none of them ever made an HTTP request to the product. DR-0125 made it the standing instrument and wrote the rule that governs everything below — **unknown freshness never reads as fresh.**

On 2026-10-20 it learned to probe the other class of road (DR-1124): `/edge/*` is not a Pages Function, it is the `poetech-roads` Worker on a zone route, and nothing had ever asked whether it was alive. It was not: the Worker has never been deployed, because the repository's Cloudflare token sees zero zones and zero Workers scripts.

On 2026-10-21 DR-1180 decided what to do about that. Its title is the rule — *a second door is optional while the first is open* — and its decision has two halves. The Worker's absence is a **parked decision, not a fault**, because every road the family uses is open through Pages. And the token that would deploy it is a value only Darrell's dashboard can mint, so it is **asked for once, with the scopes and the reason, and then the system stops asking**. `re-review: 2026-11-18`.

To make the witness say that, DR-1180 added an arm: when the Pages road is up, write the Worker's absence to the notes; when it is dark too, stay loud, because then the family really is locked out.

**That arm has never run. Not once.**

## What was measured

Measured tonight, from the runner, because the cloud sandbox has no route to the product — `curl https://poetech.us/automation-status` from this session answers `403 Forbidden` at the agent proxy, which is exactly the blindness DR-0125 named and the reason the GitHub runner is the team's eye (DR-1159 road 1).

**The witness's own record** (`gh run list --workflow=site-health.yml`, and the rolling run log on issue #1693, read through the REST API):

| | |
|---|---|
| last `success` | **2026-10-22T06:59:50Z** |
| runs since, all `failure` | **60** |
| of those 60, carrying any reason but one | **0** |
| the one reason | `THE WORKER ROADS ARE DARK TOO — GET poetech.us/edge/whoami …` |
| days it reported as "known outage day N" | 1 through 8 — **56 runs** |
| days it reported as 🆕 **"A FAULT NOT ALREADY ON RECORD"** | **4 runs**, all on 2026-10-29 |

**What the site was actually doing, on the same instrument** (site-health run 40809496074, 2026-10-29T02:59Z, its own step environment):

```
SERVED: cbf7211   MAIN: cbf7211   STALE: false
PAGES_CODE: 200   BACKEND_CODE: 200
BELL_CODE: 200    BELL_POST_CODE: 401   (401 = the bell is open)
XO_PRE: 200  XO_ALLOW: *  XO_POST: 400  XO_BYTES: 81
```

The served build equals `main`. The sign-in road answers. The bell answers. The app's own cross-origin POST shape works. **The site is up and it is fresh**, by the witness's own readings, in the same run it called the site DOWN/BROKEN.

**And the Pages Function layer is up** — `cf-pages-diagnose.yml`, read-only, run **40810753037** at 2026-10-29T03:16Z on the live custom domain, reproducing run 40746439480 of the night before:

| road on `poetech.us` | status | signed |
|---|---|---|
| `/sb/auth/v1/health` | **200** | `pages-function` — real GoTrue JSON, `v2.177.0` |
| `/cams/health` | **200** | `pages-function` — real go2rtc JSON, 65 streams |
| `/nas-photos/healthz` | **200** | `pages-function` — `{"ok": true}` |
| `/automation-status` | **502** | **unsigned** — `error code: 502`, `text/plain` |
| `/property-history` | **502** | **unsigned** — same shape |
| `/automation-status` on `poetech-app.pages.dev` | **502** | **`pages-function`** — `{"error":"automation-status proxy upstream unreachable","code":"upstream-unreachable"}` |

## What was wrong

**`site-health.yml:601` asked whether one road carried a header, where it meant to ask whether the first door was dark.** Those are not the same question, and the gap between them is the whole of this.

The first-door probe reads `/automation-status` and sets `FN_ROAD` from the `x-poetech-road` signature. DR-1092 established that rule and it is right: a static SPA fallback is a file and sets no header, so the signature's absence is the dark road — **for the two causes the file lists.** It lists them carefully, in a comment that is forty lines long: the road really is dark, or the served build predates the signature. And because of the second, it requires **both halves to agree** before it cries outage — unsigned *and* a body carrying `/poetech-app/assets/`, our own shell's fingerprint. Unsigned and something else is noted, not failed.

There is a third cause, and nobody had it. **The zone's own error page replaced the Function's answer.** On `poetech.us`, `/automation-status` returns Cloudflare's `error code: 502` in `text/plain`; on `poetech-app.pages.dev`, the identical road returns a **signed** 502 JSON that names the fault precisely — `automation-status proxy upstream unreachable`. The Function ran. Its upstream did not. And a Cloudflare error page signs nothing.

So the first-door probe did its job: unsigned, not our shell, **noted and not failed.** And then the Worker arm, nineteen lines later, read the same empty `FN_ROAD` as *"the first door is dark too"* and fired the loud fault. The parked note DR-1180 wrote was in the other arm of a `case` that the live reading could never reach.

**DR-1180 predicted the opposite, in writing, and was wrong.** Its line 49: *"The DR-1158 carve-out has no cliff any more: the reading it quiets no longer fires while Pages is up."* Its line 71: the carve-out *"still carves the both-doors reason until 2026-10-28, which is the only case that can still produce it."* Pages has been up all week and the reading has fired sixty times. That prediction was never verified against a run — it is the DR-0076 §4 failure, a claim where a measurement belonged, and it is withdrawn here.

**Then the carve-out expired on schedule, and the cost arrived exactly as its own file predicted it would.** `KNOWN_OUTAGES[1].until` was `'2026-10-28'`, sized on 2026-10-20 to *"a week for the token to land"* — **one day before DR-1180 decided the token would be asked for once and then never again, with its own re-review four weeks out.** The carve kept the death date of a premise that had already been replaced. At 2026-10-29T00:00Z it expired, the unchanged seven-day-old reading went back to reading 🆕 NEW, and the four runs since have each written *"A FAULT NOT ALREADY ON RECORD"* to incident #2404 **and rung the family's phones at priority 5** — about the one thing Darrell had said, at intensity, to stop raising. `site-health-verdict.mjs` itself names that shape in its header as the thing it was written to end.

## Impact

**This is the DR-0107 class, and it is worse than the fault it was reporting.** A witness that has been red for seven days is a witness nobody reads. If `poetech.us` had genuinely gone down in that week — the site the family and COLG depend on — the Actions list would have looked **identical**: `site-health` red, same single-line title, same issue, same colour. The one instrument built to tell those two states apart could not tell them apart. That is P53 happening to the witness, which `site-health.yml:434` predicted about a different probe in its own words: *"a witness that cries wolf gets deleted."*

Nothing about the product was broken by this, and the record should say that plainly rather than dress the finding up: the family's roads were open the whole time, measurably, and the deploy stayed fresh. What was broken was our ability to know it.

## Decision

**The Worker arm reads the first door's VERDICT, never its header.** The first-door probe now sets `FN_DARK`, initialised to `no` and written to `yes` in exactly one place — inside the arm that actually raises `NO PAGES FUNCTION IS RUNNING`, under the both-halves-agree test. Everything downstream that wants to know whether the Pages layer is up reads that one variable. `${FN_DARK:-no}` is deliberate: a probe that somehow never set it must not fire the loud fault by omission, because reading an absent value as an outage is the same mistake one level down.

The loud both-doors fault stays, **in the same words**, because the carve-out excises that reason by its head and its tail and a re-wording would silently stop the carve working. When both doors are dark the family is locked out and the witness must be loud.

**The carve-out expires with the decision that governs it.** `cf-roads-worker.until` moves from `'2026-10-28'` to `'2026-11-18'` — **not because it was noisy, but because DR-1180's re-review is the date on which this question is actually re-taken.** And it is no longer a literal in two places that can drift apart: the suite reads `re-review:` out of `DR-1180-the-second-door-is-optional-while-the-first-is-open.md` and asserts the carve's `until` equals it. It still expires; it still goes loud when it does.

**The `cf-pages-functions` entry is left expired, and its comment now records that the outage it names is measured over.** It is not renewed. Renewing a carve-out for an outage that has ended is how a suppression list starts lying, which is the one thing that file's header is most afraid of.

**The status code goes into the notes.** `FN_CODE` is now read from the response and printed beside the signature. Seven days of readings said *"unsigned"* with no code beside them, which looked like a mystery about headers. It was a 502 the whole time, and the 502 is the reading that explains the other two.

## Verification

- `the-witness-sees-the-worker-roads.test.js` — **22 tests**, up from 15. The new cases **run the real shell lines** of both probes against a stub `curl`, because a `case` arm that classifies wrongly reads perfectly.
- `the-witness-is-not-a-constant.test.js` — **39 tests**.
- **Proven to catch — three breaks on the live files, one at a time, each restored byte-identical (`cmp`):**

  | break | result |
  |---|---|
  | the Worker arm gated on `FN_ROAD` again — the state at 02:00 tonight | **4 failed** |
  | `FN_DARK=yes` unconditionally — the verdict no longer under the both-halves test | **2 failed** |
  | the carve-out date back to `'2026-10-28'` | **2 failed** |

  Restored: **57 passed** across the two suites after each.
- **The live reading is a test case, by its measured values.** `/edge/whoami` at `200 text/html` with the first door at `502`, unsigned, not our shell → `FN_DARK=no`, `fail_reasons` **empty**, the parked note present. That is the exact pair of readings that was red sixty times.
- **The declaring arm is pinned byte-exact** against the carve-out's head and tail, so the two files cannot drift into a silently broken carve.
- **The premature expiry is pinned against the old date**, with the four real run times (01:17, 01:28, 01:50, 02:58 on 2026-10-29), asserting 4 writes with `'2026-10-28'` and 1 with `'2026-11-18'`. The cost stays measurable instead of recalled.
- `npm run lint` and `npm run verify:gates` read without a pipe (the mistake this repo documents about its own gate runs).

## What this does not do

- **It does not make anything green that is broken.** The site is measured up and fresh; the Worker is measured undeployed and parked by Darrell's own decision. Both of those were already true. The only thing that changes is that the witness now says which.
- **It does not ask for the Cloudflare token.** DR-1180 asked once and the system stops asking until 2026-11-18. Nothing here raises it again, and the parked note still carries the six scopes for the day he mints it.
- **It does not touch the deploy, the merge lane, or any product code.**

## Open, with dates

- **`/automation-status` and `/property-history` answer 502 on the live site.** Measured twice, eight hours apart. The signed body from `pages.dev` says `upstream-unreachable`, so the Function runs and the upstream — the n8n road behind the Funnel — does not. This is a road the app calls (`components/WorkflowStatus.jsx`). It is **noted with its status code** here rather than made a new named fault, for one honest reason: a new loud reason needs a carve-out, a carve-out needs a measured `since`, and the first sighting of this 502 is not established — the witness never recorded the code until this change. **`re-review: 2026-11-05`**, by which point the notes carry a week of codes and the `since` is a measurement rather than a guess. The retirement of the legacy `/n8n` transport (DR-0132's P1–P5) is the larger answer and is tracked there.
- **The first door is still one road, and it is the worst one to ask.** `/automation-status` is the only road in `cf-pages-diagnose`'s set of five that is NAS-backed *and* currently 502ing; `/sb/auth/v1/health` answers signed 200 and is the road the family actually needs. Asking more than one road for a **class** verdict is the right shape, and `cf-pages-diagnose` already does it. Not done here because it widens the change that is fixing a live false alarm, and the gate fix is what stops the alarm. **`re-review: 2026-11-05`**, together with the item above, which shares the same probe.
- **Sixty failing runs are on the record and the ledger entries stay.** They are not back-dated or tidied; #2404 and #1693 hold what was written at the time, which is what a ledger is for.
