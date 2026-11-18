# DR-1507: The waiting log says what KIND of work waits, not only how much

**Date:** 2026-11-16
**Status:** Accepted
**Tier:** A (one `elif` in a witness's log step; no schema, no money, no new road, nothing new leaving the house)
**Type:** decision
**Area:** `.github/workflows/inbox-lessons-waiting.yml` (the log step's served-road branch), `app/src/__tests__/the-waiting-log-says-what-kind-of-work-waits.test.js` (new), `app/src/__tests__/the-waiting-queue-has-a-witness.test.js` (never-a-body set widened, the widening pinned), `app/src/lib/open-source-candidates.js` (one lapsed promise re-reviewed)
**Pairs with:** DR-1186 (this log exists because a step summary costs thousands of tokens), DR-1431 (two roads, one log), DR-1467 (a check narrower than its name), DR-0076 §2 (a check, not a claim), DR-1284 (a join is not a witness), DR-1270 (the connector is a different database)
**Full measurement:** `docs/99-session-notes/2026-11-16-the-waiting-queue-answered-and-three-dates-came-due.md`

## Context

The hourly PRIORITY lesson lane begins by dispatching `inbox-lessons-waiting.yml`
and reading its rolling log. On 2026-11-16 it finally answered — with one number.

## What was measured

Run **43956538893** on main `79388000ae8`, the first firing in which the second
road answered at all. The tailnet was shut (`TAILNET: false`, step 5 `skipped`),
so the only step that names rows did not run, and the census answered in
production for the first time (`SERVED_READ: ok`, `COUNT: 5`, `AGE: 6`). It
reported **six** facts and the log entry carried **one**. The oldest-waited
(4 d 8 h), `by_shape` (build-failed 3, plain 2) and `by_stall` (other 2,
transient 1) went to the step summary — the artifact DR-1186 opened this log to
stop paying for — and those decide the next move: a `voice-waiting-for-words` row
must not be built at all (DR-0611), a `build-failed` one wants a retry or a
person, and `by_stall` says which. Never-a-body was checked, not assumed (DR-0076
§7): `served-lesson-queue.py` reads no `body` under any spelling. The rows stay
**unnamed**, both roads blocked by the one dead key — verified: `nas-loops` has
no self-pull loop, and a migration rides the tailnet.

## Impact

One cheap read now yields how many wait, how stale the count is, how overdue the
oldest is, and what KIND of work it is — and nothing new leaves the house.

## Decision

1. **The census's own lines ride the entry**, beside the NAS road's listing, its
   `### Waiting lesson rows: N` header stripped — the head line says it.
2. **`elif`, not a second `if`:** the census runs only when the NAS road did not.
3. **The never-a-body set stays CLOSED, gains one name, and the widening is
   pinned by a check on the new file's PRODUCER** rather than by a comment.
4. **A zero reading still carries the block** — zero from a fresh census is a
   reading, and silence is what this log exists to distinguish from it.

## Verification

- **6 green**, executing the log step's own shell with `gh` stubbed against the
  real census stdout byte for byte — the defect was in what the line CONTAINED.
- **PROVEN TO CATCH (DR-0076 §3), three mechanisms:** served branch removed → 3
  fail, other 3 correctly green; header strip replaced with `cat` → exactly 1; a
  `body` read injected → exactly 1. Restored 6/6, 14/14; neighbours green over 9
  files naming this workflow, the census or that road.
- **CLOSED ON LIVE DATA the same night** — run 43976118454 on the deployed
  `158c8a2fb06` posted the real entry to issue #2378 (comment 6932137294); its
  `re-review: 2026-11-23` is retired. Measured in the session note.
- **The 3-min join is NOT fixed here** (DR-0075 why + date): that means editing
  the shared `join-tailnet` action 64 workflows use, deploy-adjacent, which
  DR-0107 forbids. `re-review: 2026-11-30`.
