# DR-1453: The lane pays four minutes for a dead key, and holds bot-opened PRs

**Date:** 2026-11-12
**Status:** Accepted (one finding handed to Darrell; one fix deliberately NOT built, with its reason and date)
**Tier:** B (names a repository setting change and parks a deploy-lane change)
**Type:** decision
**Area:** `.github/workflows/deploy-cloudflare-pages.yml` (step `Join the tailnet (repoint armed only)`), `.github/actions/join-tailnet`, the repository's Actions approval setting
**Sent in by:** Nobody. Found while proving the deploy of #2639 on the merged SHA, which is the step DR-0107 makes mandatory. Two findings fell out of doing it properly.
**Pairs with:** DR-0107 (merge is not deploy; uptime outranks velocity), DR-0103 (motion is the default; the lane moves without being pushed), DR-1360 (the runner road is retired as each is reversed), DR-1269 (the deploy's second road to the anon key), DR-0076 (measure, do not claim)

## Context

#2639 merged and the deploy was proven on `4cfea691afd`, end to end: build + deploy green, the served app booting in a real browser against the domain, the `pages.dev` origin, the Moore door and the Church tab. Proving it meant reading the job timings, and the timings said two things nobody had asked about.

## What was measured

- **The expired `TS_AUTHKEY` costs MINUTES on EVERY run that joins, including the deploy.** Four independent measurements on 2026-11-12, and the range is stated rather than rounded to the tidier figure this record's filename carries:
  - `place-doors`, step `Join the tailnet`: 18:28:13 to 18:32:05 = **3 m 52 s**, then fails and the job dies.
  - `deploy-cloudflare-pages` run 2157, step 5: 18:16:41 to 18:20:50 = **4 m 09 s**, concluded `success`.
  - `deploy-cloudflare-pages` run 2158 (the sov76 deploy), step 5: 18:37:24 to 18:41:31 = **4 m 07 s**, concluded `success`.
  - `inbox-lessons-waiting` run 522, step 3: 19:04:51 to 19:07:38 = **2 m 47 s**, concluded `success` while reporting `TAILNET: false`.
  So the honest span is **2 m 47 s to 4 m 09 s**, not "about four minutes" — the first draft of this record said four on three samples and the fourth widened it. The conclusion is unchanged (minutes per run across 64 workflows); the figure is not.
- **On the deploy that is 64 per cent of the job.** Run 2158's build-and-deploy job ran 18:37:08 to 18:43:33 = 6 m 25 s, of which 4 m 07 s was a credential the step is explicitly designed not to need: it carries `continue-on-error: true` and the next step reads the same public value back off the served site (DR-1269). The design is right; the cost is the tailscale action retrying to its own timeout before giving up.
- **64 workflows carry `TS_AUTHKEY`.** So the key is not only holding witnesses red (camera-health, place-doors, complete-addresses, ops-queue-health, lessons-sync all failed on main today, all five at the same join step); it is sitting on the critical path between a merge and the site going live.
- **PRs opened by the lane's own bot have their gates HELD.** `dr-number-claim` runs `43241899928` (14:53) and `43279143702` (18:22), both `actor: github-actions[bot]`, both sat at `action_required` with zero jobs; the second carries `run_attempt: 2` and `triggering_actor: darrellpoe06`, which is the hand approval. Every run with `actor: darrellpoe06` started within seconds. **The hold is not in our code:** neither `dr-number-claim.yml` nor `auto-merge.yml` carries an `environment:` key, so no required-reviewer gate lives in the repository.

## Impact

`auto-open-pr.yml` opens every `claude/*` PR as `github-actions[bot]`, and auto-merge waits on required checks. When those checks are frozen at `action_required`, the PR waits for a human — which is precisely the stall DR-0103 exists to remove. It did not bite today only because someone was watching.

**REPRODUCED A THIRD TIME, watched from the push: this record's own PR.** #2640 was opened by the bot at 18:48 and `dr-number-claim` run `43283712811` concluded `action_required` with zero jobs, same as the two before it. So the behaviour is deterministic on bot-opened PRs, not intermittent.

**AND WHAT IT IS NOT: the hold is NOT what kept #2640 from merging.** That PR went red on three checks of its own, all one defect of mine — the INDEX row below was 886 characters against the 700 ratchet, failing `record-length-guard`, `bloat-ratchets.test.js:36` and the aggregator (9,113 of 9,114 tests passed). **So whether a held `dr-number-claim` BLOCKS a merge or is silently skipped by one is still an OPEN question, and this record does not answer it.** The first attempt to answer it watched a PR that was red for an unrelated reason and would have mistaken my own broken row for a lane defect. `re-review: 2026-11-19` — settle it on the next bot-opened PR that is genuinely green.

## Decision

1. **The approval hold is Darrell's dropdown, and it is named rather than worked around.** Settings, Actions, General, the fork-pull-request approval setting. The recommendation is **"Require approval for first-time contributors"** rather than all external contributors, which is what currently treats the house's own bot as an outsider. Verified not fixable in repository code.
2. **The four-minute join is NOT capped in this change, on purpose.** A `timeout-minutes` on that step would halve the deploy, and it is still the wrong trade today, for two reasons. First, DR-0107: *"uptime outranks delivery velocity, always"* — a change to the deploy lane bought with velocity is the exact trade that rule was written after a nine-hour stale site. Second, and more decisive, **there is no healthy baseline to size the cap against.** The key has been dead since 2026-11-04, so every join measurement available is a failing join; a cap set from those numbers could strangle a *working* join the first time a valid key lands. Characterize before you change (DR-0076 section 5). `re-review: 2026-11-19`, or immediately once a valid key gives one healthy measurement.
3. **The real fix is the key, and it is one value only Darrell can mint** (DR-0111 section 2): a fresh Reusable + Ephemeral auth key. That restores 64 witnesses AND removes the four minutes, without touching the deploy lane at all.

## Verification

- Every timing above read from the Actions job records, not estimated: jobs `131398846938`, `131391728146`, `131404367158`.
- The join's tolerance read from the workflow itself: `continue-on-error: true` with the DR-1269 second road at the following step.
- The absence of an `environment:` key checked in both workflow files by name.
- **Two of my own readings were wrong first and are recorded that way.** I reported the join "fails in 19 milliseconds", having read the duration of the composite action's final error-echo step and taken it for the join; the join takes about four minutes. And I reported run 2158's step as "past 8 minutes, about double the precedent" from a stale `in_progress` snapshot; it completed at 4 m 07 s, in line with the precedent. Both corrections are the reason this record carries three measurements rather than one.
- **Not measured, and so not claimed:** how long a HEALTHY tailnet join takes in this repository. That gap is the whole reason decision 2 parks rather than ships.
- **A third correction, and the sharpest one: I said "all guards green" having run three of them.** `business-systems-guard`, `re-review-ratchet-guard` and `dr-number-claims` passed, and I reported that as the guard suite. `record-length-guard` was never run, and it is the one that fails on this record — so the claim was evidence for three checks dressed as evidence for the set. CI caught it, which is the gate doing its job (DR-0076 section 2), but the claim should never have been made. Each guard is now named with its own exit code rather than summarised: `record-length-guard: 0`, `business-systems-guard: 0`, `re-review-ratchet-guard: 0`, and `bloat-ratchets.test.js` 10 green.
