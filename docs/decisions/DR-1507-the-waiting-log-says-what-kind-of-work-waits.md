# DR-1507: The waiting log says what KIND of work waits, not only how much

**Date:** 2026-11-16
**Status:** Accepted
**Tier:** A (one `elif` in a witness's log step; no schema, no money, no new road, no new data leaving the house)
**Type:** decision
**Area:** `.github/workflows/inbox-lessons-waiting.yml` (the rolling-log step's served-road branch), `app/src/__tests__/the-waiting-log-says-what-kind-of-work-waits.test.js` (new), `app/src/__tests__/the-waiting-queue-has-a-witness.test.js` (the never-a-body set widened, with the widening itself pinned)
**Pairs with:** DR-1186 (the rolling log exists because a step summary costs thousands of tokens), DR-1431 (two roads, one log), DR-1467 (a check narrower than its name), DR-0076 §2 (a check, not a claim), DR-1270 (the connector is a different database), DR-0621 (a flag is where the work starts)

## Context

The hourly PRIORITY lesson lane begins by dispatching `inbox-lessons-waiting.yml`
and reading its rolling log. On 2026-11-16 that read finally answered — and the
answer was one number.

## What was measured

Run **43956538893**, 21:05–21:09 UTC, on main `79388000ae8`. The first firing in
which the SECOND road answered at all:

| step | conclusion |
| --- | --- |
| 3 · Join the tailnet | success **as a step** |
| 4 · Verify the tailnet actually joined | success, and set `TAILNET: false` |
| 5 · List the waiting lesson rows (never a body) | **skipped** |
| 6 · When the tailnet is shut, read the house's own census | **success** |
| 9 · A queue that was never read fails this run | success — *"the queue was read (nas=skipped, served=ok)"* |

- **The tailnet is still shut, for a seventh consecutive firing.** `TAILNET: false`;
  the join burns 21:06:01→21:09:02 — **three minutes a run** — on a key that
  cannot work. Step 5 is the only step that names individual rows, so the row
  IDENTITIES remain unavailable.
- **The second road worked, exactly as built** (`SERVED_READ: ok`,
  `SERVED_COUNT: 5`, `SERVED_AGE: 6`). This is the first production proof of the
  public-road census; before today it had answered only in tests.
- **The census reported SIX facts; the rolling log carried ONE.** Its own stdout:

  ```
  ### Waiting lesson rows: 5
  Counted on the NAS itself 6 min ago (fresh), read over the public road.
  The oldest has waited 4 d 8 h (2026-11-12T12:17:12.767416+00:00).
  By road -- research-inbox: 5.
  By shape -- build-failed: 3, plain: 2.
  Failed because -- other: 2, transient: 1.
  Not counted as waiting: awaiting-review, lesson-building, lesson-captured, not-a-lesson, withdrawn.
  ```

  The log entry was: *"**5** lesson row(s) waiting — the house's own census, read
  over the public road, taken 6 min ago."* The shape, the stall reasons and the
  oldest-waited went to the **step summary** — which is the artifact DR-1186
  opened this log to stop paying for.
- **Those three dropped facts are the ones that decide the next move.** A
  `voice-waiting-for-words` row must not be built at all (DR-0611); a
  `build-failed` row wants a retry or a person, and `by_stall` says which
  (`transient` retries itself, anything else is stuck); the oldest-waited is the
  only measure of how overdue the lane is. A session reading only `5` learns the
  queue is not empty and cannot tell whether any of it is actionable.
- **The count's definition travels with it.** `excludes` names
  `not-a-lesson` and `withdrawn`, so this 5 is the post-DR-1142 question and not
  the overcount that preceded it.
- **The never-a-body contract was checked, not assumed** (DR-0076 §7).
  `scripts/served-lesson-queue.py` never reads a `body` field under any
  spelling; it prints the total, a stamp, the oldest row's TIMESTAMP, three
  dicts whose keys are class names, and the excluded tag names. Its own comment
  says the stall's reason text is never carried "it can quote a person's words".

## Impact

A session waking to this lane now learns from one cheap read what it previously
had to pay a step summary for: how many wait, how stale the count is, how long
the oldest has waited, and **what kind of work it is**. Nothing new leaves the
house: the entry gains counts, class names and a timestamp, all of which the NAS
road already published to this same public log in its row listing.

What this does NOT fix, stated plainly: the five rows are still **unnamed**. Only
the tailnet road lists IDs, and both roads to widening that are shut by the same
dead key — the NAS census would have to be redeployed by `git pull` over SSH, and
a new migration reaches the sovereign database by `sovereign-replay-over-tailnet.sh`.
Checked, not assumed: `infra/nas-loops/registry.json` has no self-pull loop.

## Decision

1. **When the served census answered, its own lines go into the log entry**, in a
   `<details>` block beside the NAS road's existing row listing.
2. **The `### Waiting lesson rows: N` header is stripped**, because the head line
   already states the count and a second one reads as a stray heading.
3. **`elif`, not a second `if`.** The census runs only when the NAS road did not,
   so the two blocks can never both apply; the shape says so.
4. **The never-a-body set stays CLOSED and is widened by one, with the widening
   pinned.** That guard's whole privacy argument used to be a single filename;
   admitting a second on the strength of a comment would trade a check for a
   claim. The new file's PRODUCER is pinned instead — a case that fails if
   `served-lesson-queue.py` ever reads a body.
5. **A zero reading still carries the block.** Zero from a fresh census is a
   reading and says so; silence is the thing this log exists to distinguish.

## Verification

- `the-waiting-log-says-what-kind-of-work-waits.test.js`, **6 green**. It
  EXECUTES the log step's own shell in bash with `gh` stubbed, against the real
  census stdout from run 43956538893 byte for byte, rather than reading the YAML
  for a phrase — the defect was in what the line CONTAINED.
- **PROVEN TO CATCH (DR-0076 §3), both mechanisms, each by its own cases.**
  Served branch removed → 3 fail (the shape, the never-a-body wording, the zero
  reading) and the other 3 correctly stay green. Header strip replaced with
  `cat` → exactly 1 fails, the stray-heading case. Producer check: a
  `receipt.get("body")` injected into `served-lesson-queue.py` → exactly 1 fails.
  All restored; 6 of 6 and 14 of 14.
- Neighbours green: every test naming this workflow, the census or the served
  road — `lesson-inbox-bell`, `opsboard-lesson-queue-census-strip`,
  `lesson-queue-census`, `join-tailnet-one-door`,
  `datasystems-dsi16-house-reports-itself`, `the-queue-is-readable-without-the-key`,
  `the-waiting-queue-has-a-witness`, `a-tailnet-join-is-not-a-witness`,
  `the-lessons-email-lands-in-the-app`.
- **Not measured, so not claimed:** the entry's rendered shape is asserted from
  the step's own shell, not from a GitHub comment — the next real firing of this
  hourly lane is the live proof. `re-review: 2026-11-23`, by which date a run
  will have written one.
- **A Ways finding, recorded and NOT fixed here** (DR-0075 why + date): the
  tailnet join spends ~3 min per run failing on a dead key — ~72 min of runner
  time a day across 24 firings. Shortening it means editing the shared
  `join-tailnet` action that **64 workflows** use, several deploy-adjacent, and
  DR-0107 forbids touching that lane without proving the site still deploys. Not
  worth that blast radius for a key restore that ends it. `re-review: 2026-11-30`
  — if the key is still dead then, the join's timeout is the next change.
