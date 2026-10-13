---
id: DR-0986
title: The stale-but-real pull request has no lane — 52 open, every one carrying work, nothing that picks any of them up
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0644, DR-0146]
tier: B
entities: [poetech]
grounds: [PERPETUAL-IMPROVEMENT, VERIFICATION-DOCTRINE, STREAMLINED-DELIVERY-LOOP]
source: 2026-10-13 — measured while pulling the next backlog item forward after the 0263 → 0269 → 0273 cascade closed
---

## Context

I have been carrying "the red-PR backlog (~20 open, oldest Aug 4)" in working
notes for weeks and had never measured it. Measured, both halves of that
sentence are wrong: there are **52** open pull requests, not ~20, and the
oldest is **2026-06-17**, not 2026-08-04 — thirty-one PRs are older than the
date I had been repeating. A number carried in prose and never checked is
exactly the class DR-0076 is about, and this record starts by correcting my own.

The reason they are not moving is not the one I expected either. The delivery
lane is working as designed; the PRs cannot use it.

## What was measured

Measured 2026-10-13 03:05–03:25Z against `main` at `d40d72e7` (one PR, #2137,
merged mid-survey, which is why the first count read 53).

| | |
|---|---|
| open pull requests | **52** |
| of those, carrying a real diff against `main` | **52 — every one** |
| **provably empty** (`git diff --quiet origin/main...branch`, all 2098 PR heads fetched) | **0** |
| checks green | 25 |
| of those 25 green, `mergeable_state` | **`dirty` — all 25** |
| labelled `hold` (the governor's brake) | 7 |
| oldest | 2026-06-17 (#250, #255) |
| size | 8 PRs touch 1–3 files, 16 touch 4–10, 26 touch 11–50, 2 touch 50+ |

**Why nothing picks them up, read from the workflows rather than guessed:**

- `keep-prs-current.yml` selects only branches starting `claude/` or `ccr-`
  (line 187) and skips any PR idle beyond `IDLE_HOURS: '72'` (line 207), with
  the note *"idle > 72h; left for its owner / pr-janitor"*. Of the 21 non-`hold`
  green PRs, **13 are in scope by branch name but every one is far past 72h**,
  and **8 are out of scope entirely** (`feat/` ×6, `fix/` ×1, `docs/` ×1).
- `pr-janitor.yml` is the handler that note names, and it closes a PR ONLY when
  it is *provably empty* — correctly, since *"real work is never auto-closed
  (DR-0076: the diff is the evidence)"*. **Zero of the 52 are empty, so it
  would close none of them.** It has not run since 2026-07-10 in any case:
  `workflow_dispatch` only, *"no schedule; a human arms each run."*

**So the lane has two mechanisms and they do not meet.** *Keep current* serves
the live PR; *janitor* buries the empty one. **Nothing serves the middle case —
stale but real — and that case is now the ENTIRE open set.** A PR that goes
quiet for three days is parked permanently by construction.

## Impact

This is a DR-0075 breach by structure, not by anyone's choice: *"Nothing
stagnates silently. No why+date means the thing is still expected to improve."*
Fifty-two pieces of real work are parked with no why and no date, the oldest for
almost four months. Each additional day of `main` drift makes its conflict
harder to resolve and the question *"is this still wanted?"* harder to answer,
so the cost compounds rather than merely persists.

It also degrades the instrument. "25 green PRs" reads like 25 things ready to
merge; every one of them is unmergeable. A board that reports green for work
that cannot land is the DR-0975 failure — a signal that means something other
than what it says.

Nothing is at risk right now: no PR here is on the merge path, the `hold` label
still holds, and the brake that stops them (`dirty`) is the correct brake.

## Decision

1. **The measurement is recorded, and my own carried figure is corrected.** 52
   open, oldest 2026-06-17, zero empty, all 25 greens `dirty`. Any future claim
   about this backlog cites this record or a fresh measurement, not a number
   remembered from prose.
2. **`pr-janitor` is NOT the answer here and is not dispatched.** It closes only
   provably-empty PRs and there are none; dispatching it would be a green run
   that did nothing — the gate theater its own header forbids. Its design is
   right and unchanged.
3. **I am NOT bulk-resolving or bulk-closing the 52.** Each needs a conflict
   resolution *and* a judgment about whether up-to-four-month-old work is still
   wanted after that much `main` drift. That is fifty-two decisions belonging to
   the governor, not one decision belonging to me, and DR-0111's carve-out for
   a genuinely new decision is exactly this shape. Doing it unasked would also
   breach DR-0107's spirit: a large unreviewed merge wave against a lane whose
   deploy I would then have to prove 52 times.
4. **What IS mine, and is the recommendation:** the backlog is worked
   **oldest-first in small batches through the normal lane**, one PR at a time —
   rebase onto `main`, resolve, re-verify, let the gates decide — starting with
   the 8 PRs that touch 1–3 files, because those are where a conflict
   resolution is reviewable in a sitting and the "still wanted?" question is
   cheapest to answer. Not a sweep; a queue that drains.
5. **NOT decided: whether the lane should GROW a mechanism for the middle
   case** — a revive-stale-but-real pass, a widening of `keep-prs-current`
   beyond `claude/*`/`ccr-*`, or a longer `IDLE_HOURS`. Each is plausible and
   each is a change to the merge lane, which DR-0107 says is never shipped
   without proving the site still deploys. It deserves its own record with its
   own proof, not a paragraph in this one. `re-review: 2026-10-20`.
6. **NOT touched: the 7 `hold` PRs.** The governor's hand is senior (DR-0103);
   they are counted and reported here and nothing more.

## Verification

- **Every number above is a measurement, with the command that produced it.**
  The open-PR list came from the REST API in one page; the empty/real split from
  `git diff --quiet origin/main...refs/remotes/pr/<n>` after fetching all 2098
  PR heads into `refs/remotes/pr/*` — the same evidence `pr-janitor` itself
  requires, run the same way.
- **`mergeable_state` was read TWICE on purpose.** The first read returned
  `unknown` for all 25 green PRs, because GitHub computes mergeability lazily;
  the second returned `dirty` for all 25. Reporting the first read would have
  been reporting a null as a finding. Noted because the trap is reusable.
- **The two workflow conditions are quoted from the files**, not recalled:
  `keep-prs-current.yml:187` (branch prefixes), `:207` (`IDLE_HOURS: '72'`, with
  its own "left for its owner / pr-janitor" wording), and `pr-janitor.yml`'s
  header on provable emptiness and `workflow_dispatch` only.
- **`pr-janitor`'s last three runs are 2026-07-10**, read from its run history —
  so "has not run since" is a reading, not an inference from the absence of a
  schedule.
- **Not verified:** why each individual PR conflicts, or whether any is
  abandoned rather than merely stale. That is the per-PR work decision 4 sets
  out and cannot be answered in aggregate. Named rather than assumed.
- **Not verified:** the 25 RED PRs' failure reasons. They were classified as red
  from their check conclusions and not diagnosed; a red PR may be red for a
  reason that no longer exists on today's `main`. Part of the same queue.

## Links

[DR-0644] (keep-prs-current — the mechanism for the live PR), [DR-0146] /
[DR-0148] (pr-janitor — the mechanism for the empty one; "armed is not alive"),
[DR-0075] (perpetual improvement — nothing stagnates silently, which this
breaches at scale), [DR-0103] (the streamlined delivery loop — work lands on
green by itself, and `hold` is the governor's hand), [DR-0975] (a signal that
means something other than what it says), [DR-0111] (do not re-ask what is
settled — and the carve-out for a decision that genuinely is not).
