# DR-1268 — DR-0672's Routine-tagging item is cleared, measured on three real rows; its layout item is not, and gets a date

**Status:** accepted
**Tier:** A (record-keeping; no product change)
**Date:** 2026-10-28
**Entities:** `DR-0672` lines 99-100; `scripts/lesson-inbox-waiting.sql`; `.github/workflows/inbox-lesson-tag.yml`; rows `60972a31`, `d56b9e85`, `b97aa626`
**Grounds:** PERPETUAL-IMPROVEMENT (DR-0075), VERIFICATION-DOCTRINE (DR-0076), DO-THE-WORK (DR-0111)

## Context

**DR-0672 carried two dated items and both ran over.** Line 100 was due `2026-10-01` — **27 days overdue** — and asked whether the hourly Routine (`trig_01KnByrzx8yYCURwfRKUrvTq`) yet writes `lesson-pr:` / `lesson-id:` for Darrell's rows, and whether it skips `lesson-building` / `awaiting-review` rows (the second being DR-0669's ask). Line 99 was due `2026-10-06` and asked for a signed-in fixture mode for the layout probe.

A date that nobody revisits is not a promise, it is a silent drop, which is the thing DR-0075 exists to prevent. This session was blocked on an unreachable NAS with no product work possible, which is exactly the room DR-0103 §4 says to spend on the next dated item.

## What was measured

**Both halves of line 100 are satisfied, and not by reading the Routine's prompt — by the artifacts.**

**1. `lesson-id:` and `lesson-pr:` are written.** `inbox-lesson-tag.yml` takes `lesson_id` and `pr` as declared inputs and reports the row's tags before and after. Measured on three rows this session, all three of Darrell's own:

- `60972a31` → sov52, PR #2450
- `d56b9e85` → ll268, PR #2451
- `b97aa626` → ll269, PR #2452 — the before/after diff shows the row gaining exactly `lesson-captured`, `lesson-id:ll269-where-the-garden-was-and-the-gate-the-search-walks-past`, `lesson-pr:2452` and `lesson-published`, with `LIVE: yes` in the run env.

`lesson-published` is also correctly gated: the workflow writes it only when a successful deploy run's commit **contains** the PR's merge commit, so a dispatch made before a proved deploy cannot write it early. That is the defect the governance review found (5 of 7 published tags written before the lesson was live) and it is closed in the tool rather than in a habit.

**2. `lesson-building` and `awaiting-review` are skipped — in a better place than the Routine's prompt.** The exclusion lives in `scripts/lesson-inbox-waiting.sql`, one shared query used by BOTH the person's list (`inbox-lessons-waiting.yml`) and the bell (`lesson-inbox-bell.yml`) — its own header says "One query, one definition of waiting." It excludes more than DR-0672 asked for:

```sql
WHERE tags ? 'lesson'
  AND NOT (tags ? 'lesson-captured')
  AND NOT (tags ? 'lesson-building')    -- DR-0669's ask
  AND NOT (tags ? 'awaiting-review')    -- the Governor's queue
  AND NOT (tags ? 'not-a-lesson')       -- DR-0768 / DR-0810
  AND NOT (tags ? 'withdrawn')          -- DR-1142
```

**Why that placement matters more than the fix itself:** DR-0672 framed this as something the Routine's prompt owns ("the coordinator owns the Routine"). A prompt is an instruction an agent may misread; a shared SQL file is a definition every reader shares. The item was closed by moving the rule OUT of the prompt, which is a better outcome than the one the re-review asked for, and that is worth recording as the pattern: **when a re-review asks whether an agent remembers a rule, the better answer is usually to put the rule where remembering is unnecessary.**

**Observed working, not merely present.** Across five firings this session (23:28, 00:05, 02:05, 03:07, 04:08, 05:08, 06:06) the query returned `1` waiting row, then `0`, then `UNKNOWN` for the NAS outage — and the `UNKNOWN` is itself the point: a failed read reports UNKNOWN and **never** zero, so an unread queue cannot be mistaken for an empty one.

## Impact

- **DR-0672 line 100 is CLEARED.** Both asks are satisfied and measured on three real rows, the strongest form available — the rows the system actually tagged tonight, not a fixture.
- **DR-0672 line 99 is NOT cleared and is NOT quietly dropped.** The signed-in fixture mode for `chrome-layout-probe.mjs` was due 2026-10-06 and has not been verified here. It is not blocked by anything external — this session simply had no evidence for it and will not claim one way or the other (DR-0076 §8). `re-review: 2026-11-04`.
- **No product change.** This record only closes a dated item and re-dates another; it touches no code and ships nothing.
- **One pattern worth keeping:** a re-review asking "does the agent do X?" is better answered by making X structural than by confirming the agent complied. The prompt still carries the rule, which is fine as belt and braces, but the SQL is what actually enforces it.

## Decision

Close DR-0672's line-100 item as satisfied, on the evidence of three tagged rows and the shared waiting-query. Re-date its line-99 layout item to `2026-11-04` with the honest reason that it was not examined. Keep the rule in `lesson-inbox-waiting.sql` as the single definition of "waiting" rather than restating it per workflow.

## Verification

- `scripts/lesson-inbox-waiting.sql` quoted above, read from `main` at `5fd832ed`; it is referenced by `inbox-lessons-waiting.yml:62` via `scripts/live-sql.sh`.
- `inbox-lesson-tag.yml` input declarations (`row_id`, `verdict`, `lesson_id`, `pr`) and its stated rule that `lesson-published` is added only when the successful deploy's commit contains the PR's merge commit.
- Row `b97aa626`'s before/after tag lists, taken from run `40609173507` (job `122556203204`), showing the four tags added and `LIVE: yes`.
- Rows `60972a31` (sov52 / #2450) and `d56b9e85` (ll268 / #2451) tagged earlier in the same session by the same workflow.
- Seven consecutive firings of the waiting query observed, returning 1, 0, then UNKNOWN under the NAS outage — the witness refusing to report zero on a failed read.
- **NOT verified:** the signed-in layout fixture of line 99. Stated rather than implied.
