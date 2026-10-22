# DR-1210: The deploy proof refuses to guess — my own watcher reported a deploy it never saw, on the one rule written in nine hours of downtime

**Date:** 2026-10-22
**Status:** accepted
**Tier:** A (one new operator tool, read-only; no workflow changed, no gate altered; 11 cases, 4 proven to catch by the operator DR-1207 shipped tonight, plus two live runs)
**Type:** tooling
**Area:**
- `scripts/prove-deploy.mjs` (new — `verdictOf`, `exitCodeOf`, `afterBudget`, and a CLI that matches by `head_sha` and refuses to dispatch the site witness without a proof)
- `app/src/__tests__/prove-deploy.test.js` (new — 11 cases, weighted at the two ways a deploy proof lies)

**Grounds:** my own watcher, caught 2026-10-22 while proving DR-1208's merge. Not reported by anyone: found because `deploy=none` appeared where a verdict should have been, and I looked at the interim lines instead of the tail.
**Principles:** DR-0107 (prove the deploy; a down or stale site is the worst outcome); DR-0125 (the site has its own witness, and unknown freshness never reads as fresh); DR-0076 §3 (proven to catch), §4 (measure, never claim), §8 (name the method's limits); DR-1021 (the fourth hand-written one-liner is a tool); DR-1207 (a proof restores what it breaks — the operator that proved this one)

## Context

DR-0107 is the hardest-won rule in this repo. On 2026-07-06 poetech.us served a stale build for about nine hours because the deploy silently stopped firing and every safeguard watched the pipeline instead of the product. The rule it left: **never ship a change to the merge/CI/deploy lane without proving the site still deploys.** DR-0125 added the outside-in witness and the sharper half — *unknown freshness never reads as fresh.*

I wrote that proof by hand five times in one night. The fourth copy lied.

It looked for the deploy by **scanning the 20 most recent workflow runs.** Under the night's volume the run scrolled out of that window, so it printed `deploy=none` forty times, **fell out of its wait loop, dispatched the site probe anyway, reported `UP · fresh`, and exited 0.** Read from its tail — which is how a summary gets read, and how I first read it — it said the deploy was proved. It had never seen one.

The real state at that moment, found by querying the sha directly: `Deploy (Cloudflare Pages)` still **queued**, and `Deploy freshness (heal a missed deploy)` firing repeatedly on that sha — the watchdog noticing the served build was behind. The site was up and one merge behind.

A false deploy proof is worse than no proof, because it conceals exactly what DR-0107 was written to catch.

## Measured (DR-0076 §4)

| | the hand-written watcher | this tool |
|---|---|---|
| finding the deploy | scan the 20 most recent runs | query `?head_sha=<sha>`, match `head_sha` exactly |
| a green deploy of another commit | would be taken as the answer | `UNKNOWN`, and it says how many such runs exist for other commits |
| a queued deploy | `none`, indistinguishable from absent | `UNKNOWN`, naming the status |
| budget spent | **fell through and continued** | `UNKNOWN`, "this is NOT a proof" |
| exit on "I do not know" | 0 | **2**, distinct from 1 for a real failure |
| the site witness | dispatched regardless | dispatched **only** on a proof |

Live, against the real repository rather than fixtures:

```
$ node scripts/prove-deploy.mjs --sha 0d6c291b47…  (DR-1208's merge)
PROVED: Deploy (Cloudflare Pages) completed successfully on 0d6c291b47…
exit=0

$ node scripts/prove-deploy.mjs --sha ccd90b232a…  (a PR head, which never deploys)
UNKNOWN: no Deploy (Cloudflare Pages) run exists for ccd90b232a…; the wait budget ran out
before the deploy completed — this is NOT a proof, and the site may be serving an older build
The site witness is NOT dispatched on anything but a proof.
exit=2
```

The second case is the one the hand-written loop answered with `UP · fresh` and exit 0.

## The decision

**A deploy is proved for ONE sha, or it is UNKNOWN. Never a pass.** Three outcomes, kept apart, with three exit codes:

- **PROVED (0)** — a `Deploy (Cloudflare Pages)` run whose `head_sha` *is* this sha completed with `success`.
- **FAILED (1)** — such a run completed any other way. The conclusion is named; a cancelled deploy is not a success and is not a mystery either.
- **UNKNOWN (2)** — no such run exists yet, or it has not completed inside the budget. This is **not** a failure of the deploy; it is the tool declining to answer, and the separate code lets a caller tell "it broke" from "I do not know."

**It matches by `head_sha`, never by recency**, because the scan bug is the reason it exists: a successful deploy of a different commit is not evidence about this one, and a tool that takes the newest green run it can find will prove the wrong thing on a busy night. It requires a full 40-character sha for the same reason — a short sha cannot be compared to `head_sha`.

**It will not dispatch the site witness without a proof.** An outside-in "fresh" reading taken while the deploy is still queued is a reading of the *previous* build, which is how a stale site passes a freshness check.

## Impact — what this obligates

**Unresolved, the cost is the 2026-07-06 outage with the alarm disconnected.** Nine hours of stale build happened *with* safeguards in place; the lesson was to watch the product. A proof that reports success without observing the deploy puts the safeguard back in the state that allowed it — and worse, leaves a written "deploy ✓, UP · fresh" in the record for the next session to trust.

**What the call obligates:**

- **A deploy proof after a merge is run with this tool**, by full sha, and its own words are what gets reported — not a hand-written loop whose fall-through is invisible.
- **The site witness follows a proof; it does not substitute for one.** `UP · fresh` while a deploy is queued is a true reading of the wrong build.
- **A verdict of UNKNOWN is reported as UNKNOWN**, in the chat and in any record, never softened to "probably fine." That is DR-0125's rule applied to the deploy half.
- **Nothing in the lane changes.** No workflow, no gate, no required check was touched; this replaces an ad-hoc loop with a tool that refuses.

### Limits, named rather than left (DR-0076 §8)

- **It proves a deploy RAN, not that the bytes are right.** The site witness (`site-health.yml`) is what reads the product; this tool's whole job is to make sure that witness is pointed at the new build rather than the old one. Neither replaces the other.
- **It needs `gh` and the API.** In a sandbox without a route it will report `UNKNOWN` with the read error, which is correct behaviour and still not an answer. It cannot fall back to anything, because there is nothing honest to fall back to.
- **The workflow name is hard-coded** as `Deploy (Cloudflare Pages)`. If the deploy is renamed, this tool goes `UNKNOWN` on every sha — loudly, not silently, which is the right failure direction, but it is a coupling. `re-review: 2026-11-19`: if the deploy is ever renamed or a second deploy target appears, this constant is the thing to change.
- **It is not wired into the lane.** It is an operator's tool, like `prove-it-catches.mjs` and `claim-decision-number.mjs`. Putting a deploy gate inside the merge path is a bigger change than this, and tonight's evidence is about how the proof is *read*, not about adding a brake.

## Proven to catch (DR-0076 §3)

11 cases. Four breaks proven **with `prove-it-catches.mjs`** — the operator DR-1207 shipped two hours earlier, now doing the proving for the tool that fixes my watcher — each restored byte-identical and the suite green on both sides:

| break | result |
|---|---|
| match by recency instead of `head_sha` (the scan bug itself) | red |
| a spent wait budget falls through as a pass | red |
| an unrecognised verdict exits 0 | red |
| a queued deploy counts as completed | red |

`all 4 break(s) proven to catch, and the tree is byte-identical.`

The suite's weighting is deliberate: the two cases that matter most are *"a green deploy of a DIFFERENT commit proves nothing"* and *"a spent budget is UNKNOWN even though the loop ended."* Those are the two lies the hand-written version told, and `exitCodeOf` is additionally pinned so that nothing unrecognised — a typo, a future verdict — can become a pass by default.
