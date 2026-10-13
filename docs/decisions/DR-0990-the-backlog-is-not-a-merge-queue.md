---
id: DR-0990
title: The backlog is not a merge queue — 19 of 43 open PRs must be rebuilt, not drained, and my own selection rule was wrong
date: 2026-10-13
status: accepted
supersedes: []
superseded-by: null
amends: [DR-0986, DR-0078]
tier: B
entities: [poetech]
grounds: [VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, HOLD-THE-HAND-OF-THE-PROCESS]
source: 2026-10-13 — measured while choosing the second drain after DR-0989 completed the first
---

## Context

DR-0986 decided the backlog is drained oldest-first and named the starting
tranche:

> *"the backlog is worked **oldest-first in small batches** through the normal
> lane, one PR at a time … **starting with the 8 PRs that touch 1–3 files**,
> because those are where a conflict resolution is reviewable in a sitting."*

DR-0989 completed the first drain (PR #1217). Choosing the second one broke that
rule's premise in two moves.

**I picked #286** — 8 files, titled `docs(hardware): sharpen toward private/
sovereign/air-gappable`. It is a whole Concerns Board feature: a 286-line
component, two new libs, a test, **1,106 insertions**, an edit to the frozen
shell, and a migration numbered **0039** while `main` is at **0282**.

**I then picked #592** as the one genuinely small candidate — 12 files, 256
insertions, and it even updates `monolith-budget.json`, which looked like a PR
accounting honestly for its own footprint. Probing the merge showed the
opposite.

## What was measured

Measured 2026-10-13 against `main` at `9774d5d1`.

**#592, the "small" one:**

| | |
|---|---|
| its `scripts/monolith-budget.json` | **5913** |
| `main`'s | **5302** |
| `main`'s shell, actual lines | **5302** — the freeze is at its floor |
| its shell hunk | still carries the full inline theme CSS block |
| what `main` has there now | `${THEME_CSS}` — the block was **extracted** |

So merging it mechanically would reinstate ~611 lines the extraction lane
already peeled out of the shell **and** raise the frozen ceiling by 611 to
permit it — undoing the hybrid-modular cutover one old PR at a time, with every
check green.

**The nine oldest green PRs:**

| PR | files | insertions | monolith | migration |
|---|---|---|---|---|
| #286 | 8 | 1,106 | yes | 0039 |
| #311 | 7 | 883 | — | — |
| #323 | 12 | 1,419 | — | 0042 |
| #432 | 17 | 3,189 | — | — |
| #484 | 11 | 796 | yes | — |
| #501 | 29 | 4,724 | yes | 0065 |
| #507 | 17 | 3,160 | — | 0066 |
| #584 | 33 | 1,079 | yes | 0076 |
| #592 | 12 | 256 | yes | — |

Five of nine touch the frozen monolith. Five carry a migration between 173 and
243 ordinals behind. None is a small merge.

**Across the whole backlog** (`scripts/drain-triage.mjs`, 43 open PRs that are
neither `hold` nor draft):

| | |
|---|---|
| **drain** | **24** |
| **rebuild** | **19** |

**Both proxies in DR-0986's rule are wrong, and provably:** `#1129` is ONE file
and drains; a one-file PR that edits the shell does not. `#592` is 12 files /
256 insertions and must be rebuilt; `#286` is 8 files / 1,106 and must be
rebuilt. Title and file count measure neither size nor risk.

## Impact

Had I followed my own rule, the second drain would have raised the frozen
monolith ceiling by 611 lines and restored extracted code, through a green PR,
on the strength of "it's only 12 files." That is the DR-0975 failure in its
worst form — not a check that fails to fire, but a *plan* that routes around
a brake while every gate reports success.

The ratchet is the mechanism `monolith-budget-guard` exists to protect: *"this
line count may only go DOWN … Re-freeze with --generate after an extraction
shrinks it."* Nineteen open PRs predate it. Each is a standing invitation to
walk it backwards.

Nothing is damaged today: none of the nineteen is on the merge path, and the
`dirty` state that blocks them is the correct brake.

## Decision

1. **DR-0986's decision 4 is amended. The selection rule is three questions,
   not a file count.** Any YES means **rebuild** (the work re-done against
   today's structure), never **drain** (rebase, resolve, ship):
   1. Does it touch `app/src/poe-financial-mvp-v28.jsx`? It predates the
      extraction of whatever it edits.
   2. Does it carry `scripts/monolith-budget.json`? It carries a ceiling from
      its own era, and applying it moves the ratchet backwards.
   3. Does it add a migration more than **20** ordinals behind main's newest?
      Its replay position is not what it assumed.
2. **The questions are about SAFETY, not size.** #1255 is 110 files and 4,088
   insertions and answers no to all three — structurally drainable, and still
   far too large for one sitting. Size stays a human judgment; these three
   questions only say whether draining is *sound*.
3. **`scripts/drain-triage.mjs` encodes it**, with the reasoning in its header
   and 13 tests over the pure classifier. **It is a tool, not a build gate** —
   it reads the GitHub API, so it cannot sit in `verify:gates` beside the
   $0/no-network guards, and the record says so rather than letting someone
   discover it.
4. **PR #1217 is closed with a preserving comment**, naming DR-0989 and the
   merge that carried its content. Its branch is kept, per `pr-janitor`'s own
   convention (*"the BRANCH IS KEPT — nothing is deleted"*). It was still open
   after its content landed, which made the backlog over-report by one and the
   triage list a false positive.
5. **NOT decided: what happens to the nineteen.** Each needs its work re-done
   against today's structure *and* a judgment about whether a three-to-four
   month old feature is still wanted. That is nineteen product decisions
   belonging to the governor, and DR-0986's refusal to bulk-action them holds
   here with more force now that the cost per PR is known to be a rebuild.
   `re-review: 2026-10-20`.
6. **NOT changed: the freeze, the ratchet, or `monolith-budget.json`.** The
   guard behaved correctly throughout; it was my plan that was wrong.

## Verification

- **Every number is a measurement.** `monolith-budget.json` read from `main`
  (5302) and from `pr/592` (5913); the shell's line count read with `wc -l`
  (5302); the newest ordinal read from `infra/supabase/migrations-auto/` (0282);
  per-PR files and insertions from `git diff --numstat` against each PR's own
  merge-base.
- **The 611-line reinstatement was seen, not inferred**: `git apply -3` of
  #592's patch onto current `main` left four conflicted files, and the shell
  hunk shows `${THEME_CSS}` on main's side against the full inline block on
  #592's.
- **The classifier is tested on real inputs** — #1217's actual three files
  classify as `drain` (and it *did* drain, DR-0989), #286's migration ordinal
  reports "243 behind", the slack boundary is asserted on both sides, and a
  PR failing all three questions reports all three reasons rather than the
  first.
- **13 tests**, including the premise correction pinned directly: a one-file PR
  drains or rebuilds depending on *which* file, which is the whole point.
- **I had the budget rule backwards first**, and checked before acting on it.
  I assumed "frozen" meant unraisable; the guard's own header says `--generate`
  refuses to raise it but *"a human editing monolith-budget.json by hand with a
  stated reason in the PR — a deliberate, reviewed act"* is the sanctioned path,
  and that file's `note` is a ledger of such raises, each justifying its lines
  as irreducible mount cost. Had I not read it, I would have reported a raise as
  forbidden when it is merely expensive.
- **Not verified:** whether any of the nineteen is cheaper to rebuild than it
  looks. The three questions are deliberately coarse — they say "not a
  mechanical merge", not "how much work". Named rather than assumed.
- **Not verified:** that 20 ordinals is the right slack. It is a judgment that
  cleanly separates the measured population (nothing sits between 38 and 173
  behind), not a derived number. `re-review: 2026-10-20`.

## Links

[DR-0986] (the stale-but-real PR has no lane — the decision this amends, and
whose decision 4 was wrong), [DR-0989] (the first drain, and the shape that
drains), [DR-0987] (the merge-history finding: carry an old branch's history
only when its content is landing), [DR-0078] (the hybrid-modular cutover and the
ratchet these PRs would walk backwards), [DR-0146] (pr-janitor's preserving-close
convention, followed for #1217), [DR-0975] (a plan that routes around a brake
while every gate reports success).
